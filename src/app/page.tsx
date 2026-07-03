import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPostLoginPath } from "@/lib/routing";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    redirect(getPostLoginPath(user));
  }

  return (
    <div>
      <section className="mx-auto max-w-7xl px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-stone-900">
            Wholesale meets retail, built for Mogadishu.
          </h1>
          <p className="mt-5 text-lg text-stone-600">
            MAMA SACDIYA connects Sellers, Business Buyers, Customers, and Riders
            in one marketplace — with WaafiPay, EVC Plus, Flutterwave, and Cash on
            Delivery built in.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-emerald-700 text-white px-5 py-3 font-medium hover:bg-emerald-800"
            >
              Create an account
            </Link>
            <Link
              href="/shop"
              className="rounded-md border border-stone-300 px-5 py-3 font-medium text-stone-700 hover:bg-stone-100"
            >
              Browse the marketplace
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ["Seller", "Sell wholesale in bulk to registered Business Buyers."],
            ["Business Buyer", "Buy wholesale, resell retail — two dashboards in one."],
            ["Customer", "Shop retail products instantly, no documents needed."],
            ["Rider", "Deliver orders in your district and get paid per drop."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="font-semibold text-stone-900">{title}</div>
              <div className="text-sm text-stone-600 mt-1">{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
