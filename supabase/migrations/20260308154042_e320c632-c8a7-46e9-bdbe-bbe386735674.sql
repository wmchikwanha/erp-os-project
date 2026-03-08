-- Timesheets table
CREATE TABLE public.timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  work_date date NOT NULL,
  hours_worked numeric NOT NULL DEFAULT 0,
  description text,
  status text NOT NULL DEFAULT 'draft',
  approved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all timesheets" ON public.timesheets FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can CRUD own timesheets" ON public.timesheets FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view direct reports timesheets" ON public.timesheets FOR SELECT TO authenticated
  USING (employee_id IN (SELECT e.id FROM employees e WHERE e.manager_id = get_my_employee_id()));

CREATE POLICY "Managers can update direct reports timesheets" ON public.timesheets FOR UPDATE TO authenticated
  USING (employee_id IN (SELECT e.id FROM employees e WHERE e.manager_id = get_my_employee_id()))
  WITH CHECK (employee_id IN (SELECT e.id FROM employees e WHERE e.manager_id = get_my_employee_id()));

CREATE POLICY "Project managers can manage timesheets" ON public.timesheets FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'project_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'project_manager'::app_role));

-- Expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'general',
  amount numeric NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  receipt_path text,
  status text NOT NULL DEFAULT 'pending',
  approved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all expenses" ON public.expenses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can CRUD own expenses" ON public.expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view direct reports expenses" ON public.expenses FOR SELECT TO authenticated
  USING (employee_id IN (SELECT e.id FROM employees e WHERE e.manager_id = get_my_employee_id()));

CREATE POLICY "Managers can update direct reports expenses" ON public.expenses FOR UPDATE TO authenticated
  USING (employee_id IN (SELECT e.id FROM employees e WHERE e.manager_id = get_my_employee_id()))
  WITH CHECK (employee_id IN (SELECT e.id FROM employees e WHERE e.manager_id = get_my_employee_id()));

CREATE POLICY "Finance managers can view expenses" ON public.expenses FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'finance_manager'::app_role));