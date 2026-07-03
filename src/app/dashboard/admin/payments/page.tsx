import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: { order: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Payments</h1>
      <p className="text-sm text-stone-500 mb-4">
        Total verified: {formatMoney(totalPaid)}. Transactions are immutable — corrections create a new ledger entry
        instead of editing history.
      </p>
      <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
        {payments.map((p) => (
          <div key={p.id} className="flex justify-between items-center px-4 py-3 text-sm">
            <div>
              <div className="font-medium">{p.order.orderNumber}</div>
              <div className="text-stone-500 text-xs">
                {p.method.replace("_", " ")} {p.transactionRef ? `· ${p.transactionRef}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatMoney(p.amount.toString())}</div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === "PAID" ? "bg-emerald-100 text-emerald-700" : p.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {p.status}
              </span>
            </div>
          </div>
        ))}
        {payments.length === 0 && <p className="text-stone-500 text-sm p-4">No transactions yet.</p>}
      </div>
    </div>
  );
}
