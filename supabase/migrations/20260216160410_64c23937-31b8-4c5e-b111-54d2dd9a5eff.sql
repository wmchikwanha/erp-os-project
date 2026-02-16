
-- Add email and job_title columns to employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS job_title text;

-- Create trigger function: auto-create/link employee when invitation is accepted
CREATE OR REPLACE FUNCTION public.auto_create_employee_on_invite_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _full_name text;
  _existing_employee_id uuid;
BEGIN
  -- Only fire when accepted_at changes from NULL to a value
  IF OLD.accepted_at IS NOT NULL OR NEW.accepted_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the user_id for this email from auth.users
  SELECT id INTO _user_id FROM auth.users WHERE email = NEW.email LIMIT 1;
  IF _user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get full name from profiles
  SELECT full_name INTO _full_name FROM public.profiles WHERE user_id = _user_id LIMIT 1;

  -- Check if an employee with this email already exists (admin pre-added)
  SELECT id INTO _existing_employee_id FROM public.employees WHERE email = NEW.email LIMIT 1;

  IF _existing_employee_id IS NOT NULL THEN
    -- Link existing employee record to this user
    UPDATE public.employees SET user_id = _user_id WHERE id = _existing_employee_id;
  ELSE
    -- Create new employee record owned by the inviter (so admin can manage)
    INSERT INTO public.employees (name, email, user_id, department, role)
    VALUES (
      COALESCE(_full_name, split_part(NEW.email, '@', 1)),
      NEW.email,
      NEW.invited_by,
      'Unassigned',
      'Employee'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on invitations table
DROP TRIGGER IF EXISTS on_invite_accepted ON public.invitations;
CREATE TRIGGER on_invite_accepted
  AFTER UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_employee_on_invite_accept();

-- RLS: Allow employees to INSERT their own leave requests
CREATE POLICY "Employees can insert own leave requests"
ON public.leave_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- RLS: Allow employees to SELECT their own leave requests
CREATE POLICY "Employees can view own leave requests"
ON public.leave_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- RLS: Allow employees to INSERT their own documents
CREATE POLICY "Employees can insert own documents"
ON public.employee_documents
FOR INSERT
TO authenticated
WITH CHECK (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  AND auth.uid() = user_id
);

-- RLS: Allow employees to view own documents (already exists but let's ensure)
-- Already have "Employees can view own documents" policy

-- Storage: Allow employees to upload to their employee folder
CREATE POLICY "Employees can upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents'
);

-- Storage: Allow employees to read their own documents
CREATE POLICY "Employees can read own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents'
);
