import { requireUser } from "@/lib/permissions";
import RoleCards from "@/components/onboarding/RoleCards";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SelectRolePage() {
  const user = await requireUser();
  if (user.status === "PENDING") redirect("/pending-approval");

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">
        {user.roles.length > 0 ? "Add another role" : "Step 2 — choose how you'll use MAMA SACDIYA"}
      </h1>
      <p className="text-stone-600 mt-1 text-sm">Pick one to continue. This cannot be skipped.</p>

      <div className="mt-8">
        <RoleCards />
      </div>

      <p className="mt-10 text-sm text-stone-500">
        Want to deliver instead?{" "}
        <Link href="/become-rider" className="text-emerald-700 font-medium hover:underline">
          Become a Rider
        </Link>
      </p>
    </div>
  );
}
