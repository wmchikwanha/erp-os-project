
-- 1. Create SECURITY DEFINER helper to get current user's employee id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
  LIMIT 1
$$;

-- 2. Drop recursive policies on employees
DROP POLICY IF EXISTS "Managers can view direct reports" ON public.employees;

-- 3. Add admin policy on employees
CREATE POLICY "Admins can manage all employees"
ON public.employees
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Recreate manager policy on employees without recursion
CREATE POLICY "Managers can view direct reports"
ON public.employees
FOR SELECT
TO authenticated
USING (manager_id = public.get_my_employee_id());

-- 5. Drop recursive policies on leave_requests
DROP POLICY IF EXISTS "Managers can view direct reports leave_requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Managers can update direct reports leave_requests" ON public.leave_requests;

-- 6. Recreate manager policies on leave_requests without recursion
CREATE POLICY "Managers can view direct reports leave_requests"
ON public.leave_requests
FOR SELECT
TO authenticated
USING (employee_id IN (
  SELECT e.id FROM public.employees e WHERE e.manager_id = public.get_my_employee_id()
));

CREATE POLICY "Managers can update direct reports leave_requests"
ON public.leave_requests
FOR UPDATE
TO authenticated
USING (employee_id IN (
  SELECT e.id FROM public.employees e WHERE e.manager_id = public.get_my_employee_id()
))
WITH CHECK (employee_id IN (
  SELECT e.id FROM public.employees e WHERE e.manager_id = public.get_my_employee_id()
));

-- 7. Drop recursive policy on performance_reviews
DROP POLICY IF EXISTS "Managers can view direct reports reviews" ON public.performance_reviews;

-- 8. Recreate manager policy on performance_reviews without recursion
CREATE POLICY "Managers can view direct reports reviews"
ON public.performance_reviews
FOR SELECT
TO authenticated
USING (employee_id IN (
  SELECT e.id FROM public.employees e WHERE e.manager_id = public.get_my_employee_id()
));
