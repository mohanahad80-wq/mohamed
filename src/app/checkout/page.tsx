import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import CheckoutForm from "@/components/shop/CheckoutForm";
import { redirect } from "next/navigation";

export default async function CheckoutPage() {
  const user = await requireUser();

  const [items, addresses] = await Promise.all([
    prisma.cartItem.findMany({
      where: { userId: user.id, product: { vendorType: "BUSINESS_BUYER_STORE" } },
      include: { product: true },
    }),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }),
  ]);

  if (items.length === 0) redirect("/cart");

  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Checkout</h1>
        <CheckoutForm scope="retail" addresses={addresses} />
      </div>
      <div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="font-semibold text-stone-900 mb-3">Order summary</h2>
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm py-1">
              <span className="truncate">
                {i.product.name} × {i.quantity}
              </span>
              <span>{formatMoney(Number(i.product.price) * i.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-stone-200 mt-2 pt-2 flex justify-between font-semibold">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <p className="text-xs text-stone-400 mt-1">Delivery fee calculated at placement.</p>
        </div>
      </div>
    </div>
  );
}
