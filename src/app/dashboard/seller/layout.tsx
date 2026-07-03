import { requireUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import VendorSidebar from "@/components/vendor/VendorSidebar";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.roles.includes("SELLER")) redirect("/");
  if (user.sellerProfile?.status !== "APPROVED") redirect("/pending-approval");

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row gap-8">
      <VendorSidebar base="/dashboard/seller" title="Seller" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
