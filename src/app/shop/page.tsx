import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

const CATEGORIES = ["CLOTHING", "FOOD", "ELECTRONICS", "OTHER"] as const;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

  const products = await prisma.product.findMany({
    where: {
      vendorType: "BUSINESS_BUYER_STORE",
      status: "APPROVED",
      isDeactivated: false,
      ...(category ? { category: category as never } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { buyerStore: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Shop</h1>

      <form className="mt-4 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products…"
          className="flex-1 min-w-[200px] rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <select name="category" defaultValue={category ?? ""} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0) + c.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-stone-800 text-white px-4 py-2 text-sm hover:bg-stone-900">
          Filter
        </button>
      </form>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            href={`/shop/${p.id}`}
            name={p.name}
            price={p.price.toString()}
            image={p.images[0]}
            stock={p.stock}
            vendorName={p.buyerStore?.storeName ?? p.buyerStore?.businessName}
          />
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-stone-500 text-sm">No products found.</p>
        )}
      </div>

      <p className="mt-8 text-xs text-stone-400">
        Selling wholesale?{" "}
        <Link href="/select-role" className="underline">
          Apply as a Seller or Business Buyer
        </Link>
        .
      </p>
    </div>
  );
}
