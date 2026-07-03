"use client";

import { useState } from "react";
import CustomerForm from "@/components/onboarding/CustomerForm";
import VendorForm from "@/components/onboarding/VendorForm";

const CARDS = [
  {
    key: "SELLER" as const,
    title: "Seller",
    desc: "Sell wholesale in bulk to registered Business Buyers. Requires ID or Business License.",
  },
  {
    key: "BUSINESS_BUYER" as const,
    title: "Business Buyer",
    desc: "Buy wholesale and resell retail to customers. Requires ID or Business License.",
  },
  {
    key: "CUSTOMER" as const,
    title: "Customer",
    desc: "Shop retail products instantly. No documents needed.",
  },
];

export default function RoleCards() {
  const [selected, setSelected] = useState<null | (typeof CARDS)[number]["key"]>(null);

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <button
            key={c.key}
            onClick={() => setSelected(c.key)}
            className={`text-left rounded-xl border-2 p-5 transition ${
              selected === c.key
                ? "border-emerald-600 bg-emerald-50"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <div className="font-semibold text-stone-900">{c.title}</div>
            <div className="text-sm text-stone-600 mt-1.5">{c.desc}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold text-lg text-stone-900 mb-4">
            {selected === "CUSTOMER"
              ? "Customer details"
              : `${selected === "SELLER" ? "Seller" : "Business Buyer"} application`}
          </h2>
          {selected === "CUSTOMER" ? <CustomerForm /> : <VendorForm role={selected} />}
        </div>
      )}
    </div>
  );
}
