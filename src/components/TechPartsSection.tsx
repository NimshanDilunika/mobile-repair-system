"use client";

import { useActionState } from "react";
import { attachPartToTicket } from "@/app/actions/inventory";

interface InventoryOption {
  id: string;
  partName: string;
  sku: string;
  stockQuantity: number;
  unitPrice: number;
}

interface PartUsedItem {
  id: string;
  quantity: number;
  unitPrice: number;
  part: {
    partName: string;
    sku: string;
  };
}

export default function TechPartsSection({
  ticketId,
  availableParts,
  partsUsed,
}: {
  ticketId: string;
  availableParts: InventoryOption[];
  partsUsed: PartUsedItem[];
}) {
  const [state, formAction, isPending] = useActionState(attachPartToTicket, null);

  const totalPartsCost = partsUsed.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Allocated Spare Parts</h3>
          <p className="text-xs text-slate-400">Parts consumed for this repair job</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Total Parts:</span>
          <p className="text-lg font-bold font-mono text-emerald-400">
            LKR {totalPartsCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
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

      {/* List of currently attached parts */}
      {partsUsed.length === 0 ? (
        <div className="p-4 bg-slate-950 border border-dashed border-slate-700 rounded-lg text-center text-xs text-slate-400">
          No replacement parts attached to this ticket yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-700 border border-slate-700 rounded-lg overflow-hidden bg-slate-950">
          {partsUsed.map((item) => (
            <div key={item.id} className="p-3 flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-slate-200">{item.part.partName}</span>
                <span className="text-slate-500 font-mono ml-2">({item.part.sku})</span>
              </div>
              <div className="text-right space-x-4">
                <span className="text-slate-400">Qty: <strong>{item.quantity}</strong></span>
                <span className="font-mono text-emerald-400 font-semibold">
                  LKR {(Number(item.unitPrice) * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form to attach a new spare part */}
      <form action={formAction} className="pt-2 border-t border-slate-700 space-y-3">
        <input type="hidden" name="ticketId" value={ticketId} />
        <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
          Add Replacement Part from Stock
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <select
              name="partId"
              required
              defaultValue=""
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="" disabled>
                Select a replacement part...
              </option>
              {availableParts.map((part) => (
                <option key={part.id} value={part.id} disabled={part.stockQuantity <= 0}>
                  {part.partName} ({part.sku}) — {part.stockQuantity} in stock — LKR {Number(part.unitPrice).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              name="quantity"
              type="number"
              min="1"
              defaultValue="1"
              className="w-20 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Adding..." : "+ Add Part"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}