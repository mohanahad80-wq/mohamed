import { requireUser } from "@/lib/permissions";
import VendorOrdersTable from "@/components/vendor/VendorOrdersTable";

export default async function StoreOrdersPage() {
  const user = await requireUser();
  return <VendorOrdersTable buyerStoreId={user.businessBuyerProfile!.id} base="/dashboard/business-buyer/store" />;
}
