import { requireUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function BusinessBuyerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.roles.includes("BUSINESS_BUYER")) redirect("/");
  if (user.businessBuyerProfile?.status !== "APPROVED") redirect("/pending-approval");

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex gap-2 border-b border-stone-200 mb-8">
        <Link href="/dashboard/business-buyer/purchases" className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-emerald-700">
          My Purchases
        </Link>
        <Link href="/dashboard/business-buyer/store" className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-emerald-700">
          My Store
        </Link>
      </div>
      {children}
    </div>
  );
}
