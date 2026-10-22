"use server";

import { auth } from "@/auth";
import { db } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export interface InvoiceActionState {
  success?: boolean;
  message?: string;
  error?: string;
  invoiceId?: string;
}

export async function createTicketInvoice(
  prevState: InvoiceActionState | null,
  formData: FormData
): Promise<InvoiceActionState> {
  const session = await auth();

  if (
    !session?.user ||
    !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)
  ) {
    return { error: "Unauthorized: Manager or Admin permissions required." };
  }

  const ticketId = formData.get("ticketId") as string;
  const partsSubtotal = parseFloat(formData.get("partsSubtotal") as string) || 0;
  const laborCharge = parseFloat(formData.get("laborCharge") as string) || 0;
  // Read both "taxAmount" and fallback "tax"
  const tax = parseFloat(
    (formData.get("taxAmount") || formData.get("tax") || "0") as string
  ) || 0;
  const discount = Math.max(
    0,
    parseFloat((formData.get("discount") || "0") as string) || 0
  );
  const paymentStatus = (formData.get("paymentStatus") as string) || "UNPAID";

  if (!ticketId) {
    return { error: "Missing repair ticket reference ID." };
  }

  const subTotal = partsSubtotal + laborCharge;
  const totalAmount = Math.max(0, subTotal + tax - discount);

  try {
    const invoice = await db.$transaction(async (tx) => {
      const existing = await tx.invoice.findUnique({
        where: { ticketId },
      });

      let inv;
      if (existing) {
        inv = await tx.invoice.update({
          where: { ticketId },
          data: {
            subTotal,
            tax,
            discount,
            totalAmount,
            paymentStatus,
          },
        });
      } else {
        inv = await tx.invoice.create({
          data: {
            ticketId,
            subTotal,
            tax,
            discount,
            totalAmount,
            paymentStatus,
          },
        });
      }

      if (paymentStatus === "PAID") {
        await tx.repairTicket.update({
          where: { id: ticketId },
          data: { status: "COMPLETED" },
        });

        await tx.ticketTimeline.create({
          data: {
            ticketId,
            status: "COMPLETED",
            notes: `Invoice finalized. Discount: LKR ${discount.toFixed(2)}, Tax: LKR ${tax.toFixed(2)}, Total Paid: LKR ${totalAmount.toFixed(2)}`,
            recordedBy: session.user.name || "Manager",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "INVOICE_GENERATED",
          metadata: `Invoice for ticket ${ticketId}: SubTotal LKR ${subTotal}, Discount LKR ${discount}, Tax LKR ${tax}, Final LKR ${totalAmount}`,
        },
      });

      return inv;
    });

    revalidatePath(`/manager/invoices/new/${ticketId}`);
    revalidatePath("/manager/tickets");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Invoice, discount, and tax saved successfully.",
      invoiceId: invoice.id,
    };
  } catch (err: any) {
    return { error: err.message || "Failed to save invoice." };
  }
}