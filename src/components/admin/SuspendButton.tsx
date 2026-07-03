"use client";

import { useTransition } from "react";
import { suspendUser } from "@/actions/admin";

export default function SuspendButton({ userId, status }: { userId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const suspend = status !== "SUSPENDED";

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await suspendUser(userId, suspend); })}
      className={`text-sm px-3 py-1.5 rounded-md ${
        suspend ? "border border-rose-300 text-rose-700 hover:bg-rose-50" : "bg-emerald-700 text-white hover:bg-emerald-800"
      }`}
    >
      {suspend ? "Suspend" : "Reactivate"}
    </button>
  );
}
