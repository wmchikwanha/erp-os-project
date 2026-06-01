# StratedgeOS → Situational Awareness Engine (SAE)
## Sprint 1 Foundation: From Generic ERP to Zimbabwean Business Organism

The attached brief is a vision document spanning 3 sprints (6 weeks). To preserve quality and avoid over-engineering, this plan implements **Sprint 1 in full** plus the **scaffolding** required for Sprints 2–3 (DB tables, module folders, routes), so subsequent work is incremental, not architectural.

The rule applied throughout: **every feature must inform a purchasing, hiring, pricing, or compliance decision within 48 hours.** If it doesn't, it's out of scope.

---

## What Gets Built Now (Sprint 1)

### 1. Rebrand the AI Layer → Situational Awareness Engine (SAE)
- Rename `AskAIPanel` → `SAEPanel`. Header trigger relabelled "SAE — Situational Awareness".
- Rewrite the `ask-ai` edge function system prompt with a **hard mandate**:
  - Refuses: stock tickers, weather, generic news, definitions, foreign markets.
  - Answers only: liquidity, cash position, supplier timing, ZIMRA/SI compliance, load-shedding impact, parallel-rate-adjusted costs, multi-currency exposure.
  - Every response ends with a **Decision Rationale Card** (3 bullets: inputs → logic → recommended action).
- Add a "Do the opposite" button beside every SAE recommendation that logs the override to a new `sae_overrides` table (learning signal for future tuning).

### 2. Liquidity Guardian (the headline feature)
- New page: `/sae/liquidity` (also surfaced as a Dashboard widget).
- Inputs:
  - Existing `invoices`, `payments`, `expenses`, `purchase_orders`.
  - **New table `currency_rates`**: `currency` (USD/ZWG/ZAR/RTGS), `official_rate`, `parallel_rate`, `effective_date`. Admin/finance role can edit; users see read-only.
  - **New table `tax_obligations`**: `name`, `authority` (ZIMRA/Local Authority), `amount`, `currency`, `due_date`, `status`.
- Output: a 7/14/30-day forward cash position **per currency**, with parallel-rate adjustment toggle. Flags shortfalls in red with specific action ("Invoice X today" / "Negotiate Y-day extension").
- Edge function `liquidity-forecast` consolidates the math server-side so the same logic powers SAE answers and the UI.

### 3. Offline-First Foundation (full CRUD, not read-only)
- Register a **Service Worker** (vite-plugin-pwa) with a Workbox runtime cache for app shell + Supabase responses (StaleWhileRevalidate).
- Add **IndexedDB write queue** (`idb` library) wrapping TanStack Query mutations: when offline, mutations queue locally with optimistic UI; on reconnect, a background sync drains the queue with conflict resolution (last-write-wins + admin override flag).
- New `useOnlineStatus()` hook + a subtle header indicator ("Online" / "Working offline — N pending").
- Encrypted local backup: nightly browser-side export of user-scoped data → AES-encrypted (Web Crypto, user passphrase) `.sqlite.enc` download via a Settings → Data Sovereignty panel.

### 4. Industry DNA — Scaffolding + Persona Selector
- Add `industry_dna` column to `profiles` (enum: `manufacturing | construction | retail | general`).
- Onboarding step (admin sets per-tenant during first login) chooses the persona.
- Dashboard reads the persona and renders a different **priority widget order** + KPI selection. Full per-persona AI companions ("Floor Manager", "Quantity Surveyor", "Shop Whisperer") come in Sprint 3, but the routing/registry exists now.

### 5. Trust UI Primitives
- New shared component `<RationaleCard />` — used by SAE, Liquidity Guardian, and (future) Procurement Scout.
- New shared component `<OverrideButton />` wired to `sae_overrides`.

---

## What Gets Scaffolded (for Sprints 2 & 3)

To avoid rewriting later, this plan lays down **empty but typed** foundations:

- `src/modules/sae/` folder structure with stubs: `liquidity/`, `procurement-scout/`, `compliance/`, `load-shedding/`.
- DB tables created now, populated later:
  - `supplier_quotes` (Procurement Scout — Sprint 2)
  - `regulatory_notices` (Compliance Monitor — Sprint 3)
  - `load_shedding_schedule` (Operations Planner — Sprint 2)
  - `material_baskets` (per-tenant raw-material watchlist)
- Edge function stubs: `price-sentinel`, `regulatory-digest`, `load-shedding-planner` (return "not yet active" but registered).

---

## Explicitly Out of Scope (this plan)

- **Voice commands (Shona/Ndebele)** — Sprint 2. Needs Web Speech API research + grammar design, deserves its own plan.
- **On-premise "Fortress" deployment** — Sprint 3+. Hardware packaging is outside Lovable's surface area; we'll document the architecture, not build the installer.
- **Live external APIs** (ZIMRA calendar, ZESA, RBZ) — these are not public REST APIs in Zimbabwe. Sprint 2 will use admin-curated tables + scraped digests via edge functions on a schedule. Manual input UI is provided now.
- **Network-wide anonymous price benchmarking** — requires multi-tenant data sharing consent flow + privacy review. Sprint 3.

---

## Technical Details

### New Database Tables (single migration)
```text
currency_rates       (currency, official_rate, parallel_rate, effective_date, source)
tax_obligations      (name, authority, amount, currency, due_date, status, user_id)
sae_overrides        (recommendation_id, user_id, original_action, override_action, reason, created_at)
supplier_quotes      (supplier_id, item, unit_price, currency, quoted_at, valid_until)
regulatory_notices   (title, si_number, effective_date, summary, affected_modules[])
load_shedding_schedule (zone, start_time, end_time, source)
material_baskets     (user_id, name, items jsonb)
```
All with RLS using existing `has_role()` patterns. `currency_rates` and `regulatory_notices` readable by all authenticated users; writable by admin/finance_manager only.

`profiles.industry_dna` column added with default `'general'`.

### New Edge Functions
- `liquidity-forecast` — active, returns forward cash position.
- `price-sentinel`, `regulatory-digest`, `load-shedding-planner` — stubs returning `{ status: 'scaffolded' }`.
- `ask-ai` (existing) — rewritten system prompt + function-calling schema bound to internal tables only.

### Frontend
- `src/modules/sae/` — new module root.
- New pages: `/sae/liquidity`, `/sae/overrides` (audit trail).
- New components: `SAEPanel` (renames AskAIPanel), `RationaleCard`, `OverrideButton`, `OfflineIndicator`, `LiquidityForecastChart`.
- New hooks: `useOnlineStatus`, `useOfflineQueue`, `useLiquidityForecast`, `useCurrencyRates`, `useTaxObligations`, `useIndustryDNA`.
- New dependencies: `vite-plugin-pwa`, `workbox-window`, `idb`.

### Routing & Permissions
- `/sae/*` accessible to all authenticated roles; `currency_rates` and `tax_obligations` edit screens gated to `admin` + `finance_manager`.

### Files Modified
- `src/components/AskAIPanel.tsx` → renamed/rewritten as `SAEPanel.tsx`.
- `src/pages/Dashboard.tsx` → industry-DNA-aware widget order + Liquidity Guardian widget.
- `src/components/AppLayout.tsx` → SAE nav entry, offline indicator.
- `vite.config.ts` → PWA plugin.
- `supabase/functions/ask-ai/index.ts` → new mandate prompt.

---

## Acceptance Criteria

1. Asking the SAE "what's the weather?" returns a polite refusal naming the mandate.
2. Asking "can I pay supplier X this week?" returns a Rationale Card with real numbers from the user's invoices/expenses.
3. Disconnecting the network, creating an invoice, reconnecting → invoice syncs without error.
4. Admin can switch industry DNA in Settings and Dashboard widget order changes accordingly.
5. Encrypted backup downloads, can be decrypted with the user's passphrase, contains valid SQLite.
6. Every SAE recommendation has a visible "Do the opposite" button that logs to `sae_overrides`.

---

## Sequence

1. Single migration: all new tables + `profiles.industry_dna` + RLS + GRANTs.
2. Edge function rewrites/stubs.
3. PWA + offline queue infrastructure.
4. SAE rename + RationaleCard + OverrideButton.
5. Liquidity Guardian page + Dashboard widget.
6. Industry DNA persona selector + Dashboard reordering.
7. Encrypted backup in Settings.
8. QA against the 6 acceptance criteria above.

Sprints 2 (voice, load-shedding integration, procurement scout) and 3 (industry-specific AI companions, decision audit trail UI) will each get their own focused plan once Sprint 1 is in users' hands.
