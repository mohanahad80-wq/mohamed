"use client";

import { useTransition } from "react";
import { flagReview } from "@/actions/reviews";

export default function FlagReviewButton({ reviewId }: { reviewId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await flagReview(reviewId);
        })
      }
      className="text-xs text-stone-400 hover:text-rose-600"
    >
      Flag as spam
    </button>
  );
}
