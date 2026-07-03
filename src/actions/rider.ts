"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { District } from "@/generated/prisma/client";
import { notify } from "@/lib/notify";
import { revalidatePath } from "next/cache";
import { DISTRICT_LABELS } from "@/lib/districts";

export async function assignRider(orderId: string, excludeRiderId?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  const candidates = await prisma.riderProfile.findMany({
    where: {
      status: "APPROVED",
      isOnline: true,
      serviceDistricts: { has: order.district },
      ...(excludeRiderId ? { id: { not: excludeRiderId } } : {}),
    },
    orderBy: { currentLoad: "asc" },
  });
  const rider = candidates.find((r) => r.currentLoad < r.maxLoad);

  if (!rider) {
    const admins = await prisma.user.findMany({ where: { roles: { has: "ADMIN" } }, select: { id: true } });
    await Promise.all(
      admins.map((a) =>
        notify(
          a.id,
          "DISTRICT_COVERAGE",
          "No riders available",
          `No online riders are available in ${DISTRICT_LABELS[order.district as District]} for order ${order.orderNumber}.`
        )
      )
    );
    return;
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { riderId: rider.id, riderStatus: "ASSIGNED" },
    }),
    prisma.riderProfile.update({
      where: { id: rider.id },
      data: { currentLoad: { increment: 1 } },
    }),
  ]);

  await notify(
    rider.userId,
    "RIDER_ASSIGNMENT",
    "New delivery assignment",
    `You've been assigned order ${order.orderNumber} in ${DISTRICT_LABELS[order.district as District]}.`
  );
}

export async function toggleOnline() {
  const user = await getCurrentUser();
  if (!user?.riderProfile) return { error: "Not a rider." };
  await prisma.riderProfile.update({
    where: { id: user.riderProfile.id },
    data: { isOnline: !user.riderProfile.isOnline },
  });
  revalidatePath("/dashboard/rider");
}

export async function respondToAssignment(orderId: string, accept: boolean) {
  const user = await getCurrentUser();
  if (!user?.riderProfile) return { error: "Not a rider." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.riderId !== user.riderProfile.id) return { error: "Not your assignment." };

  if (accept) {
    revalidatePath("/dashboard/rider");
    return { success: "Accepted." };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { riderId: null, riderStatus: "UNASSIGNED" },
    }),
    prisma.riderProfile.update({
      where: { id: user.riderProfile.id },
      data: { currentLoad: { decrement: 1 } },
    }),
  ]);

  await assignRider(orderId, user.riderProfile.id);
  revalidatePath("/dashboard/rider");
  return { success: "Rejected — reassigning." };
}

const FORWARD: Record<string, string> = {
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};

export async function advanceDeliveryStatus(orderId: string) {
  const user = await getCurrentUser();
  if (!user?.riderProfile) return { error: "Not a rider." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.riderId !== user.riderProfile.id) return { error: "Not your delivery." };

  const next = FORWARD[order.riderStatus];
  if (!next) return { error: "No further status to advance to." };

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        riderStatus: next as never,
        status: next === "PICKED_UP" ? "SHIPPED" : order.status,
        ...(next === "DELIVERED"
          ? {
              status: "DELIVERED",
              deliveredAt: new Date(),
              disputeWindowEndsAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
              paymentStatus: order.paymentMethod === "COD" ? "PAID" : order.paymentStatus,
            }
          : {}),
      },
    });

    if (next === "DELIVERED") {
      await tx.riderProfile.update({
        where: { id: user.riderProfile!.id },
        data: { currentLoad: { decrement: 1 }, totalDeliveries: { increment: 1 }, onTimeCount: { increment: 1 } },
      });

      const grossAmount = Number(order.subtotal);
      const commission = Math.round(grossAmount * 0.08 * 100) / 100;
      const vendorNet = Math.round((grossAmount - commission) * 100) / 100;

      await tx.payout.create({
        data: {
          type: order.sellerId ? "SELLER" : "BUSINESS_BUYER",
          sellerId: order.sellerId,
          buyerStoreId: order.buyerStoreId,
          orderId: order.id,
          grossAmount,
          commission,
          netAmount: vendorNet,
          status: "HELD",
        },
      });

      const riderFee = Number(order.deliveryFee);
      await tx.payout.create({
        data: {
          type: "RIDER",
          riderId: user.riderProfile!.id,
          orderId: order.id,
          grossAmount: riderFee,
          commission: 0,
          netAmount: riderFee,
          status: "HELD",
        },
      });
    }
  });

  await notify(
    order.buyerId,
    "ORDER_UPDATE",
    "Delivery update",
    `Order ${order.orderNumber} is now ${next.replace("_", " ").toLowerCase()}.`
  );

  revalidatePath("/dashboard/rider");
  revalidatePath(`/orders/${orderId}`);
}
