"use server";

import { auth } from "@/auth";
import { db } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export interface TechActionState {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function claimTicket(ticketId: string): Promise<TechActionState> {
  const session = await auth();

  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER", "TECHNICIAN"].includes(session.user.role)) {
    return { error: "Unauthorized." };
  }

  try {
    await db.$transaction(async (tx) => {
      const ticket = await tx.repairTicket.update({
        where: { id: ticketId },
        data: {
          technicianId: session.user.id,
          status: "PENDING_DIAGNOSIS",
        },
      });

      await tx.ticketTimeline.create({
        data: {
          ticketId: ticket.id,
          status: "PENDING_DIAGNOSIS",
          notes: `Job claimed by technician ${session.user.name}`,
          recordedBy: session.user.name || "Technician",
        },
      });
    });

    revalidatePath("/tech");
    return { success: true, message: "Ticket assigned to your workbench." };
  } catch (err: any) {
    return { error: err.message || "Failed to assign ticket." };
  }
}

export async function updateDiagnosisAndStatus(
  prevState: TechActionState | null,
  formData: FormData
): Promise<TechActionState> {
  const session = await auth();

  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER", "TECHNICIAN"].includes(session.user.role)) {
    return { error: "Unauthorized." };
  }

  const ticketId = formData.get("ticketId") as string;
  const status = formData.get("status") as string;
  const diagnosisNotes = formData.get("diagnosisNotes") as string;
  const estimatedCostRaw = formData.get("estimatedCost") as string;
  const timelineNote = formData.get("timelineNote") as string;

  if (!ticketId || !status) {
    return { error: "Missing required update fields." };
  }

  try {
    await db.$transaction(async (tx) => {
      const estimatedCost = estimatedCostRaw ? parseFloat(estimatedCostRaw) : undefined;

      await tx.repairTicket.update({
        where: { id: ticketId },
        data: {
          status,
          diagnosisNotes: diagnosisNotes || undefined,
          estimatedCost,
        },
      });

      await tx.ticketTimeline.create({
        data: {
          ticketId,
          status,
          notes: timelineNote || `Status updated to ${status}. Notes: ${diagnosisNotes || "None"}`,
          recordedBy: session.user.name || "Technician",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "TICKET_STATUS_UPDATED",
          metadata: `Updated ticket ${ticketId} to status ${status}`,
        },
      });
    });

    revalidatePath(`/tech/tickets/${ticketId}`);
    revalidatePath("/tech");
    return { success: true, message: "Repair status and diagnosis successfully saved." };
  } catch (err: any) {
    return { error: err.message || "Failed to update repair ticket." };
  }
}