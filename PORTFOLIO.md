# StrategOS — Lightweight ERP for SMEs

> A full-featured, browser-based Enterprise Resource Planning suite built for small and medium enterprises who need SAP/Salesforce-level functionality without the six-figure price tag.

---

## What It Does

StrategOS consolidates the core operational pillars of a business into a single web application:

| Module | Capabilities |
|---|---|
| **CRM** | Contact management (leads, customers, suppliers), deal pipeline with stage tracking & probability, activity logging (calls, meetings, emails, tasks) |
| **Finance** | Invoice lifecycle (draft → sent → paid → overdue), payment recording against invoices, expense tracking with category tagging and approval workflows |
| **HR** | Employee directory, leave request & approval system, performance reviews (manager-scoped), document management, timesheet logging with project/site allocation |
| **Procurement** | Purchase order workflow (draft → submitted → approved → received), product/inventory management with reorder alerts, asset register with condition tracking |
| **Operations** | Project management with budget vs. actual tracking, multi-site management, daily work scheduling, equipment checkout/return with acknowledgement, maintenance logging with overdue alerts, inventory consumption tracking |
| **Reporting** | Sales pipeline visualization, win-rate analytics, procurement spend summaries, department-level leave balances, project budget analysis |

### The Dashboard

The landing page is a real-time command center pulling metrics from every module: revenue totals, open deals, active projects, overdue invoices, workers on site, equipment utilization, pending leave, low-stock alerts, and overdue maintenance — supported by monthly revenue trend and project budget charts.

A notification bell in the header surfaces actionable alerts (overdue invoices, pending approvals, low stock) so managers don't need to check each module individually.

---

## How It's Built

### Architecture

```
┌─────────────────────────────────────┐
│         React SPA (Vite)            │
│  TypeScript · Tailwind · shadcn/ui  │
├─────────────────────────────────────┤
│      TanStack React Query           │
│   (caching, mutations, sync)        │
├─────────────────────────────────────┤
│        Supabase (Backend)           │
│  PostgreSQL · Auth · RLS · Edge Fn  │
└─────────────────────────────────────┘
```

- **Frontend**: React 18 + TypeScript, bundled with Vite. UI built on [shadcn/ui](https://ui.shadcn.com) component library with Tailwind CSS and a custom dark-mode design system using HSL semantic tokens.
- **State & Data**: TanStack React Query handles all server state — caching, background refetching, and optimistic updates. A single `useCrmData.ts` hook file exposes ~40 query/mutation hooks covering every table.
- **Backend**: Supabase provides PostgreSQL, authentication (email/password with verification), file storage, and serverless Edge Functions (Deno). No separate backend server required.
- **Charts**: Recharts for data visualization (bar charts, pie charts, progress indicators).

### Security Model

Role-based access control is enforced at the **database level** using PostgreSQL Row Level Security (RLS), not in frontend code:

| Role | Access Scope |
|---|---|
| `admin` | Full CRUD across all tables and all users' data |
| `hr_manager` | HR module: employees, leave, reviews, documents for all staff |
| `project_manager` | Projects, scheduling, timesheets |
| `procurement_manager` | Purchase orders, assets, inventory |
| `finance_manager` | Invoices, payments, expenses |
| `employee` | Own records only (leave, timesheets, expenses, portal) |

Roles are stored in a dedicated `user_roles` table. A `SECURITY DEFINER` helper function (`has_role()`) prevents recursive RLS evaluation. Manager-scoped queries use `get_my_employee_id()` to safely resolve the current user's employee record without triggering RLS on the same table.

### Database Schema (20 tables)

`contacts` · `deals` · `activities` · `invoices` · `payments` · `products` · `employees` · `leave_requests` · `performance_reviews` · `employee_documents` · `purchase_orders` · `purchase_order_items` · `assets` · `projects` · `sites` · `work_schedules` · `equipment_checkouts` · `maintenance_logs` · `timesheets` · `expenses` · `inventory_consumption` · `user_roles` · `invitations` · `profiles`

### Key Technical Patterns

- **Hook-per-table**: Each table has `useX()` (query), `useUpsertX()` (insert/update), and `useDeleteX()` (delete) hooks, keeping components thin.
- **Form dialogs**: Reusable `XFormDialog` components handle both create and edit modes via an `initialData` prop.
- **CSV bulk import**: Generic `CsvImportDialog` component parses CSV files client-side and batch-inserts via mutation hooks.
- **Computed notifications**: Alerts are derived client-side from existing query data — no additional tables or polling needed.
- **Edge Functions**: Used for AI-powered features (ask-AI panel) and employee account provisioning with automatic role assignment.

### Deployment

The app is deployed as a static SPA. Supabase handles all backend infrastructure (database, auth, storage, edge functions) as a managed service — no servers to maintain.

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Framework | React 18 |
| Bundler | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack React Query |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (email/password) |
| Serverless | Supabase Edge Functions (Deno) |
| Charts | Recharts |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
