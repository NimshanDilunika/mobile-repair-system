"use server";

import { auth } from "@/auth";
import { db } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export interface InventoryActionState {
  success?: boolean;
  message?: string;
  error?: string;
}

// 3. Allocate Replacement Part to Repair Ticket (Used by TechPartsSection)
export async function attachPartToTicket(
  prevState: InventoryActionState | null,
  formData: FormData
): Promise<InventoryActionState> {
  const session = await auth();

  // Role Guard: Technicians, Branch Managers, and Admins can allocate parts
  if (
    !session?.user ||
    !["TECHNICIAN", "BRANCH_MANAGER", "SUPER_ADMIN"].includes(session.user.role)
  ) {
    return { error: "Unauthorized: Insufficient permissions to allocate parts." };
  }

  const ticketId = formData.get("ticketId") as string;
  const partId = formData.get("partId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10) || 1;

  if (!ticketId || !partId || quantity <= 0) {
    return { error: "Please select a valid replacement part and specify quantity." };
  }

  try {
    await db.$transaction(async (tx) => {
      // 1. Fetch part and check current stock
      const part = await tx.inventoryItem.findUnique({
        where: { id: partId },
      });

      if (!part) {
        throw new Error("Inventory part not found.");
      }

      if (part.stockQuantity < quantity) {
        throw new Error(
          `Insufficient stock! Only ${part.stockQuantity} item(s) available.`
        );
      }

      // 2. Decrement inventory stock
      await tx.inventoryItem.update({
        where: { id: partId },
        data: {
          stockQuantity: {
            decrement: quantity,
          },
        },
      });

      // 3. Create PartUsage record attached to this repair ticket
      await tx.partUsage.create({
        data: {
          ticketId,
          partId,
          quantity,
          unitPrice: part.sellingPrice,
        },
      });

      // 4. Record history/timeline entry
      await tx.ticketTimeline.create({
        data: {
          ticketId,
          status: "IN_REPAIR",
          notes: `Allocated part: ${part.partName} (${quantity}x @ $${Number(part.sellingPrice).toFixed(2)})`,
          recordedBy: session.user.name || "Technician",
        },
      });

      // 5. Audit Log entry
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PART_ALLOCATED",
          metadata: `Allocated ${quantity}x ${part.partName} (${part.partSku}) to ticket`,
        },
      });
    });

    revalidatePath(`/tech/tickets/${ticketId}`);
    revalidatePath("/manager/tickets");
    revalidatePath("/manager/inventory");

    return { success: true, message: "Replacement part allocated successfully." };
  } catch (err: any) {
    return { error: err.message || "Failed to allocate part." };
  }
}



// In src/app/actions/inventory.ts

export async function addInventoryPart(
  prevState: InventoryActionState | null,
  formData: FormData
): Promise<InventoryActionState> {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
    return { error: "Unauthorized: Insufficient permissions." };
  }

  const partName = (formData.get("partName") as string)?.trim();
  const partSku = (formData.get("partSku") as string)?.trim().toUpperCase();
  const costPrice = parseFloat(formData.get("costPrice") as string);
  const sellingPrice = parseFloat(formData.get("sellingPrice") as string);
  const stockQuantity = parseInt(formData.get("stockQuantity") as string, 10);
  const reorderLevel = parseInt(formData.get("reorderLevel") as string, 10) || 5;

  let branchId = formData.get("branchId") as string;
  if (session.user.role === "BRANCH_MANAGER") {
    branchId = session.user.branchId!;
  }

  if (!partName || !partSku || isNaN(costPrice) || isNaN(sellingPrice) || isNaN(stockQuantity) || !branchId) {
    return { error: "All fields marked with an asterisk (*) are mandatory." };
  }

  try {
    const existing = await db.inventoryItem.findUnique({
      where: { partSku },
    });

    if (existing) {
      return { error: `SKU '${partSku}' already exists in the system.` };
    }

    await db.inventoryItem.create({
      data: {
        partName,
        partSku,
        costPrice,
        sellingPrice,
        stockQuantity,
        reorderLevel,
        branchId,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "INVENTORY_CREATED",
        metadata: `Added part ${partName} (${partSku}) - Qty: ${stockQuantity}`,
      },
    });

    revalidatePath("/manager/inventory");
    revalidatePath("/admin/inventory");
    return { success: true, message: `Part '${partName}' registered successfully.` };
  } catch (err: any) {
    return { error: err.message || "Failed to add inventory part." };
  }
}


// 2. Adjust Stock Quantity & Selling Price
export async function updatePartStock(
  prevState: InventoryActionState | null,
  formData: FormData
): Promise<InventoryActionState> {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
    return { error: "Unauthorized access." };
  }

  const partId = formData.get("partId") as string;
  const newStock = parseInt(formData.get("stockQuantity") as string, 10);
  const newPrice = parseFloat(formData.get("sellingPrice") as string);

  if (!partId || isNaN(newStock) || isNaN(newPrice)) {
    return { error: "Invalid part stock or price data." };
  }

  try {
    const part = await db.inventoryItem.findUnique({
      where: { id: partId },
    });

    if (!part) {
      return { error: "Inventory item not found." };
    }

    // Role Guard: Manager cannot edit stock of another branch
    if (session.user.role === "BRANCH_MANAGER" && part.branchId !== session.user.branchId) {
      return { error: "You are not authorized to adjust stock for another branch." };
    }

    await db.inventoryItem.update({
      where: { id: partId },
      data: {
        stockQuantity: newStock,
        sellingPrice: newPrice,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "INVENTORY_UPDATED",
        metadata: `Updated SKU ${part.partSku}: Stock -> ${newStock}, Price -> ${newPrice}`,
      },
    });

    revalidatePath("/manager/inventory");
    revalidatePath("/admin/inventory");
    return { success: true, message: "Inventory stock updated successfully." };
  } catch (err: any) {
    return { error: err.message || "Failed to update stock." };
  }
}