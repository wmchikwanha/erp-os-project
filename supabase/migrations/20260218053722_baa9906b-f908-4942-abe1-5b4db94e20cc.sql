
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can CRUD reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "HR managers can view reviews" ON public.performance_reviews;

-- All managers and admins can CRUD reviews
CREATE POLICY "All managers can CRUD reviews"
ON public.performance_reviews
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'hr_manager'::app_role) OR
  public.has_role(auth.uid(), 'procurement_manager'::app_role) OR
  public.has_role(auth.uid(), 'project_manager'::app_role) OR
  public.has_role(auth.uid(), 'finance_manager'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'hr_manager'::app_role) OR
  public.has_role(auth.uid(), 'procurement_manager'::app_role) OR
  public.has_role(auth.uid(), 'project_manager'::app_role) OR
  public.has_role(auth.uid(), 'finance_manager'::app_role)
);
