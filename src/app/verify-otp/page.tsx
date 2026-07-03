"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyOtp, resendOtp } from "@/actions/auth";
import { SubmitButton, FieldError, FieldSuccess, inputClass, labelClass } from "@/components/FormControls";

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}

function VerifyOtpForm() {
  const params = useSearchParams();
  const phone = params.get("phone") || "";
  const [state, formAction] = useActionState(verifyOtp, undefined);
  const [resendMsg, setResendMsg] = useState<string | undefined>();

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Verify your phone</h1>
      <p className="text-stone-600 mt-1 text-sm">
        Enter the 6-digit code we sent to <span className="font-medium">{phone}</span>.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <input type="hidden" name="phone" value={phone} />
        <div>
          <label className={labelClass}>Verification code</label>
          <input
            name="code"
            inputMode="numeric"
            maxLength={6}
            required
            className={inputClass + " tracking-widest text-lg text-center"}
          />
        </div>
        <FieldError message={state?.error} />
        <SubmitButton>Verify &amp; continue</SubmitButton>
      </form>

      <button
        className="mt-4 text-sm text-emerald-700 hover:underline"
        onClick={async () => {
          const res = await resendOtp(phone);
          setResendMsg(res?.success || res?.error);
        }}
      >
        Resend code
      </button>
      <div className="mt-3">
        <FieldSuccess message={resendMsg} />
      </div>
    </div>
  );
}
