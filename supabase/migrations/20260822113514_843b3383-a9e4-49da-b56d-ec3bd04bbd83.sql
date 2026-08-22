CREATE TABLE IF NOT EXISTS public.demo_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  demo_user_id uuid NOT NULL
);
GRANT SELECT ON public.demo_config TO authenticated, anon;
GRANT ALL ON public.demo_config TO service_role;
ALTER TABLE public.demo_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view demo config" ON public.demo_config FOR SELECT USING (true);

INSERT INTO public.demo_config (id, demo_user_id)
VALUES (true, 'abee637b-780b-44cd-97ba-9847beac6b50')
ON CONFLICT (id) DO UPDATE SET demo_user_id = EXCLUDED.demo_user_id;

CREATE OR REPLACE FUNCTION public.is_demo_row(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.demo_config c WHERE c.demo_user_id = _user_id)
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'contacts','deals','activities','products','invoices','payments','projects','employees',
    'leave_requests','timesheets','expenses','sites','assets','maintenance_logs',
    'equipment_checkouts','inventory_consumption','purchase_orders','candidates',
    'job_positions','supplier_quotes','material_baskets','tax_obligations',
    'outage_action_plans','performance_reviews','employee_documents','shift_collision_rules'
  ]
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Demo sample data is viewable" ON public.%I;
       CREATE POLICY "Demo sample data is viewable" ON public.%I FOR SELECT TO authenticated USING (public.is_demo_row(user_id));', t, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Demo sample data is viewable" ON public.purchase_order_items;
CREATE POLICY "Demo sample data is viewable" ON public.purchase_order_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.po_id AND public.is_demo_row(po.user_id)));