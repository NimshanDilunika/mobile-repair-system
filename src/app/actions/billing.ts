"use server";

import { auth } from "@/auth";
import { db } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export interface BillingActionState {
  success?: boolean;
  invoiceId?: string;
  error?: string;
}

export async function generateInvoice(
  prevState: BillingActionState | null,
  formData: FormData
): Promise<BillingActionState> {
  const session = await auth();

  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
    return { error: "Unauthorized: Only managers and admins can issue invoices." };
  }

  const ticketId = formData.get("ticketId") as string;
  const laborCostRaw = formData.get("laborCost") as string;
  const taxRateRaw = formData.get("taxRate") as string;
  const discountRaw = formData.get("discountAmount") as string;

  const laborCost = parseFloat(laborCostRaw || "0");
  const taxRate = parseFloat(taxRateRaw || "0");
  const discount = parseFloat(discountRaw || "0");

  if (!ticketId) {
    return { error: "Invalid ticket reference." };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const ticket = await tx.repairTicket.findUnique({
        where: { id: ticketId },
        include: { partsUsed: true },
      });

      if (!ticket) {
        throw new Error("Repair ticket not found.");
      }

      const existing = await tx.invoice.findFirst({
        where: { ticketId },
      });
      if (existing) {
        throw new Error("An invoice already exists for this repair ticket.");
      }

      // 1. Calculate parts + labor subTotal
      const partsSubtotal = ticket.partsUsed.reduce(
        (sum, p) => sum + Number(p.unitPrice) * p.quantity,
        0
      );

      const subTotal = partsSubtotal + laborCost;
      const tax = (subTotal * taxRate) / 100;
      const totalAmount = Math.max(0, subTotal + tax - discount);

      // 2. Create invoice matching your exact model
      const invoice = await tx.invoice.create({
        data: {
          ticketId,
          subTotal,
          tax,
          discount,
          totalAmount,
          paymentStatus: "UNPAID",
        },
      });

      // 3. Update ticket status
      await tx.repairTicket.update({
        where: { id: ticketId },
        data: { status: "READY_FOR_PICKUP" },
      });

      // 4. Log timeline event
      await tx.ticketTimeline.create({
        data: {
          ticketId,
          status: "READY_FOR_PICKUP",
          notes: `Invoice issued for LKR ${totalAmount.toFixed(2)}. Device is ready for customer pickup.`,
          recordedBy: session.user.name || "Billing Staff",
        },
      });

      // 5. Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "INVOICE_GENERATED",
          metadata: `Generated invoice ${invoice.id} for ticket ${ticket.ticketNumber}`,
        },
      });

      return invoice;
    });

    revalidatePath("/manager/tickets");
    return { success: true, invoiceId: result.id };
  } catch (err: any) {
    return { error: err.message || "Failed to generate invoice." };
  }
}

export async function processPayment(
  prevState: BillingActionState | null,
  formData: FormData
): Promise<BillingActionState> {
  const session = await auth();

  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
    return { error: "Unauthorized." };
  }

  const invoiceId = formData.get("invoiceId") as string;
  const paymentMethod = formData.get("paymentMethod") as string;

  if (!invoiceId) {
    return { error: "Missing invoice ID." };
  }

  try {
    await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paymentStatus: "PAID",
        },
        include: { ticket: true },
      });

      await tx.repairTicket.update({
        where: { id: invoice.ticketId },
        data: { status: "COMPLETED" },
      });

      await tx.ticketTimeline.create({
        data: {
          ticketId: invoice.ticketId,
          status: "COMPLETED",
          notes: `Payment of LKR ${Number(invoice.totalAmount).toFixed(2)} received (${paymentMethod || "CASH"}). Device handed over.`,
          recordedBy: session.user.name || "Cashier",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PAYMENT_RECEIVED",
          metadata: `Invoice ${invoice.id} marked PAID`,
        },
      });
    });

    revalidatePath(`/manager/invoices/${invoiceId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to process payment." };
  }
}