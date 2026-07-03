import { prisma } from "@/lib/prisma";
import { DISTRICT_LABELS } from "@/lib/districts";
import { District } from "@/generated/prisma/client";
import RiderDecisionButtons from "@/components/admin/RiderDecisionButtons";

export default async function AdminRidersPage() {
  const riders = await prisma.riderProfile.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Riders</h1>
      <div className="space-y-3">
        {riders.map((r) => (
          <div key={r.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-stone-900">{r.fullName}</div>
                <div className="text-sm text-stone-500">
                  {r.phone} · {r.vehicleType} · {r.plateNumber}
                </div>
                <div className="text-sm text-stone-500">
                  {r.serviceDistricts.map((d) => DISTRICT_LABELS[d as District]).join(", ")}
                </div>
                {r.idDocFile && (
                  <a href={`/api/files/${r.idDocFile}`} target="_blank" className="text-sm text-emerald-700 hover:underline">
                    View ID
                  </a>
                )}
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : r.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {r.status}
              </span>
            </div>
            {r.status === "PENDING" && (
              <div className="mt-3">
                <RiderDecisionButtons riderId={r.id} />
              </div>
            )}
          </div>
        ))}
        {riders.length === 0 && <p className="text-stone-500 text-sm">No rider applications yet.</p>}
      </div>
    </div>
  );
}
