"use client";

import { logout } from "@/actions/auth";

export default function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => logout()}
      className={className ?? "text-sm text-stone-600 hover:text-stone-900"}
    >
      Log out
    </button>
  );
}
