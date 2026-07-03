"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitReview(orderId: string, productId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.buyerId !== user.id) return { error: "Not your order." };
  if (order.status !== "DELIVERED") return { error: "You can only review after delivery." };

  const rating = parseInt(String(formData.get("rating") || "0"), 10);
  const comment = String(formData.get("comment") || "").trim();
  if (rating < 1 || rating > 5) return { error: "Choose a rating from 1 to 5." };

  const existing = await prisma.review.findUnique({ where: { productId_orderId: { productId, orderId } } });
  if (existing) return { error: "You already reviewed this product for this order." };

  await prisma.review.create({
    data: {
      orderId,
      productId,
      authorId: user.id,
      vendorType: order.vendorType,
      targetSellerId: order.sellerId,
      targetBuyerStoreId: order.buyerStoreId,
      rating,
      comment,
      editableUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  revalidatePath(`/orders/${orderId}`);
  return { success: "Review submitted." };
}

export async function editReview(reviewId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.authorId !== user.id) return { error: "Not your review." };
  if (review.editableUntil < new Date()) return { error: "The edit window has closed." };

  const rating = parseInt(String(formData.get("rating") || "0"), 10);
  const comment = String(formData.get("comment") || "").trim();
  if (rating < 1 || rating > 5) return { error: "Choose a rating from 1 to 5." };

  await prisma.review.update({ where: { id: reviewId }, data: { rating, comment } });
  revalidatePath(`/orders/${review.orderId}`);
  return { success: "Review updated." };
}

export async function submitRiderRating(orderId: string, rating: number) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.buyerId !== user.id || !order.riderId) return { error: "Not applicable." };
  if (order.status !== "DELIVERED") return { error: "Only after delivery." };
  if (rating < 1 || rating > 5) return { error: "Invalid rating." };

  const already = await prisma.review.findFirst({ where: { orderId, targetRiderId: order.riderId, authorId: user.id } });
  if (already) return { error: "Already rated." };

  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        orderId,
        productId: (await tx.orderItem.findFirstOrThrow({ where: { orderId } })).productId,
        authorId: user.id,
        vendorType: order.vendorType,
        targetRiderId: order.riderId,
        rating,
        editableUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
    await tx.riderProfile.update({
      where: { id: order.riderId! },
      data: { ratingSum: { increment: rating }, ratingCount: { increment: 1 } },
    });
  });

  const rider = await prisma.riderProfile.findUnique({ where: { id: order.riderId } });
  if (rider) {
    const avg = rider.ratingCount > 0 ? rider.ratingSum / rider.ratingCount : 0;
    if (avg < 3.0) {
      const admins = await prisma.user.findMany({ where: { roles: { has: "ADMIN" } }, select: { id: true } });
      const { notify } = await import("@/lib/notify");
      await Promise.all(
        admins.map((a) =>
          notify(a.id, "SYSTEM", "Rider review needed", `Rider ${rider.fullName}'s average rating dropped below 3.0.`)
        )
      );
    }
  }

  revalidatePath(`/orders/${orderId}`);
  return { success: "Thanks for rating your rider." };
}

export async function flagReview(reviewId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return { error: "Not found." };

  const ownsSeller = review.targetSellerId && review.targetSellerId === user.sellerProfile?.id;
  const ownsStore = review.targetBuyerStoreId && review.targetBuyerStoreId === user.businessBuyerProfile?.id;
  if (!ownsSeller && !ownsStore) return { error: "Not authorized." };

  await prisma.review.update({ where: { id: reviewId }, data: { isFlagged: true } });
  revalidatePath("/dashboard/seller/reviews");
  revalidatePath("/dashboard/business-buyer/store/reviews");
}
