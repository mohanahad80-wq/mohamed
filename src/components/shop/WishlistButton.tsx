"use client";

import { useState, useTransition } from "react";
import { toggleWishlist } from "@/actions/wishlist";

export default function WishlistButton({
  productId,
  initialWishlisted,
}: {
  productId: string;
  initialWishlisted: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleWishlist(productId);
          if (!res?.error) setWishlisted((w) => !w);
        })
      }
      className={`rounded-md border px-4 py-2.5 text-sm font-medium ${
        wishlisted ? "border-rose-300 bg-rose-50 text-rose-700" : "border-stone-300 text-stone-700 hover:bg-stone-50"
      }`}
    >
      {wishlisted ? "♥ Saved" : "♡ Save"}
    </button>
  );
}
