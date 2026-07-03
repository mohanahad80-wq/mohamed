"use client";

import { useState, useTransition } from "react";
import { respondToAssignment, advanceDeliveryStatus } from "@/actions/rider";
import { formatMoney } from "@/lib/money";
import { DISTRICT_LABELS } from "@/lib/districts";
import { District } from "@/generated/prisma/client";

const NEXT_LABEL: Record<string, string> = {
  ASSIGNED: "Mark picked up",
  PICKED_UP: "Mark in transit",
  IN_TRANSIT: "Mark delivered",
};

export default function DeliveryCard({
  orderId,
  orderNumber,
  district,
  deliveryFee,
  riderStatus,
  addressDetails,
}: {
  orderId: string;
  orderNumber: string;
  district: string;
  deliveryFee: number;
  riderStatus: string;
  addressDetails: string;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | undefined>();
  const [status, setStatus] = useState(riderStatus);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-stone-900">{orderNumber}</div>
          <div className="text-sm text-stone-500">
            {DISTRICT_LABELS[district as District]} · {addressDetails}
          </div>
          <div className="text-sm text-stone-500">Fee: {formatMoney(deliveryFee)}</div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{status}</span>
      </div>
      {err && <div className="text-xs text-rose-600 mt-2">{err}</div>}
      <div className="mt-3 flex gap-2">
        {status === "ASSIGNED" && (
          <>
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await respondToAssignment(orderId, true);
                  if (res?.error) setErr(res.error);
                })
              }
              className="rounded-md bg-emerald-700 text-white text-sm px-3 py-1.5 hover:bg-emerald-800 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await respondToAssignment(orderId, false);
                  if (res?.error) setErr(res.error);
                })
              }
              className="rounded-md border border-rose-300 text-rose-700 text-sm px-3 py-1.5 hover:bg-rose-50 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
        {NEXT_LABEL[status] && (
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await advanceDeliveryStatus(orderId);
                setStatus((s) => (s === "ASSIGNED" ? "PICKED_UP" : s === "PICKED_UP" ? "IN_TRANSIT" : "DELIVERED"));
              })
            }
            className="rounded-md bg-stone-800 text-white text-sm px-3 py-1.5 hover:bg-stone-900 disabled:opacity-50"
          >
            {NEXT_LABEL[status]}
          </button>
        )}
      </div>
    </div>
  );
}
