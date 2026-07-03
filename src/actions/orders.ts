"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notify";
import { assignRider } from "@/actions/rider";

function vendorOwnsOrder(
  order: { sellerId: string | null; buyerStoreId: string | null; vendorType: string },
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
) {
  if (order.vendorType === "SELLER") return order.sellerId === user.sellerProfile?.id;
  return order.buyerStoreId === user.businessBuyerProfile?.id;
}

export async function vendorConfirmOrder(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Not found." };
  if (!vendorOwnsOrder(order, user)) return { error: "Not your order." };
  if (order.status !== "PENDING") return { error: "Order already confirmed." };

  await prisma.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
  await assignRider(orderId);
  await notify(order.buyerId, "ORDER_UPDATE", "Order confirmed", `Order ${order.orderNumber} was confirmed.`);

  revalidatePath("/dashboard/seller/orders");
  revalidatePath("/dashboard/business-buyer/store/orders");
  revalidatePath(`/orders/${orderId}`);
}

export async function cancelOrder(orderId: string, reason: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  if (!reason?.trim()) return { error: "A cancellation reason is required." };

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { error: "Not found." };

  const isBuyer = order.buyerId === user.id;
  const isVendor = vendorOwnsOrder(order, user);
  const isAdmin = user.roles.includes("ADMIN");
  if (!isBuyer && !isVendor && !isAdmin) return { error: "Not authorized." };

  if (isBuyer && !isVendor && !isAdmin && order.status !== "PENDING") {
    return { error: "You can only cancel while the order is still pending." };
  }
  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    return { error: "This order can no longer be cancelled." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelReason: reason.trim() },
    });
    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    if (order.riderId) {
      await tx.riderProfile.update({ where: { id: order.riderId }, data: { currentLoad: { decrement: 1 } } });
    }
  });

  const otherPartyId = isBuyer
    ? (order.sellerId
        ? (await prisma.sellerProfile.findUnique({ where: { id: order.sellerId } }))?.userId
        : (await prisma.businessBuyerProfile.findUnique({ where: { id: order.buyerStoreId! } }))?.userId)
    : order.buyerId;
  if (otherPartyId) {
    await notify(otherPartyId, "ORDER_UPDATE", "Order cancelled", `Order ${order.orderNumber} was cancelled: ${reason}`);
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard/seller/orders");
  revalidatePath("/dashboard/business-buyer/store/orders");
  revalidatePath(`/orders/${orderId}`);
}

export async function reportProblem(orderId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.buyerId !== user.id) return { error: "Not your order." };
  if (order.status !== "DELIVERED") return { error: "You can only report a problem on delivered orders." };
  if (order.disputeWindowEndsAt && order.disputeWindowEndsAt < new Date()) {
    return { error: "The 72-hour reporting window has closed." };
  }

  const reason = String(formData.get("reason") || "").trim();
  if (!reason) return { error: "Describe the problem." };

  const photo = formData.get("photo") as File | null;
  let photoUrl: string | undefined;
  if (photo && photo.size > 0) {
    const { savePublicFile } = await import("@/lib/upload");
    photoUrl = await savePublicFile(photo);
  }

  await prisma.dispute.create({
    data: {
      orderId,
      raisedById: user.id,
      reason,
      photoUrl,
      responseDeadline: new Date(Date.now() + 60 * 60 * 60 * 1000),
    },
  });

  const vendorUserId = order.sellerId
    ? (await prisma.sellerProfile.findUnique({ where: { id: order.sellerId } }))?.userId
    : (await prisma.businessBuyerProfile.findUnique({ where: { id: order.buyerStoreId! } }))?.userId;
  const admins = await prisma.user.findMany({ where: { roles: { has: "ADMIN" } }, select: { id: true } });
  const recipients = [vendorUserId, ...admins.map((a) => a.id)].filter(Boolean) as string[];
  await Promise.all(
    recipients.map((id) =>
      notify(id, "DISPUTE", "New dispute filed", `A dispute was filed for order ${order.orderNumber}.`)
    )
  );

  revalidatePath(`/orders/${orderId}`);
  return { success: "Problem reported. The vendor and admin have been notified." };
}
