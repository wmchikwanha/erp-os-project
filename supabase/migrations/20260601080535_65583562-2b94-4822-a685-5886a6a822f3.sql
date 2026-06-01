
-- Industry DNA persona
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS industry_dna text NOT NULL DEFAULT 'general'
  CHECK (industry_dna IN ('general','manufacturing','construction','retail'));

-- 1. currency_rates (shared reference data)
CREATE TABLE public.currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL,
  official_rate numeric NOT NULL DEFAULT 1,
  parallel_rate numeric NOT NULL DEFAULT 1,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.currency_rates TO authenticated;
GRANT ALL ON public.currency_rates TO service_role;
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can view rates" ON public.currency_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/finance can manage rates" ON public.currency_rates FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance_manager'));

-- 2. tax_obligations (per-user)
CREATE TABLE public.tax_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  authority text NOT NULL DEFAULT 'ZIMRA',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_obligations TO authenticated;
GRANT ALL ON public.tax_obligations TO service_role;
ALTER TABLE public.tax_obligations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all tax_obligations" ON public.tax_obligations FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Finance can view tax_obligations" ON public.tax_obligations FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'finance_manager'));
CREATE POLICY "Users CRUD own tax_obligations" ON public.tax_obligations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. sae_overrides (per-user audit)
CREATE TABLE public.sae_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recommendation_key text NOT NULL,
  original_action text NOT NULL,
  override_action text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sae_overrides TO authenticated;
GRANT ALL ON public.sae_overrides TO service_role;
ALTER TABLE public.sae_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own overrides" ON public.sae_overrides FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own overrides" ON public.sae_overrides FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all overrides" ON public.sae_overrides FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

-- 4. supplier_quotes (per-user)
CREATE TABLE public.supplier_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  supplier_id uuid,
  item text NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  quoted_at date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_quotes TO authenticated;
GRANT ALL ON public.supplier_quotes TO service_role;
ALTER TABLE public.supplier_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all supplier_quotes" ON public.supplier_quotes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Procurement view supplier_quotes" ON public.supplier_quotes FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'procurement_manager'));
CREATE POLICY "Users CRUD own supplier_quotes" ON public.supplier_quotes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. regulatory_notices (shared reference data)
CREATE TABLE public.regulatory_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  si_number text,
  effective_date date,
  summary text,
  affected_modules text[] DEFAULT '{}',
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regulatory_notices TO authenticated;
GRANT ALL ON public.regulatory_notices TO service_role;
ALTER TABLE public.regulatory_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated view notices" ON public.regulatory_notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage notices" ON public.regulatory_notices FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- 6. load_shedding_schedule (shared reference data)
CREATE TABLE public.load_shedding_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  source text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.load_shedding_schedule TO authenticated;
GRANT ALL ON public.load_shedding_schedule TO service_role;
ALTER TABLE public.load_shedding_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated view schedule" ON public.load_shedding_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage schedule" ON public.load_shedding_schedule FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- 7. material_baskets (per-user watchlist)
CREATE TABLE public.material_baskets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_baskets TO authenticated;
GRANT ALL ON public.material_baskets TO service_role;
ALTER TABLE public.material_baskets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all material_baskets" ON public.material_baskets FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Users CRUD own material_baskets" ON public.material_baskets FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at triggers
CREATE TRIGGER currency_rates_updated BEFORE UPDATE ON public.currency_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tax_obligations_updated BEFORE UPDATE ON public.tax_obligations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER material_baskets_updated BEFORE UPDATE ON public.material_baskets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
