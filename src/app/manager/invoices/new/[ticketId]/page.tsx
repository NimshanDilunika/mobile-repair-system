import { auth } from "@/auth";
import { db } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopRibbon from "@/components/TopRibbon";
// Important: import directly from current folder
import InvoiceForm from "@/components/InvoiceForm";

export default async function NewInvoicePage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const session = await auth();

  if (
    !session?.user ||
    !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)
  ) {
    redirect("/login");
  }

  const { ticketId } = await params;

  if (!ticketId) {
    redirect("/manager/tickets");
  }

  const ticket = await db.repairTicket.findUnique({
    where: { id: ticketId },
    include: {
      customer: true,
      branch: true,
      partsUsed: {
        include: {
          part: true,
        },
      },
      invoice: true,
    },
  });

  if (!ticket) {
    redirect("/manager/tickets");
  }

  // Pre-calculate parts total
  const partsSubtotal = ticket.partsUsed.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );

  const initialLabor = ticket.invoice
    ? Math.max(0, Number(ticket.invoice.subTotal) - partsSubtotal)
    : 1500;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <TopRibbon />

      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Generate Final Invoice</h1>
              <p className="text-slate-400 text-xs mt-1">
                Ticket: <span className="font-mono text-blue-400 font-semibold">{ticket.ticketNumber}</span> ({ticket.brand} {ticket.deviceModel})
              </p>
            </div>
            <Link
              href="/manager/tickets"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition"
            >
              ← Back to Queue
            </Link>
          </div>

          <InvoiceForm
            ticketId={ticket.id}
            partsSubtotal={partsSubtotal}
            initialDiscount={ticket.invoice ? Number(ticket.invoice.discount) : 0}
            initialTax={ticket.invoice ? Number(ticket.invoice.tax) : 0}
            initialLabor={initialLabor}
            initialStatus={ticket.invoice?.paymentStatus || "UNPAID"}
          />
        </div>
      </main>
    </div>
  );
}