CREATE POLICY "Authenticated add schedule" ON public.load_shedding_schedule FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update schedule" ON public.load_shedding_schedule FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete schedule" ON public.load_shedding_schedule FOR DELETE TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.load_shedding_schedule TO authenticated;