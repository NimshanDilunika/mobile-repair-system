import { db } from "../lib/prisma";
import Link from "next/link";
import CustomerApprovalForm from "@/components/CustomerApprovalForm";

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;

  let ticket = null;
  if (query) {
    const trimmed = query.trim();
    ticket = await db.repairTicket.findFirst({
      where: {
        OR: [
          { ticketNumber: { equals: trimmed } },
          { imeiOrSerial: { equals: trimmed } },
        ],
      },
      include: {
        branch: { select: { name: true, address: true, contactNo: true } },
        ticketHistory: { orderBy: { createdAt: "desc" } },
        partsUsed: { include: { part: true } },
      },
    });
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Live Device Tracking</h1>
          <p className="text-slate-400 text-sm">
            Enter your Ticket Number (e.g. <code>TICK-2026-0001</code>) or 15-digit IMEI
          </p>
        </div>

        {/* Search Bar */}
        <form method="GET" className="flex gap-2 max-w-xl mx-auto">
          <input
            name="query"
            defaultValue={query || ""}
            placeholder="Search TICK-2026-XXXX or IMEI..."
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 font-semibold rounded-xl text-sm transition cursor-pointer"
          >
            Track
          </button>
        </form>

        {query && !ticket && (
          <div className="p-6 bg-slate-800 border border-slate-700 rounded-xl text-center text-slate-400 text-sm">
            No repair job found matching &ldquo;<span className="text-white font-mono">{query}</span>&rdquo;. Check your receipt code and try again.
          </div>
        )}

        {ticket && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xl font-bold text-blue-400">{ticket.ticketNumber}</span>
                  <h2 className="text-lg font-semibold text-slate-100">{ticket.brand} {ticket.deviceModel}</h2>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300">
                  {ticket.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 border-t border-slate-700 pt-3">
                <div>
                  <span className="text-slate-500">Service Center:</span>
                  <p className="font-medium text-slate-200">{ticket.branch.name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Intake Date:</span>
                  <p className="font-medium text-slate-200">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Diagnostic Details */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Diagnosis & Quotation</h3>
              <p className="text-sm text-slate-300">
                {ticket.diagnosisNotes || "Initial inspection in progress by our technicians."}
              </p>
            </div>

            {/* Approval Action Form (Visible when Diagnosed) */}
            {ticket.status === "DIAGNOSED_AWAITING_APPROVAL" && (
              <CustomerApprovalForm
                ticketId={ticket.id}
                isApproved={ticket.isApproved}
                estimatedCost={ticket.estimatedCost ? Number(ticket.estimatedCost) : null}
              />
            )}

            {/* Timeline */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Repair History</h3>
              <div className="space-y-4 border-l-2 border-slate-700 pl-4 ml-2">
                {ticket.ticketHistory.map((h) => (
                  <div key={h.id} className="relative space-y-1">
                    <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-800" />
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-blue-400">{h.status}</span>
                      <span className="text-slate-500">{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-300">{h.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}