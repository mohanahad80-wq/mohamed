"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addToCart(productId: string, quantity: number) {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in first." };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "APPROVED" || product.isDeactivated) {
    return { error: "This product isn't available." };
  }

  // Enforce marketplace segregation: wholesale (Seller) products can only be
  // bought by approved Business Buyers; retail products are open to any buyer.
  if (product.vendorType === "SELLER") {
    if (
      !user.roles.includes("BUSINESS_BUYER") ||
      user.businessBuyerProfile?.status !== "APPROVED"
    ) {
      return { error: "Only verified Business Buyers can purchase wholesale products." };
    }
  }

  const qty = Math.max(quantity, product.minOrderQty);
  if (qty > product.stock) return { error: "Not enough stock available." };

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: { userId: user.id, productId, quantity: qty },
    update: { quantity: qty },
  });

  revalidatePath("/cart");
  revalidatePath("/wholesale/cart");
  return { success: "Added to cart." };
}

export async function updateCartQty(productId: string, quantity: number) {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in first." };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Not found." };

  if (quantity < product.minOrderQty) {
    return { error: `Minimum order quantity is ${product.minOrderQty}.` };
  }
  if (quantity > product.stock) return { error: "Not enough stock available." };

  await prisma.cartItem.update({
    where: { userId_productId: { userId: user.id, productId } },
    data: { quantity },
  });

  revalidatePath("/cart");
  revalidatePath("/wholesale/cart");
}

export async function removeFromCart(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in first." };

  await prisma.cartItem.delete({
    where: { userId_productId: { userId: user.id, productId } },
  }).catch(() => {});

  revalidatePath("/cart");
  revalidatePath("/wholesale/cart");
}
