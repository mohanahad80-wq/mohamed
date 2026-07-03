import { requireUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";

const LINKS = [
  ["", "Overview"],
  ["vendors", "Vendors"],
  ["riders", "Riders"],
  ["users", "Users"],
  ["products", "Products"],
  ["orders", "Orders"],
  ["payments", "Payments"],
  ["disputes", "Disputes"],
  ["reports", "Reports"],
  ["reviews", "Reviews"],
  ["broadcasts", "Broadcasts"],
  ["delivery-rates", "Delivery rates"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.roles.includes("ADMIN")) redirect("/");

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row gap-8">
      <aside className="w-full sm:w-48 shrink-0">
        <div className="text-xs font-semibold uppercase text-stone-400 mb-2">Admin</div>
        <nav className="flex sm:flex-col gap-1 overflow-x-auto">
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={`/dashboard/admin/${href}`}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
