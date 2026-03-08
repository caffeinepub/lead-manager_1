# Lead Manager

## Current State

Full-featured Lead Management System with role-based access (Admin, HOD, FSE, TeleCaller, THOD). Data is stored in localStorage. The FSE role has a dedicated "Follow-ups" page (`/fse/followups`) with date-wise grouping (Overdue, Today, Tomorrow, This Week, Later) and mark-complete functionality. The HOD dashboard has two tabs: "My Leads" and "FSE Activity" but no follow-up tab for HOD's own scheduled follow-ups.

## Requested Changes (Diff)

### Add
- A third tab "Follow-ups" to the HOD Dashboard showing all follow-ups for leads assigned to that HOD, grouped by date (same grouping logic as the FSE FollowUpsPage: Overdue, Today, Tomorrow, This Week, Later)
- Each follow-up item shows: lead name, description, scheduled time, and a mark-complete toggle/checkbox
- Summary stats (pending count, completed count) at the top of the HOD follow-ups tab

### Modify
- HOD Dashboard: add a third `TabsTrigger` and `TabsContent` for "Follow-ups" with a count badge
- HOD follow-ups should include all follow-ups on leads that `assignedToHOD === currentUser.id`, not just by `assignedTo` user

### Remove
- Nothing

## Implementation Plan

1. In `HODDashboard.tsx`:
   - Import `updateFollowUp` from LMSContext
   - Derive `hodFollowUps`: all followUps where `leads.find(l => l.id === f.leadId)?.assignedToHOD === currentUser.id`, sorted by scheduledAt ascending
   - Compute `hodPending` and `hodCompleted` counts
   - Add a third tab trigger "Follow-ups" with a count badge (pending count)
   - Add a third TabsContent with:
     - Two summary stat cards (Pending, Completed) matching the FSE FollowUpsPage style
     - Empty state if no follow-ups
     - Date-grouped list using the same GROUP_ORDER and GROUP_COLORS as FollowUpsPage
     - Each item: lead name, description, scheduled time, checkbox to mark complete
