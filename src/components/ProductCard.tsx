import Link from "next/link";
import { formatMoney } from "@/lib/money";

export default function ProductCard({
  href,
  name,
  price,
  image,
  stock,
  minOrderQty,
  vendorName,
}: {
  href: string;
  name: string;
  price: number | string;
  image?: string;
  stock: number;
  minOrderQty?: number;
  vendorName?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-stone-200 bg-white overflow-hidden hover:shadow-md transition"
    >
      <div className="aspect-square bg-stone-100 relative overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-cover group-hover:scale-105 transition" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-stone-300 text-sm">No image</div>
        )}
        {stock === 0 && (
          <span className="absolute top-2 left-2 bg-stone-900 text-white text-xs px-2 py-1 rounded">
            Sold Out
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="font-medium text-stone-900 line-clamp-1">{name}</div>
        {vendorName && <div className="text-xs text-stone-500 line-clamp-1">{vendorName}</div>}
        <div className="mt-1 flex items-center justify-between">
          <span className="font-semibold text-emerald-700">{formatMoney(price)}</span>
          {minOrderQty && minOrderQty > 1 && (
            <span className="text-xs text-stone-500">min {minOrderQty}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
