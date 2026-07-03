import { requireUser } from "@/lib/permissions";
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

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const user = await requireUser();
  const { group } = await searchParams;

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    include: { items: true, seller: true, buyerStore: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-stone-900">My orders</h1>
      {group && (
        <p className="mt-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2">
          Order placed successfully!
        </p>
      )}

      <div className="mt-6 space-y-3">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className={`block rounded-xl border p-4 hover:shadow-sm ${
              group === o.groupId ? "border-emerald-400" : "border-stone-200"
            } bg-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-stone-900">{o.orderNumber}</div>
                <div className="text-sm text-stone-500">
                  {o.seller?.businessName ?? o.buyerStore?.storeName ?? o.buyerStore?.businessName} ·{" "}
                  {o.items.length} item(s)
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatMoney(o.total.toString())}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
              </div>
            </div>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-stone-500">No orders yet.</p>}
      </div>
    </div>
  );
}
