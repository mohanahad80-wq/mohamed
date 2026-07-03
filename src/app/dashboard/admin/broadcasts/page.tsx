import { prisma } from "@/lib/prisma";
import BroadcastForm from "@/components/admin/BroadcastForm";

export default async function AdminBroadcastsPage() {
  const broadcasts = await prisma.broadcast.findMany({ orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Broadcasts</h1>
      <BroadcastForm />
      <p className="text-xs text-stone-400 mt-2">Rate limited to 3 broadcasts per hour.</p>

      <div className="mt-8 space-y-2">
        {broadcasts.map((b) => (
          <div key={b.id} className="rounded-md border border-stone-200 bg-white p-3 text-sm">
            <div className="font-medium">
              {b.title} <span className="text-xs text-stone-400">({b.audience})</span>
            </div>
            <div className="text-stone-600">{b.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
