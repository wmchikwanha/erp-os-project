
-- Outage action plans
CREATE TABLE public.outage_action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recommendation_key text NOT NULL,
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'upcoming',
  status text NOT NULL DEFAULT 'pending',
  assigned_to uuid,
  due_date date,
  completion_notes text,
  source_collision_id text,
  rationale_inputs text,
  rationale_logic text,
  rationale_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outage_action_plans TO authenticated;
GRANT ALL ON public.outage_action_plans TO service_role;

ALTER TABLE public.outage_action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all outage plans"
ON public.outage_action_plans FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users CRUD own outage plans"
ON public.outage_action_plans FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Assignees can view outage plans"
ON public.outage_action_plans FOR SELECT TO authenticated
USING (assigned_to = get_my_employee_id());

CREATE POLICY "Assignees can update outage plans"
ON public.outage_action_plans FOR UPDATE TO authenticated
USING (assigned_to = get_my_employee_id())
WITH CHECK (assigned_to = get_my_employee_id());

CREATE TRIGGER outage_action_plans_updated_at
BEFORE UPDATE ON public.outage_action_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shift collision rules (per-user configuration)
CREATE TABLE public.shift_collision_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  min_overlap_hours numeric NOT NULL DEFAULT 1,
  severity_threshold_hours numeric NOT NULL DEFAULT 4,
  urgent_collision_count integer NOT NULL DEFAULT 3,
  auto_shift_minutes integer NOT NULL DEFAULT 60,
  ignore_zones text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_collision_rules TO authenticated;
GRANT ALL ON public.shift_collision_rules TO service_role;

ALTER TABLE public.shift_collision_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all collision rules"
ON public.shift_collision_rules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users CRUD own collision rules"
ON public.shift_collision_rules FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER shift_collision_rules_updated_at
BEFORE UPDATE ON public.shift_collision_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
