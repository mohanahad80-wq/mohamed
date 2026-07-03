"use client";

import { useState, useTransition } from "react";
import { cancelOrder } from "@/actions/orders";

export default function CancelOrderForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | undefined>();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-rose-600 hover:underline">
        Cancel order
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for cancelling…"
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        rows={2}
      />
      {err && <div className="text-xs text-rose-600">{err}</div>}
      <div className="flex gap-2">
        <button
          disabled={pending || !reason.trim()}
          onClick={() =>
            startTransition(async () => {
              const res = await cancelOrder(orderId, reason);
              if (res?.error) setErr(res.error);
            })
          }
          className="rounded-md bg-rose-600 text-white text-sm px-3 py-1.5 hover:bg-rose-700 disabled:opacity-50"
        >
          Confirm cancel
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-stone-500">
          Never mind
        </button>
      </div>
    </div>
  );
}
