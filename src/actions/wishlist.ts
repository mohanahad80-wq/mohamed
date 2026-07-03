"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleWishlist(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in first." };

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlist.create({ data: { userId: user.id, productId } });
  }

  revalidatePath("/wishlist");
  revalidatePath("/shop");
  return { success: existing ? "Removed from wishlist." : "Saved to wishlist." };
}
