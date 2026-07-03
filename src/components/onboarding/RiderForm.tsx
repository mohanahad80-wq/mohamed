"use client";

import { useActionState } from "react";
import { submitRiderProfile } from "@/actions/riderOnboarding";
import { SubmitButton, FieldError, inputClass, labelClass } from "@/components/FormControls";
import { DISTRICTS, DISTRICT_LABELS } from "@/lib/districts";

export default function RiderForm() {
  const [state, formAction] = useActionState(submitRiderProfile, undefined);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Full name</label>
          <input name="fullName" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input name="phone" type="tel" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Vehicle type</label>
          <select name="vehicleType" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select…
            </option>
            <option value="Motorbike">Motorbike</option>
            <option value="Tuk-tuk">Tuk-tuk (Bajaj)</option>
            <option value="Car">Car</option>
            <option value="Bicycle">Bicycle</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Plate number</label>
          <input name="plateNumber" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Payout number (EVC or WaafiPay)</label>
          <input name="payoutNumber" required className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Service districts (select all that apply)</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-md border border-stone-300 p-3">
          {DISTRICTS.map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="serviceDistricts" value={d} />
              {DISTRICT_LABELS[d]}
            </label>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>ID / license upload</label>
          <input name="idDoc" type="file" accept="image/*,.pdf" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Photo (optional)</label>
          <input name="photo" type="file" accept="image/*" className={inputClass} />
        </div>
      </div>

      <FieldError message={state?.error} />
      <SubmitButton>Submit application</SubmitButton>
    </form>
  );
}
