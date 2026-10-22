"use client";

import { useActionState } from "react";
import { createRepairTicket } from "@/app/actions/ticket";
import Link from "next/link";

export default function NewTicketPage() {
  const [state, formAction, isPending] = useActionState(createRepairTicket, null);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">New Device Intake</h1>
            <p className="text-slate-400 text-sm">Register incoming device and print tracking ticket</p>
          </div>
          <Link
            href="/manager"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {state?.error && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-500 rounded-lg text-red-200 text-sm">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="mb-6 p-4 bg-emerald-900/40 border border-emerald-500 rounded-lg text-emerald-200 text-sm flex items-center justify-between">
            <span>Ticket <strong>{state.ticketId}</strong> successfully created!</span>
            <Link
              href="/manager/tickets"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-semibold"
            >
              View Ticket Queue
            </Link>
          </div>
        )}

        <form action={formAction} className="space-y-6">
          {/* Customer Details */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-lg font-semibold text-blue-400 mb-4">1. Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer Full Name *</label>
                <input
                  name="customerName"
                  required
                  placeholder="e.g. Ruwan Jayawardena"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  name="customerEmail"
                  type="email"
                  required
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  name="customerPhone"
                  placeholder="+94 77 123 4567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Device Details */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-lg font-semibold text-blue-400 mb-4">2. Device Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Brand *</label>
                <input
                  name="brand"
                  required
                  placeholder="e.g. Apple, Samsung, Xiaomi"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Device Model *</label>
                <input
                  name="deviceModel"
                  required
                  placeholder="e.g. iPhone 14 Pro Max"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">IMEI or Serial Number *</label>
                <input
                  name="imeiOrSerial"
                  required
                  placeholder="15-digit IMEI or Serial"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Device Passcode / PIN</label>
                <input
                  name="passcodeProvided"
                  placeholder="Pattern, PIN, or leave empty"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Intake Priority</label>
                <select
                  name="priority"
                  defaultValue="MEDIUM"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="LOW">Low (Standard)</option>
                  <option value="MEDIUM">Medium (Normal turn-around)</option>
                  <option value="HIGH">High (Expedited)</option>
                  <option value="URGENT">Urgent (Same-day critical)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Condition & Checklist */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-lg font-semibold text-blue-400 mb-4">3. Condition & Checklist</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              {[
                { name: "powersOn", label: "Powers On" },
                { name: "touchFunctional", label: "Touch Screen OK" },
                { name: "camerasFunctional", label: "Cameras OK" },
                { name: "faceIdOrFingerprint", label: "Biometrics OK" },
                { name: "waterDamageIndicator", label: "Liquid Contact" },
              ].map((item) => (
                <label key={item.name} className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-700 cursor-pointer text-xs">
                  <input type="checkbox" name={item.name} className="accent-blue-500 rounded" />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reported Issue *</label>
                <textarea
                  name="reportedIssue"
                  required
                  rows={2}
                  placeholder="Customer notes: battery draining fast, screen blank after dropping, etc."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Physical Condition Notes</label>
                <input
                  name="conditionNotes"
                  placeholder="Scratches on frame, missing SIM tray, hairline crack on rear glass"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Generating Ticket..." : "Generate Repair Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}