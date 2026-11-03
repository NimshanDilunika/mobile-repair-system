# FixDesk – Enterprise Mobile Device Repair & Service Management System

> **Custody Chain Documentation · Shift Cash Reconciliation · Dynamic Invoicing · Multi-Branch RBAC**
>
> Built with Next.js 15 (App Router) · React 19 · TypeScript · Prisma ORM · SQLite / PostgreSQL · Tailwind CSS · Auth.js (NextAuth v5)

## Table of Contents

 1. [Project Description](#1-project-description)

 2. [System Architecture & Design](#2-system-architecture--design)

 3. [Technologies Used](#3-technologies-used)

 4. [Installation Instructions](#4-installation-instructions)

 5. [Environment Variables & Configuration](#5-environment-variables--configuration)

 6. [Usage Instructions](#6-usage-instructions)

 7. [API & Server Action Endpoints](#7-api--server-action-endpoints)

 8. [Project Structure](#8-project-structure)

 9. [Features & Role Permissions Matrix](#9-features--role-permissions-matrix)

10. [Database Schema Specification](#10-database-schema-specification)

11. [Production Deployment & Hardening](#11-production-deployment--hardening)

12. [Contact Information & Licence](#12-contact-information--licence)

## 1. Project Description

### Overview

**FixDesk** is an enterprise-grade mobile device service and repair lifecycle management platform. Designed for multi-branch retail service hubs, authorized device refurbishing labs, and franchise electronics repair stores, it unifies device intake, physical condition documentation, hardware fault diagnosis, spare parts inventory allocation, dynamic invoice settlement, end-of-shift register reconciliation, and live customer self-service tracking into a single web application.

### Problem Statement

Mobile device repair businesses and multi-branch technical service networks encounter several critical operational risks during daily store floor activities:

* **Customer Damage Disputes & False Claims:** Without verified intake evidence and documented pre-service condition checks, repair centers face false customer claims regarding scratches, frame bends, dead pixels, or hairline cracks claimed to have happened while in the shop's custody.

* **Cash Drawer Imbalances & Register Leakage:** Unrecorded payments, unaccounted petty cash payments for courier or cleaning supplies, and unverified card/bank transactions create constant discrepancies between physical register drawers and computerized books.

* **Technician Idle Time & Quote Bottlenecks:** Lack of direct communication channels between workshop technicians and customer devices leads to stalled repairs while waiting for phone approvals on repair quotes.

* **Reporting & Multi-Branch Auditing Friction:** Shop owners and regional managers struggle to reconcile stock levels across branches, track VAT/tax obligations, or audit staff actions across multiple service locations.

### Key Objectives

* **Tamper-Proof Custody Documentation:** Capture photographic condition evidence and an inspection checklist directly upon check-in, linking photos directly to the repair record.

* **Shift Reconciliation (Drawer Closeout):** Enforce daily shift balancing by requiring managers to declare physical cash, card slips, and bank transfer receipts, flagging shortages or surpluses against software invoices.

* **Fine-Grained Role-Based Access Control (RBAC):** Restrict system operations across `SUPER_ADMIN`, `BRANCH_MANAGER`, `TECHNICIAN`, and `CUSTOMER` roles using Next.js Server Actions and session authentication.

* **Dynamic Invoicing & Exportable Accounting:** Automate line-item calculations for parts, labor, and taxes with print-optimized receipt rendering and RFC-4180/Excel-compliant CSV exports.

## 2. System Architecture & Design

### Application Topology

The platform is designed around the Next.js App Router using React Server Components (RSC) for zero-client-bundle data fetching, React Server Actions for transactional mutations, and API route handlers for RFC-4180 streaming reports and multipart uploads.

```
+----------------------------------------------------------------------------------------------------+
|                                             CLIENT TIER                                            |
|   Responsive Web Dashboard (Desktop/Tablet) · Mobile POS Camera Capture · 80mm Thermal Printer    |
+--------------------------------------------------┬-------------------------------------------------+
                                                   │ HTTPS / RSC / Form Actions
                                                   ▼
+----------------------------------------------------------------------------------------------------+
|                                          APPLICATION TIER                                          |
|                                     Next.js (App Router Engine)                                    |
|                                                                                                    |
|  ┌───────────────────────────────────┐               ┌──────────────────────────────────────────┐  |
|  │          Server Actions           │               │              API Route Tier              │  |
|  │  (Ticket Lifecycle, Invoicing,    │               │  (RFC-4180 CSV Exporters, Multipart File │  |
|  │   Closeout Mutations, Auditing)   │               │   Streaming Upload Handlers)             │  |
|  └─────────────────┬─────────────────┘               └────────────────────┬─────────────────────┘  |
|                    │                                                      │                        |
|                    ▼                                                      ▼                        |
|  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐  |
|  │                         Auth.js (v5) Session & RBAC Guard Tier                               │  |
|  └───────────────────────────────────────────────┬──────────────────────────────────────────────┘  |
|                                                  │                                                 |
|                                                  ▼                                                 |
|  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐  |
|  │                            Prisma Data Access & Transaction Layer                            │  |
|  └───────────────────────────────────────────────┬──────────────────────────────────────────────┘  |
+--------------------------------------------------┼-------------------------------------------------+
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         ▼                                                   ▼
+--------------------------------------------------+   +---------------------------------------------+
|                 PERSISTENCE TIER                 |   |                ASSET STORAGE                |
|        SQLite (Local / Embedded Dev Engine)      |   |       Local Static Storage (/public/uploads) │
|        PostgreSQL (Multi-Branch Production Ready)|   |       * Cloudflare R2 / S3 Extensible       |
+--------------------------------------------------+   +---------------------------------------------+

```

### Core Relational Entities

```
                 ┌──────────────────────────────────────────────────┐
                 │                  ServiceCenter                   │
                 ├──────────────────────────────────────────────────┤
                 │ id (PK)                                          │
                 │ name, code, address, contactNo                   │
                 └───────┬──────────────────┬─────────────────┬─────┘
                         │ 1                │ 1               │ 1
                         │                  │                 │
                         │ *                │ *               │ *
                         ▼                  │                 ▼
              ┌─────────────────────┐       │     ┌──────────────────────┐
              │        User         │       │     │    InventoryItem     │
              ├─────────────────────┤       │     ├──────────────────────┤
              │ id (PK)             │       │     │ id (PK)              │
              │ email (UQ)          │       │     │ branchId (FK)        │
              │ role, branchId (FK) │       │     │ partSku, partName    │
              └───────┬─────────────┘       │     │ costPrice            │
                      │ 1                   │     │ sellingPrice         │
                      │                     │     │ stockQuantity        │
                      │ * (customerId)      │     └──────────┬───────────┘
                      ▼                     │                │ 1
           ┌────────────────────────┐       │                │
           │      RepairTicket      │◄──────┘                │ *
           ├────────────────────────┤                        ▼
           │ id (PK)                │              ┌────────────────────┐
           │ ticketNumber (UQ)      │              │     PartUsage      │
           │ branchId (FK)          │              ├────────────────────┤
           │ customerId (FK)        │              │ id (PK)            │
           │ technicianId (FK, opt) │              │ ticketId (FK) ─────┼──┐
           │ brand, deviceModel     │              │ partId (FK)        │  │
           │ imeiOrSerial           │              │ quantity, unitPrice│  │
           │ intakeChecklist (JSON) │              └────────────────────┘  │
           │ devicePhotos (JSON)    │                                      │
           │ status, priority       │                                      │
           └──────┬────────────┬────┘                                      │
                  │ 1          │ 1                                         │
                  │            │                                           │
                  │ *          │ 1                                         │
                  ▼            ▼                                           │
  ┌───────────────────────┐  ┌────────────────────────────────────┐        │
  │    TicketTimeline     │  │              Invoice               │        │
  ├───────────────────────┤  ├────────────────────────────────────┤        │
  │ id (PK)               │  │ id (PK)                            │        │
  │ ticketId (FK)         │  │ ticketId (FK, UQ) ◄────────────────┼────────┘
  │ status, notes         │  │ subTotal, tax, discount            │
  │ recordedBy            │  │ totalAmount, paymentStatus         │
  └───────────────────────┘  └────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │                        DailyCashCloseout                        │
  ├─────────────────────────────────────────────────────────────────┤
  │ id (PK)                                                         │
  │ branchId (FK) ────────► ServiceCenter.id                        │
  │ closedById (FK) ──────► User.id                                 │
  │ closeDate, systemCashTotal, actualCashTally, cashDiscrepancy    │
  │ cardTotal, bankTransferTotal, status (BALANCED|SHORTAGE|SURPLUS)│
  └─────────────────────────────────────────────────────────────────┘

```

## 3. Technologies Used

| Layer | Technology | Version | Purpose in System | 
| ----- | ----- | ----- | ----- | 
| **Core Framework** | Next.js (App Router, Turbopack) | 15.0+ | Server-side rendering (SSR), Server Actions, and file streaming route handlers | 
| **User Interface** | React | 19.0+ | Reactive forms, modern state hooks (`useActionState`, `useState`) | 
| **Type Safety** | TypeScript | 5.0+ | End-to-end static types spanning Prisma queries, UI forms, and actions | 
| **Data Access** | Prisma ORM | 5.x / 6.x | Schema migrations, type-safe queries, and transactional updates | 
| **Database** | SQLite (Dev) / PostgreSQL (Prod) | 3.x / 16+ | Embedded local database in development; multi-branch relational store in production | 
| **CSS & Design** | Tailwind CSS | 3.4+ | Utility styling, responsive cards, and receipt print rules (`@media print`) | 
| **Auth & Security** | Auth.js (NextAuth) | 5.0-beta | Session-based authentication, password hashing, and role checks | 
| **File Handling** | Node.js File System (`fs/promises`) | Built-in | Saving uploaded device condition photos to `/public/uploads/` | 
| **Data Export** | Native Web Streams | Built-in | Streaming CSV files with Excel-compatible UTF-8 Byte Order Marks (`\uFEFF`) | 

## 4. Installation Instructions

### Prerequisites

* [Node.js](https://nodejs.org/) (Version 18.18+ or 20.x LTS)

* `npm` or `pnpm`

* Git

### 1. Clone the Repository

```
git clone https://github.com/NimshanDilunika/mobile-repair-system.git
cd mobile-repair-system

```

### 2. Install Dependencies

```
npm install

```

### 3. Setup Local Environment Variables

Create your `.env` file from the example:

```
cp .env.example .env

```

Set your development configuration values:

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="f9b4c0926d83a1d95738872a9e3a6828b6d8a39b20e176b6b7cb85d8e78a6321"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"

```

### 4. Initialize Database & Run Migrations

```
npx prisma generate
npx prisma db push

```

### 5. Launch the Development Server

```
npm run dev

```

Open your browser to:

* **Application Portal:** `http://localhost:3000`

* **Customer Tracker:** `http://localhost:3000/track`

* **Manager Operations:** `http://localhost:3000/manager`

* **Shift Drawer Closeout:** `http://localhost:3000/manager/closeout`

## 5. Environment Variables & Configuration

| Variable Name | Required | Default / Format | Description | 
| ----- | ----- | ----- | ----- | 
| `DATABASE_URL` | Yes | `file:./dev.db` | Connection string for SQLite or PostgreSQL database | 
| `AUTH_SECRET` | Yes | 32-byte string | Cryptographic secret for signing session tokens and cookies | 
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | Canonical origin URL for authentication callbacks | 
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`) | 

## 6. Usage Instructions

### 1. New Device Intake & Condition Evidence

1. Navigate to `/manager/tickets/new`.

2. Enter the customer's name, email, and phone number (existing customers are looked up automatically).

3. Record device specifications: Brand, Model, Serial/IMEI, and Passcode/PIN.

4. Complete the 5-point physical condition checklist.

5. Capture or select up to 4 device condition photos using `<IntakePhotoUploader>`.

6. Click **"Generate Repair Ticket"**. The system creates the ticket, records the photo URLs, and generates timeline and audit entries.

### 2. Diagnosis & Technician Allocation

1. Open the Repair Ticket Queue at `/manager/tickets`.

2. Assign the ticket to an active technician.

3. The technician logs diagnosis findings, selects needed spare parts (updating inventory counts), and provides an estimated cost.

4. Ticket status moves to `DIAGNOSED_AWAITING_APPROVAL`.

### 3. Customer Quote Approval

1. Customers visit `/track` and search by their Ticket Number or IMEI.

2. The page displays the diagnosis notes, itemized parts, and total estimate.

3. The customer clicks **"Approve Repair"** or **"Decline Repair"**.

4. When approved, the ticket status moves to `IN_PROGRESS`.

### 4. Billing, Settle & Thermal Receipt Printing

1. Once marked `COMPLETED`, open `/manager/invoices/new/[ticketId]`.

2. Review aggregated line items (Parts + Labor - Discounts + Tax).

3. Select the payment method (`CASH`, `CARD`, `BANK_TRANSFER`) and click **"Settle Invoice"**.

4. Click **"Print Customer Receipt"** to open the browser print dialog, styled for receipt output.

### 5. Daily Shift Drawer Closeout

1. At the end of each shift, open `/manager/closeout`.

2. Review the **"Expected Drawer Revenue"** calculated by the system from today's paid invoices.

3. Count the physical cash in the drawer and enter the total into **"Physical Cash Tally (LKR)"**.

4. Enter card machine settlement totals and direct bank transfers.

5. The form calculates the discrepancy (`BALANCED`, `SHORTAGE`, or `SURPLUS`).

6. Enter shift notes and click **"Submit Shift Closeout"**.

### 6. Export Accounting Reports

1. From `/manager` or `/admin`, view the **Export Accounting Reports** panel.

2. Click **"Export Revenue & VAT (CSV)"** to download itemized invoice ledgers.

3. Click **"Export Stock Valuation (CSV)"** to download current inventory counts and valuation totals.

## 7. API & Server Action Endpoints

Base URL: `http://localhost:3000`

### Server Actions (Mutations)

| Action Function | File Location | Invocation Context | Permitted Roles | 
| ----- | ----- | ----- | ----- | 
| `createRepairTicket` | `src/app/actions/ticket.ts` | Intake registration form | `SUPER_ADMIN`, `BRANCH_MANAGER` | 
| `editTicketByManager` | `src/app/actions/ticket.ts` | Edit device specs & reassign | `SUPER_ADMIN`, `BRANCH_MANAGER` | 
| `cancelTicketByManager` | `src/app/actions/ticket.ts` | Cancel ticket with reason | `SUPER_ADMIN`, `BRANCH_MANAGER` | 
| `submitDailyCloseout` | `src/app/actions/closeout.ts` | Shift drawer balancing | `SUPER_ADMIN`, `BRANCH_MANAGER` | 
| `createTicketInvoice` | `src/app/actions/invoices.ts` | Billing settlement & print | `SUPER_ADMIN`, `BRANCH_MANAGER` | 

### Route Handlers (REST & Web Streams)

| HTTP Method | Route URL | Purpose & Output | Access Control | 
| ----- | ----- | ----- | ----- | 
| `POST` | `/api/upload` | Multipart form intake photo uploads; saves to `/public/uploads/` | Authenticated Staff | 
| `GET` | `/api/reports/export?type=invoices` | Streams complete Revenue, VAT, Discount, and Customer ledger as RFC-4180 CSV | `SUPER_ADMIN`, `BRANCH_MANAGER` | 
| `GET` | `/api/reports/export?type=inventory` | Streams spare parts stock counts, cost/selling values, and valuations as RFC-4180 CSV | `SUPER_ADMIN`, `BRANCH_MANAGER` | 

## 8. Project Structure

```
mobile-repair-system/
├── prisma/
│   ├── schema.prisma                  # Prisma relational schema, indexes, and relations
│   └── dev.db                         # Local SQLite database (ignored by Git)
├── public/
│   └── uploads/                       # Persisted device intake condition photos
├── src/
│   ├── app/
│   │   ├── actions/                   # Next.js Server Actions (Mutations & Business Logic)
│   │   │   ├── auth.ts                # Credential authentication and sign-out logic
│   │   │   ├── closeout.ts            # Cash drawer reconciliation calculations & transactions
│   │   │   ├── invoices.ts            # Invoice calculation, labor/tax additions, settlement
│   │   │   └── ticket.ts              # Ticket intake, checklist capture, status updates, timeline
│   │   ├── admin/                     # System-Wide Super Administrator Portal
│   │   │   ├── page.tsx               # High-level overview, user statistics, scrollable audit log
│   │   │   └── users/                 # System user creation, credential updates, role assignments
│   │   ├── api/                       # Next.js Route Handlers
│   │   │   ├── reports/export/        # Universal CSV export engine with Excel UTF-8 BOM
│   │   │   └── upload/                # Multipart form photo upload handler with unique hashing
│   │   ├── manager/                   # Branch Operations Management Portal
│   │   │   ├── closeout/              # End-of-shift cash drawer balancing UI & past closeouts
│   │   │   │   ├── page.tsx           # Server view calculating daily expected revenue
│   │   │   │   └── CloseoutForm.tsx   # Interactive client component for real-time discrepancy math
│   │   ├── inventory/                 # Branch inventory catalog, reorder levels, stock adjustments
│   │   ├── invoices/                  # Customer billing, settled receipts, and payment logs
│   │   │   └── new/[ticketId]/        # Print-optimized invoice generation
│   │   ├── tickets/                   # Intake ticket queue and management workflows
│   │   │   ├── new/                   # New device intake form with checklists & camera capture
│   │   │   └── page.tsx               # Paginated and status-filtered ticket queue
│   │   └── page.tsx                   # Manager Operations Dashboard with 4-card quick grid
│   ├── tech/                          # Technician Workbench & Diagnostic Portal
│   │   └── page.tsx                   # Assigned repair queue, parts consumption, diagnostic logs
│   ├── track/                         # Public Real-Time Device Tracking
│   │   └── page.tsx                   # Tracking search by Ticket ID / IMEI with approval triggers
│   ├── layout.tsx                     # Root layout styling and theme definitions
│   └── page.tsx                       # System landing / login entry point
├── components/                        # Reusable Client & Server Components
│   ├── CustomerApprovalForm.tsx       # Digital customer quote approval widget
│   ├── ExportReportsBar.tsx           # Standardized financial and valuation CSV export buttons
│   ├── IntakePhotoUploader.tsx        # Multi-photo intake capture widget with local preview
│   ├── InvoiceForm.tsx                # Line-item calculation billing form with print triggers
│   └── TopRibbon.tsx                  # Universal authenticated header with branch/role context
├── lib/
│   └── prisma.ts                      # Global Prisma client singleton instance
├── types/
│   └── index.ts                       # Application domain types and shared interfaces
└── auth.ts                            # Auth.js configuration, callbacks, session security

```

## 9. Features & Role Permissions Matrix

### Feature Set

* **Intake Damage Photo Verification:** Snap and upload up to 4 high-resolution evidence images per device during intake, storing them alongside check-in notes to avoid post-service condition disputes.

* **Pre-Service Inspection Checklist:** 5-point hardware functional test (Power, Touch Screen, Cameras, Biometrics, Liquid Indicator) recorded as immutable JSON on the ticket.

* **End-of-Shift Drawer Balancing:** Compares physical register cash counts against system-recorded payments to calculate and flag drawer shortages or surpluses.

* **Dynamic Billing & Invoicing:** Combines parts consumption from inventory with labor charges and customizable discounts, generating print-ready receipts formatted for browser print rendering.

* **Live Public Ticket Tracking:** Customers search by Ticket Number or IMEI to monitor timeline progression, review diagnostic findings, and digitally approve cost estimates.

* **Scrollable Audit Trail:** System-wide stream tracking security and administrative actions (`TICKET_CREATED`, `CASH_DRAWER_CLOSEOUT`, `INVOICE_GENERATED`) with timestamps, actor IDs, and metadata.

* **Excel-Compatible CSV Reporting:** One-click streaming exports for Revenue & VAT as well as Stock Valuations, pre-configured with UTF-8 Byte Order Marks (`\uFEFF`) for spreadsheet compatibility.

### Role Permissions Matrix

| Functional Action | Super Admin | Branch Manager | Technician | Customer | 
| ----- | ----- | ----- | ----- | ----- | 
| Create/Edit System Staff & Change Roles | Full Access | No | No | No | 
| Create Service Center Branches | Full Access | No | No | No | 
| Register Device Intake & Upload Photos | Full Access | Full Access | No | No | 
| Edit Device Intake Specifications | Full Access | Full Access | No | No | 
| Cancel Repair Tickets | Full Access | Full Access | No | No | 
| Perform Diagnosis & Allocate Parts | Full Access | Full Access | Full Access | No | 
| Settle Invoices & Print Receipts | Full Access | Full Access | No | No | 
| Submit Shift Drawer Closeout | Full Access | Full Access | No | No | 
| Adjust Inventory Quantities & Unit Costs | Full Access | Full Access | View Only | No | 
| Export Financial & Stock Valuations | Full Access | Full Access | No | No | 
| View System-Wide Audit Log Stream | Full Access | Branch Only | No | No | 
| Track Repair Timeline via Public Portal | Full Access | Full Access | Full Access | Query Only | 
| Digitally Approve / Reject Repair Quotes | Full Access | Full Access | No | Own Ticket | 

## 10. Database Schema Specification

Below is the complete Prisma data schema definition:

```
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model ServiceCenter {
  id             String              @id @default(cuid())
  name           String
  code           String              @unique
  address        String
  contactNo      String
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  users          User[]
  tickets        RepairTicket[]
  inventory      InventoryItem[]
  closeouts      DailyCashCloseout[]
}

model User {
  id             String              @id @default(cuid())
  name           String
  email          String              @unique
  passwordHash   String
  role           String              @default("CUSTOMER") // SUPER_ADMIN | BRANCH_MANAGER | TECHNICIAN | CUSTOMER
  phoneNumber    String?
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  branchId       String?
  branch         ServiceCenter?      @relation(fields: [branchId], references: [id], onDelete: SetNull)

  assignedTickets RepairTicket[]     @relation("TechTickets")
  customerTickets RepairTicket[]     @relation("CustomerTickets")
  closeouts       DailyCashCloseout[]
  auditLogs       AuditLog[]
}

model RepairTicket {
  id                String          @id @default(cuid())
  ticketNumber      String          @unique
  brand             String
  deviceModel       String
  imeiOrSerial      String
  passcodeProvided  String?
  priority          String          @default("MEDIUM") // LOW | MEDIUM | HIGH | URGENT
  reportedIssue     String
  diagnosisNotes    String?
  estimatedCost     Decimal?
  isApproved        Boolean?
  intakeChecklist   String          @default("{}") // JSON string of checklist flags
  devicePhotos      String          @default("[]") // JSON string of photo URLs
  status            String          @default("PENDING_DIAGNOSIS")

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  branchId          String
  branch            ServiceCenter   @relation(fields: [branchId], references: [id])

  customerId        String
  customer          User            @relation("CustomerTickets", fields: [customerId], references: [id])

  technicianId      String?
  technician        User?           @relation("TechTickets", fields: [technicianId], references: [id])

  timeline          TicketTimeline[]
  partsUsed         PartUsage[]
  invoice           Invoice?
}

model TicketTimeline {
  id          String        @id @default(cuid())
  ticketId    String
  ticket      RepairTicket  @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  status      String
  notes       String
  recordedBy  String
  createdAt   DateTime      @default(now())
}

model InventoryItem {
  id             String        @id @default(cuid())
  branchId       String
  branch         ServiceCenter @relation(fields: [branchId], references: [id], onDelete: Cascade)
  partSku        String
  partName       String
  costPrice      Decimal
  sellingPrice   Decimal
  stockQuantity  Int           @default(0)
  reorderLevel   Int           @default(5)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  partsUsed      PartUsage[]

  @@unique([branchId, partSku])
}

model PartUsage {
  id          String        @id @default(cuid())
  ticketId    String
  ticket      RepairTicket  @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  partId      String
  part        InventoryItem @relation(fields: [partId], references: [id])
  quantity    Int           @default(1)
  unitPrice   Decimal
  createdAt   DateTime      @default(now())
}

model Invoice {
  id             String        @id @default(cuid())
  ticketId       String        @unique
  ticket         RepairTicket  @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  subTotal       Decimal
  tax            Decimal       @default(0.0)
  discount       Decimal       @default(0.0)
  totalAmount    Decimal
  paymentMethod  String        @default("CASH") // CASH | CARD | BANK_TRANSFER
  paymentStatus  String        @default("UNPAID") // UNPAID | PAID | REFUNDED
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model DailyCashCloseout {
  id                 String        @id @default(cuid())
  branchId           String
  branch             ServiceCenter @relation(fields: [branchId], references: [id], onDelete: Cascade)
  closedById         String
  closedBy           User          @relation(fields: [closedById], references: [id])
  closeDate          DateTime      @default(now())
  systemCashTotal    Decimal
  actualCashTally    Decimal
  cashDiscrepancy    Decimal
  cardTotal          Decimal       @default(0.0)
  bankTransferTotal  Decimal       @default(0.0)
  status             String        // BALANCED | SHORTAGE | SURPLUS
  notes              String?
  createdAt          DateTime      @default(now())
}

model AuditLog {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  action     String
  metadata   String?
  createdAt  DateTime  @default(now())
}

```

## 11. Production Deployment & Hardening

When transitioning from local development to production hosting:

1. **Migrate to PostgreSQL:**
   Switch the Prisma datasource provider to `postgresql` and connect to a managed provider (such as Supabase, Neon, or AWS RDS). This avoids SQLite write-lock limitations during concurrent multi-counter transactions.

2. **Cloud Asset Storage for Intake Photos:**
   In serverless hosting environments (such as Vercel or Netlify), local files in `/public/uploads/` are not persistent. Use an S3-compatible service (Cloudflare R2, AWS S3, or Uploadthing) and store signed CDN URLs in the `devicePhotos` JSON array.

3. **Secure Environment Variables:**

   * Generate a strong `AUTH_SECRET` using `openssl rand -base64 32`.

   * Set `NODE_ENV="production"`.

   * Verify that your production database enforces TLS (`sslmode=require`).

4. **Thermal Printer Configuration:**
   For counter hardware, use an 80mm ESC/POS thermal receipt printer. Configure the browser print driver with margins set to "None" and paper size set to 80mm Roll.

## 12. Contact Information & Licence

| Contact Detail | Details | 
| ----- | ----- | 
| **Lead Developer** | T.P.D. Nimshan Tharamasinghe | 
| **Email Address** | nimshandilunika@gmail.com | 
| **Project Repository** | <https://github.com/NimshanDilunika/mobile-repair-system> | 

### Licence

This software is released under the **MIT Licence**.

```
MIT License

Copyright (c) 2026 FixDesk Repair Management System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```
