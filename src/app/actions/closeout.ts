"use server";

import { auth } from "@/auth";
import { db } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export interface CloseoutState {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function submitDailyCloseout(
  prevState: CloseoutState | null,
  formData: FormData
): Promise<CloseoutState> {
  const session = await auth();

  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
    return { error: "Unauthorized: Manager permissions required." };
  }

  const branchId = session.user.branchId;
  if (!branchId) {
    return { error: "Manager is not linked to any active service center branch." };
  }

  const actualCashTally = parseFloat(formData.get("actualCashTally") as string) || 0;
  const cardTotal = parseFloat(formData.get("cardTotal") as string) || 0;
  const bankTransferTotal = parseFloat(formData.get("bankTransferTotal") as string) || 0;
  const notes = (formData.get("notes") as string)?.trim() || "";

  // 1. Calculate system invoices paid today for this branch
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayInvoices = await db.invoice.findMany({
    where: {
      paymentStatus: "PAID",
      createdAt: { gte: startOfDay },
      ticket: { branchId },
    },
  });

  const systemCashTotal = todayInvoices.reduce(
    (sum, inv) => sum + Number(inv.totalAmount),
    0
  );

  const cashDiscrepancy = actualCashTally - systemCashTotal;
  let status = "BALANCED";
  if (cashDiscrepancy < -50) status = "SHORTAGE";
  if (cashDiscrepancy > 50) status = "SURPLUS";

  try {
    await db.$transaction(async (tx) => {
      const closeout = await tx.dailyCashCloseout.create({
        data: {
          branchId,
          closedById: session.user.id,
          systemCashTotal,
          actualCashTally,
          cashDiscrepancy,
          cardTotal,
          bankTransferTotal,
          notes,
          status,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CASH_DRAWER_CLOSEOUT",
          metadata: `Shift closeout by ${session.user.name}. System: LKR ${systemCashTotal}, Counted: LKR ${actualCashTally}, Discrepancy: LKR ${cashDiscrepancy} (${status})`,
        },
      });

      return closeout;
    });

    revalidatePath("/manager/closeout");
    return {
      success: true,
      message: `Closeout registered. Status: ${status} (Discrepancy: LKR ${cashDiscrepancy.toFixed(2)})`,
    };
  } catch (err: any) {
    return { error: err.message || "Failed to record cash reconciliation." };
  }
}
