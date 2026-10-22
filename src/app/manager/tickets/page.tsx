import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "../../lib/prisma";
import Link from "next/link";
import TicketQueueTable from "@/components/TicketQueueTable";

export default async function TicketQueuePage() {
  const session = await auth();

  // 1. Role Guard: Allow only SUPER_ADMIN and BRANCH_MANAGER
  if (
    !session?.user ||
    !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)
  ) {
    redirect("/login");
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const dashboardHref = isSuperAdmin ? "/admin" : "/manager";

  // 2. Branch Scoping: Managers see only their branch; Super Admins see all
  const branchFilter =
    !isSuperAdmin && session.user.branchId
      ? { branchId: session.user.branchId }
      : {};

  // Fetch branch-scoped technicians
  const technicians = await db.user.findMany({
    where: {
      role: "TECHNICIAN",
      ...(!isSuperAdmin && session.user.branchId
        ? { branchId: session.user.branchId }
        : {}),
    },
    select: { id: true, name: true },
  });

  // Fetch branch-scoped repair tickets
  const rawTickets = await db.repairTicket.findMany({
    where: branchFilter,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      technician: true,
      branch: true,
    },
  });

  // 3. Serialize objects to avoid Decimal pass-through errors
  const tickets = JSON.parse(JSON.stringify(rawTickets));

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Repair Tickets Queue</h1>
            <p className="text-slate-400 text-sm">
              Active intakes, diagnostic stages, and customer tickets
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={dashboardHref}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition"
            >
              ← Dashboard
            </Link>
            <Link
              href="/manager/inventory"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition"
            >
              Parts & Stock
            </Link>
            <Link
              href="/manager/tickets/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition"
            >
              + New Intake
            </Link>
          </div>
        </div>

        {/* Search, Filter & Ticket Queue Table */}
        <TicketQueueTable initialTickets={tickets} technicians={technicians} />
      </div>
    </div>
  );
}