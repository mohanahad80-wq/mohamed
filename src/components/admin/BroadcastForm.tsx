"use client";

import { useState, useTransition } from "react";
import { sendBroadcast } from "@/actions/admin";

export default function BroadcastForm() {
  const [audience, setAudience] = useState<"ALL" | "VENDORS">("ALL");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | undefined>();

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
      <div className="flex gap-3 text-sm">
        <label className="flex items-center gap-1">
          <input type="radio" checked={audience === "ALL"} onChange={() => setAudience("ALL")} /> All users
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={audience === "VENDORS"} onChange={() => setAudience("VENDORS")} /> Vendors only
        </label>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message"
        rows={3}
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
      {msg && <div className="text-sm text-stone-600">{msg}</div>}
      <button
        disabled={pending || !title.trim() || !body.trim()}
        onClick={() =>
          startTransition(async () => {
            const res = await sendBroadcast(audience, title, body);
            setMsg(res?.success ?? res?.error);
            if (res?.success) {
              setTitle("");
              setBody("");
            }
          })
        }
        className="rounded-md bg-emerald-700 text-white text-sm px-4 py-2 hover:bg-emerald-800 disabled:opacity-50"
      >
        Send broadcast
      </button>
    </div>
  );
}
