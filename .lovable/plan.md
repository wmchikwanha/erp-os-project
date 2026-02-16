

## Plan: Procurement Workflow, Asset Register, and Projects

### Architecture Decision

After reviewing the codebase, here is the recommended module structure that maximizes remixability:

**Group 1 -- Supply Chain** (rename "Products" sidebar item to "Procurement")
- Tab 1: **Inventory** (existing products catalog, unchanged)
- Tab 2: **Purchase Orders** (request-to-receipt workflow with approval)
- Tab 3: **Asset Register** (company assets tracked from procurement or manually added)

**Group 2 -- Revenue** (keep "Deals" and add "Projects" as separate sidebar items)
- **Deals** stays as-is (sales kanban pipeline)
- **Projects** (new sidebar item) -- spawned from closed-won deals or created standalone, with milestones and status tracking

This keeps the sidebar clean (replaces "Products" with "Procurement", adds "Projects") and groups logically: procurement is about spending money, deals/projects are about earning it.

### Sidebar Order (updated)
Dashboard | Contacts | Deals | Projects | Activities | Procurement | Invoices | HR | Reports

---

### 1. Database Changes (new migration)

**`purchase_orders` table:**
- id, user_id, supplier_id (links to contacts where type=supplier), po_number, status (draft / submitted / approved / rejected / received), requested_by, approved_by, total_amount, notes, created_at, updated_at
- Workflow: Draft -> Submitted -> Approved/Rejected -> Received

**`purchase_order_items` table:**
- id, po_id (FK to purchase_orders), product_id (FK to products), description, quantity, unit_price, total

**`assets` table:**
- id, user_id, name, asset_tag, category (Equipment / Vehicle / IT / Furniture / Other), purchase_date, purchase_price, current_value, condition (New / Good / Fair / Poor / Decommissioned), location, assigned_to (employee_id), po_id (optional link to purchase order), notes, created_at, updated_at

**`projects` table:**
- id, user_id, deal_id (optional FK to deals), name, description, status (planning / active / on-hold / completed / cancelled), priority (low / medium / high / critical), start_date, end_date, budget, actual_cost, progress (0-100), manager_id (employee_id), created_at, updated_at

RLS: All tables use `auth.uid() = user_id` pattern matching existing tables.

---

### 2. Procurement Page (replaces Products in sidebar)

Three tabs:

**Inventory Tab** -- the existing products table, moved here unchanged.

**Purchase Orders Tab** -- table listing POs with status badges and a kanban-style workflow:
- "New PO" form: select supplier (from contacts), add line items (from products catalog), auto-calculate total
- Status progression buttons: Submit for Approval -> Approve/Reject -> Mark Received
- When marked "Received", optionally auto-update product stock quantities and/or create asset records

**Asset Register Tab** -- table of company assets with:
- "Add Asset" form: name, tag, category, purchase info, condition, location, assigned employee
- Filter by category, condition, or assigned employee
- Link back to originating PO if created from procurement

---

### 3. Projects Page (new sidebar item)

- Card/list view of projects with status, priority, progress bar, and budget vs actual
- "New Project" form: name, description, link to deal (dropdown of closed-won deals), dates, budget, assigned manager
- Project detail shows: overview stats, linked deal info, budget tracking
- Status workflow: Planning -> Active -> Completed (or On-Hold / Cancelled)

---

### 4. Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Procurement.tsx` | Tabbed page (Inventory, Purchase Orders, Assets) |
| `src/pages/Projects.tsx` | Projects list and management |
| `src/components/forms/PurchaseOrderFormDialog.tsx` | PO creation with line items |
| `src/components/forms/AssetFormDialog.tsx` | Asset register form |
| `src/components/forms/ProjectFormDialog.tsx` | Project creation/edit form |

### 5. Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/` | New migration for 4 tables + RLS |
| `src/integrations/supabase/types.ts` | Auto-updated |
| `src/types/crm.ts` | Add PurchaseOrder, Asset, Project interfaces |
| `src/hooks/useCrmData.ts` | Add hooks for POs, assets, projects |
| `src/components/AppLayout.tsx` | Replace "Products" with "Procurement", add "Projects" |
| `src/App.tsx` | Add /projects and /procurement routes, remove /products |
| `src/pages/Dashboard.tsx` | Add active projects count KPI |
| `src/pages/Reports.tsx` | Add procurement/asset summary |
| `supabase/functions/ask-ai/index.ts` | Include POs, assets, projects in AI context |

---

### 6. AI Integration

The ask-ai function will be updated to pull from the new tables so executives can ask things like:
- "Show me all pending purchase orders awaiting approval"
- "What assets are assigned to the Engineering department?"
- "Which projects are over budget?"
- "Link procurement spend to project budgets"

