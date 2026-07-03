"use client";

import { useState, useTransition } from "react";
import { updateCartQty, removeFromCart } from "@/actions/cart";
import { formatMoney } from "@/lib/money";

export default function CartItemRow({
  productId,
  name,
  image,
  price,
  quantity,
  minOrderQty,
  stock,
}: {
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  minOrderQty: number;
  stock: number;
}) {
  const [qty, setQty] = useState(quantity);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | undefined>();

  return (
    <div className="flex items-center gap-4 py-4 border-b border-stone-200">
      <div className="h-16 w-16 rounded-md bg-stone-100 overflow-hidden shrink-0">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-stone-900 truncate">{name}</div>
        <div className="text-sm text-stone-500">{formatMoney(price)} each</div>
        {err && <div className="text-xs text-rose-600">{err}</div>}
      </div>
      <input
        type="number"
        min={minOrderQty}
        max={stock}
        value={qty}
        disabled={pending}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10) || minOrderQty;
          setQty(v);
          startTransition(async () => {
            const res = await updateCartQty(productId, v);
            if (res?.error) setErr(res.error);
            else setErr(undefined);
          });
        }}
        className="w-20 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
      />
      <div className="w-20 text-right font-medium">{formatMoney(price * qty)}</div>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await removeFromCart(productId);
          })
        }
        className="text-stone-400 hover:text-rose-600 text-sm"
      >
        Remove
      </button>
    </div>
  );
}
