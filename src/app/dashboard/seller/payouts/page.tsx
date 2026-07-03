import { requireUser } from "@/lib/permissions";
import VendorPayouts from "@/components/vendor/VendorPayouts";

export default async function SellerPayoutsPage() {
  const user = await requireUser();
  return <VendorPayouts sellerId={user.sellerProfile!.id} />;
}
