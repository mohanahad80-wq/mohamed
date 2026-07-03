"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/actions/cart";

export default function AddToCartForm({
  productId,
  maxStock,
  minOrderQty,
  cartHref = "/cart",
}: {
  productId: string;
  maxStock: number;
  minOrderQty: number;
  cartHref?: string;
}) {
  const [qty, setQty] = useState(minOrderQty);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | undefined>();
  const router = useRouter();

  if (maxStock === 0) {
    return <span className="text-stone-500 text-sm">Currently unavailable.</span>;
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        min={minOrderQty}
        max={maxStock}
        value={qty}
        onChange={(e) => setQty(parseInt(e.target.value, 10) || minOrderQty)}
        className="w-20 rounded-md border border-stone-300 px-2 py-2 text-sm"
      />
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await addToCart(productId, qty);
            if (res?.error) setMsg(res.error);
            else router.push(cartHref);
          })
        }
        className="rounded-md bg-emerald-700 text-white px-5 py-2.5 font-medium hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add to cart"}
      </button>
      {msg && <span className="text-sm text-rose-600">{msg}</span>}
    </div>
  );
}
