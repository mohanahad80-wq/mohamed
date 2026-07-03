import { requireUser } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.roles.includes("RIDER")) redirect("/");
  if (user.riderProfile?.status !== "APPROVED") redirect("/pending-approval");

  return <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>;
}
