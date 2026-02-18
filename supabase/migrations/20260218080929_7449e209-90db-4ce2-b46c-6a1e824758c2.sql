
-- Managers can SELECT leave requests of their direct reports
CREATE POLICY "Managers can view direct reports leave_requests"
ON public.leave_requests
FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    WHERE e.manager_id IN (
      SELECT m.id FROM public.employees m
      WHERE m.email = public.get_auth_email()
    )
  )
);

-- Managers can UPDATE (approve/reject) leave requests of their direct reports
CREATE POLICY "Managers can update direct reports leave_requests"
ON public.leave_requests
FOR UPDATE
TO authenticated
USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    WHERE e.manager_id IN (
      SELECT m.id FROM public.employees m
      WHERE m.email = public.get_auth_email()
    )
  )
)
WITH CHECK (
  employee_id IN (
    SELECT e.id FROM public.employees e
    WHERE e.manager_id IN (
      SELECT m.id FROM public.employees m
      WHERE m.email = public.get_auth_email()
    )
  )
);

-- Managers can view performance reviews of their direct reports
CREATE POLICY "Managers can view direct reports reviews"
ON public.performance_reviews
FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT e.id FROM public.employees e
    WHERE e.manager_id IN (
      SELECT m.id FROM public.employees m
      WHERE m.email = public.get_auth_email()
    )
  )
);

-- Managers can SELECT their direct reports in the employees table
CREATE POLICY "Managers can view direct reports"
ON public.employees
FOR SELECT
TO authenticated
USING (
  manager_id IN (
    SELECT m.id FROM public.employees m
    WHERE m.email = public.get_auth_email()
  )
);
