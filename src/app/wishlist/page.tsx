import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

export default async function WishlistPage() {
  const user = await requireUser();

  const items = await prisma.wishlist.findMany({
    where: { userId: user.id },
    include: { product: { include: { buyerStore: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Wishlist</h1>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((w) => (
          <ProductCard
            key={w.id}
            href={`/shop/${w.product.id}`}
            name={w.product.name}
            price={w.product.price.toString()}
            image={w.product.images[0]}
            stock={w.product.stock}
            vendorName={w.product.buyerStore?.storeName ?? w.product.buyerStore?.businessName}
          />
        ))}
        {items.length === 0 && <p className="col-span-full text-stone-500 text-sm">No saved items yet.</p>}
      </div>
    </div>
  );
}
