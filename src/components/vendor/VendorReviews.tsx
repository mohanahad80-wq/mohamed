import { prisma } from "@/lib/prisma";
import FlagReviewButton from "@/components/vendor/FlagReviewButton";

export default async function VendorReviews({ sellerId, buyerStoreId }: { sellerId?: string; buyerStoreId?: string }) {
  const reviews = await prisma.review.findMany({
    where: sellerId ? { targetSellerId: sellerId } : { targetBuyerStoreId: buyerStoreId },
    include: { author: true, product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-4">Reviews</h1>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                <div className="text-sm text-stone-600 mt-1">{r.comment}</div>
                <div className="text-xs text-stone-400 mt-1">
                  {r.author.fullName ?? r.author.phone} on {r.product.name}
                  {r.isFlagged && " · flagged"}
                  {r.isHidden && " · hidden by admin"}
                </div>
              </div>
              {!r.isFlagged && <FlagReviewButton reviewId={r.id} />}
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-stone-500 text-sm">No reviews yet.</p>}
      </div>
    </div>
  );
}
