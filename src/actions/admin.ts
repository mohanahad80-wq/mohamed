"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notify";
import { BroadcastAudience, District, OrderStatus } from "@/generated/prisma/client";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.roles.includes("ADMIN")) return null;
  return user;
}

async function audit(adminId: string, action: string, targetType: string, targetId: string, reason?: string) {
  await prisma.adminAuditLog.create({ data: { adminId, action, targetType, targetId, reason } });
}

export async function decideVendorApplication(
  profileType: "SELLER" | "BUSINESS_BUYER",
  profileId: string,
  approve: boolean,
  reason?: string
) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };

  const status = approve ? "APPROVED" : "REJECTED";
  const profile =
    profileType === "SELLER"
      ? await prisma.sellerProfile.update({ where: { id: profileId }, data: { status } })
      : await prisma.businessBuyerProfile.update({ where: { id: profileId }, data: { status } });

  await prisma.user.update({
    where: { id: profile.userId },
    data: { status: approve ? "APPROVED" : "REJECTED" },
  });

  await notify(
    profile.userId,
    "VENDOR_APPROVAL",
    approve ? "Application approved" : "Application rejected",
    approve
      ? "Your vendor application was approved. You now have full dashboard access."
      : `Your vendor application was rejected.${reason ? " Reason: " + reason : ""}`
  );

  await audit(admin.id, approve ? "APPROVE_VENDOR" : "REJECT_VENDOR", profileType, profileId, reason);
  revalidatePath("/dashboard/admin/vendors");
  return { success: "Done." };
}

export async function decideRiderApplication(riderId: string, approve: boolean, reason?: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };

  const rider = await prisma.riderProfile.update({
    where: { id: riderId },
    data: { status: approve ? "APPROVED" : "REJECTED" },
  });
  await prisma.user.update({ where: { id: rider.userId }, data: { status: approve ? "APPROVED" : "REJECTED" } });
  await notify(
    rider.userId,
    "VENDOR_APPROVAL",
    approve ? "Rider application approved" : "Rider application rejected",
    approve ? "You can now go online and accept deliveries." : `Rejected.${reason ? " Reason: " + reason : ""}`
  );
  await audit(admin.id, approve ? "APPROVE_RIDER" : "REJECT_RIDER", "RiderProfile", riderId, reason);
  revalidatePath("/dashboard/admin/riders");
  return { success: "Done." };
}

export async function suspendUser(userId: string, suspend: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };

  await prisma.user.update({
    where: { id: userId },
    data: { status: suspend ? "SUSPENDED" : "APPROVED" },
  });
  await audit(admin.id, suspend ? "SUSPEND_USER" : "REACTIVATE_USER", "User", userId);
  await notify(
    userId,
    "SYSTEM",
    suspend ? "Account suspended" : "Account reactivated",
    suspend ? "Your account has been suspended. Contact support for details." : "Your account is active again."
  );
  revalidatePath("/dashboard/admin/users");
  return { success: "Done." };
}

export async function decideProduct(productId: string, approve: boolean, reason?: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };
  if (!approve && !reason?.trim()) return { error: "A rejection reason is required." };

  const product = await prisma.product.update({
    where: { id: productId },
    data: { status: approve ? "APPROVED" : "REJECTED", rejectionReason: approve ? null : reason },
  });

  const vendorUserId = product.sellerId
    ? (await prisma.sellerProfile.findUnique({ where: { id: product.sellerId } }))?.userId
    : (await prisma.businessBuyerProfile.findUnique({ where: { id: product.buyerStoreId! } }))?.userId;
  if (vendorUserId) {
    await notify(
      vendorUserId,
      approve ? "PRODUCT_APPROVAL" : "PRODUCT_REJECTION",
      approve ? "Product approved" : "Product rejected",
      approve ? `"${product.name}" is now live.` : `"${product.name}" was rejected: ${reason}`
    );
  }
  await audit(admin.id, approve ? "APPROVE_PRODUCT" : "REJECT_PRODUCT", "Product", productId, reason);
  revalidatePath("/dashboard/admin/products");
  return { success: "Done." };
}

export async function overrideOrderStatus(orderId: string, status: OrderStatus, reason: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };
  if (!reason?.trim()) return { error: "A reason is required for manual overrides." };

  await prisma.order.update({ where: { id: orderId }, data: { status } });
  await audit(admin.id, "OVERRIDE_ORDER_STATUS", "Order", orderId, `${status}: ${reason}`);
  revalidatePath("/dashboard/admin/orders");
  return { success: "Order updated." };
}

export async function resolveDispute(disputeId: string, resolution: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };
  if (!resolution?.trim()) return { error: "Add a resolution note." };

  const dispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: "RESOLVED", resolution, resolvedById: admin.id },
    include: { order: true },
  });

  const vendorUserId = dispute.order.sellerId
    ? (await prisma.sellerProfile.findUnique({ where: { id: dispute.order.sellerId } }))?.userId
    : dispute.order.buyerStoreId
      ? (await prisma.businessBuyerProfile.findUnique({ where: { id: dispute.order.buyerStoreId } }))?.userId
      : undefined;

  await Promise.all(
    [dispute.raisedById, vendorUserId].filter(Boolean).map((id) =>
      notify(id as string, "DISPUTE", "Dispute resolved", `Dispute for order ${dispute.order.orderNumber}: ${resolution}`)
    )
  );

  await audit(admin.id, "RESOLVE_DISPUTE", "Dispute", disputeId, resolution);
  revalidatePath("/dashboard/admin/disputes");
  return { success: "Resolved." };
}

export async function hideReview(reviewId: string, reason: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };
  if (!reason?.trim()) return { error: "A reason is required." };

  await prisma.review.update({ where: { id: reviewId }, data: { isHidden: true } });
  await audit(admin.id, "HIDE_REVIEW", "Review", reviewId, reason);
  revalidatePath("/dashboard/admin/reviews");
  return { success: "Hidden." };
}

export async function sendBroadcast(audience: BroadcastAudience, title: string, body: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };
  if (!title.trim() || !body.trim()) return { error: "Title and message are required." };

  const recentCount = await prisma.broadcast.count({
    where: { createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recentCount >= 3) return { error: "Rate limit: max 3 broadcasts per hour." };

  await prisma.broadcast.create({ data: { audience, title, body, createdById: admin.id } });

  const where =
    audience === "ALL"
      ? { status: "APPROVED" as const, promotionsOptOut: false }
      : {
          status: "APPROVED" as const,
          promotionsOptOut: false,
          OR: [{ roles: { has: "SELLER" as const } }, { roles: { has: "BUSINESS_BUYER" as const } }],
        };
  const recipients = await prisma.user.findMany({ where, select: { id: true } });
  await prisma.notification.createMany({
    data: recipients.map((r) => ({ userId: r.id, type: "BROADCAST" as const, title, body })),
  });

  await audit(admin.id, "SEND_BROADCAST", "Broadcast", audience, title);
  revalidatePath("/dashboard/admin/broadcasts");
  return { success: `Sent to ${recipients.length} users.` };
}

export async function upsertDeliveryRate(
  district: District,
  fixedRate: number,
  perKmRate: number,
  useDistance: boolean
) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };

  await prisma.deliveryRateConfig.upsert({
    where: { district },
    create: { district, fixedRate, perKmRate, useDistance },
    update: { fixedRate, perKmRate, useDistance },
  });
  revalidatePath("/dashboard/admin/delivery-rates");
  return { success: "Saved." };
}

export async function setAdminScope(userId: string, scope: "FULL" | "ORDER_MANAGER" | "VENDOR_REVIEWER") {
  const admin = await requireAdmin();
  if (!admin || admin.adminScope !== "FULL") return { error: "Only a Full Admin can assign sub-admin roles." };

  await prisma.user.update({
    where: { id: userId },
    data: { roles: { push: "ADMIN" }, adminScope: scope },
  });
  await audit(admin.id, "SET_ADMIN_SCOPE", "User", userId, scope);
  revalidatePath("/dashboard/admin/users");
  return { success: "Done." };
}
