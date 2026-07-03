"use client";

import { useState, useTransition } from "react";
import { vendorConfirmOrder, cancelOrder } from "@/actions/orders";

export default function OrderActionButtons({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | undefined>();

  if (!["PENDING", "CONFIRMED"].includes(status)) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {status === "PENDING" && (
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await vendorConfirmOrder(orderId);
                if (res?.error) setErr(res.error);
              })
            }
            className="rounded-md bg-emerald-700 text-white text-sm px-4 py-2 hover:bg-emerald-800 disabled:opacity-50"
          >
            Confirm order
          </button>
        )}
        {!showCancel && (
          <button onClick={() => setShowCancel(true)} className="rounded-md border border-rose-300 text-rose-700 text-sm px-4 py-2 hover:bg-rose-50">
            Cancel order
          </button>
        )}
      </div>
      {err && <div className="text-xs text-rose-600">{err}</div>}
      {showCancel && (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Cancellation reason (required)…"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            rows={2}
          />
          <button
            disabled={pending || !reason.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await cancelOrder(orderId, reason);
                if (res?.error) setErr(res.error);
              })
            }
            className="rounded-md bg-rose-600 text-white text-sm px-4 py-2 hover:bg-rose-700 disabled:opacity-50"
          >
            Confirm cancellation
          </button>
        </div>
      )}
    </div>
  );
}
