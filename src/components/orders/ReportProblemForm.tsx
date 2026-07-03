"use client";

import { useState, useTransition } from "react";
import { reportProblem } from "@/actions/orders";

export default function ReportProblemForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ error?: string; success?: string } | undefined>();

  if (msg?.success) return <div className="text-sm text-emerald-700">{msg.success}</div>;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-stone-300 text-stone-700 text-sm px-3 py-1.5 hover:bg-stone-50"
      >
        Report a problem
      </button>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const res = await reportProblem(orderId, formData);
          setMsg(res);
        })
      }
      className="space-y-2 border border-stone-200 rounded-md p-3"
    >
      <textarea
        name="reason"
        required
        placeholder="What went wrong?"
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        rows={2}
      />
      <input type="file" name="photo" accept="image/*" className="text-xs" />
      {msg?.error && <div className="text-xs text-rose-600">{msg.error}</div>}
      <button
        disabled={pending}
        className="rounded-md bg-stone-800 text-white text-sm px-3 py-1.5 hover:bg-stone-900 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}
