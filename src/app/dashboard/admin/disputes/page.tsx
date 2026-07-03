import { prisma } from "@/lib/prisma";
import { escalateOverdueDisputes } from "@/lib/lifecycle";
import ResolveDisputeForm from "@/components/admin/ResolveDisputeForm";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  ESCALATED: "bg-rose-100 text-rose-700",
};

export default async function AdminDisputesPage() {
  await escalateOverdueDisputes();

  const disputes = await prisma.dispute.findMany({
    include: { order: true, raisedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Disputes</h1>
      <div className="space-y-3">
        {disputes.map((d) => (
          <div key={d.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-stone-900">{d.order.orderNumber}</div>
                <div className="text-sm text-stone-600 mt-1">{d.reason}</div>
                <div className="text-xs text-stone-400 mt-1">
                  Raised by {d.raisedBy.fullName ?? d.raisedBy.phone} · deadline {d.responseDeadline.toLocaleString()}
                </div>
                {d.resolution && <div className="text-xs text-emerald-700 mt-1">Resolved: {d.resolution}</div>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>{d.status}</span>
            </div>
            {(d.status === "OPEN" || d.status === "UNDER_REVIEW" || d.status === "ESCALATED") && (
              <ResolveDisputeForm disputeId={d.id} />
            )}
          </div>
        ))}
        {disputes.length === 0 && <p className="text-stone-500 text-sm">No disputes.</p>}
      </div>
    </div>
  );
}
