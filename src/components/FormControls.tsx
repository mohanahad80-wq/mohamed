"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className,
  pendingText = "Submitting…",
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={
        className ??
        "w-full rounded-md bg-emerald-700 text-white py-2.5 font-medium hover:bg-emerald-800 disabled:opacity-60"
      }
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
      {message}
    </div>
  );
}

export function FieldSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2">
      {message}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600";

export const labelClass = "block text-sm font-medium text-stone-700 mb-1";
