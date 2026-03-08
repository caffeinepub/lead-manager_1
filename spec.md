# Lead Manager

## Current State

- Roles: Admin, HOD, FSE, TeleCaller, THOD
- Order ID Request form (9 checkboxes) exists on FSE leads
- When all 9 are ticked and submitted, request shows under "Pending Approval" tab in Admin and THOD dashboards
- FSE lead cards show stage as a badge; stage can only be changed inside the lead detail modal in edit mode
- Layout/nav, types, and storage are all in place

## Requested Changes (Diff)

### Add
- New role: **BO** (Business Officer)
  - Added to `Role` type in `lms.ts`
  - Added to `ROLE_COLORS` map
  - Added to `NAV_MAP` in `Layout.tsx` with its own nav items
  - Seeded sample BO user: `bo.user` / `bo@12345`
  - Available in UserManagement role dropdown
  - BO gets its own dashboard page at `/bo`
  - BO dashboard has a "Pending Approval" tab showing all Order ID Requests where `allChecked === true && status === "pending"`, with Approve/Reject buttons (same as Admin's tab)
  - BO can also view overall leads (read-only, all leads visible to them)
  - RoleRedirect in App.tsx routes BO to `/bo`

- **FSE stage dropdown on lead card**
  - Each FSE lead card gets an inline stage `<Select>` dropdown (replaces the static stage badge, or is placed below it)
  - Changing the dropdown immediately calls `updateLead` with the new stageId
  - No need to open lead detail modal to change stage

### Modify
- `types/lms.ts`: Add `"BO"` to `Role` union type and `ROLE_COLORS`
- `utils/storage.ts`: Add seeded BO user to `seedData()`; note: since seedData only seeds when `users.length === 0`, existing users in localStorage won't be affected — document this
- `App.tsx`: Add `/bo` route and `/bo` RoleRedirect case; import BODashboard
- `Layout.tsx`: Add `BO_NAV` items and `ROLE_BADGE` entry for BO; add to `NAV_MAP`
- `pages/admin/UserManagement.tsx`: Add "BO" to the role `<Select>` options
- `pages/fse/FSEDashboard.tsx`: Add inline stage select dropdown on each lead card (stop-propagation on change so it doesn't open modal)

### Remove
- Nothing removed

## Implementation Plan

1. Update `types/lms.ts` — add `"BO"` to `Role` type and `ROLE_COLORS`
2. Update `utils/storage.ts` — add seeded BO user
3. Create `src/frontend/src/pages/bo/BODashboard.tsx` — BO dashboard with Pending Approval tab and All Leads read-only tab
4. Update `App.tsx` — add `/bo` route, import BODashboard, update RoleRedirect
5. Update `Layout.tsx` — add BO nav, role badge, NAV_MAP entry
6. Update `pages/admin/UserManagement.tsx` — add BO to role dropdown
7. Update `pages/fse/FSEDashboard.tsx` — add inline stage select on each lead card
