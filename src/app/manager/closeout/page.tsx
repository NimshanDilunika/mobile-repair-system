import { auth } from "@/auth";
import { db } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import TopRibbon from "@/components/TopRibbon";
import CloseoutForm from "@/components/CloseoutForm";

export default async function DailyCloseoutPage() {
  const session = await auth();

  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
    redirect("/login");
  }

  const branchId = session.user.branchId;

  // Tally today's revenue
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayInvoices, recentCloseouts] = await Promise.all([
    db.invoice.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startOfDay },
        ...(branchId ? { ticket: { branchId } } : {}),
      },
    }),
    db.dailyCashCloseout.findMany({
      where: branchId ? { branchId } : {},
      include: { closedBy: true },
      orderBy: { createdAt: "desc" },
      take: 7,
    }),
  ]);

  const systemCashExpected = todayInvoices.reduce(
    (sum, inv) => sum + Number(inv.totalAmount),
    0
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <TopRibbon />

      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">End-of-Shift Cash Reconciliation</h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare physical drawer cash against settled ticket revenue to prevent discrepancies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Today's System Ledger</span>
            <div>
              <span className="text-[11px] text-slate-400 block">Total Settled Invoices:</span>
              <p className="text-2xl font-mono font-bold text-emerald-400">{todayInvoices.length}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Expected Drawer Revenue:</span>
              <p className="text-2xl font-mono font-bold text-blue-400">
                LKR {systemCashExpected.toFixed(2)}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Count all physical cash and bills in the drawer, then submit your tally below.
            </p>
          </div>

          <div className="md:col-span-2">
            <CloseoutForm systemCashExpected={systemCashExpected} />
          </div>
        </div>

        {/* History Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-slate-200">Past 7 Closeout Records</h2>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Closed By</th>
                <th className="p-3">System Total</th>
                <th className="p-3">Actual Count</th>
                <th className="p-3">Discrepancy</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {recentCloseouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500 italic">No previous drawer closeouts recorded.</td>
                </tr>
              ) : (
                recentCloseouts.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 text-slate-300">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-200">{c.closedBy.name}</td>
                    <td className="p-3 font-mono text-slate-300">LKR {Number(c.systemCashTotal).toFixed(2)}</td>
                    <td className="p-3 font-mono text-slate-300">LKR {Number(c.actualCashTally).toFixed(2)}</td>
                    <td className={`p-3 font-mono font-bold ${Number(c.cashDiscrepancy) < 0 ? "text-red-400" : Number(c.cashDiscrepancy) > 0 ? "text-emerald-400" : "text-slate-400"}`}>
                      LKR {Number(c.cashDiscrepancy).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === "BALANCED" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-red-950 text-red-400 border border-red-800"}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}