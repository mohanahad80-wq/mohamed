export function getPostLoginPath(user: { status: string; roles: string[] }): string {
  if (user.roles.length === 0 || user.status === "UNASSIGNED") return "/select-role";
  if (user.status === "PENDING") return "/pending-approval";
  if (user.roles.includes("ADMIN")) return "/dashboard/admin";
  if (user.roles.includes("SELLER")) return "/dashboard/seller";
  if (user.roles.includes("BUSINESS_BUYER")) return "/dashboard/business-buyer";
  if (user.roles.includes("RIDER")) return "/dashboard/rider";
  return "/shop";
}
