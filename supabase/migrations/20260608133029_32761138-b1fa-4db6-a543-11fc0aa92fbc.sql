
-- Plan approval settings: per-department config for who can approve/reject SAE action plans
CREATE TABLE public.plan_approval_settings (
  department text PRIMARY KEY,
  label text NOT NULL,
  allowed_roles app_role[] NOT NULL DEFAULT ARRAY['admin']::app_role[],
  allowed_user_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_approval_settings TO authenticated;
GRANT ALL ON public.plan_approval_settings TO service_role;

ALTER TABLE public.plan_approval_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings (UI needs them to gate buttons)
CREATE POLICY "Authenticated can read approval settings"
  ON public.plan_approval_settings FOR SELECT
  TO authenticated USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert approval settings"
  ON public.plan_approval_settings FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update approval settings"
  ON public.plan_approval_settings FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete approval settings"
  ON public.plan_approval_settings FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_plan_approval_settings_updated
  BEFORE UPDATE ON public.plan_approval_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper to check if a user can approve plans for a given department
CREATE OR REPLACE FUNCTION public.can_approve_plan(_department text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Admins can always approve
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.plan_approval_settings s
      WHERE s.department = _department
        AND (
          _user_id = ANY (s.allowed_user_ids)
          OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = _user_id
              AND ur.role = ANY (s.allowed_roles)
          )
        )
    )
$$;

-- Audit trigger
CREATE OR REPLACE FUNCTION public.audit_plan_approval_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, after_data)
    VALUES ('plan_approval_settings', NULL, 'approval_settings.created', auth.uid(),
      'Created approval settings for ' || NEW.department, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, before_data, after_data)
    VALUES ('plan_approval_settings', NULL, 'approval_settings.updated', auth.uid(),
      'Updated approval settings for ' || NEW.department, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, before_data)
    VALUES ('plan_approval_settings', NULL, 'approval_settings.deleted', auth.uid(),
      'Deleted approval settings for ' || OLD.department, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_audit_plan_approval_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.plan_approval_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_plan_approval_settings();

-- Seed defaults for each known SAE department
INSERT INTO public.plan_approval_settings (department, label, allowed_roles) VALUES
  ('operations', 'Operations (Load-Shedding)', ARRAY['admin','project_manager']::app_role[]),
  ('procurement', 'Procurement Scout', ARRAY['admin','procurement_manager']::app_role[]),
  ('compliance', 'Compliance Monitor', ARRAY['admin','hr_manager','finance_manager']::app_role[]),
  ('liquidity', 'Liquidity Guardian', ARRAY['admin','finance_manager']::app_role[]),
  ('hr', 'HR', ARRAY['admin','hr_manager']::app_role[])
ON CONFLICT (department) DO NOTHING;
