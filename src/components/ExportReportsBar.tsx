"use client";

export default function ExportReportsBar() {
  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-wrap justify-between items-center gap-3">
      <div>
        <span className="text-xs font-semibold text-slate-200 block">Export Accounting Reports</span>
        <span className="text-[11px] text-slate-400">Download formatted CSV reports compatible with Excel and QuickBooks.</span>
      </div>

      <div className="flex gap-2">
        <a
          href="/api/reports/export?type=invoices"
          download
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
        >
          📊 Export Revenue & VAT (CSV)
        </a>

        <a
          href="/api/reports/export?type=inventory"
          download
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
        >
          📦 Export Stock Valuation (CSV)
        </a>
      </div>
    </div>
  );
}