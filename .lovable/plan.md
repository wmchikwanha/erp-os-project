

# Simplified Employee Onboarding: Admin-Driven Account Creation

## Current Problems

1. **Admin adds employee** -- record saves to DB but doesn't always show in HR UI (RLS timing/query issues)
2. **Self-signup leads to dead end** -- new user sees "Pending Approval" with no way for admin to approve
3. **Two disconnected flows** -- adding an employee record and inviting are separate steps that don't link together

## New Approach: Admin Creates Everything

The admin adds an employee, picks their access role, and the system automatically creates their login account and sends them a "set your password" email. No self-signup needed.

```text
Admin adds employee (name, email, role)
         |
         v
Backend function creates auth account
         |
         v
Employee receives "Set Password" email
         |
         v
Employee sets password and signs in
         |
         v
System routes them based on their role
```

## What Changes

### 1. New backend function: `create-employee-account`

An edge function that the admin calls when adding an employee. It:
- Creates the auth user via admin API (with a random password)
- Inserts a row into `user_roles` with the selected role
- Sends a password reset email so the employee can set their own password
- Returns the new user ID to link to the employee record

### 2. Update Employee Form

- Add a required **email** field
- Add an **Access Role** dropdown (Employee, Procurement Manager, HR Manager, Project Manager, Finance Manager)
- When saving a new employee, call the edge function instead of just inserting into `employees` table

### 3. Update `useUpsertEmployee` hook

- For new employees: call the `create-employee-account` edge function, which handles auth user + role + employee record creation all in one
- For edits: keep the current direct update

### 4. Remove self-signup from Auth page

- Auth page becomes **login + forgot password only**
- Remove the "Sign Up" option since all accounts are admin-created
- Keep the "Pending Approval" screen as a fallback safety net (in case someone somehow signs up without being added)

### 5. Database: add `app_role` column to employees

- Add `app_role` column (type `app_role` enum, nullable) to the `employees` table
- This stores which system access level the employee has

### 6. Clean up invitation system

- Keep the invitations table/UI as optional (for cases where admin wants to pre-authorize an email before adding the full employee record)
- The primary flow is now: admin adds employee -> account created automatically

## Technical Details

### Files to create
| File | Purpose |
|------|---------|
| `supabase/functions/create-employee-account/index.ts` | Edge function: creates auth user, assigns role, creates employee record |

### Files to modify
| File | Change |
|------|--------|
| `src/components/forms/EmployeeFormDialog.tsx` | Add access role dropdown, make email required for new employees |
| `src/hooks/useCrmData.ts` | Update `useUpsertEmployee` to call edge function for new employees |
| `src/pages/Auth.tsx` | Remove signup mode, keep login + forgot password only |

### Database migration
- Add `app_role` column to `employees` table (type `app_role`, nullable, default null)

### Edge function logic (create-employee-account)
1. Verify caller is admin (check `user_roles`)
2. Create auth user with `supabase.auth.admin.createUser({ email, email_confirm: true })`
3. Insert into `user_roles` with selected role
4. Insert into `employees` table with all provided fields + new user_id
5. Send password reset email via `supabase.auth.admin.generateLink({ type: 'recovery', email })`
6. Return success with employee ID

