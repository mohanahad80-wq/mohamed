import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function AdminReportsPage() {
  const orders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    include: { items: true, seller: true, buyerStore: true },
  });

  const now = new Date();
  const today = startOfDay(now);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const sumSince = (since: Date) => orders.filter((o) => o.createdAt >= since).reduce((s, o) => s + Number(o.total), 0);

  const vendorSales = new Map<string, { name: string; total: number }>();
  const productSales = new Map<string, { name: string; qty: number }>();
  for (const o of orders) {
    const key = o.sellerId ?? o.buyerStoreId ?? "unknown";
    const name = o.seller?.businessName ?? o.buyerStore?.businessName ?? "Unknown";
    const prev = vendorSales.get(key) ?? { name, total: 0 };
    prev.total += Number(o.total);
    vendorSales.set(key, prev);
    for (const it of o.items) {
      const p = productSales.get(it.productId) ?? { name: it.nameSnapshot, qty: 0 };
      p.qty += it.quantity;
      productSales.set(it.productId, p);
    }
  }

  const topVendors = [...vendorSales.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  const topProducts = [...productSales.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Reports</h1>
        <a href="/api/admin/reports/export" className="rounded-md bg-stone-800 text-white text-sm px-4 py-2 hover:bg-stone-900">
          Export CSV (Excel)
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="text-xs text-stone-500">Today</div>
          <div className="text-xl font-bold">{formatMoney(sumSince(today))}</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="text-xs text-stone-500">Last 7 days</div>
          <div className="text-xl font-bold">{formatMoney(sumSince(weekAgo))}</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="text-xs text-stone-500">Last 30 days</div>
          <div className="text-xl font-bold">{formatMoney(sumSince(monthAgo))}</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-stone-900 mb-2">Top vendors</h2>
          <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
            {topVendors.map((v) => (
              <div key={v.name} className="flex justify-between px-4 py-2 text-sm">
                <span>{v.name}</span>
                <span className="text-stone-500">{formatMoney(v.total)}</span>
              </div>
            ))}
            {topVendors.length === 0 && <p className="text-stone-500 text-sm p-4">No sales yet.</p>}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-stone-900 mb-2">Top products</h2>
          <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
            {topProducts.map((p) => (
              <div key={p.name} className="flex justify-between px-4 py-2 text-sm">
                <span>{p.name}</span>
                <span className="text-stone-500">{p.qty} sold</span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-stone-500 text-sm p-4">No sales yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
