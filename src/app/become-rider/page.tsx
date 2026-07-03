import { requireUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import RiderForm from "@/components/onboarding/RiderForm";

export default async function BecomeRiderPage() {
  const user = await requireUser();
  if (user.status === "PENDING") redirect("/pending-approval");
  if (user.riderProfile) redirect("/pending-approval");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Become a Rider</h1>
      <p className="text-stone-600 mt-1 text-sm">
        Deliver orders in your district and get paid per drop-off.
      </p>
      <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <RiderForm />
      </div>
    </div>
  );
}
