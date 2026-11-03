# FixDesk – Enterprise Mobile Device Repair & Service Management System

> **Custody Chain Documentation · Shift Cash Reconciliation · Dynamic Invoicing · Multi-Branch RBAC**
>
> Built with Next.js 15 (App Router) · React 19 · TypeScript · Prisma ORM · SQLite / PostgreSQL · Tailwind CSS · Auth.js (NextAuth v5)

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)
![Auth.js](https://img.shields.io/badge/Auth.js-v5-green)
![Licence](https://img.shields.io/badge/Licence-MIT-yellow)

---

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
10. [Contact Information](#10-contact-information)

---

## 1. Project Description

### Overview

**FixDesk** is an enterprise-grade mobile device service and repair lifecycle management platform. Designed for multi-branch repair service centers, authorized refurbishment labs, and retail gadget maintenance facilities, it unifies customer equipment intake, hardware diagnosis, physical condition documentation, spare parts inventory allocation, dynamic billing, and shift cash drawer audits into a single system.

### Problem Statement

Mobile repair enterprises and retail technical service centers handle complex, high-risk custody workflows with several persistent operational bottlenecks:

- **Customer Damage Disputes & False Claims:** Without photographic evidence and systematic physical checklists during intake, shops face liability for pre-existing scratches, chassis dents, or hairline cracks claimed to have been caused by technicians.
- **Cash Leakage & End-of-Shift Discrepancies:** Unrecorded cash payments, emergency petty cash outflows, and unverified card/bank transactions lead to revenue mismatches between physical cash drawers and digital billing ledgers.
- **Disjointed Custody & Opaque Diagnostic Lifecycles:** Customers and service managers lack real-time visibility into repair states, leading to delayed quote approvals, blocked technicians, and inaccurate turnaround estimates.
- **Manual Accounting & Tax Reporting Overhead:** Consolidating monthly gross revenue, value-added taxes, component discounts, and live spare parts inventory valuations often requires manual data entry across disconnected spreadsheets.

### Objectives

- **Tamper-Proof Custody Documentation:** Capture pre-repair photographic evidence and physical condition checklists upon intake, storing immutable logs in the ticket timeline.
- **End-of-Shift Financial Integrity:** Enforce physical drawer balancing (`DailyCashCloseout`) comparing physical currency counts against system-settled invoices to detect shortages or surpluses instantly.
- **Strict Role-Gated Operations:** Enforce access control across `SUPER_ADMIN`, `BRANCH_MANAGER`, `TECHNICIAN`, and `CUSTOMER` roles using Next.js Server Actions and session authentication.
- **Dynamic Invoicing & Exportable Accounting:** Automate line-item calculations for parts, labor, and taxes with print-optimized receipt rendering and RFC-4180/Excel-compliant CSV exports.

---

## 2. System Architecture & Design

### Application Topology

The platform uses the **Next.js App Router** with React Server Components (RSC) for read efficiency, Next.js Server Actions for transactional mutations, and an API Route tier for streaming reports and file uploads.
