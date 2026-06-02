# Sprint 2 & 3 — Procurement Scout + Compliance Monitor

Builds on the Sprint 1 SAE foundation. Activates the two scaffolded modules end-to-end: data capture, server-side intelligence, decision UI, and SAE integration. Same mandate applies — every screen must drive a purchasing or compliance decision within 48 hours.

---

## Part A — Procurement Scout (Sprint 2)

**Goal:** Tell the user *which supplier, in which currency, this week* — based on their material basket and recent quotes, parallel-rate-adjusted.

### A1. Data layer (already scaffolded)
- `supplier_quotes` and `material_baskets` tables exist. No migration needed unless we add `lead_time_days` (integer) and `supplier_name` snapshot to `supplier_quotes` for resilience when contacts are deleted → **one small migration**.

### A2. Edge function `price-sentinel` (rewrite the stub)
Inputs: `{ basket_id?: uuid }` (defaults to all baskets for the user).
Logic:
1. Load user's basket items.
2. For each item, pull last 90 days of quotes across suppliers.
3. Convert all to USD-equivalent using latest `currency_rates` (parallel rate by default, official as comparison).
4. Compute: cheapest-now, 30-day price trend (% change), best supplier per item, lead-time-adjusted total cost.
5. Flag: items where price moved >10% in 14 days, items with only one active supplier (concentration risk), quotes expiring in <7 days.
6. Return a `RationaleCard`-shaped payload per recommendation.

### A3. UI
- **New page `/sae/procurement`** — "Procurement Scout"
  - Basket selector (dropdown) + "New Basket" inline editor (jsonb items: `{ name, qty, unit }[]`).
  - Quotes table with quick-add row (item, supplier, price, currency, valid_until, lead_time_days).
  - Recommendations grid: one `<RationaleCard>` per basket item with `<OverrideButton>`.
  - Trend sparkline per item (recharts).
- **Dashboard widget:** "Top 3 procurement actions this week" (compact rationale list).
- **Nav entry** under SAE.

### A4. SAE integration
Extend `ask-ai` system prompt + context loader to pull `supplier_quotes` and `material_baskets`, so "should I buy steel this week or wait?" gets a grounded answer.

### A5. Acceptance criteria
1. User creates a basket with 3 items, adds 2 quotes per item from different suppliers → Procurement Scout renders 3 rationale cards naming the cheapest supplier and parallel-rate-adjusted USD total.
2. Adding a quote with price 15% higher than 14 days ago triggers a red "Price spike" flag on that item.
3. Asking SAE "is now a good time to buy [item]?" returns an answer citing actual quote numbers and ends with a Rationale Card.
4. Clicking "Do the opposite" on a recommendation writes a row to `sae_overrides` with the basket item key.

---

## Part B — Compliance Monitor (Sprint 3)

**Goal:** Tell the user *which ZIMRA/SI/labour deadline hits next* and *which modules of their data are affected*, before the penalty does.

### B1. Data layer
- `regulatory_notices` and `tax_obligations` exist. Add:
  - `notice_acknowledgements` table — per-user dismissal/acknowledgement of a notice (so multi-user tenants don't keep re-alerting one user).
  - `tax_obligations.recurrence` (text: `none|monthly|quarterly|annual`) + `tax_obligations.reminder_days_before` (int, default 7).

### B2. Edge function `regulatory-digest` (rewrite the stub)
Inputs: none (user inferred from JWT).
Logic:
1. Pull all `regulatory_notices` with `effective_date >= today - 30d`.
2. Pull user's `tax_obligations` with `due_date BETWEEN today AND today + 60d AND status = 'pending'`.
3. Cross-reference `affected_modules` against the user's actual data (e.g. notice tagged `['payroll']` + user has employees → relevant).
4. Rank by `effective_date`/`due_date` ascending + impact severity.
5. Return: `{ urgent: RationaleCard[], upcoming: RationaleCard[], dismissed_count: number }`.

### B3. UI
- **New page `/sae/compliance`** — "Compliance Monitor"
  - Two columns: "Next 14 days" (red/amber) and "15–60 days" (neutral).
  - Each card: title, SI/authority, due date countdown, affected modules badge, `<RationaleCard>` and `<OverrideButton>` ("Mark as not applicable" → writes acknowledgement + override).
  - Admin-only sub-tab: "Manage Notices" (CRUD on `regulatory_notices`).
  - Finance/admin tab: "Tax Calendar" (CRUD on `tax_obligations` with recurrence).
- **Dashboard widget:** "Compliance — N urgent, M upcoming" with top 3 cards inline.
- **Header bell badge:** count of unacknowledged urgent items (reuses `NotificationsPanel`).
- **Nav entry** under SAE.

### B4. SAE integration
`ask-ai` already loads `regulatory_notices` and `tax_obligations`. Tighten the system prompt to *proactively surface* the next compliance deadline when the user asks any cash-flow or hiring question.

### B5. Acceptance criteria
1. Admin adds a regulatory notice (SI 142/2024, affected_modules=`['imports']`, effective in 5 days) → it appears in the "Next 14 days" column for all authenticated users with rationale + countdown.
2. User clicks "Mark as not applicable" → notice disappears from their view only; `sae_overrides` and `notice_acknowledgements` rows created.
3. Finance manager adds a monthly VAT obligation due in 6 days → Dashboard widget flags it red; SAE answer to "can I hire someone?" mentions the upcoming VAT outflow.
4. Header bell shows correct unacknowledged count and decrements on dismissal.

---

## Part C — Cross-cutting

- Recurrence engine: simple client-side rollover on view (if a recurring obligation passes its due_date with status=paid, auto-insert next period). Lightweight; cron not required yet.
- Reuse `<RationaleCard>` and `<OverrideButton>` everywhere — no new primitives.
- All new pages gated to authenticated users; CRUD on `regulatory_notices` and `tax_obligations` follows existing RLS (admin/finance only).

## Technical summary
- **Migrations:** add `lead_time_days` + `supplier_name` to `supplier_quotes`; add `recurrence` + `reminder_days_before` to `tax_obligations`; create `notice_acknowledgements`.
- **Edge functions rewritten:** `price-sentinel`, `regulatory-digest`. `ask-ai` context loader extended.
- **New pages:** `src/pages/sae/ProcurementScout.tsx`, `src/pages/sae/ComplianceMonitor.tsx`.
- **New hooks:** `useMaterialBaskets`, `useSupplierQuotes`, `usePriceSentinel`, `useRegulatoryDigest`, `useNoticeAcknowledgements`.
- **Modified:** `App.tsx` (routes), `AppLayout.tsx` (nav), `Dashboard.tsx` (two widgets), `ask-ai/index.ts` (prompt), `NotificationsPanel.tsx` (compliance feed).

## Sequence
1. Migration (3 small changes in one file).
2. `price-sentinel` rewrite + Procurement Scout page + dashboard widget.
3. `regulatory-digest` rewrite + Compliance Monitor page + dashboard widget + bell integration.
4. `ask-ai` prompt tightening.
5. Verify all 8 acceptance criteria against the running preview.

Out of scope (deferred): live ZIMRA/RBZ scraping (still manual entry), SMS alerts, multi-tenant benchmarking.
