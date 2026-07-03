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

export default async function MyPurchasesPage() {
  const user = await requireUser();

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id, vendorType: "SELLER" },
    include: { items: true, seller: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-stone-900">My Purchases</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/wholesale" className="text-emerald-700 hover:underline">
            Browse wholesale
          </Link>
          <Link href="/wholesale/cart" className="text-emerald-700 hover:underline">
            Cart
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="block rounded-xl border border-stone-200 bg-white p-4 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-stone-900">{o.orderNumber}</div>
                <div className="text-sm text-stone-500">
                  {o.seller?.businessName} · {o.items.length} item(s)
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatMoney(o.total.toString())}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{o.status}</span>
              </div>
            </div>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-stone-500 text-sm">No wholesale purchases yet.</p>}
      </div>
    </div>
  );
}
