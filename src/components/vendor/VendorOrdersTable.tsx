import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatMoney } from "@/lib/money";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-stone-200 text-stone-600",
};

export default async function VendorOrdersTable({
  sellerId,
  buyerStoreId,
  base,
}: {
  sellerId?: string;
  buyerStoreId?: string;
  base: string;
}) {
  const orders = await prisma.order.findMany({
    where: sellerId ? { sellerId } : { buyerStoreId },
    include: { items: true, buyer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-4">Orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`${base}/orders/${o.id}`}
            className="block rounded-xl border border-stone-200 bg-white p-4 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-stone-900">{o.orderNumber}</div>
                <div className="text-sm text-stone-500">
                  {o.buyer.fullName ?? o.buyer.phone} · {o.items.length} item(s)
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatMoney(o.total.toString())}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
              </div>
            </div>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-stone-500 text-sm">No orders yet.</p>}
      </div>
    </div>
  );
}
