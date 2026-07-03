import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import ProductDecisionButtons from "@/components/admin/ProductDecisionButtons";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { seller: true, buyerStore: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Products</h1>
      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="h-14 w-14 rounded-md bg-stone-100 overflow-hidden shrink-0">
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-stone-900">{p.name}</div>
                  <div className="text-sm text-stone-500">
                    {p.seller?.businessName ?? p.buyerStore?.businessName} · {formatMoney(p.price.toString())} ·{" "}
                    {p.vendorType === "SELLER" ? "Wholesale" : "Retail"}
                  </div>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : p.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {p.status}
              </span>
            </div>
            {p.status === "PENDING" && (
              <div className="mt-3">
                <ProductDecisionButtons productId={p.id} />
              </div>
            )}
          </div>
        ))}
        {products.length === 0 && <p className="text-stone-500 text-sm">No products yet.</p>}
      </div>
    </div>
  );
}
