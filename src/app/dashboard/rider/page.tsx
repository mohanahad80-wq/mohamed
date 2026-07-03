import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import OnlineToggle from "@/components/rider/OnlineToggle";
import DeliveryCard from "@/components/rider/DeliveryCard";
import VendorPayouts from "@/components/vendor/VendorPayouts";

export default async function RiderDashboardPage() {
  const user = await requireUser();
  const rider = user.riderProfile!;

  const activeOrders = await prisma.order.findMany({
    where: { riderId: rider.id, riderStatus: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] } },
    orderBy: { createdAt: "asc" },
  });

  const avgRating = rider.ratingCount > 0 ? rider.ratingSum / rider.ratingCount : 0;
  const onTimePct = rider.totalDeliveries > 0 ? Math.round((rider.onTimeCount / rider.totalDeliveries) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{rider.fullName}</h1>
          <p className="text-sm text-stone-500">
            {rider.vehicleType} · {rider.plateNumber} · load {rider.currentLoad}/{rider.maxLoad}
          </p>
        </div>
        <OnlineToggle isOnline={rider.isOnline} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="text-xs text-stone-500">Total deliveries</div>
          <div className="text-xl font-bold">{rider.totalDeliveries}</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="text-xs text-stone-500">On-time %</div>
          <div className="text-xl font-bold">{onTimePct}%</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="text-xs text-stone-500">Avg rating</div>
          <div className={`text-xl font-bold ${avgRating > 0 && avgRating < 3 ? "text-rose-600" : ""}`}>
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-stone-900 mb-3">Active deliveries</h2>
        <div className="space-y-3">
          {activeOrders.map((o) => {
            const address = o.addressSnapshot as { details: string };
            return (
              <DeliveryCard
                key={o.id}
                orderId={o.id}
                orderNumber={o.orderNumber}
                district={o.district}
                deliveryFee={Number(o.deliveryFee)}
                riderStatus={o.riderStatus}
                addressDetails={address.details}
              />
            );
          })}
          {activeOrders.length === 0 && <p className="text-stone-500 text-sm">No active deliveries.</p>}
        </div>
      </div>

      <VendorPayouts riderId={rider.id} />
    </div>
  );
}
