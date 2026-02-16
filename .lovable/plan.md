

# Fix Plan: Role System, Data Rendering, and Access Control

## Problems Identified

1. **Missing triggers**: Functions `handle_new_user` and `handle_user_role_on_signup` exist but have no triggers on `auth.users`. Profiles and roles are never auto-created.
2. **Empty `user_roles`**: The admin (wmchikwanha71@gmail.com) has no role, so all `has_role(auth.uid(), 'admin')` RLS checks fail -- blocking invitations, documents, and reviews.
3. **Employee/Project rendering**: These likely work for basic SELECT but related HR sub-features (reviews dropdown, documents) silently return empty because of failed admin RLS checks.
4. **New signups default to admin UI**: `App.tsx` treats any user without role='employee' as admin.
5. **No granular roles**: Only 'admin' and 'employee' exist. No way to give an employee access to a specific department tab.

---

## Step 1: Database Migration -- Fix Triggers, Roles, and Bootstrap

**Create migration with:**

a) **Attach missing triggers to `auth.users`**:
   - `handle_new_user` -> creates profile on signup
   - `handle_user_role_on_signup` -> assigns role if invitation exists

b) **Insert admin role** for existing user (wmchikwanha71@gmail.com, ID `abee637b-780b-44cd-97ba-9847beac6b50`):
   ```sql
   INSERT INTO user_roles (user_id, role) 
   VALUES ('abee637b-780b-44cd-97ba-9847beac6b50', 'admin')
   ON CONFLICT DO NOTHING;
   ```

c) **Create missing profile** for the admin user.

d) **Expand `app_role` enum** to include department-level roles:
   - `procurement_manager`
   - `hr_manager`
   - `project_manager`
   - `finance_manager`

e) **Add `department_access` column** to `employees` table (text array) to store which sections an employee can access.

f) **Create a first-admin bootstrap trigger**: If `user_roles` is empty when a new user signs up, auto-assign them as admin.

---

## Step 2: Update `useRole` Hook

- Return the full role object (not just 'admin'|'employee')
- Add a `useDepartmentAccess` hook that returns which sections the logged-in employee can access based on their role
- Support the new enum values

---

## Step 3: Fix `App.tsx` Routing

- When `role` is null (no role assigned), show a "pending approval" screen instead of admin UI
- For `admin` role: show all routes (current behavior)
- For `employee` role: show base employee portal
- For department roles (e.g. `procurement_manager`): show employee portal plus the specific department route (e.g. `/procurement`)

Updated routing logic:
```text
role === 'admin'                -> all routes
role === 'procurement_manager'  -> employee portal + /procurement
role === 'hr_manager'           -> employee portal + /hr (read-only)
role === 'project_manager'      -> employee portal + /projects
role === 'finance_manager'      -> employee portal + /invoices
role === 'employee'             -> employee portal only
role === null                   -> "Pending approval" screen
```

---

## Step 4: Update `AppLayout.tsx` Navigation

- Build nav items dynamically based on role
- Department managers see their base employee portal tab plus their department tab
- Admins see everything

---

## Step 5: Update `InviteEmployeeDialog`

- Add a role selector dropdown so admins can choose which role to assign to the invited employee
- Pass the selected role to `useCreateInvitation`

---

## Step 6: Update `useCreateInvitation` Hook

- Accept a `role` parameter instead of hardcoding `'employee'`
- Pass it to the invitations insert

---

## Step 7: Update `handle_user_role_on_signup` Function

- Already reads role from invitations table, so it will automatically assign the correct role when the new enum values are used

---

## Step 8: Fix RLS for Department Roles

Add SELECT policies on relevant tables so department managers can read their section's data:
- `procurement_manager` can SELECT on `purchase_orders`, `purchase_order_items`, `products`, `assets`
- `hr_manager` can SELECT on `employees`, `leave_requests`, `performance_reviews`, `employee_documents`
- `project_manager` can SELECT on `projects`
- `finance_manager` can SELECT on `invoices`, `payments`

---

## Technical Details

### Files to Modify
| File | Change |
|------|--------|
| `src/hooks/useRole.ts` | Expand AppRole type, add department access helper |
| `src/App.tsx` | Role-based routing with department access, pending screen |
| `src/components/AppLayout.tsx` | Dynamic nav items per role |
| `src/components/forms/InviteEmployeeDialog.tsx` | Add role selector |
| `src/hooks/useCrmData.ts` | Update `useCreateInvitation` to accept role param |
| `src/pages/EmployeePortal.tsx` | Minor updates for department managers |

### New Migration SQL
- Attach 2 triggers to `auth.users`
- Insert admin role + profile for existing user
- Expand `app_role` enum with 4 new values
- Add RLS policies for department roles
- Add first-admin bootstrap function/trigger

