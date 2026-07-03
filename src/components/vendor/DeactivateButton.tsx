"use client";

import { useTransition } from "react";
import { deactivateProduct } from "@/actions/products";

export default function DeactivateButton({ productId, isDeactivated }: { productId: string; isDeactivated: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deactivateProduct(productId);
        })
      }
      className="text-sm text-stone-500 hover:text-stone-800"
    >
      {isDeactivated ? "Activate" : "Deactivate"}
    </button>
  );
}
