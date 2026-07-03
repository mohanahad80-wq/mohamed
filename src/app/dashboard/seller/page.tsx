import { requireUser } from "@/lib/permissions";
import VendorAnalytics from "@/components/vendor/VendorAnalytics";

export default async function SellerOverviewPage() {
  const user = await requireUser();
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-1">{user.sellerProfile?.businessName}</h1>
      <p className="text-sm text-stone-500 mb-6">Seller dashboard</p>
      <VendorAnalytics sellerId={user.sellerProfile!.id} />
    </div>
  );
}
