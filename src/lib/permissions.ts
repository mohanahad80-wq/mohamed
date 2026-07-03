import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: string): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.roles.includes(role as never)) redirect("/");
  return user;
}

export function isAdmin(user: SessionUser) {
  return user.roles.includes("ADMIN" as never);
}

export function isApprovedSeller(user: SessionUser) {
  return (
    user.roles.includes("SELLER" as never) &&
    user.sellerProfile?.status === "APPROVED"
  );
}

export function isApprovedBusinessBuyer(user: SessionUser) {
  return (
    user.roles.includes("BUSINESS_BUYER" as never) &&
    user.businessBuyerProfile?.status === "APPROVED"
  );
}

export function isApprovedRider(user: SessionUser) {
  return (
    user.roles.includes("RIDER" as never) && user.riderProfile?.status === "APPROVED"
  );
}
