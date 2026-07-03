import { requireUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default async function PendingApprovalPage() {
  const user = await requireUser();
  if (user.status === "APPROVED") redirect("/");
  if (user.status === "UNASSIGNED") redirect("/select-role");

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
        ⏳
      </div>
      <h1 className="mt-6 text-2xl font-bold text-stone-900">Waiting for approval</h1>
      <p className="mt-3 text-stone-600">
        Thanks for applying. An admin is reviewing your business documents and
        will approve your account shortly. You&apos;ll get a notification once
        you&apos;re approved.
      </p>
      <div className="mt-8">
        <LogoutButton className="text-sm text-stone-500 hover:text-stone-800 underline" />
      </div>
    </div>
  );
}
