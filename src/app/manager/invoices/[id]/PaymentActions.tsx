"use client";

import { useActionState } from "react";
import { processPayment } from "@/app/actions/billing";

export default function PaymentActions({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, isPending] = useActionState(processPayment, null);

  return (
    <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 space-y-3">
      <h3 className="text-sm font-semibold text-slate-300">Collect & Record Payment</h3>

      {state?.error && (
        <div className="p-2 bg-red-900/40 border border-red-500 rounded text-red-200 text-xs">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <input type="hidden" name="invoiceId" value={invoiceId} />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-400">Payment Method:</label>
          <select
            name="paymentMethod"
            defaultValue="CASH"
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Debit / Credit Card</option>
            <option value="ONLINE">Bank Transfer / Online</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Recording Payment..." : "Mark as Paid & Close Ticket"}
        </button>
      </form>
    </div>
  );
}