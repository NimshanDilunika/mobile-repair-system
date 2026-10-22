import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Clearing existing records...");
  await prisma.auditLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.partUsage.deleteMany();
  await prisma.ticketTimeline.deleteMany();
  await prisma.repairTicket.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceCenter.deleteMany();

  console.log("🏢 Seeding Service Center branches...");
  const colomboBranch = await prisma.serviceCenter.create({
    data: {
      name: "Colombo Central Hub",
      code: "CMB-001",
      address: "123 Galle Road, Colombo 03",
      contactNo: "+94112345678",
    },
  });

  const kandyBranch = await prisma.serviceCenter.create({
    data: {
      name: "Kandy Service Center",
      code: "KDY-002",
      address: "45 Peradeniya Road, Kandy",
      contactNo: "+94812345678",
    },
  });

  console.log("👥 Seeding Users with hashed passwords...");
  const defaultPassword = await bcrypt.hash("Password@123", 10);

  // 1. Super Admin
  const admin = await prisma.user.create({
    data: {
      name: "System SuperAdmin",
      email: "admin@repairsystem.com",
      passwordHash: defaultPassword,
      phoneNumber: "+94770000001",
      role: "SUPER_ADMIN",
    },
  });

  // 2. Branch Manager (Colombo)
  const manager = await prisma.user.create({
    data: {
      name: "Colombo Manager",
      email: "manager.cmb@repairsystem.com",
      passwordHash: defaultPassword,
      phoneNumber: "+94770000002",
      role: "BRANCH_MANAGER",
      branchId: colomboBranch.id,
    },
  });

  // 3. Technician (Colombo)
  const technician = await prisma.user.create({
    data: {
      name: "Nimal Perera (Senior Tech)",
      email: "tech1.cmb@repairsystem.com",
      passwordHash: defaultPassword,
      phoneNumber: "+94770000003",
      role: "TECHNICIAN",
      branchId: colomboBranch.id,
    },
  });

  // 4. Customer
  const customer = await prisma.user.create({
    data: {
      name: "Kamal Silva",
      email: "customer@example.com",
      passwordHash: defaultPassword,
      phoneNumber: "+94770000004",
      role: "CUSTOMER",
    },
  });

  console.log("📦 Seeding Inventory items...");
  const screenPart = await prisma.inventoryItem.create({
    data: {
      branchId: colomboBranch.id,
      partName: "iPhone 13 OLED Display Panel",
      partSku: "DISP-IP13-OEM",
      costPrice: 18000.0,
      sellingPrice: 28500.0,
      stockQuantity: 12,
      reorderLevel: 3,
    },
  });

  await prisma.inventoryItem.create({
    data: {
      branchId: colomboBranch.id,
      partName: "Samsung Galaxy S22 Battery 3700mAh",
      partSku: "BATT-SGS22-ORIG",
      costPrice: 6500.0,
      sellingPrice: 11500.0,
      stockQuantity: 8,
      reorderLevel: 2,
    },
  });

  console.log("🎫 Seeding Initial Sample Repair Ticket...");
  const ticket = await prisma.repairTicket.create({
    data: {
      ticketNumber: "TICK-2026-0001",
      customerId: customer.id,
      branchId: colomboBranch.id,
      technicianId: technician.id,
      brand: "Apple",
      deviceModel: "iPhone 13",
      imeiOrSerial: "358912345678901",
      passcodeProvided: "1234",
      conditionNotes: "Cracked front glass, minor scuffs on rear aluminum chassis.",
      intakeChecklist: JSON.stringify({
        powersOn: true,
        touchFunctional: false,
        camerasFunctional: true,
        faceIdWorking: true,
        waterDamageIndicator: false,
      }),
      status: "REPAIR_IN_PROGRESS",
      priority: "HIGH",
      reportedIssue: "Screen shattered after accidental drop. Display flickers green.",
      diagnosisNotes: "Display layer damaged. Digitizer failing. Requires full display assembly replacement.",
      estimatedCost: 31500.0,
      isApproved: true,
      approvedAt: new Date(),
    },
  });

  // Part Usage
  await prisma.partUsage.create({
    data: {
      ticketId: ticket.id,
      partId: screenPart.id,
      quantity: 1,
      unitPrice: 28500.0,
    },
  });

  // Timeline
  await prisma.ticketTimeline.create({
    data: {
      ticketId: ticket.id,
      status: "REPAIR_IN_PROGRESS",
      notes: "Customer approved estimate. Replacement OLED screen allocated from Colombo inventory.",
      recordedBy: manager.name,
    },
  });

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "INITIAL_DATABASE_SEED",
      metadata: "Database initialized with core entities and test repair ticket.",
    },
  });

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });