"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/actions/auth";
import { SubmitButton, FieldError, inputClass, labelClass } from "@/components/FormControls";

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, undefined);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Create your account</h1>
      <p className="text-stone-600 mt-1 text-sm">
        Step 1 of 2 — basic signup. You&apos;ll choose your role next.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label className={labelClass}>Phone number</label>
          <input
            name="phone"
            type="tel"
            placeholder="+252 61 234 5678"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input
            name="password"
            type="password"
            minLength={6}
            required
            className={inputClass}
          />
        </div>
        <FieldError message={state?.error} />
        <SubmitButton>Continue</SubmitButton>
      </form>

      <p className="mt-6 text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-700 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
