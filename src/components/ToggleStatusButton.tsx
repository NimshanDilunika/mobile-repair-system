"use client";

import { useTransition } from "react";
import { toggleUserStatus } from "@/app/actions/admin";

export default function ToggleStatusButton({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [isPending, startTransition] = useTransition();
  const isInactive = currentRole === "INACTIVE";

  return (
    <button
      onClick={() => {
        if (confirm(`Are you sure you want to ${isInactive ? "activate" : "deactivate"} this user?`)) {
          startTransition(() => toggleUserStatus(userId, currentRole));
        }
      }}
      disabled={isPending}
      className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
        isInactive
          ? "bg-emerald-900/60 hover:bg-emerald-700 text-emerald-200"
          : "bg-red-900/50 hover:bg-red-700 text-red-200"
      }`}
    >
      {isPending ? "..." : isInactive ? "Activate" : "Deactivate"}
    </button>
  );
}