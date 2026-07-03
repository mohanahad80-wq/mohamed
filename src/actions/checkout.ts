"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VendorType, PaymentMethod, District } from "@/generated/prisma/client";
import { generateOrderNumber } from "@/lib/orderNumber";
import { computeDeliveryFee } from "@/lib/lifecycle";
import { notify } from "@/lib/notify";
import type { ActionState } from "@/actions/auth";
import { randomUUID } from "crypto";

export async function checkout(
  scope: "retail" | "wholesale",
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in first." };

  if (user.paymentLockedUntil && user.paymentLockedUntil > new Date()) {
    const mins = Math.ceil((user.paymentLockedUntil.getTime() - Date.now()) / 60000);
    return { error: `Too many failed payment attempts. Try again in ${mins} minute(s).` };
  }

  const vendorType: VendorType = scope === "retail" ? "BUSINESS_BUYER_STORE" : "SELLER";
  const paymentMethod = String(formData.get("paymentMethod") || "") as PaymentMethod;
  const simulateFailure = formData.get("simulateFailure") === "on";

  if (!["WAAFIPAY", "EVC_PLUS", "FLUTTERWAVE", "COD"].includes(paymentMethod)) {
    return { error: "Choose a payment method." };
  }

  // Resolve delivery address: existing address id, or inline new address fields.
  let district: District | null = null;
  let addressSnapshot: { label: string; city: string; district: string; details: string } | null = null;

  const addressId = String(formData.get("addressId") || "");
  if (addressId) {
    const addr = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
    if (!addr) return { error: "Delivery address not found." };
    district = addr.district;
    addressSnapshot = { label: addr.label, city: addr.city, district: addr.district, details: addr.details };
  } else {
    const newDistrict = String(formData.get("newDistrict") || "") as District;
    const newDetails = String(formData.get("newDetails") || "").trim();
    if (!newDistrict || !newDetails) {
      return { error: "Add a delivery address (district + details) before checking out." };
    }
    const created = await prisma.address.create({
      data: { userId: user.id, district: newDistrict, details: newDetails },
    });
    district = created.district;
    addressSnapshot = { label: created.label, city: created.city, district: created.district, details: created.details };
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id, product: { vendorType } },
    include: { product: { include: { seller: true, buyerStore: true } } },
  });

  if (cartItems.length === 0) return { error: "Your cart is empty." };

  // Alert the buyer if stock changed since items were added, and block checkout.
  const insufficient = cartItems.filter((ci) => ci.quantity > ci.product.stock);
  if (insufficient.length > 0) {
    return {
      error: `Stock changed for: ${insufficient.map((i) => i.product.name).join(", ")}. Update your cart quantities and try again.`,
    };
  }

  if (paymentMethod !== "COD" && simulateFailure) {
    const attempts = user.failedPaymentAttempts + 1;
    if (attempts >= 3) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedPaymentAttempts: 0, paymentLockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
      });
      return { error: "Payment failed 3 times. Your account is locked for 15 minutes." };
    }
    await prisma.user.update({ where: { id: user.id }, data: { failedPaymentAttempts: attempts } });
    return { error: `Payment failed (${attempts}/3 attempts). Please try again.` };
  }

  type Group = {
    sellerId?: string;
    buyerStoreId?: string;
    district: District;
    items: typeof cartItems;
  };
  const groups = new Map<string, Group>();
  for (const ci of cartItems) {
    const key = ci.product.sellerId ?? ci.product.buyerStoreId!;
    const vendorDistrict = ci.product.seller?.district ?? ci.product.buyerStore!.district;
    if (!groups.has(key)) {
      groups.set(key, {
        sellerId: ci.product.sellerId ?? undefined,
        buyerStoreId: ci.product.buyerStoreId ?? undefined,
        district: vendorDistrict,
        items: [],
      });
    }
    groups.get(key)!.items.push(ci);
  }

  const groupId = randomUUID();
  const createdOrderIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    if (paymentMethod !== "COD") {
      await tx.user.update({ where: { id: user.id }, data: { failedPaymentAttempts: 0 } });
    }

    for (const g of groups.values()) {
      const subtotal = g.items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
      const deliveryFee = await computeDeliveryFee(g.district, district!);
      const total = subtotal + deliveryFee;

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          groupId,
          buyerId: user.id,
          vendorType,
          sellerId: g.sellerId,
          buyerStoreBuyerId: vendorType === "SELLER" ? user.businessBuyerProfile?.id : undefined,
          buyerStoreId: g.buyerStoreId,
          subtotal,
          deliveryFee,
          total,
          status: paymentMethod === "COD" ? "PENDING" : "CONFIRMED",
          paymentMethod,
          paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
          addressSnapshot: addressSnapshot!,
          district: district!,
          items: {
            create: g.items.map((i) => ({
              productId: i.productId,
              nameSnapshot: i.product.name,
              priceSnapshot: i.product.price,
              imageSnapshot: i.product.images[0],
              quantity: i.quantity,
            })),
          },
        },
      });
      createdOrderIds.push(order.id);

      for (const i of g.items) {
        await tx.product.update({
          where: { id: i.productId },
          data: { stock: { decrement: i.quantity } },
        });
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod,
          status: paymentMethod === "COD" ? "PENDING" : "PAID",
          amount: total,
          transactionRef: paymentMethod === "COD" ? null : `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`,
          attemptCount: 1,
        },
      });

      const vendorUserId = g.sellerId
        ? (await tx.sellerProfile.findUnique({ where: { id: g.sellerId }, select: { userId: true } }))?.userId
        : (await tx.businessBuyerProfile.findUnique({ where: { id: g.buyerStoreId! }, select: { userId: true } }))
            ?.userId;
      if (vendorUserId) {
        await notify(
          vendorUserId,
          "ORDER_UPDATE",
          "New order received",
          `Order ${order.orderNumber} for $${total.toFixed(2)} was just placed.`
        );
      }
    }

    await tx.cartItem.deleteMany({ where: { id: { in: cartItems.map((c) => c.id) } } });
  });

  redirect(`/orders?group=${groupId}`);
}
