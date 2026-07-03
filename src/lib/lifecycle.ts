import { prisma } from "@/lib/prisma";
import { District } from "@/generated/prisma/client";
import { COMMISSION_RATE } from "@/lib/money";
import { notify } from "@/lib/notify";

/** No real geocoding available — distance-based rate uses a same-district vs
 * cross-district heuristic instead of true coordinates. */
export async function computeDeliveryFee(vendorDistrict: District, buyerDistrict: District) {
  const config = await prisma.deliveryRateConfig.findUnique({ where: { district: buyerDistrict } });
  if (config?.useDistance) {
    const estimatedKm = vendorDistrict === buyerDistrict ? 3 : 8;
    return Number(config.perKmRate) * estimatedKm;
  }
  if (config) return Number(config.fixedRate);
  return vendorDistrict === buyerDistrict ? 2.5 : 4.5;
}

/** Lazily flip disputes past their SLA to ESCALATED — called from pages that list disputes. */
export async function escalateOverdueDisputes() {
  const overdue = await prisma.dispute.findMany({
    where: { status: "OPEN", responseDeadline: { lt: new Date() } },
    include: { order: { include: { seller: true, buyerStore: true } } },
  });
  if (overdue.length === 0) return;

  const admins = await prisma.user.findMany({ where: { roles: { has: "ADMIN" } }, select: { id: true } });

  for (const d of overdue) {
    await prisma.dispute.update({ where: { id: d.id }, data: { status: "ESCALATED" } });
    await Promise.all(
      admins.map((a) =>
        notify(
          a.id,
          "DISPUTE",
          "Dispute auto-escalated",
          `Order ${d.order.orderNumber}'s dispute passed its response deadline and was escalated to Admin.`
        )
      )
    );
  }
}

/** Lazily release HELD payouts once the 48h no-dispute window has passed. */
export async function releaseEligiblePayouts() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const candidates = await prisma.payout.findMany({
    where: {
      status: "HELD",
      order: { deliveredAt: { lt: cutoff } },
    },
    include: { order: { include: { disputes: true } } },
  });

  for (const p of candidates) {
    const hasActiveDispute = p.order.disputes.some(
      (d) => d.status === "OPEN" || d.status === "UNDER_REVIEW" || d.status === "ESCALATED"
    );
    if (hasActiveDispute) continue;
    await prisma.payout.update({
      where: { id: p.id },
      data: { status: "RELEASED", releasedAt: new Date() },
    });
    const recipientUserId = await resolvePayoutRecipientUserId(p);
    if (recipientUserId) {
      await notify(
        recipientUserId,
        "PAYOUT",
        "Payout released",
        `Your payout of $${Number(p.netAmount).toFixed(2)} for order ${p.orderId} has been released.`
      );
    }
  }
}

async function resolvePayoutRecipientUserId(p: { sellerId: string | null; buyerStoreId: string | null; riderId: string | null }) {
  if (p.sellerId) {
    const s = await prisma.sellerProfile.findUnique({ where: { id: p.sellerId }, select: { userId: true } });
    return s?.userId;
  }
  if (p.buyerStoreId) {
    const b = await prisma.businessBuyerProfile.findUnique({ where: { id: p.buyerStoreId }, select: { userId: true } });
    return b?.userId;
  }
  if (p.riderId) {
    const r = await prisma.riderProfile.findUnique({ where: { id: p.riderId }, select: { userId: true } });
    return r?.userId;
  }
  return null;
}

export function computeCommission(amount: number) {
  const commission = Math.round(amount * COMMISSION_RATE * 100) / 100;
  return { commission, net: Math.round((amount - commission) * 100) / 100 };
}
