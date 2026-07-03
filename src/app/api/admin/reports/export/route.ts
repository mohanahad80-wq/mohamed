import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    include: { buyer: true, seller: true, buyerStore: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["Order #", "Date", "Vendor", "Buyer", "Status", "Subtotal", "Delivery Fee", "Total", "Payment Method"],
    ...orders.map((o) => [
      o.orderNumber,
      o.createdAt.toISOString(),
      o.seller?.businessName ?? o.buyerStore?.businessName ?? "",
      o.buyer.fullName ?? o.buyer.phone,
      o.status,
      o.subtotal.toString(),
      o.deliveryFee.toString(),
      o.total.toString(),
      o.paymentMethod,
    ]),
  ];

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="mama-sacdiya-sales-report.csv"`,
    },
  });
}
