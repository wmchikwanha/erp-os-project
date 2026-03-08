

# High-Impact ERP Enhancements Plan

## What's Already Built
CRM (contacts, deals, activities), Invoicing, HR (employees, leave, reviews, documents), Procurement (POs, assets, products), Projects, Sites, Scheduling, Equipment Checkouts, Maintenance, Consumption, Reports, Settings, CSV Import, Role-based access.

## What's Missing vs SAP/Salesforce for an SME

### 1. Expanded Dashboard with Cross-Module Metrics
The current dashboard shows only 4 KPIs and 2 lists. A competitive ERP dashboard should be a command center.

**New KPI row:** Employees on site today, Equipment checked out, Pending leave requests, Low-stock items, Overdue maintenance, Pending POs awaiting approval.

**New sections:**
- Revenue trend (bar chart -- monthly invoices paid, using recharts BarChart)
- Project budget vs actual (horizontal bar chart)
- Equipment utilization gauge (checked-out vs total assets)
- Today's workforce snapshot (workers scheduled today, by site)
- Maintenance alerts (overdue items list)
- Low-stock alerts (products below reorder level)

**Data sources:** All hooks already exist -- just need to pull `useEquipmentCheckouts`, `useMaintenanceLogs`, `useWorkSchedules`, `useProducts`, `useEmployees`, `useSites`, `useAssets` into Dashboard.tsx alongside existing hooks.

### 2. Payments Module (Accounts Receivable)
The `payments` table already exists but has no UI. This is critical -- invoicing without payment tracking is incomplete.

**New page: `src/pages/Payments.tsx`**
- Record payments against invoices (partial or full)
- Auto-update invoice status to "paid" when fully settled
- Payment history per invoice
- KPI: Outstanding receivables, Collected this month

**New form dialog:** `PaymentFormDialog.tsx` -- invoice select, amount, date, method (cash/bank/card), reference.

**New hooks:** `usePayments()`, `useRecordPayment()` in useCrmData.ts.

**Route:** Add `/payments` for admin and finance_manager roles.

### 3. Notifications / Alerts Center
No notification system exists. SMEs need actionable alerts without checking every module.

**New component: `NotificationsPanel.tsx`** (dropdown from header bell icon)
- Computed client-side from existing data (no new table needed initially):
  - Overdue invoices
  - Pending leave requests (for managers/HR)
  - Overdue maintenance
  - Low stock items
  - Equipment not returned past expected date
  - Projects over budget

### 4. Timesheet / Hours Tracking
Work schedules exist but there's no way to log actual hours worked. Essential for payroll and project costing.

**New table:** `timesheets` (employee_id, project_id, site_id, date, hours_worked, description, status, approved_by)

**New page:** `src/pages/Timesheets.tsx` -- weekly view, employees log hours per project/site, managers approve.

**New hooks:** `useTimesheets()`, `useUpsertTimesheet()`, `useApproveTimesheet()`

### 5. Expense Tracking
No way to track operational expenses beyond POs. SMEs need petty cash, travel, misc expense tracking.

**New table:** `expenses` (user_id, employee_id, category, amount, date, description, receipt_path, status, approved_by, project_id, site_id)

**New page:** `src/pages/Expenses.tsx` -- submit expenses, attach receipts, manager/admin approval workflow.

### 6. Vendor/Supplier Management Enhancement
Contacts serve as suppliers but lack supplier-specific fields. Add a filtered "Suppliers" view within Procurement with payment terms, rating, lead time.

### 7. Audit Log / Activity Feed
Track who changed what and when -- critical for compliance and accountability. A lightweight approach: a `system_activity_log` view computed from `created_at`/`updated_at` across tables, shown on the dashboard.

---

## Implementation Scope (Prioritized)

### Phase 1 (This implementation)
1. **Expand Dashboard** -- add 6 new KPIs, 4 new chart/list sections pulling from all existing hooks
2. **Payments page** -- new page + form + hooks using existing `payments` table
3. **Notifications dropdown** -- computed alerts from existing data in the header
4. **Timesheets** -- new table + page + hooks for hours tracking
5. **Expenses** -- new table + page + hooks for expense management

### Phase 2 (Future)
- Audit logging
- Supplier rating system
- Dashboard customization per role
- Email notifications via edge functions
- Export to PDF for invoices/POs

---

## Technical Details

### Database Migrations Needed
```sql
-- Timesheets table
CREATE TABLE public.timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid REFERENCES public.employees(id),
  project_id uuid REFERENCES public.projects(id),
  site_id uuid REFERENCES public.sites(id),
  work_date date NOT NULL,
  hours_worked numeric NOT NULL DEFAULT 0,
  description text,
  status text NOT NULL DEFAULT 'draft',
  approved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid REFERENCES public.employees(id),
  project_id uuid REFERENCES public.projects(id),
  site_id uuid REFERENCES public.sites(id),
  category text NOT NULL DEFAULT 'general',
  amount numeric NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  receipt_path text,
  status text NOT NULL DEFAULT 'pending',
  approved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- + RLS policies for both tables (admin full, managers direct reports, users own)
```

### Files to Create
- `src/pages/Payments.tsx`
- `src/pages/Timesheets.tsx`
- `src/pages/Expenses.tsx`
- `src/components/forms/PaymentFormDialog.tsx`
- `src/components/forms/TimesheetFormDialog.tsx`
- `src/components/forms/ExpenseFormDialog.tsx`
- `src/components/NotificationsPanel.tsx`

### Files to Modify
- `src/pages/Dashboard.tsx` -- expand with all module metrics, charts
- `src/hooks/useCrmData.ts` -- add hooks for payments, timesheets, expenses
- `src/App.tsx` -- add routes for payments, timesheets, expenses
- `src/components/AppLayout.tsx` -- add nav items + notification bell in header
- `src/pages/Reports.tsx` -- add timesheet/expense summary sections

