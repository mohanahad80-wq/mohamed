import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import DeactivateButton from "@/components/vendor/DeactivateButton";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export default async function VendorProductsList({
  sellerId,
  buyerStoreId,
  base,
}: {
  sellerId?: string;
  buyerStoreId?: string;
  base: string;
}) {
  const products = await prisma.product.findMany({
    where: sellerId ? { sellerId } : { buyerStoreId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-stone-900">Products</h1>
        <Link href={`${base}/products/new`} className="rounded-md bg-emerald-700 text-white text-sm px-4 py-2 hover:bg-emerald-800">
          + Add product
        </Link>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-3">
            <div className="h-14 w-14 rounded-md bg-stone-100 overflow-hidden shrink-0">
              {p.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-stone-900 truncate">{p.name}</div>
              <div className="text-sm text-stone-500">
                {formatMoney(p.price.toString())} · stock {p.stock} · min {p.minOrderQty}
              </div>
              {p.status === "REJECTED" && p.rejectionReason && (
                <div className="text-xs text-rose-600">Rejected: {p.rejectionReason}</div>
              )}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status}</span>
            {p.isDeactivated && <span className="text-xs px-2 py-1 rounded-full bg-stone-200 text-stone-600">Deactivated</span>}
            <Link href={`${base}/products/${p.id}/edit`} className="text-sm text-emerald-700 hover:underline">
              Edit
            </Link>
            <DeactivateButton productId={p.id} isDeactivated={p.isDeactivated} />
          </div>
        ))}
        {products.length === 0 && <p className="text-stone-500 text-sm">No products yet.</p>}
      </div>
    </div>
  );
}
