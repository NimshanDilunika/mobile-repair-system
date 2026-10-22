"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ManagerTicketActionsModal from "@/components/ManagerTicketActionsModal";

interface TicketQueueTableProps {
  initialTickets: any[];
  technicians: { id: string; name: string }[];
}

export default function TicketQueueTable({
  initialTickets,
  technicians,
}: TicketQueueTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredTickets = useMemo(() => {
    return initialTickets.filter((ticket) => {
      // 1. Status Filter
      if (statusFilter !== "ALL" && ticket.status !== statusFilter) {
        return false;
      }

      // 2. Global Search Match (Ticket, Device Brand/Model/IMEI, Customer Name/Email/Phone)
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchTicket = ticket.ticketNumber?.toLowerCase().includes(q);
      const matchDevice =
        ticket.brand?.toLowerCase().includes(q) ||
        ticket.deviceModel?.toLowerCase().includes(q) ||
        ticket.imeiOrSerial?.toLowerCase().includes(q);
      const matchCustomer =
        ticket.customer?.name?.toLowerCase().includes(q) ||
        ticket.customer?.email?.toLowerCase().includes(q) ||
        ticket.customer?.phoneNumber?.toLowerCase().includes(q);

      return matchTicket || matchDevice || matchCustomer;
    });
  }, [initialTickets, searchQuery, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Ticket #, Device (Brand, Model, IMEI), or Customer..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_DIAGNOSIS">Pending Diagnosis</option>
            <option value="DIAGNOSING">Diagnosing</option>
            <option value="WAITING_PARTS">Waiting Parts</option>
            <option value="IN_REPAIR">In Repair</option>
            <option value="REPAIRED">Repaired</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-700 uppercase text-xs">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-slate-200">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-sm">
                    No tickets found matching your query.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-750 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-100">
                        {t.brand} {t.deviceModel}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {t.imeiOrSerial}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-100">{t.customer?.name}</div>
                      <div className="text-xs text-slate-400">
                        {t.customer?.phoneNumber || t.customer?.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          t.priority === "URGENT"
                            ? "bg-red-900/60 text-red-300"
                            : t.priority === "HIGH"
                            ? "bg-amber-900/60 text-amber-300"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/50 text-blue-300">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs whitespace-nowrap">
                      {t.technician?.name || (
                        <span className="italic text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {/* Properly aligned action button group */}
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <Link
                          href={`/tech/tickets/${t.id}`}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
                        >
                          Workbench
                        </Link>
                        <ManagerTicketActionsModal ticket={t} technicians={technicians} />
                        <Link
                          href={`/manager/invoices/new/${t.id}`}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition"
                        >
                          Invoice
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}