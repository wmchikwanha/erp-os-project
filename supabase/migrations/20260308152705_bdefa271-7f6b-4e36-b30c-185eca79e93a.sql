
-- 1. Add 'reason' column to leave_requests
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS reason text;

-- 2. Update performance_reviews RLS: drop old broad policy, add scoped policies
DROP POLICY IF EXISTS "All managers can CRUD reviews" ON public.performance_reviews;

-- Admin full access
CREATE POLICY "Admins can CRUD reviews"
ON public.performance_reviews FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- HR managers full access
CREATE POLICY "HR managers can CRUD reviews"
ON public.performance_reviews FOR ALL TO authenticated
USING (has_role(auth.uid(), 'hr_manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr_manager'::app_role));

-- Department managers can INSERT reviews and manage their own (reviewer_id = self)
CREATE POLICY "Managers can insert reviews"
ON public.performance_reviews FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'procurement_manager'::app_role) OR
   has_role(auth.uid(), 'project_manager'::app_role) OR
   has_role(auth.uid(), 'finance_manager'::app_role))
  AND reviewer_id = auth.uid()
);

CREATE POLICY "Managers can manage own reviews"
ON public.performance_reviews FOR ALL TO authenticated
USING (
  (has_role(auth.uid(), 'procurement_manager'::app_role) OR
   has_role(auth.uid(), 'project_manager'::app_role) OR
   has_role(auth.uid(), 'finance_manager'::app_role))
  AND reviewer_id = auth.uid()
)
WITH CHECK (
  (has_role(auth.uid(), 'procurement_manager'::app_role) OR
   has_role(auth.uid(), 'project_manager'::app_role) OR
   has_role(auth.uid(), 'finance_manager'::app_role))
  AND reviewer_id = auth.uid()
);

-- Update "Managers can view direct reports reviews" to scope by manager_id
DROP POLICY IF EXISTS "Managers can view direct reports reviews" ON public.performance_reviews;
CREATE POLICY "Managers can view direct reports reviews"
ON public.performance_reviews FOR SELECT TO authenticated
USING (
  employee_id IN (
    SELECT e.id FROM employees e WHERE e.manager_id = get_my_employee_id()
  )
);

-- 3. Restrict employee_documents: remove employee insert policy, add manager/admin only insert
DROP POLICY IF EXISTS "Employees can insert own documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Employees can view own documents" ON public.employee_documents;

-- Managers can CRUD docs for their direct reports
CREATE POLICY "Managers can CRUD direct reports documents"
ON public.employee_documents FOR ALL TO authenticated
USING (
  employee_id IN (
    SELECT e.id FROM employees e WHERE e.manager_id = get_my_employee_id()
  )
)
WITH CHECK (
  employee_id IN (
    SELECT e.id FROM employees e WHERE e.manager_id = get_my_employee_id()
  )
);

-- HR managers can CRUD all documents
DROP POLICY IF EXISTS "HR managers can view documents" ON public.employee_documents;
CREATE POLICY "HR managers can CRUD documents"
ON public.employee_documents FOR ALL TO authenticated
USING (has_role(auth.uid(), 'hr_manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr_manager'::app_role));
