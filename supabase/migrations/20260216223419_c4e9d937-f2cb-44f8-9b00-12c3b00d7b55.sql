
-- 1. Create helper function (SECURITY DEFINER bypasses auth.users restriction)
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- 2. Fix the broken employees policy
DROP POLICY IF EXISTS "Employees can view own employee record" ON public.employees;
CREATE POLICY "Employees can view own employee record"
ON public.employees FOR SELECT
USING (user_id = auth.uid() OR email = public.get_auth_email());
