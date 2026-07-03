import { requireUser } from "@/lib/permissions";
import VendorProductsList from "@/components/vendor/VendorProductsList";

export default async function StoreProductsPage() {
  const user = await requireUser();
  return <VendorProductsList buyerStoreId={user.businessBuyerProfile!.id} base="/dashboard/business-buyer/store" />;
}
