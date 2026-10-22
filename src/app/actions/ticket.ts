"use server";

import { auth } from "@/auth";
import { db } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export interface TicketActionState {
  success?: boolean;
  message?: string;
  error?: string;
  ticketId?: string;
}

// 1. Manager Edit Ticket Specifications
export async function editTicketByManager(
  prevState: TicketActionState | null,
  formData: FormData
): Promise<TicketActionState> {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
    return { error: "Unauthorized: Manager permissions required." };
  }

  const ticketId = formData.get("ticketId") as string;
  const brand = formData.get("brand") as string;
  const deviceModel = formData.get("deviceModel") as string;
  const imeiOrSerial = formData.get("imeiOrSerial") as string;
  const priority = formData.get("priority") as string;
  const reportedIssue = formData.get("reportedIssue") as string;
  const technicianId = (formData.get("technicianId") as string) || null;

  if (!ticketId || !brand || !deviceModel || !imeiOrSerial) {
    return { error: "Missing required device fields." };
  }

  try {
    const updated = await db.repairTicket.update({
      where: { id: ticketId },
      data: {
        brand,
        deviceModel,
        imeiOrSerial,
        priority,
        reportedIssue,
        technicianId,
      },
    });

    await db.ticketTimeline.create({
      data: {
        ticketId,
        status: updated.status,
        notes: "Manager updated device specifications / reassigned technician.",
        recordedBy: session.user.name || "Branch Manager",
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TICKET_EDITED",
        metadata: `Manager edited ticket ${updated.ticketNumber}`,
      },
    });

    revalidatePath("/manager/tickets");
    return { success: true, message: "Ticket details updated successfully." };
  } catch (err: any) {
    return { error: err.message || "Failed to edit ticket." };
  }
}

// 2. Manager Cancel Ticket
export async function cancelTicketByManager(
  prevState: TicketActionState | null,
  formData: FormData
): Promise<TicketActionState> {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
    return { error: "Unauthorized: Manager permissions required." };
  }

  const ticketId = formData.get("ticketId") as string;
  const reason = (formData.get("reason") as string)?.trim() || "Cancelled by Manager";

  if (!ticketId) {
    return { error: "Invalid ticket reference ID." };
  }

  try {
    const updated = await db.$transaction(async (tx: any) => {
      const existing = await tx.repairTicket.findUnique({
        where: { id: ticketId },
      });

      if (!existing) {
        throw new Error("Repair ticket not found.");
      }

      const ticket = await tx.repairTicket.update({
        where: { id: ticketId },
        data: { status: "CANCELLED" },
      });

      // Fixed: tx.ticketTimeline instead of tx.ticketHistory, recordedBy instead of changedBy
      await tx.ticketTimeline.create({
        data: {
          ticketId,
          status: "CANCELLED",
          notes: `Repair cancelled by branch manager. Reason: ${reason}`,
          recordedBy: session.user.name || "Branch Manager",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "TICKET_CANCELLED",
          metadata: `Ticket ${ticket.ticketNumber} cancelled. Reason: ${reason}`,
        },
      });

      return ticket;
    });

    revalidatePath("/manager/tickets");
    revalidatePath("/manager");
    revalidatePath("/track");
    return { success: true, message: `Ticket ${updated.ticketNumber} has been successfully cancelled.` };
  } catch (err: any) {
    console.error("Cancellation error:", err);
    return { error: err.message || "Failed to cancel ticket." };
  }
}

// 3. New Ticket Intake
export async function createRepairTicket(
  prevState: TicketActionState | null,
  formData: FormData
): Promise<TicketActionState> {
  const session = await auth();

  if (
    !session?.user ||
    !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)
  ) {
    return { error: "Unauthorized: Manager or Admin permissions required." };
  }

  const customerName = formData.get("customerName") as string;
  const customerEmail = (formData.get("customerEmail") as string)?.toLowerCase().trim();
  const customerPhone = (formData.get("customerPhone") as string) || null;

  const brand = formData.get("brand") as string;
  const deviceModel = formData.get("deviceModel") as string;
  const imeiOrSerial = formData.get("imeiOrSerial") as string;
  const passcodeProvided = (formData.get("passcodeProvided") as string) || null;
  const priority = (formData.get("priority") as string) || "MEDIUM";

  const reportedIssue = formData.get("reportedIssue") as string;
  const conditionNotes = (formData.get("conditionNotes") as string) || "";

  if (!customerName || !customerEmail || !brand || !deviceModel || !imeiOrSerial || !reportedIssue) {
    return { error: "Please complete all mandatory fields marked with an asterisk (*)." };
  }

  const intakeChecklist = JSON.stringify({
    powersOn: formData.get("powersOn") === "on",
    touchFunctional: formData.get("touchFunctional") === "on",
    camerasFunctional: formData.get("camerasFunctional") === "on",
    faceIdOrFingerprint: formData.get("faceIdOrFingerprint") === "on",
    waterDamageIndicator: formData.get("waterDamageIndicator") === "on",
    notes: conditionNotes,
  });

  try {
    const result = await db.$transaction(async (tx: any) => {
      let customer = await tx.user.findUnique({
        where: { email: customerEmail },
      });

      if (!customer) {
        customer = await tx.user.create({
          data: {
            name: customerName,
            email: customerEmail,
            passwordHash: "",
            role: "CUSTOMER",
            phoneNumber: customerPhone,
          },
        });
      }

      let branchId = session.user.branchId;
      if (!branchId) {
        const firstBranch = await tx.serviceCenter.findFirst();
        branchId = firstBranch?.id || null;
      }

      if (!branchId) {
        throw new Error("No service center branch associated with this intake.");
      }

      const currentYear = new Date().getFullYear();
      const count = await tx.repairTicket.count();
      const ticketNumber = `TICK-${currentYear}-${String(count + 1).padStart(4, "0")}`;

      const ticket = await tx.repairTicket.create({
        data: {
          ticketNumber,
          customerId: customer.id,
          branchId,
          brand,
          deviceModel,
          imeiOrSerial,
          passcodeProvided,
          priority,
          reportedIssue,
          intakeChecklist,
          status: "PENDING_DIAGNOSIS",
        },
      });

      // Fixed: tx.ticketTimeline instead of tx.ticketHistory, recordedBy instead of changedBy
      await tx.ticketTimeline.create({
        data: {
          ticketId: ticket.id,
          status: "PENDING_DIAGNOSIS",
          notes: `Device accepted at intake. Issue reported: ${reportedIssue}`,
          recordedBy: session.user.name || "Intake Staff",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "TICKET_CREATED",
          metadata: `Created ticket ${ticketNumber} for ${brand} ${deviceModel}`,
        },
      });

      return ticket;
    });

    revalidatePath("/manager/tickets");
    return { success: true, ticketId: result.ticketNumber };
  } catch (err: any) {
    return { error: err.message || "Failed to create repair ticket." };
  }
}