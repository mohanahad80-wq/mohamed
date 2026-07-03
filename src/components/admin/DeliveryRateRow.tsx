"use client";

import { useState, useTransition } from "react";
import { upsertDeliveryRate } from "@/actions/admin";
import { District } from "@/generated/prisma/client";

export default function DeliveryRateRow({
  district,
  label,
  fixedRate,
  perKmRate,
  useDistance,
}: {
  district: District;
  label: string;
  fixedRate: number;
  perKmRate: number;
  useDistance: boolean;
}) {
  const [fixed, setFixed] = useState(fixedRate);
  const [perKm, setPerKm] = useState(perKmRate);
  const [dist, setDist] = useState(useDistance);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="grid grid-cols-5 items-center gap-2 px-4 py-2 text-sm">
      <span>{label}</span>
      <input
        type="number"
        step="0.01"
        value={fixed}
        onChange={(e) => setFixed(parseFloat(e.target.value) || 0)}
        className="rounded-md border border-stone-300 px-2 py-1 w-20"
      />
      <input
        type="number"
        step="0.01"
        value={perKm}
        onChange={(e) => setPerKm(parseFloat(e.target.value) || 0)}
        className="rounded-md border border-stone-300 px-2 py-1 w-20"
      />
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={dist} onChange={(e) => setDist(e.target.checked)} />
        distance-based
      </label>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await upsertDeliveryRate(district, fixed, perKm, dist);
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          })
        }
        className="rounded-md bg-stone-800 text-white text-xs px-3 py-1.5 hover:bg-stone-900 disabled:opacity-50"
      >
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
