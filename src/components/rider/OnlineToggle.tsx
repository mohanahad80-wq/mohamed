"use client";

import { useTransition } from "react";
import { toggleOnline } from "@/actions/rider";

export default function OnlineToggle({ isOnline }: { isOnline: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleOnline();
        })
      }
      className={`rounded-md px-4 py-2 text-sm font-medium ${
        isOnline ? "bg-emerald-700 text-white hover:bg-emerald-800" : "bg-stone-200 text-stone-700 hover:bg-stone-300"
      }`}
    >
      {isOnline ? "● Online — go offline" : "○ Offline — go online"}
    </button>
  );
}
