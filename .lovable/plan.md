

# ERP Enhancement Plan — Premium Utilities + Expanded Dashboard

## Analysis of Gaps vs SAP/Salesforce

The system already covers CRM, Finance, HR, Procurement, Projects, and Operations well. Here are the high-value additions that would close the remaining gap:

## New Features

### 1. Accounts Receivable Aging Report (Dashboard + Reports)
Show invoice aging buckets (Current, 30-day, 60-day, 90+ day) as a stacked bar or table. Critical for cash flow management — SAP's bread and butter.

### 2. Expense vs Revenue Profitability View (Dashboard)
Add a net profit/loss KPI and a monthly expenses-vs-revenue comparison chart. Pull from paid invoices (revenue) and approved expenses + received POs (costs).

### 3. Recruitment Pipeline Summary (Dashboard)
New KPI row: Open Positions, New Candidates, Shortlisted count. HR module data already exists.

### 4. Workforce Utilization Chart (Dashboard)
Compare scheduled hours (from work_schedules) vs logged hours (from timesheets) per project/site. Shows productivity at a glance.

### 5. Deal Conversion Funnel (Reports)
Visual funnel: Prospecting → Negotiation → Closed Won with drop-off rates between stages.

### 6. Cash Flow Forecast (Dashboard)
Project expected cash inflows from unpaid invoices (by due date) vs upcoming expenses. Simple 30/60/90-day forward view.

### 7. Asset Depreciation Summary (Reports)
Show purchase_price vs current_value across asset categories. Pie chart of asset allocation by category.

### 8. Timesheet & Expense Summaries (Reports)
Total hours logged by project, total expenses by category — currently missing from Reports page.

### 9. Quick Actions Panel (Dashboard)
A row of shortcut buttons: "New Invoice", "Log Expense", "Record Payment", "Create Deal" — reduces clicks for daily tasks.

## Expanded Dashboard Metrics

Add to the existing Dashboard:
- **Receivables Aging** — mini table showing $amounts in 0-30/31-60/61-90/90+ day buckets
- **Net Margin KPI** — revenue minus expenses
- **Cash Flow Mini-Chart** — upcoming inflows vs outflows by week
- **Recruitment Snapshot** — open positions / candidates in pipeline
- **Workforce Utilization** — bar chart of scheduled vs actual hours
- **Quick Actions** strip at the top

## Expanded Reports Page

Add sections:
- **Invoice Aging Analysis** — table + chart
- **Deal Conversion Funnel** — visual funnel
- **Asset Depreciation** — category breakdown with purchase vs current value
- **Timesheet Summary** — hours by project/employee
- **Expense Breakdown** — by category with pie chart
- **Monthly P&L** — revenue vs costs trend

## Technical Details

### Files to Modify
- `src/pages/Dashboard.tsx` — add 6 new sections (aging, net margin, cash flow, recruitment, workforce, quick actions)
- `src/pages/Reports.tsx` — add 6 new report sections (aging, funnel, depreciation, timesheets, expenses, P&L)

### Data Sources
All data already exists in current hooks. New hooks needed:
- None — everything computes from `useInvoices`, `usePayments`, `useExpenses`, `useTimesheets`, `useWorkSchedules`, `useDeals`, `useAssets`, `useJobPositions`, `useCandidates`, `useProducts`

### No Database Changes Required
All new features are computed views over existing data.

### New Dependencies
None — uses existing `recharts` components (BarChart, PieChart, Tooltip, etc.)

