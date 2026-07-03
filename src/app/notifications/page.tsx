import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { markAllNotificationsRead, togglePromotionsOptOut } from "@/actions/notifications";

function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Notifications</h1>
        <form action={markAllNotificationsRead}>
          <button className="text-sm text-emerald-700 hover:underline">Mark all read</button>
        </form>
      </div>

      <form action={togglePromotionsOptOut} className="mt-3 flex items-center gap-2 text-sm text-stone-600">
        <span>{user.promotionsOptOut ? "Promotions muted" : "Receiving promotions"}</span>
        <button className="text-emerald-700 hover:underline">
          {user.promotionsOptOut ? "Enable" : "Opt out of promotions"}
        </button>
      </form>
      <p className="text-xs text-stone-400">Critical order updates are always delivered, even if opted out.</p>

      <div className="mt-6 space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-md border p-3 text-sm ${n.isRead ? "border-stone-200 bg-white" : "border-emerald-200 bg-emerald-50"}`}
          >
            <div className="flex justify-between">
              <span className="font-medium text-stone-900">{n.title}</span>
              <span className="text-xs text-stone-400">{timeAgo(n.createdAt)}</span>
            </div>
            <div className="text-stone-600">{n.body}</div>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-stone-500 text-sm">No notifications yet.</p>}
      </div>
    </div>
  );
}
