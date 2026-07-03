import { prisma } from "@/lib/prisma";
import { DISTRICT_LABELS } from "@/lib/districts";
import { District } from "@/generated/prisma/client";
import VendorDecisionButtons from "@/components/admin/VendorDecisionButtons";

export default async function AdminVendorsPage() {
  const [sellers, buyers] = await Promise.all([
    prisma.sellerProfile.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.businessBuyerProfile.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const all = [
    ...sellers.map((s) => ({ ...s, type: "SELLER" as const })),
    ...buyers.map((b) => ({ ...b, type: "BUSINESS_BUYER" as const })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Vendors</h1>
      <div className="space-y-3">
        {all.map((v) => (
          <div key={v.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-stone-900">
                  {v.businessName} <span className="text-xs text-stone-400">({v.type === "SELLER" ? "Seller" : "Business Buyer"})</span>
                </div>
                <div className="text-sm text-stone-500">
                  {v.ownerFullName} · {v.phone} · {v.email}
                </div>
                <div className="text-sm text-stone-500">
                  {DISTRICT_LABELS[v.district as District]}, {v.city} · {v.category}
                </div>
                <div className="mt-2 flex gap-3 text-sm">
                  {v.idDocFile && (
                    <a href={`/api/files/${v.idDocFile}`} target="_blank" className="text-emerald-700 hover:underline">
                      View ID
                    </a>
                  )}
                  {v.licenseFile && (
                    <a href={`/api/files/${v.licenseFile}`} target="_blank" className="text-emerald-700 hover:underline">
                      View License
                    </a>
                  )}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  v.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-700"
                    : v.status === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                }`}
              >
                {v.status}
              </span>
            </div>
            {v.status === "PENDING" && (
              <div className="mt-3">
                <VendorDecisionButtons profileType={v.type} profileId={v.id} />
              </div>
            )}
          </div>
        ))}
        {all.length === 0 && <p className="text-stone-500 text-sm">No vendor applications yet.</p>}
      </div>
    </div>
  );
}
