"use client";

import { useActionState, useState } from "react";
import { checkout } from "@/actions/checkout";
import { SubmitButton, FieldError, inputClass, labelClass } from "@/components/FormControls";
import { DISTRICTS, DISTRICT_LABELS } from "@/lib/districts";
import { District } from "@/generated/prisma/client";

const METHODS = [
  ["WAAFIPAY", "WaafiPay"],
  ["EVC_PLUS", "EVC Plus"],
  ["FLUTTERWAVE", "Flutterwave"],
  ["COD", "Cash on Delivery"],
] as const;

export default function CheckoutForm({
  scope,
  addresses,
}: {
  scope: "retail" | "wholesale";
  addresses: { id: string; label: string; district: District; details: string }[];
}) {
  const boundAction = checkout.bind(null, scope);
  const [state, formAction] = useActionState(boundAction, undefined);
  const [addressMode, setAddressMode] = useState<"existing" | "new">(addresses.length > 0 ? "existing" : "new");
  const [method, setMethod] = useState<string>("COD");

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <h2 className="font-semibold text-stone-900 mb-2">Delivery address</h2>
        {addresses.length > 0 && (
          <div className="space-y-2 mb-3">
            {addresses.map((a) => (
              <label key={a.id} className="flex items-start gap-2 text-sm border border-stone-200 rounded-md p-3">
                <input
                  type="radio"
                  name="addressId"
                  value={a.id}
                  defaultChecked={addressMode === "existing"}
                  onChange={() => setAddressMode("existing")}
                />
                <span>
                  <span className="font-medium">{a.label}</span> — {DISTRICT_LABELS[a.district]}, {a.details}
                </span>
              </label>
            ))}
            <button
              type="button"
              onClick={() => setAddressMode("new")}
              className="text-sm text-emerald-700 underline"
            >
              + Use a new address
            </button>
          </div>
        )}
        {addressMode === "new" && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>District</label>
              <select name="newDistrict" className={inputClass} defaultValue="">
                <option value="" disabled>
                  Select…
                </option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {DISTRICT_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Address details</label>
              <input name="newDetails" placeholder="Street, landmark…" className={inputClass} />
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-stone-900 mb-2">Payment method</h2>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map(([v, l]) => (
            <label
              key={v}
              className={`flex items-center gap-2 text-sm border rounded-md p-3 cursor-pointer ${
                method === v ? "border-emerald-600 bg-emerald-50" : "border-stone-200"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={v}
                checked={method === v}
                onChange={() => setMethod(v)}
              />
              {l}
            </label>
          ))}
        </div>
        {method !== "COD" && (
          <label className="mt-2 flex items-center gap-2 text-xs text-stone-500">
            <input type="checkbox" name="simulateFailure" />
            Simulate a failed payment (demo)
          </label>
        )}
      </div>

      <FieldError message={state?.error} />
      <SubmitButton>Place order</SubmitButton>
    </form>
  );
}
