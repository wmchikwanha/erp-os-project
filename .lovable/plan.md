

# Fix: Employees Not Visible to Admin (and Projects, HR pages broken)

## Root Cause Found

The Postgres error logs show hundreds of **"permission denied for table users"** errors. This is caused by one RLS policy on the `employees` table:

```sql
-- This policy has a subquery to auth.users, which the authenticated role CANNOT access
"Employees can view own employee record"
USING (
  user_id = auth.uid() 
  OR email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
)
```

The `authenticated` database role does not have SELECT permission on `auth.users`. So every time ANY query touches the `employees` table, PostgreSQL tries to evaluate this subquery and fails with "permission denied." This breaks:

- **HR page**: Direct query to employees fails, plus leave_requests, reviews, and documents all join with employees
- **Projects page**: The query `select('*, deals(title), employees(name)')` joins employees via manager_id FK
- **Slow loading**: The repeated permission errors cause timeouts and retries

Products, contacts, and basic assets work because they don't touch the employees table.

## Additional Issue: Employee Self-Access

The edge function creates employees with `user_id = admin's ID` (so admin can manage them via RLS). But the employee's own auth user ID is never stored on the employee record, so employees can only find their record by email match -- which is what the broken policy was trying to do.

## Fix Plan

### Step 1: Database Migration

a) **Create a SECURITY DEFINER function** to safely get the current user's email without directly querying auth.users:

```sql
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;
```

b) **Drop and recreate the broken RLS policy** on employees:

```sql
DROP POLICY "Employees can view own employee record" ON public.employees;

CREATE POLICY "Employees can view own employee record"
ON public.employees FOR SELECT
USING (
  user_id = auth.uid() 
  OR email = public.get_auth_email()
);
```

This gives the same behavior (employees can find their record by email) but without the permission error.

### Step 2: Update Edge Function

Store the new auth user's ID on the employee record so we have a direct link. Update `create-employee-account` to set a link between the employee record and their auth account, enabling future RLS improvements.

Currently the edge function does:
```js
user_id: caller.id  // admin's ID
```

After the employee's auth account is created, also store their user ID by updating the employee row.

### Step 3: No Frontend Changes Needed

The queries and UI code are all correct. Once the RLS policy is fixed, employees and projects will render immediately.

---

## Technical Details

### Database Migration SQL

```sql
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
```

### Files to Modify

| File | Change |
|------|--------|
| Database migration (new) | Create `get_auth_email()` function and fix RLS policy |

### What This Fixes

- Admin can see all employees they created (via `user_id = auth.uid()`)
- Employees can see their own record (via email match using safe function)
- HR page loads correctly (all sub-queries stop erroring)
- Projects page loads correctly (employees join stops erroring)
- Performance reviews employee dropdown populates correctly
- Documents tab works for admin

