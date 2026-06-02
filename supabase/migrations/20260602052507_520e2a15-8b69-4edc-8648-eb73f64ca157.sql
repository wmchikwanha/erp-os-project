
ALTER TABLE public.supplier_quotes
  ADD COLUMN IF NOT EXISTS lead_time_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplier_name text;

ALTER TABLE public.tax_obligations
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS reminder_days_before integer NOT NULL DEFAULT 7;

CREATE TABLE IF NOT EXISTS public.notice_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notice_id uuid NOT NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, notice_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notice_acknowledgements TO authenticated;
GRANT ALL ON public.notice_acknowledgements TO service_role;

ALTER TABLE public.notice_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own acknowledgements"
ON public.notice_acknowledgements
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all acknowledgements"
ON public.notice_acknowledgements
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
