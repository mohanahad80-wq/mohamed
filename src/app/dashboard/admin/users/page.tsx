import { prisma } from "@/lib/prisma";
import SuspendButton from "@/components/admin/SuspendButton";

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700",
  SUSPENDED: "bg-stone-300 text-stone-700",
  UNASSIGNED: "bg-stone-100 text-stone-500",
  INACTIVE: "bg-stone-300 text-stone-700",
};

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Users</h1>
      <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium text-stone-900">{u.fullName ?? u.phone}</div>
              <div className="text-sm text-stone-500">
                {u.phone} · {u.roles.join(", ") || "no role"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[u.status]}`}>{u.status}</span>
              {!u.roles.includes("ADMIN") && <SuspendButton userId={u.id} status={u.status} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
