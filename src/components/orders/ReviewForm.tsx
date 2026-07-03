"use client";

import { useState, useTransition } from "react";
import { submitReview } from "@/actions/reviews";

export default function ReviewForm({ orderId, productId, productName }: { orderId: string; productId: string; productName: string }) {
  const [rating, setRating] = useState(5);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ error?: string; success?: string } | undefined>();

  if (msg?.success) return <div className="text-sm text-emerald-700">{msg.success}</div>;

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const res = await submitReview(orderId, productId, formData);
          setMsg(res);
        })
      }
      className="space-y-2 border border-stone-200 rounded-md p-3"
    >
      <div className="text-sm font-medium">Rate {productName}</div>
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            className={n <= rating ? "text-amber-500" : "text-stone-300"}
          >
            ★
          </button>
        ))}
      </div>
      <textarea name="comment" placeholder="Optional comment" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" rows={2} />
      {msg?.error && <div className="text-xs text-rose-600">{msg.error}</div>}
      <button
        disabled={pending}
        className="rounded-md bg-emerald-700 text-white text-sm px-3 py-1.5 hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
