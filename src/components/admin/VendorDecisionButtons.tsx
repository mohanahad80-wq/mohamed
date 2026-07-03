"use client";

import { useState, useTransition } from "react";
import { decideVendorApplication } from "@/actions/admin";

export default function VendorDecisionButtons({
  profileType,
  profileId,
}: {
  profileType: "SELLER" | "BUSINESS_BUYER";
  profileId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() => startTransition(async () => { await decideVendorApplication(profileType, profileId, true); })}
          className="rounded-md bg-emerald-700 text-white text-sm px-3 py-1.5 hover:bg-emerald-800 disabled:opacity-50"
        >
          Approve
        </button>
        {!showReject ? (
          <button onClick={() => setShowReject(true)} className="rounded-md border border-rose-300 text-rose-700 text-sm px-3 py-1.5 hover:bg-rose-50">
            Reject
          </button>
        ) : null}
      </div>
      {showReject && (
        <div className="flex gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Rejection reason"
            className="rounded-md border border-stone-300 px-2 py-1 text-sm flex-1"
          />
          <button
            disabled={pending || !reason.trim()}
            onClick={() => startTransition(async () => { await decideVendorApplication(profileType, profileId, false, reason); })}
            className="rounded-md bg-rose-600 text-white text-sm px-3 py-1.5 hover:bg-rose-700 disabled:opacity-50"
          >
            Confirm reject
          </button>
        </div>
      )}
    </div>
  );
}
