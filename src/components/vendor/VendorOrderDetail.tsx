import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { DISTRICT_LABELS } from "@/lib/districts";
import { District } from "@/generated/prisma/client";
import OrderActionButtons from "@/components/vendor/OrderActionButtons";

export default async function VendorOrderDetail({
  orderId,
  sellerId,
  buyerStoreId,
}: {
  orderId: string;
  sellerId?: string;
  buyerStoreId?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, buyer: true, rider: true, disputes: true },
  });

  if (!order) notFound();
  const owns = sellerId ? order.sellerId === sellerId : order.buyerStoreId === buyerStoreId;
  if (!owns) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{order.orderNumber}</h1>
      <div className="text-sm text-stone-500 mt-1">
        Buyer: {order.buyer.fullName ?? order.buyer.phone} · {DISTRICT_LABELS[order.district as District]}
      </div>

      <div className="mt-6 space-y-2">
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between text-sm">
            <span>
              {it.nameSnapshot} × {it.quantity}
            </span>
            <span>{formatMoney(Number(it.priceSnapshot) * it.quantity)}</span>
          </div>
        ))}
        <div className="border-t border-stone-200 pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatMoney(order.total.toString())}</span>
        </div>
      </div>

      <div className="mt-4 text-sm text-stone-500">
        Status: <span className="font-medium text-stone-800">{order.status}</span> · Payment:{" "}
        {order.paymentMethod.replace("_", " ")} ({order.paymentStatus})
        {order.rider && (
          <div>
            Rider: {order.rider.fullName} — {order.riderStatus}
          </div>
        )}
      </div>

      {order.status === "CANCELLED" && (
        <div className="mt-4 rounded-md bg-stone-100 p-3 text-sm text-stone-600">Reason: {order.cancelReason}</div>
      )}

      {order.disputes.length > 0 && (
        <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm">
          <div className="font-medium text-amber-800">Dispute: {order.disputes[0].status}</div>
          <div className="text-amber-700">{order.disputes[0].reason}</div>
          <div className="text-xs text-amber-600 mt-1">
            Respond by {order.disputes[0].responseDeadline.toLocaleString()}
          </div>
        </div>
      )}

      <div className="mt-6">
        <OrderActionButtons orderId={order.id} status={order.status} />
      </div>
    </div>
  );
}
