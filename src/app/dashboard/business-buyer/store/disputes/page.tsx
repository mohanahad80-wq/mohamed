import { requireUser } from "@/lib/permissions";
import VendorDisputes from "@/components/vendor/VendorDisputes";

export default async function StoreDisputesPage() {
  const user = await requireUser();
  return <VendorDisputes buyerStoreId={user.businessBuyerProfile!.id} />;
}
