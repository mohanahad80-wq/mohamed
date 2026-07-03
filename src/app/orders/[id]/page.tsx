import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { DISTRICT_LABELS } from "@/lib/districts";
import { District } from "@/generated/prisma/client";
import CancelOrderForm from "@/components/orders/CancelOrderForm";
import ReportProblemForm from "@/components/orders/ReportProblemForm";
import ReviewForm from "@/components/orders/ReviewForm";
import RiderRatingForm from "@/components/orders/RiderRatingForm";

const STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      seller: true,
      buyerStore: true,
      rider: true,
      disputes: true,
      payment: true,
    },
  });

  if (!order) notFound();
  const isBuyer = order.buyerId === user.id;
  const isAdmin = user.roles.includes("ADMIN");
  if (!isBuyer && !isAdmin) notFound();

  const reviews = await prisma.review.findMany({ where: { orderId: order.id, authorId: user.id } });
  const reviewedProductIds = new Set(reviews.filter((r) => r.targetRiderId === null).map((r) => r.productId));
  const riderReviewed = reviews.some((r) => r.targetRiderId !== null);

  const currentStepIdx = order.status === "CANCELLED" ? -1 : STEPS.indexOf(order.status);
  const canReportProblem =
    order.status === "DELIVERED" && (!order.disputeWindowEndsAt || order.disputeWindowEndsAt > new Date());
  const showRiderInfo = order.rider && ["PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(order.riderStatus);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">{order.orderNumber}</h1>
        {order.status === "PENDING" && isBuyer && <CancelOrderForm orderId={order.id} />}
      </div>
      <div className="text-sm text-stone-500 mt-1">
        {order.seller?.businessName ?? order.buyerStore?.storeName ?? order.buyerStore?.businessName}
      </div>

      {order.status === "CANCELLED" ? (
        <div className="mt-6 rounded-md bg-stone-100 p-4 text-stone-600 text-sm">
          Cancelled. Reason: {order.cancelReason}
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((s, idx) => (
            <div key={s} className="flex-1 text-center">
              <div
                className={`h-2 rounded-full ${idx <= currentStepIdx ? "bg-emerald-600" : "bg-stone-200"}`}
              />
              <div className="text-xs mt-1 text-stone-500">{s}</div>
            </div>
          ))}
        </div>
      )}

      {showRiderInfo && order.rider && (
        <div className="mt-6 rounded-md border border-stone-200 p-4">
          <div className="text-sm font-medium text-stone-900">Your rider</div>
          <div className="text-sm text-stone-600">
            {order.rider.fullName} · {order.rider.phone}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between text-sm">
            <span>
              {it.nameSnapshot} × {it.quantity}
            </span>
            <span>{formatMoney(Number(it.priceSnapshot) * it.quantity)}</span>
          </div>
        ))}
        <div className="border-t border-stone-200 pt-2 flex justify-between text-sm text-stone-600">
          <span>Delivery fee</span>
          <span>{formatMoney(order.deliveryFee.toString())}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatMoney(order.total.toString())}</span>
        </div>
        <div className="text-xs text-stone-400">
          {DISTRICT_LABELS[order.district as District]} · {order.paymentMethod.replace("_", " ")} · Payment{" "}
          {order.paymentStatus}
        </div>
      </div>

      {order.disputes.length > 0 && (
        <div className="mt-6 rounded-md bg-amber-50 border border-amber-200 p-4 text-sm">
          <div className="font-medium text-amber-800">Dispute: {order.disputes[0].status}</div>
          <div className="text-amber-700">{order.disputes[0].reason}</div>
          {order.disputes[0].resolution && (
            <div className="text-amber-700 mt-1">Resolution: {order.disputes[0].resolution}</div>
          )}
        </div>
      )}

      {isBuyer && order.status === "DELIVERED" && (
        <div className="mt-8 space-y-3">
          <h2 className="font-semibold text-stone-900">Reviews</h2>
          {order.items
            .filter((it) => !reviewedProductIds.has(it.productId))
            .map((it) => (
              <ReviewForm key={it.id} orderId={order.id} productId={it.productId} productName={it.nameSnapshot} />
            ))}
          {order.rider && !riderReviewed && <RiderRatingForm orderId={order.id} />}
          {canReportProblem && (
            <div className="pt-2">
              <ReportProblemForm orderId={order.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
