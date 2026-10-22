"use server";

import { auth } from "@/auth";
import { db } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export interface ApprovalActionState {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function submitEstimateDecision(
  prevState: ApprovalActionState | null,
  formData: FormData
): Promise<ApprovalActionState> {
  const session = await auth();

  const ticketId = formData.get("ticketId") as string;
  const decision = formData.get("decision") as "APPROVE" | "REJECT";

  if (!ticketId || !["APPROVE", "REJECT"].includes(decision)) {
    return { error: "Invalid approval payload." };
  }

  try {
    const isApproved = decision === "APPROVE";
    const nextStatus = isApproved ? "REPAIR_IN_PROGRESS" : "CANCELLED";

    await db.$transaction(async (tx) => {
      const ticket = await tx.repairTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error("Repair ticket not found.");
      }

      // Verify authorization if user is logged in as a customer
      if (session?.user?.role === "CUSTOMER" && ticket.customerId !== session.user.id) {
        throw new Error("Unauthorized to approve this repair ticket.");
      }

      await tx.repairTicket.update({
        where: { id: ticketId },
        data: {
          isApproved,
          approvedAt: isApproved ? new Date() : null,
          status: nextStatus,
        },
      });

      await tx.ticketTimeline.create({
        data: {
          ticketId,
          status: nextStatus,
          notes: isApproved
            ? "Customer approved quotation. Repair officially queued for work."
            : "Customer rejected estimated quotation. Repair cancelled.",
          recordedBy: session?.user?.name || "Customer",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session?.user?.id || ticket.customerId,
          action: isApproved ? "ESTIMATE_APPROVED" : "ESTIMATE_REJECTED",
          metadata: `Customer decided ${decision} on ticket ${ticket.ticketNumber}`,
        },
      });
    });

    revalidatePath(`/portal`);
    revalidatePath(`/track/${ticketId}`);
    return {
      success: true,
      message: isApproved
        ? "Quotation approved! Our technicians will begin repairing your device."
        : "Estimate declined. Repair status updated to cancelled.",
    };
  } catch (err: any) {
    return { error: err.message || "Failed to submit decision." };
  }
}