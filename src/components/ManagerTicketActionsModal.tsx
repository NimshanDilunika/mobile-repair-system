"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  editTicketByManager,
  cancelTicketByManager,
  type TicketActionState,
} from "@/app/actions/ticket";

export default function ManagerTicketActionsModal({
  ticket,
  technicians,
}: {
  ticket: any;
  technicians: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"EDIT" | "CANCEL">("EDIT");

  const [editState, editAction, isEditPending] = useActionState<TicketActionState | null, FormData>(
    editTicketByManager,
    null
  );
  const [cancelState, cancelAction, isCancelPending] = useActionState<TicketActionState | null, FormData>(
    cancelTicketByManager,
    null
  );

  // Auto-close modal and trigger client refresh when cancellation succeeds
  useEffect(() => {
    if (cancelState?.success) {
      router.refresh();
      const timer = setTimeout(() => {
        setOpen(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cancelState, router]);

  // Auto-close on successful edit
  useEffect(() => {
    if (editState?.success) {
      router.refresh();
      const timer = setTimeout(() => {
        setOpen(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editState, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200 transition cursor-pointer"
      >
        Manage
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Ticket #{ticket.ticketNumber}</h3>
                <span className="text-[11px] text-slate-400">Current Status: {ticket.status}</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-slate-700 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("EDIT")}
                className={`pb-2 border-b-2 cursor-pointer ${
                  activeTab === "EDIT" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400"
                }`}
              >
                Edit Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("CANCEL")}
                className={`pb-2 border-b-2 cursor-pointer ${
                  activeTab === "CANCEL" ? "border-red-500 text-red-400" : "border-transparent text-slate-400"
                }`}
              >
                Cancel Repair Ticket
              </button>
            </div>

            {/* TAB 1: EDIT FORM */}
            {activeTab === "EDIT" && (
              <form action={editAction} className="space-y-3 text-xs">
                <input type="hidden" name="ticketId" value={ticket.id} />

                {editState?.error && (
                  <div className="p-2 bg-red-900/40 border border-red-500 rounded text-red-200 text-xs">
                    {editState.error}
                  </div>
                )}
                {editState?.success && (
                  <div className="p-2 bg-emerald-900/40 border border-emerald-500 rounded text-emerald-200 text-xs">
                    {editState.message}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Brand</label>
                    <input
                      name="brand"
                      defaultValue={ticket.brand}
                      required
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Model</label>
                    <input
                      name="deviceModel"
                      defaultValue={ticket.deviceModel}
                      required
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">IMEI / Serial</label>
                    <input
                      name="imeiOrSerial"
                      defaultValue={ticket.imeiOrSerial}
                      required
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Priority</label>
                    <select
                      name="priority"
                      defaultValue={ticket.priority}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="LOW">LOW</option>
                      <option value="STANDARD">STANDARD</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assign Technician</label>
                  <select
                    name="technicianId"
                    defaultValue={ticket.technicianId || ""}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="">Unassigned</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Reported Issue</label>
                  <textarea
                    name="reportedIssue"
                    defaultValue={ticket.reportedIssue}
                    rows={2}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isEditPending}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 font-semibold rounded text-white disabled:opacity-50 cursor-pointer"
                  >
                    {isEditPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CANCEL FORM */}
            {activeTab === "CANCEL" && (
              <form action={cancelAction} className="space-y-3 text-xs">
                <input type="hidden" name="ticketId" value={ticket.id} />

                {cancelState?.error && (
                  <div className="p-2 bg-red-900/40 border border-red-500 rounded text-red-200 text-xs">
                    {cancelState.error}
                  </div>
                )}
                {cancelState?.success && (
                  <div className="p-2 bg-emerald-900/40 border border-emerald-500 rounded text-emerald-200 text-xs">
                    {cancelState.message}
                  </div>
                )}

                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-red-200 text-xs space-y-1">
                  <p className="font-semibold">⚠️ Warning:</p>
                  <p>Cancelling this repair will update the status to CANCELLED and log the reason in public tracking.</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Reason for Cancellation *</label>
                  <textarea
                    name="reason"
                    required
                    rows={3}
                    placeholder="e.g. Customer declined repair estimate, device deemed beyond repair..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 cursor-pointer"
                  >
                    Keep Ticket
                  </button>
                  <button
                    type="submit"
                    disabled={isCancelPending}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 font-semibold rounded text-white disabled:opacity-50 cursor-pointer"
                  >
                    {isCancelPending ? "Cancelling..." : "Confirm Cancellation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}