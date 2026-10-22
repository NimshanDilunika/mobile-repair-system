import { auth } from "@/auth";
import { db } from "@/app/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import TechStatusForm from "@/components/TechStatusForm";
import TechPartsSection from "@/components/TechPartsSection";

export default async function TechTicketDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  // 1. Role Guard: Allow TECHNICIAN, BRANCH_MANAGER, and SUPER_ADMIN
  if (
    !session?.user ||
    !["TECHNICIAN", "BRANCH_MANAGER", "SUPER_ADMIN"].includes(session.user.role)
  ) {
    redirect("/login");
  }

  const ticket = await db.repairTicket.findUnique({
    where: { id },
    include: {
      customer: true,
      ticketHistory: { orderBy: { createdAt: "desc" } },
      partsUsed: { include: { part: true } },
    },
  });

  if (!ticket) notFound();

  // 2. Branch Security: Prevent managers from other branches inspecting foreign tickets
  if (
    session.user.role === "BRANCH_MANAGER" &&
    session.user.branchId &&
    ticket.branchId !== session.user.branchId
  ) {
    redirect("/manager/tickets");
  }

  // 3. Fetch available replacement parts for this branch
  const availableParts = await db.inventoryItem.findMany({
    where: { branchId: ticket.branchId },
    orderBy: { partName: "asc" },
  });

  // 4. Serialize objects to avoid Decimal pass-through errors
  const serializedTicket = JSON.parse(JSON.stringify(ticket));

  const serializedParts = availableParts.map((p) => ({
    id: p.id,
    partName: p.partName,
    sku: p.partSku,
    stockQuantity: p.stockQuantity,
    unitPrice: Number(p.sellingPrice),
  }));

  const serializedUsedParts = ticket.partsUsed.map((pu) => ({
    id: pu.id,
    quantity: pu.quantity,
    unitPrice: Number(pu.unitPrice),
    part: {
      partName: pu.part.partName,
      sku: pu.part.partSku,
    },
  }));

  let checklist: Record<string, boolean> = {};
  try {
    checklist = JSON.parse(ticket.intakeChecklist || "{}");
  } catch {
    checklist = {};
  }

  const isManagerOrAdmin =
    session.user.role === "BRANCH_MANAGER" || session.user.role === "SUPER_ADMIN";
  const backHref = isManagerOrAdmin ? "/manager/tickets" : "/tech";
  const backLabel = isManagerOrAdmin ? "← Back to Ticket Queue" : "← Back to Workbench";

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-mono text-blue-400">
                {ticket.ticketNumber}
              </h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-900/60 text-blue-300">
                {ticket.status}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              {ticket.brand} {ticket.deviceModel}
            </p>
          </div>
         <Link
            href={session.user.role === "BRANCH_MANAGER" ||  "SUPER_ADMIN" ? "/manager/tickets" : "/tech"}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition"
          >
            ← {session.user.role === "BRANCH_MANAGER" ||  "SUPER_ADMIN"? "Back to Ticket Queue" : "Back to Workbench"}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Device & Intake Specs */}
          <div className="space-y-6">
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Device Specifications
              </h3>
              <div className="text-sm space-y-2">
                <p>
                  <strong>IMEI/Serial:</strong>{" "}
                  <span className="font-mono text-slate-300">{ticket.imeiOrSerial}</span>
                </p>
                <p>
                  <strong>Passcode / PIN:</strong>{" "}
                  <span className="font-mono text-amber-400">
                    {ticket.passcodeProvided || "None"}
                  </span>
                </p>
                <p>
                  <strong>Priority:</strong>{" "}
                  <span className="font-semibold text-slate-300">{ticket.priority}</span>
                </p>
                <p>
                  <strong>Physical Notes:</strong>{" "}
                  <span className="text-slate-300">{ticket.conditionNotes || "None"}</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Intake Checklist
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(checklist).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-700"
                  >
                    <span className={val ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                      {val ? "✓" : "✗"}
                    </span>
                    <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Customer Contact
              </h3>
              <div className="text-sm space-y-1">
                <p className="font-medium text-slate-200">{ticket.customer.name}</p>
                <p className="text-slate-400 text-xs">{ticket.customer.email}</p>
                <p className="text-slate-400 text-xs">
                  {ticket.customer.phoneNumber || "No phone provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Diagnostic Form, Parts Allocation & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interactive Status & Diagnostic Update Form */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold text-blue-400 mb-4">Diagnostics & Status Update</h3>
              <TechStatusForm ticket={serializedTicket} />
            </div>

            {/* Spare Parts Allocation Component */}
            <TechPartsSection
              ticketId={ticket.id}
              availableParts={serializedParts}
              partsUsed={serializedUsedParts}
            />

            {/* Ticket Activity History */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold text-slate-200 mb-4">Activity Timeline</h3>
              <div className="space-y-4 border-l-2 border-slate-700 pl-4 ml-2">
                {ticket.ticketHistory.map((h) => (
                  <div key={h.id} className="relative space-y-1">
                    <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-800" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-400">{h.status}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(h.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{h.notes}</p>
                    <p className="text-xs text-slate-500">
                      By: {h.recordedBy || (h as any).recordedBy || "Staff"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}