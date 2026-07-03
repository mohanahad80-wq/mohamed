import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import OrderOverrideForm from "@/components/admin/OrderOverrideForm";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-stone-200 text-stone-600",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { buyer: true, seller: true, buyerStore: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">All orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-stone-900">{o.orderNumber}</div>
                <div className="text-sm text-stone-500">
                  {o.buyer.fullName ?? o.buyer.phone} → {o.seller?.businessName ?? o.buyerStore?.businessName}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatMoney(o.total.toString())}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
              </div>
            </div>
            <OrderOverrideForm orderId={o.id} currentStatus={o.status} />
          </div>
        ))}
        {orders.length === 0 && <p className="text-stone-500 text-sm">No orders yet.</p>}
      </div>
    </div>
  );
}
