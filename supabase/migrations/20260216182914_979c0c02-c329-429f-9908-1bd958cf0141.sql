
-- Fix employees RLS: drop restrictive policies, recreate as permissive
DROP POLICY IF EXISTS "Users can CRUD own employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view own employee record" ON public.employees;

CREATE POLICY "Users can CRUD own employees"
ON public.employees FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employees can view own employee record"
ON public.employees FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
);
