import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CartItemRow from "@/components/shop/CartItemRow";
import { formatMoney } from "@/lib/money";

export default async function CartPage() {
  const user = await requireUser();

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id, product: { vendorType: "BUSINESS_BUYER_STORE" } },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Your cart</h1>

      {items.length === 0 ? (
        <p className="mt-6 text-stone-500">
          Your cart is empty.{" "}
          <Link href="/shop" className="text-emerald-700 underline">
            Browse the shop
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="mt-6">
            {items.map((i) => (
              <CartItemRow
                key={i.id}
                productId={i.productId}
                name={i.product.name}
                image={i.product.images[0]}
                price={Number(i.product.price)}
                quantity={i.quantity}
                minOrderQty={i.product.minOrderQty}
                stock={i.product.stock}
              />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-stone-600">Subtotal</span>
            <span className="text-xl font-bold">{formatMoney(subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block text-center rounded-md bg-emerald-700 text-white py-3 font-medium hover:bg-emerald-800"
          >
            Proceed to checkout
          </Link>
        </>
      )}
    </div>
  );
}
