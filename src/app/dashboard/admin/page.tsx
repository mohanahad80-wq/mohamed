import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export default async function AdminOverviewPage() {
  const [
    userCount,
    pendingVendors,
    pendingRiders,
    pendingProducts,
    orders,
    openDisputes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.sellerProfile.count({ where: { status: "PENDING" } }).then(async (s) => s + (await prisma.businessBuyerProfile.count({ where: { status: "PENDING" } }))),
    prisma.riderProfile.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({ where: { status: { not: "CANCELLED" } } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW", "ESCALATED"] } } }),
  ]);

  const totalSales = orders.reduce((s, o) => s + Number(o.total), 0);

  const stats = [
    ["Total users", userCount],
    ["Pending vendor approvals", pendingVendors],
    ["Pending rider approvals", pendingRiders],
    ["Pending products", pendingProducts],
    ["Total orders", orders.length],
    ["Open disputes", openDisputes],
    ["Gross sales", formatMoney(totalSales)],
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Admin overview</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="text-xs text-stone-500">{label}</div>
            <div className="text-xl font-bold text-stone-900 mt-1">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
