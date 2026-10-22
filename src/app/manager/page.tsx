import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopRibbon from "@/components/TopRibbon";

export default async function ManagerDashboard() {
  const session = await auth();

  if (
    !session?.user ||
    !["BRANCH_MANAGER", "SUPER_ADMIN"].includes(session.user.role)
  ) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Universal Top Ribbon: Shop Details (Left) & User/Role/Logout (Right) */}
      <TopRibbon />

      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h1 className="text-3xl font-bold tracking-tight">Branch Operations Control</h1>
            <p className="text-slate-400 text-sm mt-1">
              Service Hub Management, Device Intake & Spare Parts Stock
            </p>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* New Intake Card */}
            <Link
              href="/manager/tickets/new"
              className="p-5 bg-blue-600/20 border border-blue-500/50 rounded-xl hover:bg-blue-600/30 transition flex flex-col justify-between group"
            >
              <div>
                <div className="text-2xl mb-2">📋</div>
                <h3 className="font-bold text-lg text-blue-300 group-hover:text-blue-200">
                  + Create Device Intake
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Register customer device, checklist, & fault details
                </p>
              </div>
              <span className="text-right text-lg font-bold text-blue-400 group-hover:translate-x-1 transition-transform mt-4">
                →
              </span>
            </Link>

            {/* Ticket Queue Card */}
            <Link
              href="/manager/tickets"
              className="p-5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 hover:border-slate-600 transition flex flex-col justify-between group"
            >
              <div>
                <div className="text-2xl mb-2">🎫</div>
                <h3 className="font-bold text-lg text-slate-200 group-hover:text-white">
                  Repair Tickets Queue
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Track diagnostics, workbenches, status & assign technicians
                </p>
              </div>
              <span className="text-right text-lg font-bold text-slate-400 group-hover:translate-x-1 transition-transform mt-4">
                →
              </span>
            </Link>

            {/* Inventory Parts Card */}
            <Link
              href="/manager/inventory"
              className="p-5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 hover:border-slate-600 transition flex flex-col justify-between group"
            >
              <div>
                <div className="text-2xl mb-2">⚙️</div>
                <h3 className="font-bold text-lg text-slate-200 group-hover:text-white">
                  Spare Parts & Stock
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage replacement parts, adjust branch quantities & pricing
                </p>
              </div>
              <span className="text-right text-lg font-bold text-slate-400 group-hover:translate-x-1 transition-transform mt-4">
                →
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}