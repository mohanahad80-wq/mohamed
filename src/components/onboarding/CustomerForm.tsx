"use client";

import { useActionState } from "react";
import { selectCustomer } from "@/actions/onboarding";
import { SubmitButton, FieldError, inputClass, labelClass } from "@/components/FormControls";
import { DISTRICTS, DISTRICT_LABELS } from "@/lib/districts";

export default function CustomerForm() {
  const [state, formAction] = useActionState(selectCustomer, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className={labelClass}>Full name</label>
        <input name="fullName" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>District (optional — add later at checkout)</label>
        <select name="district" className={inputClass} defaultValue="">
          <option value="">Select district…</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {DISTRICT_LABELS[d]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Delivery address details (optional)</label>
        <input name="details" placeholder="Street, landmark…" className={inputClass} />
      </div>
      <FieldError message={state?.error} />
      <SubmitButton>Start shopping</SubmitButton>
    </form>
  );
}
