"use client";

import { useState, useActionState } from "react";
import { submitDailyCloseout, type CloseoutState } from "@/app/actions/closeout";

export default function CloseoutForm({ systemCashExpected }: { systemCashExpected: number }) {
  const [actualCash, setActualCash] = useState<number>(0);
  const [cardTotal, setCardTotal] = useState<number>(0);
  const [bankTotal, setBankTotal] = useState<number>(0);

  const discrepancy = actualCash - systemCashExpected;

  const [state, formAction, isPending] = useActionState<CloseoutState | null, FormData>(
    submitDailyCloseout,
    null
  );

  return (
    <form action={formAction} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-amber-400 mb-1">
            Physical Cash Tally (LKR)*
          </label>
          <input
            type="number"
            name="actualCashTally"
            min="0"
            step="100"
            required
            value={actualCash || ""}
            onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Card Machine Swipes (LKR)
          </label>
          <input
            type="number"
            name="cardTotal"
            min="0"
            step="100"
            value={cardTotal || ""}
            onChange={(e) => setCardTotal(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Bank Transfers (LKR)
          </label>
          <input
            type="number"
            name="bankTransferTotal"
            min="0"
            step="100"
            value={bankTotal || ""}
            onChange={(e) => setBankTotal(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm"
          />
        </div>
      </div>

      <div className="p-3 bg-slate-950 rounded-lg border border-slate-700 flex justify-between items-center text-xs">
        <span className="text-slate-400">Calculated Cash Discrepancy:</span>
        <span className={`font-mono font-bold text-sm ${discrepancy < 0 ? "text-red-400" : discrepancy > 0 ? "text-emerald-400" : "text-slate-200"}`}>
          {discrepancy < 0 ? `- LKR ${Math.abs(discrepancy).toFixed(2)} (Shortage)` : discrepancy > 0 ? `+ LKR ${discrepancy.toFixed(2)} (Surplus)` : "LKR 0.00 (Balanced)"}
        </span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Shift Notes / Explanations</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="e.g., Shortage due to petty cash purchase of workshop cleaning supplies..."
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition cursor-pointer"
      >
        {isPending ? "Reconciling Register..." : "Submit Shift Closeout"}
      </button>
    </form>
  );
}