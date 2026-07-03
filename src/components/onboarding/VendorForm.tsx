"use client";

import { useActionState, useState } from "react";
import { submitVendorProfile } from "@/actions/onboarding";
import { SubmitButton, FieldError, inputClass, labelClass } from "@/components/FormControls";
import { DISTRICTS, DISTRICT_LABELS } from "@/lib/districts";
import EmailVerifyBox from "@/components/onboarding/EmailVerifyBox";

const CATEGORIES = [
  ["CLOTHING", "Clothing"],
  ["FOOD", "Food"],
  ["ELECTRONICS", "Electronics"],
  ["OTHER", "Other"],
] as const;

export default function VendorForm({ role }: { role: "SELLER" | "BUSINESS_BUYER" }) {
  const [state, formAction] = useActionState(submitVendorProfile, undefined);
  const [emailVerified, setEmailVerified] = useState(false);

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <input type="hidden" name="role" value={role} />

      <EmailVerifyBox onVerified={setEmailVerified} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Business name</label>
          <input name="businessName" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Owner full name</label>
          <input name="ownerFullName" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input name="phone" type="tel" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Business category</label>
          <select name="category" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            {CATEGORIES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input name="city" defaultValue="Mogadishu" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>District</label>
          <select name="district" required className={inputClass} defaultValue="">
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
          <label className={labelClass}>Payout number (EVC or WaafiPay)</label>
          <input name="payoutNumber" required className={inputClass} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>National ID (upload one of ID or License)</label>
          <input name="idDoc" type="file" accept="image/*,.pdf" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Business License</label>
          <input name="license" type="file" accept="image/*,.pdf" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Store logo / banner (optional)</label>
        <input name="logo" type="file" accept="image/*" className={inputClass} />
      </div>

      <p className="text-xs text-stone-500">
        Uploaded documents are stored privately and are only visible to MAMA SACDIYA admins.
      </p>

      <FieldError message={state?.error} />
      <SubmitButton
        disabled={!emailVerified}
        className="w-full rounded-md bg-emerald-700 text-white py-2.5 font-medium hover:bg-emerald-800 disabled:opacity-40"
      >
        {emailVerified ? "Submit application" : "Verify your email to continue"}
      </SubmitButton>
    </form>
  );
}
