CREATE TABLE public.budget_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  period date NOT NULL,
  kind text NOT NULL DEFAULT 'expense',
  category text NOT NULL,
  label text,
  planned_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_lines TO authenticated;
GRANT ALL ON public.budget_lines TO service_role;

ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or demo budget lines" ON public.budget_lines
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_demo_row(user_id));

CREATE POLICY "Insert own budget lines" ON public.budget_lines
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own budget lines" ON public.budget_lines
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Delete own budget lines" ON public.budget_lines
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_budget_lines_period ON public.budget_lines(period);

CREATE TRIGGER budget_lines_updated_at
  BEFORE UPDATE ON public.budget_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();