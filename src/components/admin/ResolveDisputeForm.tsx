"use client";

import { useState, useTransition } from "react";
import { resolveDispute } from "@/actions/admin";

export default function ResolveDisputeForm({ disputeId }: { disputeId: string }) {
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | undefined>();

  if (msg) return <div className="text-xs text-emerald-700">{msg}</div>;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-emerald-700 hover:underline">
        Resolve
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <input
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        placeholder="Resolution note (sent to both parties)"
        className="flex-1 min-w-[200px] rounded-md border border-stone-300 px-2 py-1.5 text-sm"
      />
      <button
        disabled={pending || !resolution.trim()}
        onClick={() =>
          startTransition(async () => {
            const res = await resolveDispute(disputeId, resolution);
            setMsg(res?.success ?? res?.error);
          })
        }
        className="rounded-md bg-emerald-700 text-white text-sm px-3 py-1.5 hover:bg-emerald-800 disabled:opacity-50"
      >
        Submit
      </button>
    </div>
  );
}
