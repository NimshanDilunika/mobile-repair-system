import { auth } from "@/auth";
import { db } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import PaymentActions from "@/components/PaymentActions";
import PrintButton from "@/components/PrintButton";
export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      ticket: {
        include: {
          customer: true,
          branch: true,
          partsUsed: { include: { part: true } },
        },
      },
    },
  });

  if (!invoice) notFound();

  const isPaid = invoice.paymentStatus === "PAID";
  const partsTotal = invoice.ticket.partsUsed.reduce(
    (acc, p) => acc + Number(p.unitPrice) * p.quantity,
    0
  );
  const laborTotal = Math.max(0, Number(invoice.subTotal) - partsTotal);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <Link
            href="/manager/tickets"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition"
          >
            ← Back to Tickets
          </Link>
          {/* Replace this: */}
{/* <button onClick="window.print()" ...>🖨️ Print Receipt</button> */}

{/* With this: */}
<PrintButton />
        </div>

        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 space-y-6 print:bg-white print:text-black print:border-none print:shadow-none">
          <div className="flex justify-between items-start border-b border-slate-700 print:border-gray-300 pb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white print:text-black">
                {invoice.ticket.branch.name}
              </h1>
              <p className="text-xs text-slate-400 print:text-gray-600">{invoice.ticket.branch.address}</p>
              <p className="text-xs text-slate-400 print:text-gray-600">Contact: {invoice.ticket.branch.contactNo}</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-lg font-bold text-blue-400 print:text-blue-700">
                INV-{invoice.id.slice(-6).toUpperCase()}
              </span>
              <p className="text-xs text-slate-400 print:text-gray-600">
                Date: {new Date(invoice.createdAt).toLocaleDateString()}
              </p>
              <span className={`inline-block mt-2 px-3 py-1 rounded text-xs font-bold ${
                isPaid
                  ? "bg-emerald-900/60 text-emerald-300 print:bg-emerald-100 print:text-emerald-800"
                  : "bg-amber-900/60 text-amber-300 print:bg-amber-100 print:text-amber-800"
              }`}>
                {invoice.paymentStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-400 print:text-gray-500 uppercase">Customer</span>
              <p className="font-bold text-sm text-slate-100 print:text-black">{invoice.ticket.customer.name}</p>
              <p className="text-slate-400 print:text-gray-600">{invoice.ticket.customer.email}</p>
              <p className="text-slate-400 print:text-gray-600">{invoice.ticket.customer.phoneNumber}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-400 print:text-gray-500 uppercase">Device Repaired</span>
              <p className="font-bold text-sm text-slate-100 print:text-black">{invoice.ticket.brand} {invoice.ticket.deviceModel}</p>
              <p className="text-slate-400 print:text-gray-600 font-mono">IMEI: {invoice.ticket.imeiOrSerial}</p>
              <p className="text-slate-400 print:text-gray-600">Ref: {invoice.ticket.ticketNumber}</p>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-700 print:border-gray-300 text-slate-400 print:text-gray-600 uppercase">
              <tr>
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 print:divide-gray-200">
              {invoice.ticket.partsUsed.map((p) => (
                <tr key={p.id}>
                  <td className="py-2">
                    <p className="font-semibold">{p.part.partName}</p>
                    <p className="text-[10px] text-slate-400 print:text-gray-500 font-mono">{p.part.partSku}</p>
                  </td>
                  <td className="py-2 text-center">{p.quantity}</td>
                  <td className="py-2 text-right font-mono">LKR {Number(p.unitPrice).toFixed(2)}</td>
                  <td className="py-2 text-right font-mono">LKR {(Number(p.unitPrice) * p.quantity).toFixed(2)}</td>
                </tr>
              ))}
              {laborTotal > 0 && (
                <tr>
                  <td className="py-2 font-semibold">Technician Repair Labor & Diagnostic Fee</td>
                  <td className="py-2 text-center">1</td>
                  <td className="py-2 text-right font-mono">LKR {laborTotal.toFixed(2)}</td>
                  <td className="py-2 text-right font-mono">LKR {laborTotal.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="border-t border-slate-700 print:border-gray-300 pt-4 flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 print:text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono">LKR {Number(invoice.subTotal).toFixed(2)}</span>
              </div>
              {Number(invoice.tax) > 0 && (
                <div className="flex justify-between text-slate-400 print:text-gray-600">
                  <span>Tax:</span>
                  <span className="font-mono">LKR {Number(invoice.tax).toFixed(2)}</span>
                </div>
              )}
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between text-amber-400 print:text-amber-700">
                  <span>Discount:</span>
                  <span className="font-mono">- LKR {Number(invoice.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-emerald-400 print:text-emerald-700 pt-2 border-t border-slate-700 print:border-gray-300">
                <span>Total Amount:</span>
                <span className="font-mono">LKR {Number(invoice.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {!isPaid && (
            <div className="print:hidden pt-4 border-t border-slate-700">
              <PaymentActions invoiceId={invoice.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}