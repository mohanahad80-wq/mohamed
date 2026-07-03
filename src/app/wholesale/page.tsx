import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { requireUser, isApprovedBusinessBuyer } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";

const CATEGORIES = ["CLOTHING", "FOOD", "ELECTRONICS", "OTHER"] as const;

export default async function WholesalePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const user = await requireUser();
  // Seller products are never reachable by Customers — this route only serves
  // verified Business Buyers, enforced server-side, not just hidden nav.
  if (!isApprovedBusinessBuyer(user)) redirect("/pending-approval");

  const { q, category } = await searchParams;

  const products = await prisma.product.findMany({
    where: {
      vendorType: "SELLER",
      status: "APPROVED",
      isDeactivated: false,
      ...(category ? { category: category as never } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { seller: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Wholesale marketplace</h1>
        <Link href="/wholesale/cart" className="text-sm text-emerald-700 hover:underline">
          Wholesale cart →
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search wholesale products…"
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
            href={`/wholesale/${p.id}`}
            name={p.name}
            price={p.price.toString()}
            image={p.images[0]}
            stock={p.stock}
            minOrderQty={p.minOrderQty}
            vendorName={p.seller?.businessName}
          />
        ))}
        {products.length === 0 && <p className="col-span-full text-stone-500 text-sm">No products found.</p>}
      </div>
    </div>
  );
}
