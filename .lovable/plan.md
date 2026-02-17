

# Fix: New Employees Unable to Login

## Problems Found

### 1. Password Reset Emails Never Arrive
The `generateLink({ type: 'recovery' })` call in the edge function generates a link object server-side but does NOT send an email. The built-in email service on Lovable Cloud has very limited delivery capability -- most emails to external addresses (Gmail, Hotmail) simply don't arrive. This means:
- New employees never get the "Set Password" email
- "Forgot Password" reset links also don't arrive
- Invited users never get invitation emails

### 2. Employees Created with Unguessable Random Passwords
The edge function sets `crypto.randomUUID() + '!Aa1'` as the password. Since the reset email never arrives, the employee has no way to know their password and cannot login.

### 3. Users Created Directly in Backend Have No Role
`welluz101@hotmail.com` was created directly in the backend but has no entry in `user_roles`, so the app shows "Pending Approval" with no way for admin to assign a role.

### 4. Invitation System is Redundant and Causes Duplicates
Inviting + adding the same person creates duplicate employee records (astinmarten71@gmail.com appears twice).

## Solution: Admin Sets Initial Password

Since email delivery is unreliable, the admin will set the employee's initial password directly. The password is shown once in a confirmation dialog so the admin can share it with the employee (in person, via chat, etc.). The employee can change it later via "Forgot Password" or profile settings.

```text
Admin adds employee (name, email, role, initial password)
         |
         v
Edge function creates account with that password
         |
         v
Admin shares credentials with employee directly
         |
         v
Employee logs in and changes password when ready
```

## Changes

### 1. Update Employee Form -- Add Password Field
Add a "Set Initial Password" field (required, min 6 chars) to `EmployeeFormDialog.tsx` for new employees only. Include a generate-random-password button for convenience.

### 2. Update Edge Function -- Use Admin-Provided Password
Change `create-employee-account` to accept a `password` field from the request body instead of generating a random one. Remove the `generateLink` call since emails don't deliver.

### 3. Show Credentials Confirmation
After successfully creating an employee, show a dialog with the login credentials (email + password) so the admin can copy and share them. This only appears once.

### 4. Add Role Assignment for Orphaned Users
Add a simple "Assign Role" capability in the HR page so admin can assign roles to users who were created directly in the backend (like welluz101@hotmail.com). This eliminates the "Pending Approval" dead end.

### 5. Remove Invitation Tab
The invitation system is now redundant since admin creates accounts directly. Remove the Invitations tab from HR to avoid confusion and duplicate records.

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/components/forms/EmployeeFormDialog.tsx` | Add password field + generate button for new employees |
| `supabase/functions/create-employee-account/index.ts` | Accept password from request, remove generateLink call |
| `src/hooks/useCrmData.ts` | Return credentials from mutation, pass password to edge function |
| `src/pages/HRPage.tsx` | Add credentials confirmation dialog after employee creation; remove Invitations tab; add role assignment for unlinked users |

### Edge Function Changes

```text
Before: Random password + generateLink (email never arrives)
After:  Admin-provided password, no email dependency
```

### Data Cleanup
- Remove duplicate employee records via a database query
- The `invitations` table stays in the database but is no longer used in the UI

### What This Fixes
- Employees can login immediately with credentials shared by admin
- No dependency on email delivery
- No more "Pending Approval" dead end for backend-created users
- No more duplicate employee records from invitation + add
- Simpler, more reliable onboarding flow

