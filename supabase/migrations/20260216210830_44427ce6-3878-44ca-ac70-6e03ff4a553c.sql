
-- Add app_role column to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS app_role public.app_role;
