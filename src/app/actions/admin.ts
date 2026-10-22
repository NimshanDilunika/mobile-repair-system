"use server";

import { auth } from "@/auth";
import { db } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";

export interface AdminUserActionState {
  success?: boolean;
  message?: string;
  error?: string;
}

// -------------------------------------------------------------
// 1. Executive Analytics Data Fetcher
// -------------------------------------------------------------
export async function getAdminAnalytics() {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  const [
    totalTickets,
    completedTickets,
    pendingTickets,
    invoices,
    branches,
    technicians,
    allTechTickets,
    recentAuditLogs,
    lowStockItems,
  ] = await Promise.all([
    // Total count of tickets
    db.repairTicket.count(),

    // Count of completed tickets
    db.repairTicket.count({ where: { status: "COMPLETED" } }),

    // Active in-progress repair tickets
    db.repairTicket.count({
      where: {
        status: {
          in: [
            "PENDING_DIAGNOSIS",
            "DIAGNOSED_AWAITING_APPROVAL",
            "REPAIR_IN_PROGRESS",
            "WAITING_FOR_PARTS",
          ],
        },
      },
    }),

    // Invoices marked PAID
    db.invoice.findMany({
      where: { paymentStatus: "PAID" },
      select: { totalAmount: true },
    }),

    // Service Center Branches overview
    db.serviceCenter.findMany({
      include: {
        _count: {
          select: { tickets: true, staff: true, inventory: true },
        },
      },
    }),

    // Technician users
    db.user.findMany({
      where: { role: "TECHNICIAN" },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),

    // Tickets assigned to any technician (schema-safe: avoids reverse relation issues)
    db.repairTicket.findMany({
      where: { technicianId: { not: null } },
      select: { technicianId: true, status: true },
    }),

    // Most recent audit trail entries
    db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    }),

    // Low stock spare parts alert
    db.inventoryItem.findMany({
      where: {
        stockQuantity: { lte: 5 },
      },
      include: { branch: { select: { name: true } } },
      take: 5,
    }),
  ]);

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

  return {
    totalTickets,
    completedTickets,
    pendingTickets,
    totalRevenue,
    branches,
    technicians: technicians.map((tech) => {
      const tickets = allTechTickets.filter((t) => t.technicianId === tech.id);
      return {
        id: tech.id,
        name: tech.name,
        email: tech.email,
        totalAssigned: tickets.length,
        completed: tickets.filter((t) => t.status === "COMPLETED").length,
        inProgress: tickets.filter((t) => t.status !== "COMPLETED").length,
      };
    }),
    recentAuditLogs,
    lowStockItems: lowStockItems.map((item) => ({
      id: item.id,
      partName: item.partName,
      partSku: item.partSku,
      stockQuantity: item.stockQuantity,
      branchName: item.branch.name,
    })),
  };
}

// -------------------------------------------------------------
// 2. Super Admin User Creation Action
// -------------------------------------------------------------
export async function createSystemUser(
  prevState: AdminUserActionState | null,
  formData: FormData
): Promise<AdminUserActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized: Super Admin access required." };
  }

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const branchId = (formData.get("branchId") as string) || null;
  const phoneNumber = (formData.get("phoneNumber") as string) || null;

  if (!name || !email || !password || !role) {
    return { error: "All required fields must be filled." };
  }

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "A user with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        branchId: role === "SUPER_ADMIN" ? null : branchId,
        phoneNumber,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "USER_CREATED",
        metadata: `Created user ${user.email} with role ${user.role}`,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, message: `User ${user.name} created successfully.` };
  } catch (err: any) {
    return { error: err.message || "Failed to create user." };
  }
}

// -------------------------------------------------------------
// 3. Super Admin User Update Action
// -------------------------------------------------------------
export async function updateSystemUser(
  prevState: AdminUserActionState | null,
  formData: FormData
): Promise<AdminUserActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized: Super Admin access required." };
  }

  const userId = formData.get("userId") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const branchId = (formData.get("branchId") as string) || null;
  const phoneNumber = (formData.get("phoneNumber") as string) || null;
  const newPassword = (formData.get("newPassword") as string)?.trim();

  if (!userId || !name || !role) {
    return { error: "Missing required update fields." };
  }

  try {
    const updateData: Record<string, any> = {
      name,
      role,
      branchId: role === "SUPER_ADMIN" ? null : branchId,
      phoneNumber,
    };

    if (newPassword && newPassword.length >= 6) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "USER_UPDATED",
        metadata: `Updated user profile/role for ${userId}`,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "User profile updated successfully." };
  } catch (err: any) {
    return { error: err.message || "Failed to update user." };
  }
}

// -------------------------------------------------------------
// 4. Super Admin Toggle User Status (Activate / Deactivate)
// -------------------------------------------------------------
export async function toggleUserStatus(userId: string, currentRole: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized.");
  }

  const isCurrentlyInactive = currentRole === "INACTIVE";
  const updatedRole = isCurrentlyInactive ? "TECHNICIAN" : "INACTIVE";

  await db.user.update({
    where: { id: userId },
    data: { role: updatedRole },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: isCurrentlyInactive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      metadata: `Changed user ${userId} status to ${updatedRole}`,
    },
  });

  revalidatePath("/admin/users");
}