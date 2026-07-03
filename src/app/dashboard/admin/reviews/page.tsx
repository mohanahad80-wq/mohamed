import { prisma } from "@/lib/prisma";
import HideReviewForm from "@/components/admin/HideReviewForm";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: { OR: [{ isFlagged: true }, { isHidden: true }] },
    include: { author: true, product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Flagged reviews</h1>
      <p className="text-sm text-stone-500 mb-6">Only flagged or hidden reviews are shown here.</p>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-stone-200 bg-white p-4 flex justify-between items-start">
            <div>
              <div className="text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              <div className="text-sm text-stone-600 mt-1">{r.comment}</div>
              <div className="text-xs text-stone-400 mt-1">
                {r.author.fullName ?? r.author.phone} on {r.product.name}
                {r.isHidden && " · hidden"}
              </div>
            </div>
            {!r.isHidden && <HideReviewForm reviewId={r.id} />}
          </div>
        ))}
        {reviews.length === 0 && <p className="text-stone-500 text-sm">No flagged reviews.</p>}
      </div>
    </div>
  );
}
