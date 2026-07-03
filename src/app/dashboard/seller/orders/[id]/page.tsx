import { requireUser } from "@/lib/permissions";
import VendorOrderDetail from "@/components/vendor/VendorOrderDetail";

export default async function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  return <VendorOrderDetail orderId={id} sellerId={user.sellerProfile!.id} />;
}
