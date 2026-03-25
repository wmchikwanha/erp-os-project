
-- Job Positions table
CREATE TABLE public.job_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  department text NOT NULL DEFAULT 'Unassigned',
  description text,
  requirements text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all job_positions" ON public.job_positions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR managers can manage all job_positions" ON public.job_positions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'hr_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'hr_manager'::app_role));

CREATE POLICY "Users can CRUD own job_positions" ON public.job_positions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Candidates table
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  position_id uuid REFERENCES public.job_positions(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  department text,
  cv_file_path text,
  cv_file_size integer,
  status text NOT NULL DEFAULT 'new',
  notes text,
  applied_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all candidates" ON public.candidates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR managers can manage all candidates" ON public.candidates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'hr_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'hr_manager'::app_role));

CREATE POLICY "Users can CRUD own candidates" ON public.candidates FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for CVs
INSERT INTO storage.buckets (id, name, public) VALUES ('candidate-cvs', 'candidate-cvs', false);

-- Storage RLS policies
CREATE POLICY "Admins can manage candidate CVs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'candidate-cvs' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'candidate-cvs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR managers can manage candidate CVs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'candidate-cvs' AND has_role(auth.uid(), 'hr_manager'::app_role))
  WITH CHECK (bucket_id = 'candidate-cvs' AND has_role(auth.uid(), 'hr_manager'::app_role));

CREATE POLICY "Users can manage own candidate CVs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'candidate-cvs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'candidate-cvs' AND (storage.foldername(name))[1] = auth.uid()::text);
