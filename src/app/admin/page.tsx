import { auth } from "@/auth";
import { getAdminAnalytics } from "@/app/actions/admin";
import TopRibbon from "@/components/TopRibbon";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const data = await getAdminAnalytics();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Universal Top Ribbon: Shop Details (Left) & User/Role/Logout (Right) */}
      <TopRibbon />

      <main className="flex-1 p-6 md:p-10 space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-6 rounded-xl border border-slate-700 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System Administration Control</h1>
              <p className="text-slate-400 text-sm mt-1">
                Global overview of service branches, revenue metrics, technician workloads, and security logs
              </p>
            </div>
            
            {/* Clean, horizontally aligned administrative quick links */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/users"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition"
              >
                👥 Manage Users
              </Link>
              <Link
                href="/manager/tickets"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition"
              >
                Manage All Tickets
              </Link>
              <Link
                href="/manager/inventory"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition"
              >
                Branch-wise Parts & Stock
              </Link>
            </div>
          </div>

          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-800 border border-slate-700 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Paid Revenue</span>
              <p className="text-2xl font-bold font-mono text-emerald-400">
                LKR {data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500">Collected from finalized invoices</span>
            </div>

            <div className="p-5 bg-slate-800 border border-slate-700 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Repairs Handled</span>
              <p className="text-2xl font-bold font-mono text-blue-400">{data.totalTickets}</p>
              <span className="text-[11px] text-slate-500">All registered intake devices</span>
            </div>

            <div className="p-5 bg-slate-800 border border-slate-700 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active In-Progress</span>
              <p className="text-2xl font-bold font-mono text-amber-400">{data.pendingTickets}</p>
              <span className="text-[11px] text-slate-500">Diagnosing, parts wait, or repair bench</span>
            </div>

            <div className="p-5 bg-slate-800 border border-slate-700 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Repairs</span>
              <p className="text-2xl font-bold font-mono text-purple-400">{data.completedTickets}</p>
              <span className="text-[11px] text-slate-500">Fully serviced & delivered</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Branches & Technician Workloads */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Centers Overview */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                <h2 className="text-lg font-bold text-slate-200">Service Center Branches</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.branches.map((b) => (
                    <div key={b.id} className="p-4 bg-slate-950 border border-slate-700 rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-sm text-slate-100">{b.name}</h3>
                          <p className="text-xs text-slate-400">{b.address}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-900/60 text-blue-300">
                          {b.code}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        <div>Tickets: <strong className="text-slate-200">{b._count.tickets}</strong></div>
                        <div>Staff: <strong className="text-slate-200">{b._count.staff}</strong></div>
                        <div>SKUs: <strong className="text-slate-200">{b._count.inventory}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technician Workload Distribution */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                <h2 className="text-lg font-bold text-slate-200">Technician Productivity & Workloads</h2>
                <div className="divide-y divide-slate-700 border border-slate-700 rounded-lg overflow-hidden bg-slate-950">
                  {data.technicians.map((t) => (
                    <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-semibold text-slate-200 text-sm">{t.name}</p>
                        <p className="text-slate-400">{t.email}</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center px-3 py-1 bg-slate-900 rounded border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase">Active</span>
                          <span className="font-bold text-amber-400 font-mono text-sm">{t.inProgress}</span>
                        </div>
                        <div className="text-center px-3 py-1 bg-slate-900 rounded border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase">Resolved</span>
                          <span className="font-bold text-emerald-400 font-mono text-sm">{t.completed}</span>
                        </div>
                        <div className="text-center px-3 py-1 bg-slate-900 rounded border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase">Total</span>
                          <span className="font-bold text-blue-400 font-mono text-sm">{t.totalAssigned}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Low Stock Alerts & System Audit Logs */}
            <div className="space-y-6">
              {/* Low Inventory Alert */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                <h2 className="text-lg font-bold text-red-400">Inventory Reorder Alerts</h2>
                {data.lowStockItems.length === 0 ? (
                  <p className="text-xs text-slate-400">All spare parts are within safe inventory thresholds.</p>
                ) : (
                  <div className="space-y-2">
                    {data.lowStockItems.map((item) => (
                      <div key={item.id} className="p-3 bg-red-950/30 border border-red-500/40 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-200">{item.partName}</span>
                          <span className="font-bold font-mono text-red-400">{item.stockQuantity} left</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          SKU: {item.partSku} • {item.branchName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Log Stream */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                <h2 className="text-lg font-bold text-slate-200">Recent Security & Audit Logs</h2>
                <div className="space-y-3">
                  {data.recentAuditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-blue-400 font-semibold">{log.action}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{log.metadata || "No metadata attached"}</p>
                      <p className="text-[10px] text-slate-500">By: {log.user.name} ({log.user.role})</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}