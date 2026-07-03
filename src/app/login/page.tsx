"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/actions/auth";
import { SubmitButton, FieldError, inputClass, labelClass } from "@/components/FormControls";

export default function LoginPage() {
  const [state, formAction] = useActionState(login, undefined);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Log in</h1>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label className={labelClass}>Phone number</label>
          <input name="phone" type="tel" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input name="password" type="password" required className={inputClass} />
        </div>
        <FieldError message={state?.error} />
        <SubmitButton>Log in</SubmitButton>
      </form>

      <p className="mt-6 text-sm text-stone-600">
        No account yet?{" "}
        <Link href="/signup" className="text-emerald-700 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
