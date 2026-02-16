
-- 1. Attach trigger for handle_new_user on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Attach trigger for handle_user_role_on_signup on auth.users
CREATE TRIGGER on_auth_user_role_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_role_on_signup();

-- 3. Bootstrap: insert admin role for existing user
INSERT INTO public.user_roles (user_id, role)
VALUES ('abee637b-780b-44cd-97ba-9847beac6b50', 'admin')
ON CONFLICT DO NOTHING;

-- 4. Bootstrap: create profile for existing admin user if missing
INSERT INTO public.profiles (user_id, full_name)
VALUES ('abee637b-780b-44cd-97ba-9847beac6b50', 'Admin')
ON CONFLICT DO NOTHING;

-- 5. First-admin bootstrap function
CREATE OR REPLACE FUNCTION public.handle_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_first_admin_assignment
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_first_admin();

-- 6. RLS: Department manager SELECT policies
CREATE POLICY "Procurement managers can view purchase_orders"
  ON public.purchase_orders FOR SELECT
  USING (has_role(auth.uid(), 'procurement_manager'));

CREATE POLICY "Procurement managers can view PO items"
  ON public.purchase_order_items FOR SELECT
  USING (has_role(auth.uid(), 'procurement_manager'));

CREATE POLICY "Procurement managers can view products"
  ON public.products FOR SELECT
  USING (has_role(auth.uid(), 'procurement_manager'));

CREATE POLICY "Procurement managers can view assets"
  ON public.assets FOR SELECT
  USING (has_role(auth.uid(), 'procurement_manager'));

CREATE POLICY "HR managers can view employees"
  ON public.employees FOR SELECT
  USING (has_role(auth.uid(), 'hr_manager'));

CREATE POLICY "HR managers can view leave_requests"
  ON public.leave_requests FOR SELECT
  USING (has_role(auth.uid(), 'hr_manager'));

CREATE POLICY "HR managers can view reviews"
  ON public.performance_reviews FOR SELECT
  USING (has_role(auth.uid(), 'hr_manager'));

CREATE POLICY "HR managers can view documents"
  ON public.employee_documents FOR SELECT
  USING (has_role(auth.uid(), 'hr_manager'));

CREATE POLICY "Project managers can view projects"
  ON public.projects FOR SELECT
  USING (has_role(auth.uid(), 'project_manager'));

CREATE POLICY "Finance managers can view invoices"
  ON public.invoices FOR SELECT
  USING (has_role(auth.uid(), 'finance_manager'));

CREATE POLICY "Finance managers can view payments"
  ON public.payments FOR SELECT
  USING (has_role(auth.uid(), 'finance_manager'));
