import { requireUser } from "@/lib/permissions";
import VendorDisputes from "@/components/vendor/VendorDisputes";

export default async function SellerDisputesPage() {
  const user = await requireUser();
  return <VendorDisputes sellerId={user.sellerProfile!.id} />;
}
