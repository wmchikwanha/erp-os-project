DROP POLICY IF EXISTS "Demo sample data is viewable" ON public.work_schedules;
CREATE POLICY "Demo sample data is viewable" ON public.work_schedules FOR SELECT TO authenticated
USING (public.is_demo_row(user_id));