import { requireUser } from "@/lib/permissions";
import VendorReviews from "@/components/vendor/VendorReviews";

export default async function SellerReviewsPage() {
  const user = await requireUser();
  return <VendorReviews sellerId={user.sellerProfile!.id} />;
}
