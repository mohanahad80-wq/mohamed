"use client";

import { useActionState } from "react";
import { SubmitButton, FieldError, inputClass, labelClass } from "@/components/FormControls";
import type { ActionState } from "@/actions/auth";

const CATEGORIES = [
  ["CLOTHING", "Clothing"],
  ["FOOD", "Food"],
  ["ELECTRONICS", "Electronics"],
  ["OTHER", "Other"],
] as const;

export default function ProductForm({
  action,
  vendorType,
  defaultValues,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  vendorType: "SELLER" | "BUSINESS_BUYER_STORE";
  defaultValues?: {
    name: string;
    description: string;
    category: string;
    price: number;
    stock: number;
    minOrderQty: number;
  };
}) {
  const [state, formAction] = useActionState(action, undefined);
  const minAllowed = vendorType === "SELLER" ? 10 : 1;

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-4">
      <div>
        <label className={labelClass}>Product name</label>
        <input name="name" required defaultValue={defaultValues?.name} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={defaultValues?.description}
          className={inputClass}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Category</label>
          <select
            name="category"
            required
            defaultValue={defaultValues?.category ?? ""}
            className={inputClass}
          >
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
          <label className={labelClass}>Price (USD)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaultValues?.price}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Stock</label>
          <input
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={defaultValues?.stock}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            Minimum order qty {vendorType === "SELLER" ? "(10+ required)" : "(1+)"}
          </label>
          <input
            name="minOrderQty"
            type="number"
            min={minAllowed}
            required
            defaultValue={defaultValues?.minOrderQty ?? minAllowed}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Images (1–5{defaultValues ? " — leave blank to keep current" : ""})</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {["image1", "image2", "image3", "image4", "image5"].map((k) => (
            <input key={k} name={k} type="file" accept="image/*" className="text-xs" />
          ))}
        </div>
      </div>
      <FieldError message={state?.error} />
      <SubmitButton>{defaultValues ? "Save changes" : "Submit for approval"}</SubmitButton>
    </form>
  );
}
