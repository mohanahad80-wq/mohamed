import { requireUser } from "@/lib/permissions";
import VendorPayouts from "@/components/vendor/VendorPayouts";

export default async function StorePayoutsPage() {
  const user = await requireUser();
  return <VendorPayouts buyerStoreId={user.businessBuyerProfile!.id} />;
}
