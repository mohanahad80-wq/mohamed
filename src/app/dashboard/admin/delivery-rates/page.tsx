import { prisma } from "@/lib/prisma";
import { DISTRICTS, DISTRICT_LABELS } from "@/lib/districts";
import DeliveryRateRow from "@/components/admin/DeliveryRateRow";

export default async function AdminDeliveryRatesPage() {
  const configs = await prisma.deliveryRateConfig.findMany();
  const byDistrict = new Map(configs.map((c) => [c.district, c]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Delivery rates</h1>
      <p className="text-sm text-stone-500 mb-6">
        Set a fixed rate per district, or switch to distance-based pricing (per-km rate).
      </p>
      <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
        <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs font-medium text-stone-400">
          <span>District</span>
          <span>Fixed ($)</span>
          <span>Per km ($)</span>
          <span>Mode</span>
          <span></span>
        </div>
        {DISTRICTS.map((d) => {
          const c = byDistrict.get(d);
          return (
            <DeliveryRateRow
              key={d}
              district={d}
              label={DISTRICT_LABELS[d]}
              fixedRate={c ? Number(c.fixedRate) : 2.5}
              perKmRate={c ? Number(c.perKmRate) : 0.5}
              useDistance={c?.useDistance ?? false}
            />
          );
        })}
      </div>
    </div>
  );
}
