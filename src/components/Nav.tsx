import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";

export default async function Nav() {
  const user = await getCurrentUser();

  let unread = 0;
  if (user) {
    unread = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });
  }

  const links: { href: string; label: string }[] = [];
  if (user && user.status === "APPROVED") {
    if (user.roles.includes("CUSTOMER")) {
      links.push({ href: "/shop", label: "Shop" });
      links.push({ href: "/orders", label: "My Orders" });
      links.push({ href: "/wishlist", label: "Wishlist" });
    }
    if (user.roles.includes("BUSINESS_BUYER")) {
      links.push({ href: "/dashboard/business-buyer", label: "Business Buyer" });
    }
    if (user.roles.includes("SELLER")) {
      links.push({ href: "/dashboard/seller", label: "Seller" });
    }
    if (user.roles.includes("RIDER")) {
      links.push({ href: "/dashboard/rider", label: "Rider" });
    }
    if (user.roles.includes("ADMIN")) {
      links.push({ href: "/dashboard/admin", label: "Admin" });
    }
  }

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg tracking-tight text-emerald-700 shrink-0">
          MAMA SACDIYA
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-stone-700 overflow-x-auto">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-emerald-700 whitespace-nowrap">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <>
              {user.status === "APPROVED" && (
                <>
                  <Link href="/notifications" className="relative text-sm text-stone-600 hover:text-stone-900">
                    Notifications
                    {unread > 0 && (
                      <span className="absolute -top-2 -right-3 bg-rose-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </Link>
                  {user.roles.includes("CUSTOMER") && (
                    <Link href="/cart" className="text-sm text-stone-600 hover:text-stone-900">
                      Cart
                    </Link>
                  )}
                </>
              )}
              <span className="hidden sm:inline text-sm text-stone-500">
                {user.fullName || user.phone}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-stone-600 hover:text-stone-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm rounded-md bg-emerald-700 text-white px-3 py-1.5 hover:bg-emerald-800"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
