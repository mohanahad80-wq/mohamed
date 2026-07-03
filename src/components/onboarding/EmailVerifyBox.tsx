"use client";

import { useState, useTransition } from "react";
import { sendEmailOtp, verifyEmailOtp } from "@/actions/auth";
import { inputClass } from "@/components/FormControls";

export default function EmailVerifyBox({
  onVerified,
}: {
  onVerified: (verified: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [msg, setMsg] = useState<string | undefined>();
  const [err, setErr] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-4 space-y-3">
      <div className="text-sm font-medium text-stone-800">Verify your email</div>
      {!verified ? (
        <>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              disabled={sent}
            />
            <button
              type="button"
              disabled={pending || !email || sent}
              onClick={() =>
                startTransition(async () => {
                  setErr(undefined);
                  const res = await sendEmailOtp(email);
                  if (res?.error) setErr(res.error);
                  else {
                    setMsg(res?.success);
                    setSent(true);
                  }
                })
              }
              className="shrink-0 rounded-md bg-stone-800 text-white text-sm px-3 py-2 hover:bg-stone-900 disabled:opacity-50"
            >
              {sent ? "Sent" : "Send code"}
            </button>
          </div>
          {sent && (
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                disabled={pending || !code}
                onClick={() =>
                  startTransition(async () => {
                    setErr(undefined);
                    const res = await verifyEmailOtp(code);
                    if (res?.error) setErr(res.error);
                    else {
                      setVerified(true);
                      onVerified(true);
                    }
                  })
                }
                className="shrink-0 rounded-md bg-emerald-700 text-white text-sm px-3 py-2 hover:bg-emerald-800 disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          )}
          {msg && <div className="text-xs text-emerald-700">{msg}</div>}
          {err && <div className="text-xs text-rose-700">{err}</div>}
        </>
      ) : (
        <div className="text-sm text-emerald-700 font-medium">✓ {email} verified</div>
      )}
    </div>
  );
}
