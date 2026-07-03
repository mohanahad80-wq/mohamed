"use client";

import { useState, useTransition } from "react";
import { overrideOrderStatus } from "@/actions/admin";

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function OrderOverrideForm({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | undefined>();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-stone-500 hover:text-stone-800 underline">
        Override
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-stone-300 px-2 py-1 text-xs">
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (required)"
        className="rounded-md border border-stone-300 px-2 py-1 text-xs flex-1 min-w-[140px]"
      />
      <button
        disabled={pending || !reason.trim()}
        onClick={() =>
          startTransition(async () => {
            const res = await overrideOrderStatus(orderId, status as never, reason);
            setMsg(res?.error ?? res?.success);
          })
        }
        className="rounded-md bg-stone-800 text-white text-xs px-3 py-1.5 hover:bg-stone-900 disabled:opacity-50"
      >
        Apply
      </button>
      {msg && <span className="text-xs text-stone-500">{msg}</span>}
    </div>
  );
}
