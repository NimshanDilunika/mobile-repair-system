"use client";

import { useActionState } from "react";
import { submitEstimateDecision } from "@/app/actions/portal";

export default function CustomerApprovalForm({
  ticketId,
  isApproved,
  estimatedCost,
}: {
  ticketId: string;
  isApproved: boolean | null;
  estimatedCost: number | null;
}) {
  const [state, formAction, isPending] = useActionState(submitEstimateDecision, null);

  if (isApproved === true) {
    return (
      <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
        <span>✓</span>
        <span>You have approved this repair estimate. Work is currently in progress.</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-amber-400">Action Required: Estimate Approval</h3>
          <p className="text-xs text-slate-400">Please review the diagnostic findings and authorize the repair cost.</p>
        </div>
        {estimatedCost !== null && (
          <div className="text-right">
            <span className="text-xs text-slate-400">Estimated Total:</span>
            <p className="text-xl font-bold font-mono text-emerald-400">
              LKR {estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>

      {state?.error && (
        <div className="p-3 bg-red-900/40 border border-red-500 rounded text-red-200 text-xs">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-3 bg-emerald-900/40 border border-emerald-500 rounded text-emerald-200 text-xs">
          {state.message}
        </div>
      )}

      <form action={formAction} className="flex gap-3 justify-end pt-2">
        <input type="hidden" name="ticketId" value={ticketId} />

        <button
          type="submit"
          name="decision"
          value="REJECT"
          disabled={isPending}
          className="px-4 py-2 bg-slate-700 hover:bg-red-700 text-slate-200 hover:text-white font-semibold rounded-lg text-xs transition disabled:opacity-50 cursor-pointer"
        >
          Decline Repair
        </button>

        <button
          type="submit"
          name="decision"
          value="APPROVE"
          disabled={isPending}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Submitting..." : "Approve & Start Repair"}
        </button>
      </form>
    </div>
  );
}