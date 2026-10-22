"use client";

import { useActionState } from "react";
import { updateDiagnosisAndStatus } from "@/app/actions/technician";

export default function TechStatusForm({ ticket }: { ticket: any }) {
  const [state, formAction, isPending] = useActionState(updateDiagnosisAndStatus, null);

  const statuses = [
    { value: "PENDING_DIAGNOSIS", label: "Pending Diagnosis" },
    { value: "DIAGNOSED_AWAITING_APPROVAL", label: "Diagnosed (Awaiting Customer Approval)" },
    { value: "REPAIR_IN_PROGRESS", label: "Repair In Progress" },
    { value: "WAITING_FOR_PARTS", label: "Waiting For Parts" },
    { value: "QUALITY_CHECK", label: "Quality Check / Testing" },
    { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
    { value: "COMPLETED", label: "Completed & Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="ticketId" value={ticket.id} />

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Status Transition</label>
          <select
            name="status"
            defaultValue={ticket.status}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Cost (LKR / $)</label>
          <input
            name="estimatedCost"
            type="number"
            step="0.01"
            defaultValue={ticket.estimatedCost ? Number(ticket.estimatedCost) : ""}
            placeholder="e.g. 25000"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Diagnostic Findings & Technical Notes</label>
        <textarea
          name="diagnosisNotes"
          rows={3}
          defaultValue={ticket.diagnosisNotes || ""}
          placeholder="State technical diagnostics: component burnt, screen flex torn, battery health at 68%, etc."
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Timeline Note (Logged to history)</label>
        <input
          name="timelineNote"
          placeholder="e.g. Cleaned motherboard contacts, awaiting replacement charging flex."
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Updating Workbench..." : "Save Diagnostic & Status"}
        </button>
      </div>
    </form>
  );
}