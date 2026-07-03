"use client";

import { useState, useTransition } from "react";
import { hideReview } from "@/actions/admin";

export default function HideReviewForm({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return <span className="text-xs text-stone-400">Hidden</span>;
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-rose-600 hover:underline">
        Hide
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
        className="rounded-md border border-stone-300 px-2 py-1 text-xs"
      />
      <button
        disabled={pending || !reason.trim()}
        onClick={() =>
          startTransition(async () => {
            const res = await hideReview(reviewId, reason);
            if (!res?.error) setDone(true);
          })
        }
        className="rounded-md bg-rose-600 text-white text-xs px-2 py-1 hover:bg-rose-700 disabled:opacity-50"
      >
        Confirm
      </button>
    </div>
  );
}
