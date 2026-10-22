"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addInventoryPart, type InventoryActionState } from "@/app/actions/inventory";

export default function AddPartModal({
  branches,
  userRole,
  userBranchId,
}: {
  branches: { id: string; name: string }[];
  userRole: string;
  userBranchId?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<InventoryActionState | null, FormData>(
    addInventoryPart,
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
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition cursor-pointer"
      >
        + Add New Part
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Register Replacement Part</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
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

            <form action={formAction} className="space-y-4 text-xs">
              {/* Branch Selector for Super Admin */}
              {userRole === "SUPER_ADMIN" ? (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Branch *</label>
                  <select
                    name="branchId"
                    required
                    defaultValue={userBranchId || (branches[0]?.id ?? "")}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input type="hidden" name="branchId" value={userBranchId || ""} />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Part Name *</label>
                  <input
                    name="partName"
                    required
                    placeholder="e.g. iPhone 13 OLED Display"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">SKU / Code *</label>
                  <input
                    name="partSku"
                    required
                    placeholder="e.g. DISP-IP13-ORG"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cost Price ($) *</label>
                  <input
                    name="costPrice"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Selling Price ($) *</label>
                  <input
                    name="sellingPrice"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Stock Quantity *</label>
                  <input
                    name="stockQuantity"
                    type="number"
                    min="0"
                    required
                    defaultValue="10"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Reorder Level Warning</label>
                  <input
                    name="reorderLevel"
                    type="number"
                    min="1"
                    defaultValue="5"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-semibold rounded text-white disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save Part to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}