
-- Allow employees to view their own employee record (where user_id in the employees table might be their own or where email matches)
CREATE POLICY "Employees can view own employee record"
ON public.employees
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
