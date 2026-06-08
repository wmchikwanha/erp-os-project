
-- 1. Approval workflow columns on outage_action_plans
DO $$ BEGIN
  CREATE TYPE public.plan_approval_status AS ENUM ('pending_approval','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.outage_action_plans
  ADD COLUMN IF NOT EXISTS approval_status public.plan_approval_status NOT NULL DEFAULT 'pending_approval',
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Helper: is the user a manager or admin?
CREATE OR REPLACE FUNCTION public.is_manager_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','procurement_manager','hr_manager','project_manager','finance_manager')
  )
$$;

-- Allow managers/admins to update plans they don't own (for approval)
DROP POLICY IF EXISTS "Managers can review action plans" ON public.outage_action_plans;
CREATE POLICY "Managers can review action plans"
  ON public.outage_action_plans
  FOR UPDATE
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Managers can view all action plans" ON public.outage_action_plans;
CREATE POLICY "Managers can view all action plans"
  ON public.outage_action_plans
  FOR SELECT
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- 2. Audit log
CREATE TABLE IF NOT EXISTS public.sae_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  actor_id uuid,
  summary text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.sae_audit_log TO authenticated;
GRANT ALL ON public.sae_audit_log TO service_role;

ALTER TABLE public.sae_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view audit log"
  ON public.sae_audit_log FOR SELECT TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "System and users can insert audit rows"
  ON public.sae_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS sae_audit_log_entity_idx ON public.sae_audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sae_audit_log_actor_idx ON public.sae_audit_log(actor_id, created_at DESC);

-- 3. Audit trigger functions
CREATE OR REPLACE FUNCTION public.audit_outage_action_plans()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _action text;
  _summary text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'plan.created';
    _summary := 'Created plan: ' || COALESCE(NEW.title, '(untitled)');
    INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, after_data)
    VALUES ('outage_action_plan', NEW.id, _action, auth.uid(), _summary, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, before_data, after_data)
      VALUES ('outage_action_plan', NEW.id, 'plan.status_changed', auth.uid(),
        'Status: ' || OLD.status || ' → ' || NEW.status, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
      INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, before_data, after_data)
      VALUES ('outage_action_plan', NEW.id, 'plan.approval_changed', auth.uid(),
        'Approval: ' || OLD.approval_status || ' → ' || NEW.approval_status ||
        CASE WHEN NEW.rejection_reason IS NOT NULL AND NEW.approval_status = 'rejected'
             THEN ' (' || NEW.rejection_reason || ')' ELSE '' END,
        to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
      INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, before_data, after_data)
      VALUES ('outage_action_plan', NEW.id, 'plan.assigned', auth.uid(),
        'Assigned to: ' || COALESCE(NEW.assigned_to::text, 'unassigned'), to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, before_data)
    VALUES ('outage_action_plan', OLD.id, 'plan.deleted', auth.uid(),
      'Deleted plan: ' || COALESCE(OLD.title, '(untitled)'), to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_audit_outage_action_plans ON public.outage_action_plans;
CREATE TRIGGER trg_audit_outage_action_plans
AFTER INSERT OR UPDATE OR DELETE ON public.outage_action_plans
FOR EACH ROW EXECUTE FUNCTION public.audit_outage_action_plans();

CREATE OR REPLACE FUNCTION public.audit_shift_collision_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, after_data)
    VALUES ('shift_collision_rules', NEW.id, 'rules.created', auth.uid(), 'Collision rules created', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, before_data, after_data)
    VALUES ('shift_collision_rules', NEW.id, 'rules.updated', auth.uid(),
      'Rules updated (min_overlap=' || NEW.min_overlap_hours || 'h, urgent≥' || NEW.severity_threshold_hours || 'h)',
      to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, before_data)
    VALUES ('shift_collision_rules', OLD.id, 'rules.deleted', auth.uid(), 'Rules deleted', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_audit_shift_collision_rules ON public.shift_collision_rules;
CREATE TRIGGER trg_audit_shift_collision_rules
AFTER INSERT OR UPDATE OR DELETE ON public.shift_collision_rules
FOR EACH ROW EXECUTE FUNCTION public.audit_shift_collision_rules();

CREATE OR REPLACE FUNCTION public.audit_sae_overrides()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, after_data)
    VALUES ('sae_override', NEW.id, 'override.created', auth.uid(),
      'Override on ' || NEW.recommendation_key || COALESCE(' — ' || NEW.reason, ''), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.sae_audit_log(entity_type, entity_id, action, actor_id, summary, before_data)
    VALUES ('sae_override', OLD.id, 'override.deleted', auth.uid(),
      'Override removed for ' || OLD.recommendation_key, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_audit_sae_overrides ON public.sae_overrides;
CREATE TRIGGER trg_audit_sae_overrides
AFTER INSERT OR DELETE ON public.sae_overrides
FOR EACH ROW EXECUTE FUNCTION public.audit_sae_overrides();
