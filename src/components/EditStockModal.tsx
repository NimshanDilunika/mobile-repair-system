"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePartStock, type InventoryActionState } from "@/app/actions/inventory";

export default function EditStockModal({ part }: { part: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<InventoryActionState | null, FormData>(
    updatePartStock,
    null
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      const timer = setTimeout(() => setOpen(false), 800);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200 transition cursor-pointer"
      >
        Adjust
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">{part.partName}</h3>
                <span className="text-[11px] font-mono text-slate-400">{part.partSku}</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {state?.error && (
              <div className="p-2 bg-red-900/40 border border-red-500 rounded text-red-200 text-xs">
                {state.error}
              </div>
            )}
            {state?.success && (
              <div className="p-2 bg-emerald-900/40 border border-emerald-500 rounded text-emerald-200 text-xs">
                {state.message}
              </div>
            )}

            <form action={formAction} className="space-y-3 text-xs">
              <input type="hidden" name="partId" value={part.id} />

              <div>
                <label className="block text-slate-300 font-medium mb-1">Available Stock</label>
                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  required
                  defaultValue={part.stockQuantity}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Unit Selling Price ($)</label>
                <input
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={part.sellingPrice}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 font-semibold rounded text-white disabled:opacity-50"
                >
                  {isPending ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}