# Lead Manager

## Current State

- Full role-based LMS with Admin, HOD, FSE roles stored in localStorage
- Admin: user management, stage management, lead management with HOD assignment
- HOD: sees only leads assigned to them, assigns leads to FSEs, FSE activity feed
- FSE: updates assigned leads, adds notes, schedules follow-ups with date-wise list
- Data model: User, Lead, Stage, Note, FollowUp — all in localStorage
- AuthContext handles login/logout; no password change feature exists
- No Excel/CSV export feature anywhere in the app

## Requested Changes (Diff)

### Add

1. **Excel Download for Admin (AdminLeads.tsx)**
   - "Download Excel" button in the header area of the leads table
   - Dropdown or two-button approach: "Download All" and "Download Selected"
   - For "Download Selected": checkboxes on each lead row to multi-select; a selection count badge near the button
   - Export columns: Title, Contact Name, Email, Phone, Company, Source, Stage, Assigned HOD, Assigned FSE, Created At
   - Use client-side CSV/Excel generation (no external library needed — build a CSV blob and trigger download with `.xlsx` extension or proper CSV)

2. **Excel Download for HOD (HODDashboard.tsx)**
   - Similar "Download Excel" button in the My Leads tab header
   - "Download All" (all myLeads) and "Download Selected" (checkboxes on lead cards or a separate list mode)
   - Same export columns as Admin; HOD-visible fields only (no ability to see leads outside their scope)

3. **Change Password for all roles**
   - A "Change Password" option accessible from the top navigation/profile area (Layout.tsx or a profile dropdown)
   - Dialog/modal with: Current Password, New Password, Confirm New Password fields
   - Validates current password matches stored hash (btoa comparison)
   - On success: updates passwordHash in localStorage via saveUsers, shows toast, closes dialog
   - Available to Admin, HOD, and FSE (all logged-in users)

### Modify

- **Layout.tsx**: Add a user profile dropdown or button in the top bar that includes "Change Password" and existing "Logout"
- **AdminLeads.tsx**: Add checkboxes column + download button with selected/all options
- **HODDashboard.tsx**: Add checkboxes on lead cards or a list toggle + download button

### Remove

Nothing removed.

## Implementation Plan

1. Create a `useExcelExport` utility hook or helper function in `src/utils/exportLeads.ts` that:
   - Takes an array of leads + supporting data (users, stages)
   - Builds CSV content with all relevant columns
   - Triggers browser download as `.csv` file (named `leads-export-YYYY-MM-DD.csv`)

2. Update `AdminLeads.tsx`:
   - Add checkbox column to the leads table (select-all in header, per-row checkboxes)
   - Track `selectedIds: Set<string>` state
   - Add "Download Excel" button (dropdown with "Download All" / "Download Selected") in header

3. Update `HODDashboard.tsx` My Leads tab:
   - Add per-card checkbox (small, top-right of card) and a "select all" toggle
   - Add "Download Excel" button in the My Leads tab header

4. Update `AuthContext.tsx`:
   - Add `changePassword(currentPassword: string, newPassword: string): boolean` function to context

5. Create `ChangePasswordDialog.tsx` component:
   - Dialog with current/new/confirm password inputs
   - Calls `changePassword` from AuthContext
   - Shows success/error toast

6. Update `Layout.tsx`:
   - Add user avatar/name button in top bar that opens a dropdown
   - Dropdown items: "Change Password" (opens ChangePasswordDialog) + "Logout"

7. Validate and build
