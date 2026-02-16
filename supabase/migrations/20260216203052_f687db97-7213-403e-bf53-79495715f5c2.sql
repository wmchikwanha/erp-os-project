
-- Expand app_role enum with department-level roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'procurement_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_manager';
