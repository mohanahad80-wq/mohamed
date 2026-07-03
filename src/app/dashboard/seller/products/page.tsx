import { requireUser } from "@/lib/permissions";
import VendorProductsList from "@/components/vendor/VendorProductsList";

export default async function SellerProductsPage() {
  const user = await requireUser();
  return <VendorProductsList sellerId={user.sellerProfile!.id} base="/dashboard/seller" />;
}
