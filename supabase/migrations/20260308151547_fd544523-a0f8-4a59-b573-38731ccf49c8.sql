
-- 1. Sites/Locations table
CREATE TABLE public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  city text,
  state text,
  country text DEFAULT 'Australia',
  manager_id uuid REFERENCES public.employees(id),
  status text NOT NULL DEFAULT 'active',
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all sites" ON public.sites FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can CRUD own sites" ON public.sites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Project managers can view sites" ON public.sites FOR SELECT USING (has_role(auth.uid(), 'project_manager'::app_role));
CREATE POLICY "Procurement managers can view sites" ON public.sites FOR SELECT USING (has_role(auth.uid(), 'procurement_manager'::app_role));

-- 2. Work Schedules table
CREATE TABLE public.work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  schedule_date date NOT NULL,
  shift_start time,
  shift_end time,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all work_schedules" ON public.work_schedules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can CRUD own work_schedules" ON public.work_schedules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Project managers can manage work_schedules" ON public.work_schedules FOR ALL USING (has_role(auth.uid(), 'project_manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'project_manager'::app_role));
CREATE POLICY "Employees can view own schedules" ON public.work_schedules FOR SELECT USING (employee_id = get_my_employee_id());

-- 3. Equipment Checkouts table (with digital sign-off)
CREATE TABLE public.equipment_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  checked_out_to uuid REFERENCES public.employees(id) NOT NULL,
  checked_out_by uuid REFERENCES public.employees(id),
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  checkout_date timestamptz NOT NULL DEFAULT now(),
  expected_return_date date,
  actual_return_date timestamptz,
  checkout_condition text DEFAULT 'Good',
  return_condition text,
  checkout_notes text,
  return_notes text,
  acknowledged_by_worker boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  status text NOT NULL DEFAULT 'checked-out',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all equipment_checkouts" ON public.equipment_checkouts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can CRUD own equipment_checkouts" ON public.equipment_checkouts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Procurement managers can manage equipment_checkouts" ON public.equipment_checkouts FOR ALL USING (has_role(auth.uid(), 'procurement_manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'procurement_manager'::app_role));
CREATE POLICY "Workers can view own checkouts" ON public.equipment_checkouts FOR SELECT USING (checked_out_to = get_my_employee_id());
CREATE POLICY "Workers can acknowledge checkouts" ON public.equipment_checkouts FOR UPDATE USING (checked_out_to = get_my_employee_id()) WITH CHECK (checked_out_to = get_my_employee_id());

-- 4. Maintenance Logs table
CREATE TABLE public.maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  maintenance_type text NOT NULL DEFAULT 'inspection',
  description text,
  performed_by text,
  performed_date date NOT NULL DEFAULT CURRENT_DATE,
  next_due_date date,
  cost numeric DEFAULT 0,
  downtime_hours numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all maintenance_logs" ON public.maintenance_logs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can CRUD own maintenance_logs" ON public.maintenance_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Procurement managers can manage maintenance_logs" ON public.maintenance_logs FOR ALL USING (has_role(auth.uid(), 'procurement_manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'procurement_manager'::app_role));

-- 5. Inventory Consumption table
CREATE TABLE public.inventory_consumption (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  consumed_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  consumption_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_consumption ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all inventory_consumption" ON public.inventory_consumption FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can CRUD own inventory_consumption" ON public.inventory_consumption FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Procurement managers can manage inventory_consumption" ON public.inventory_consumption FOR ALL USING (has_role(auth.uid(), 'procurement_manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'procurement_manager'::app_role));
CREATE POLICY "Project managers can log consumption" ON public.inventory_consumption FOR ALL USING (has_role(auth.uid(), 'project_manager'::app_role)) WITH CHECK (has_role(auth.uid(), 'project_manager'::app_role));

-- Add site_id to assets for site-level allocation
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Enable realtime for schedules and checkouts
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment_checkouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_schedules;
