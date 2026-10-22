import { auth, signOut } from "@/auth";
import { db } from "../lib/prisma";
import Link from "next/link";
import CustomerApprovalForm from "@/components/CustomerApprovalForm";

export default async function CustomerPortalPage() {
  const session = await auth();

  const tickets = await db.repairTicket.findMany({
    where: { customerId: session?.user?.id },
    orderBy: { createdAt: "desc" },
   include: {
      branch: { select: { name: true, contactNo: true } },
      ticketHistory: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {session?.user?.name}</h1>
            <p className="text-slate-400 text-xs">Manage your device repairs, quotations, and collection notices</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* Tickets Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Your Repair Jobs ({tickets.length})</h2>

          {tickets.length === 0 ? (
            <div className="p-8 bg-slate-800 border border-dashed border-slate-700 rounded-xl text-center text-slate-400 text-sm">
              You have no active or previous repairs registered.
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <div key={t.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-bold text-blue-400">{t.ticketNumber}</span>
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-900/60 text-blue-300">
                          {t.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-100">{t.brand} {t.deviceModel}</h3>
                    </div>
                    <Link
                      href={`/track?query=${t.ticketNumber}`}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200 transition text-center"
                    >
                      View Live Tracker →
                    </Link>
                  </div>

                  <p className="text-xs text-slate-400">
                    <strong>Reported Issue:</strong> {t.reportedIssue}
                  </p>

                  {/* If Awaiting Approval, display inline approval action */}
                  {t.status === "DIAGNOSED_AWAITING_APPROVAL" && (
                    <CustomerApprovalForm
                      ticketId={t.id}
                      isApproved={t.isApproved}
                      estimatedCost={t.estimatedCost ? Number(t.estimatedCost) : null}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}