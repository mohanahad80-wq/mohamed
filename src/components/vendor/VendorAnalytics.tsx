import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export default async function VendorAnalytics({
  sellerId,
  buyerStoreId,
}: {
  sellerId?: string;
  buyerStoreId?: string;
}) {
  const orderWhere = sellerId ? { sellerId } : { buyerStoreId };

  const [orders, payouts, products] = await Promise.all([
    prisma.order.findMany({
      where: { ...orderWhere, status: { not: "CANCELLED" } },
      include: { items: true },
    }),
    prisma.payout.findMany({ where: sellerId ? { sellerId } : { buyerStoreId } }),
    prisma.product.findMany({ where: sellerId ? { sellerId } : { buyerStoreId } }),
  ]);

  const totalSales = orders.reduce((s, o) => s + Number(o.subtotal), 0);
  const heldPayout = payouts.filter((p) => p.status === "HELD").reduce((s, p) => s + Number(p.netAmount), 0);
  const releasedPayout = payouts.filter((p) => p.status === "RELEASED").reduce((s, p) => s + Number(p.netAmount), 0);

  const soldQty = new Map<string, { name: string; qty: number }>();
  for (const o of orders) {
    for (const it of o.items) {
      const prev = soldQty.get(it.productId) ?? { name: it.nameSnapshot, qty: 0 };
      prev.qty += it.quantity;
      soldQty.set(it.productId, prev);
    }
  }
  const bestSellers = [...soldQty.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const stats = [
    ["Total orders", orders.length.toString()],
    ["Total sales", formatMoney(totalSales)],
    ["Held payouts", formatMoney(heldPayout)],
    ["Released payouts", formatMoney(releasedPayout)],
    ["Active products", products.filter((p) => p.status === "APPROVED" && !p.isDeactivated).length.toString()],
    ["Pending products", products.filter((p) => p.status === "PENDING").length.toString()],
  ] as const;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="text-xs text-stone-500">{label}</div>
            <div className="text-xl font-bold text-stone-900 mt-1">{value}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-semibold text-stone-900 mb-2">Best sellers</h2>
        {bestSellers.length === 0 ? (
          <p className="text-sm text-stone-500">No sales yet.</p>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
            {bestSellers.map((b) => (
              <div key={b.name} className="flex justify-between px-4 py-2 text-sm">
                <span>{b.name}</span>
                <span className="text-stone-500">{b.qty} sold</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
