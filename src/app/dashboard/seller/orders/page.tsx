import { requireUser } from "@/lib/permissions";
import VendorOrdersTable from "@/components/vendor/VendorOrdersTable";

export default async function SellerOrdersPage() {
  const user = await requireUser();
  return <VendorOrdersTable sellerId={user.sellerProfile!.id} base="/dashboard/seller" />;
}
