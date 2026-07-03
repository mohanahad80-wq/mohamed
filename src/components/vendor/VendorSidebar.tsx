import Link from "next/link";

export default function VendorSidebar({
  base,
  title,
  extraLinks,
}: {
  base: string;
  title: string;
  extraLinks?: { href: string; label: string }[];
}) {
  const links = [
    { href: base, label: "Overview" },
    { href: `${base}/products`, label: "Products" },
    { href: `${base}/orders`, label: "Orders" },
    { href: `${base}/payouts`, label: "Payouts" },
    { href: `${base}/disputes`, label: "Disputes" },
    { href: `${base}/reviews`, label: "Reviews" },
    ...(extraLinks ?? []),
  ];

  return (
    <aside className="w-full sm:w-52 shrink-0">
      <div className="text-xs font-semibold uppercase text-stone-400 mb-2">{title}</div>
      <nav className="flex sm:flex-col gap-1 overflow-x-auto">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
