"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTicketInvoice, type InvoiceActionState } from "@/app/actions/invoices";

interface InvoiceFormProps {
  ticketId: string;
  partsSubtotal: number;
  initialDiscount?: number;
  initialTax?: number;
  initialLabor?: number;
  initialStatus?: string;
}

export default function InvoiceForm({
  ticketId,
  partsSubtotal,
  initialDiscount = 0,
  initialTax = 0,
  initialLabor = 1500,
  initialStatus = "UNPAID",
}: InvoiceFormProps) {
  const router = useRouter();

  const [laborCharge, setLaborCharge] = useState<number>(initialLabor);
  const [taxAmount, setTaxAmount] = useState<number>(initialTax);
  const [discount, setDiscount] = useState<number>(initialDiscount);
  const [paymentStatus, setPaymentStatus] = useState<string>(initialStatus);

  const subTotal = Number(partsSubtotal) + Number(laborCharge);
  const netTotal = Math.max(0, subTotal + Number(taxAmount) - Number(discount));

  const [state, formAction, isPending] = useActionState<InvoiceActionState | null, FormData>(
    createTicketInvoice,
    null
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 🖨️ Top Toolbar with Print Button */}
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 print:hidden shadow-md">
        <div>
          <span className="text-sm font-semibold text-white block">Invoice Control</span>
          <span className="text-xs text-slate-400">
            Set discount & tax, save to database, or print a customer receipt.
          </span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow"
        >
          🖨️ Print Invoice / Receipt
        </button>
      </div>

      {/* Main Invoice Form */}
      <form
        action={formAction}
        className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6 print:bg-white print:text-black print:border-none print:p-0"
      >
        <input type="hidden" name="ticketId" value={ticketId} />
        <input type="hidden" name="partsSubtotal" value={partsSubtotal.toString()} />
        <input type="hidden" name="subTotal" value={subTotal.toFixed(2)} />
        <input type="hidden" name="taxAmount" value={taxAmount.toFixed(2)} />

        {state?.error && (
          <div className="p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-200 text-xs print:hidden">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="p-3 bg-emerald-900/40 border border-emerald-500 rounded-lg text-emerald-200 text-xs print:hidden">
            ✅ {state.message}
          </div>
        )}

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
          <div>
            <label className="block text-slate-300 font-medium text-xs mb-1">
              Labor / Service Charge (LKR)
            </label>
            <input
              type="number"
              name="laborCharge"
              min="0"
              step="100"
              value={laborCharge}
              onChange={(e) => setLaborCharge(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium text-xs mb-1">
              Tax / VAT Amount (LKR)
            </label>
            <input
              type="number"
              name="tax"
              min="0"
              step="50"
              value={taxAmount}
              onChange={(e) => setTaxAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-amber-400 font-medium text-xs mb-1">
              Discount Amount (LKR)
            </label>
            <input
              type="number"
              name="discount"
              min="0"
              step="50"
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-lg text-amber-300 font-mono text-sm font-bold"
            />
          </div>
        </div>

        {/* Summary Breakdown Box */}
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-700 space-y-2 text-xs print:bg-slate-50 print:border-slate-300 print:text-black">
          <div className="flex justify-between text-slate-400 print:text-slate-600">
            <span>Spare Parts Subtotal:</span>
            <span className="font-mono text-slate-200 print:text-black font-semibold">
              LKR {Number(partsSubtotal).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-slate-400 print:text-slate-600">
            <span>Labor & Diagnostics:</span>
            <span className="font-mono text-slate-200 print:text-black font-semibold">
              LKR {Number(laborCharge).toFixed(2)}
            </span>
          </div>
          {taxAmount > 0 && (
            <div className="flex justify-between text-slate-400 print:text-slate-600">
              <span>Tax / VAT:</span>
              <span className="font-mono text-slate-200 print:text-black font-semibold">
                LKR {Number(taxAmount).toFixed(2)}
              </span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-amber-400 font-medium print:text-emerald-700">
              <span>Discount Applied:</span>
              <span className="font-mono font-bold">- LKR {Number(discount).toFixed(2)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-800 print:border-slate-300 flex justify-between items-center text-sm">
            <span className="font-bold text-white print:text-black text-base">Final Net Payable:</span>
            <span className="font-mono font-bold text-xl text-emerald-400 print:text-black">
              LKR {netTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-2 print:hidden">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Payment Status:
            </label>
            <select
              name="paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-medium cursor-pointer"
            >
              <option value="UNPAID">UNPAID</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="PAID">PAID IN FULL</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition cursor-pointer shadow-md"
          >
            {isPending ? "Saving..." : "Finalize & Save Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}