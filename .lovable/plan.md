

# Recruitment & CV Management Module

## Problem
Currently, employee documents are tied 1:1 to existing employees. HR needs a separate recruitment pipeline to manage incoming CVs from external candidates, organized by department and open positions, with search/filter capabilities for shortlisting.

## Design Approach

Three new database tables, a new "Recruitment" tab in the HR page, and a storage bucket for CV files.

### Database Schema

**1. `job_positions` table** — Open roles HR is hiring for
- id, user_id, title, department, description (job description text), requirements, status (open/closed/on-hold), created_at, updated_at

**2. `candidates` table** — People who submitted CVs
- id, user_id, name, email, phone, department, position_id (FK → job_positions), cv_file_path, cv_file_size, status (new/shortlisted/interviewed/rejected/hired), notes, applied_date, created_at, updated_at

**3. Storage bucket** — `candidate-cvs` (private) for uploaded CV files

### RLS Policies
- Admin: full CRUD on both tables
- HR Manager: full CRUD on both tables
- All others: no access

### New UI Components

**HR Page changes:**
- Add two new tabs: `Positions` and `Recruitment`
- **Positions tab**: List/create/edit open positions with department, title, description, requirements, status. Simple card layout.
- **Recruitment tab**: 
  - Filter bar: by department, by position, by status (new/shortlisted/rejected)
  - Candidate cards showing name, position applied for, date, status badge
  - Click to view CV (download), update status, add notes
  - Upload CV dialog: select position (or unassigned), enter candidate name/email/phone, attach file
  - Bulk status update for shortlisting

**New form dialogs:**
- `PositionFormDialog.tsx` — title, department, description, requirements, status
- `CandidateFormDialog.tsx` — name, email, phone, position select, CV file upload, notes

**New hooks in `useCrmData.ts`:**
- `useJobPositions()`, `useUpsertPosition()`, `useDeletePosition()`
- `useCandidates(filters?)`, `useUpsertCandidate()`, `useDeleteCandidate()`, `useUploadCV()`

### User Flow
1. HR creates a Position (e.g. "Senior Developer — Engineering") with job description
2. HR uploads CVs against that position (or unassigned for general pool)
3. HR filters candidates by department/position, reviews CVs, marks as shortlisted/rejected
4. Later, HR searches the candidate pool by department/skills when new positions open

### Files to Create
- `src/components/forms/PositionFormDialog.tsx`
- `src/components/forms/CandidateFormDialog.tsx`

### Files to Modify
- `src/pages/HRPage.tsx` — add Positions and Recruitment tabs
- `src/hooks/useCrmData.ts` — add position and candidate hooks

### Migration
- Create `job_positions` and `candidates` tables with RLS
- Create `candidate-cvs` storage bucket with RLS policies

