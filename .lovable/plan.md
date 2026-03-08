

## Fix: Employee Visibility and Manager Dropdown

### Problem
The `Managers can view direct reports` RLS policy on the `employees` table contains a subquery that reads from `employees` itself:
```sql
manager_id IN (SELECT m.id FROM employees m WHERE m.email = get_auth_email())
```
This causes **recursive RLS evaluation** -- when PostgreSQL evaluates this policy, the inner query triggers RLS on the same table again, which can cause silent failures (empty results). This breaks employee visibility for all roles.

The same recursive pattern exists on `leave_requests` and `performance_reviews` manager policies.

Additionally, there is no explicit admin policy on the `employees` table -- the admin only sees records because `user_id` happens to match.

### Solution

#### 1. Create a SECURITY DEFINER helper function
A new function `get_my_employee_id()` that returns the current user's employee ID without triggering RLS:

```sql
CREATE OR REPLACE FUNCTION public.get_my_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
  LIMIT 1
$$;
```

#### 2. Update employees table policies
- Add **"Admins can manage all employees"** (FOR ALL) policy
- Drop and recreate **"Managers can view direct reports"** using `get_my_employee_id()` to avoid recursion:

```sql
USING (manager_id = public.get_my_employee_id())
```

#### 3. Update leave_requests and performance_reviews manager policies
Drop and recreate the manager policies to use the new non-recursive function:

```sql
-- Instead of the recursive subquery:
employee_id IN (
  SELECT e.id FROM employees e
  WHERE e.manager_id = public.get_my_employee_id()
)
```

#### 4. No frontend code changes needed
The `useEmployees()` hook and `EmployeeFormDialog` already handle `manager_id` correctly. The Select Manager dropdown will work once the admin can see employees again.

### Technical Details (Database Migration)

Single migration that:
1. Creates `get_my_employee_id()` SECURITY DEFINER function
2. Drops recursive policies: `Managers can view direct reports` (employees), `Managers can view direct reports leave_requests` (leave_requests), `Managers can update direct reports leave_requests` (leave_requests), `Managers can view direct reports reviews` (performance_reviews)
3. Creates admin policy on employees: `Admins can manage all employees` (FOR ALL)
4. Recreates all manager policies using `get_my_employee_id()` instead of recursive subqueries

