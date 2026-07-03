import { requireUser } from "@/lib/permissions";
import VendorReviews from "@/components/vendor/VendorReviews";

export default async function StoreReviewsPage() {
  const user = await requireUser();
  return <VendorReviews buyerStoreId={user.businessBuyerProfile!.id} />;
}
