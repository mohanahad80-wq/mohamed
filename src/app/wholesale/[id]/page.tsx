import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatMoney } from "@/lib/money";
import AddToCartForm from "@/components/shop/AddToCartForm";
import { requireUser, isApprovedBusinessBuyer } from "@/lib/permissions";

export default async function WholesaleProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!isApprovedBusinessBuyer(user)) redirect("/pending-approval");

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { seller: true } });

  if (!product || product.vendorType !== "SELLER" || product.status !== "APPROVED") notFound();

  const ratingAgg = await prisma.review.aggregate({
    where: { targetSellerId: product.sellerId!, isHidden: false },
    _avg: { rating: true },
    _count: true,
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 grid md:grid-cols-2 gap-10">
      <div>
        <div className="aspect-square bg-stone-100 rounded-xl overflow-hidden">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
      </div>
      <div>
        <div className="text-sm text-stone-500">{product.seller?.businessName}</div>
        <h1 className="text-2xl font-bold text-stone-900 mt-1">{product.name}</h1>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-2xl font-bold text-emerald-700">{formatMoney(product.price.toString())}</span>
          <span className="text-sm text-stone-500">/ unit · min {product.minOrderQty}</span>
        </div>
        {ratingAgg._count > 0 && (
          <div className="mt-1 text-sm text-amber-600">
            ★ {ratingAgg._avg.rating?.toFixed(1)} ({ratingAgg._count} reviews)
          </div>
        )}
        <p className="mt-4 text-stone-600 whitespace-pre-line">{product.description}</p>
        <div className="mt-6">
          <AddToCartForm
            productId={product.id}
            maxStock={product.stock}
            minOrderQty={product.minOrderQty}
            cartHref="/wholesale/cart"
          />
        </div>
      </div>
    </div>
  );
}
