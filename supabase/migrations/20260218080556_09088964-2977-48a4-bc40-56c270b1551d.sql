
-- Allow admins full access to all leave requests
CREATE POLICY "Admins can manage all leave_requests"
ON public.leave_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow HR managers to update leave requests (approve/reject)
CREATE POLICY "HR managers can update leave_requests"
ON public.leave_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'hr_manager'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'hr_manager'::app_role));
