import { auth } from "@/auth";
import { db } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user || !["SUPER_ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "invoices";
  const branchId = session.user.branchId;

  const BOM = "\uFEFF"; // Byte Order Mark for Excel UTF-8 compatibility

  // 1. Inventory & Stock Valuation Report
  if (type === "inventory") {
    const items = await db.inventoryItem.findMany({
      where: session.user.role === "SUPER_ADMIN" || !branchId ? {} : { branchId },
      include: { branch: true },
    });

    const headers = "SKU,Part Name,Branch,Cost Price (LKR),Selling Price (LKR),In Stock,Reorder Level,Total Stock Valuation (LKR)\n";
    const rows = items
      .map((i) => {
        const valuation = (Number(i.costPrice) * i.stockQuantity).toFixed(2);
        return `"${i.partSku}","${i.partName.replace(/"/g, '""')}","${i.branch.name}",${Number(i.costPrice).toFixed(2)},${Number(i.sellingPrice).toFixed(2)},${i.stockQuantity},${i.reorderLevel},${valuation}`;
      })
      .join("\n");

    return new NextResponse(BOM + headers + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inventory-valuation-${Date.now()}.csv"`,
      },
    });
  }

  // 2. Revenue, VAT & Discounts Report
  const invoices = await db.invoice.findMany({
    where: session.user.role === "SUPER_ADMIN" || !branchId ? {} : { ticket: { branchId } },
    include: {
      ticket: {
        include: { customer: true, branch: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = "Invoice ID,Ticket #,Customer,Contact,Branch,Subtotal (LKR),VAT/Tax (LKR),Discount (LKR),Final Net Total (LKR),Payment Status,Date\n";
  const rows = invoices
    .map((inv) => {
      const dateStr = new Date(inv.createdAt).toISOString().split("T")[0];
      return `"${inv.id}","${inv.ticket.ticketNumber}","${inv.ticket.customer.name}","${inv.ticket.customer.phoneNumber || ""}","${inv.ticket.branch.name}",${Number(inv.subTotal).toFixed(2)},${Number(inv.tax).toFixed(2)},${Number(inv.discount).toFixed(2)},${Number(inv.totalAmount).toFixed(2)},"${inv.paymentStatus}","${dateStr}"`;
    })
    .join("\n");

  return new NextResponse(BOM + headers + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="financial-revenue-report-${Date.now()}.csv"`,
    },
  });
}