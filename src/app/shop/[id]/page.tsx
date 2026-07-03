import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/money";
import AddToCartForm from "@/components/shop/AddToCartForm";
import WishlistButton from "@/components/shop/WishlistButton";
import { getCurrentUser } from "@/lib/auth";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { buyerStore: true },
  });

  // Real permission check, not just hidden navigation: wholesale products are
  // never reachable from the customer marketplace, even by direct link.
  if (!product || product.vendorType !== "BUSINESS_BUYER_STORE" || product.status !== "APPROVED") {
    notFound();
  }

  const [ratingAgg, user] = await Promise.all([
    prisma.review.aggregate({
      where: { targetBuyerStoreId: product.buyerStoreId!, isHidden: false },
      _avg: { rating: true },
      _count: true,
    }),
    getCurrentUser(),
  ]);

  const isWishlisted = user
    ? !!(await prisma.wishlist.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } }))
    : false;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 grid md:grid-cols-2 gap-10">
      <div>
        <div className="aspect-square bg-stone-100 rounded-xl overflow-hidden">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {product.images.slice(1).map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img} src={img} alt="" className="aspect-square object-cover rounded-md" />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-sm text-stone-500">{product.buyerStore?.storeName ?? product.buyerStore?.businessName}</div>
        <h1 className="text-2xl font-bold text-stone-900 mt-1">{product.name}</h1>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-2xl font-bold text-emerald-700">{formatMoney(product.price.toString())}</span>
          {product.stock === 0 && (
            <span className="bg-stone-900 text-white text-xs px-2 py-1 rounded">Sold Out</span>
          )}
        </div>
        {ratingAgg._count > 0 && (
          <div className="mt-1 text-sm text-amber-600">
            ★ {ratingAgg._avg.rating?.toFixed(1)} ({ratingAgg._count} reviews)
          </div>
        )}
        <p className="mt-4 text-stone-600 whitespace-pre-line">{product.description}</p>

        <div className="mt-6 flex items-center gap-3">
          <AddToCartForm productId={product.id} maxStock={product.stock} minOrderQty={product.minOrderQty} />
          {user && <WishlistButton productId={product.id} initialWishlisted={isWishlisted} />}
        </div>
      </div>
    </div>
  );
}
