import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { releaseEligiblePayouts } from "@/lib/lifecycle";

export default async function VendorPayouts({
  sellerId,
  buyerStoreId,
  riderId,
}: {
  sellerId?: string;
  buyerStoreId?: string;
  riderId?: string;
}) {
  await releaseEligiblePayouts();

  const payouts = await prisma.payout.findMany({
    where: sellerId ? { sellerId } : riderId ? { riderId } : { buyerStoreId },
    include: { order: true },
    orderBy: { createdAt: "desc" },
  });

  const held = payouts.filter((p) => p.status === "HELD");
  const released = payouts.filter((p) => p.status === "RELEASED");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-4">Payouts</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="text-xs text-stone-500">Pending payout</div>
          <div className="text-xl font-bold text-amber-600">
            {formatMoney(held.reduce((s, p) => s + Number(p.netAmount), 0))}
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="text-xs text-stone-500">Released payout</div>
          <div className="text-xl font-bold text-emerald-700">
            {formatMoney(released.reduce((s, p) => s + Number(p.netAmount), 0))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
        {payouts.map((p) => (
          <div key={p.id} className="flex justify-between items-center px-4 py-3 text-sm">
            <div>
              <div className="font-medium">{p.order.orderNumber}</div>
              <div className="text-stone-500 text-xs">
                Gross {formatMoney(p.grossAmount.toString())} · Commission {formatMoney(p.commission.toString())}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatMoney(p.netAmount.toString())}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "HELD" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                {p.status}
              </span>
            </div>
          </div>
        ))}
        {payouts.length === 0 && <p className="text-stone-500 text-sm p-4">No payouts yet.</p>}
      </div>
      <p className="text-xs text-stone-400 mt-2">
        Funds move from held to released once delivery is confirmed and no dispute is raised within 48 hours.
        Commission is calculated automatically and cannot be edited.
      </p>
    </div>
  );
}
