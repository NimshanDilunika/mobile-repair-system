import { auth } from "@/auth";
import { db } from "../lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopRibbon from "@/components/TopRibbon";
import { claimTicket } from "@/app/actions/technician";

export default async function TechDashboard() {
  const session = await auth();

  // Route Guard: Ensure user is authenticated and permitted
  if (!session?.user || !["TECHNICIAN", "BRANCH_MANAGER", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  // Fetch tickets assigned to this technician
  const myTickets = await db.repairTicket.findMany({
    where: { technicianId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      customer: { select: { name: true, phoneNumber: true } },
    },
  });

  // Fetch unassigned tickets waiting for diagnosis (branch-scoped if assigned to a branch)
  const unassignedTickets = await db.repairTicket.findMany({
    where: {
      technicianId: null,
      status: "PENDING_DIAGNOSIS",
      ...(session.user.branchId ? { branchId: session.user.branchId } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: {
      customer: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Universal Top Ribbon: Shop Details (Left) & User/Role/Logout (Right) */}
      <TopRibbon />

      <main className="flex-1 p-6 md:p-10 space-y-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h1 className="text-3xl font-bold tracking-tight">Technician Repair Workbench</h1>
            <p className="text-slate-400 text-sm mt-1">
              Active assigned repair jobs, diagnostic stages, and unassigned branch queue
            </p>
          </div>

          {/* Assigned Jobs */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-blue-400">
                Your Active Repairs ({myTickets.length})
              </h2>
            </div>

            {myTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-700 rounded-lg">
                You have no active tickets assigned. Claim an unassigned job below to begin diagnosis.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 bg-slate-950 border border-slate-700 rounded-xl flex flex-col justify-between hover:border-slate-600 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-mono font-bold text-blue-400">{t.ticketNumber}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/50 text-blue-300">
                          {t.status}
                        </span>
                      </div>
                      <div className="text-lg font-semibold">{t.brand} {t.deviceModel}</div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        <strong>Issue:</strong> {t.reportedIssue}
                      </p>
                      <div className="text-xs text-slate-400">
                        Customer: {t.customer.name} ({t.customer.phoneNumber || "No phone"})
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-mono">IMEI: {t.imeiOrSerial}</span>
                      <Link
                        href={`/tech/tickets/${t.id}`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition"
                      >
                        Open Workbench →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unassigned Intake Queue */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
            <h2 className="text-xl font-bold text-amber-400">
              Unassigned Intake Queue ({unassignedTickets.length})
            </h2>

            {unassignedTickets.length === 0 ? (
              <p className="text-slate-400 text-sm">No unassigned tickets available in your branch.</p>
            ) : (
              <div className="divide-y divide-slate-700">
                {unassignedTickets.map((t) => (
                  <div
                    key={t.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400">{t.ticketNumber}</span>
                        <span className="text-xs text-slate-400">
                          ({t.brand} {t.deviceModel})
                        </span>
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                          {t.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{t.reportedIssue}</p>
                    </div>

                    <form
                      action={async () => {
                        "use server";
                        await claimTicket(t.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                      >
                        Claim Ticket
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}