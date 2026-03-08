# Lead Manager

## Current State
- Full role-based LMS with Admin, HOD, FSE, TeleCaller, THOD roles
- TeleCaller and FSE have dedicated dashboards for lead management
- Admin, HOD, THOD dashboards have tabs for overview, follow-ups, and activity
- All data stored in localStorage via LMSContext and storage utilities

## Requested Changes (Diff)

### Add
- **DayLog type** in `types/lms.ts`: captures userId, role, date, dayStartTime, dayStartLocation (lat/lng/address), dayEndTime, dayEndLocation, notes
- **LS_DAYLOGS localStorage key** in `types/lms.ts`
- **getDayLogs / saveDayLogs** in `storage.ts`
- **DayLog context** in `LMSContext`: addDayLog, updateDayLog, getDayLogsForUser, getTodayLog
- **Day Start / Day End banner** in TeleCallerDashboard and FSEDashboard: sticky top-of-page panel showing current day status; "Start Day" captures geolocation + timestamp; "End Day" captures geolocation + timestamp; shows elapsed time while day is active
- **"Day Reports" tab** in AdminDashboard, HODDashboard, THODDashboard: shows list of all TeleCaller/FSE users visible to that role, with today's day log (started at, ended at, location); date filter to browse historical days; expandable rows showing start/end location details

### Modify
- `AdminDashboard.tsx`: add a "Day Reports" tab alongside existing tabs
- `HODDashboard.tsx`: add a "Day Reports" tab (shows FSEs assigned under HOD's leads)
- `THODDashboard.tsx`: add a "Day Reports" tab (shows all TeleCaller/FSE users system-wide)
- `TeleCallerDashboard.tsx`: add Day Start/End panel at the top
- `FSEDashboard.tsx`: add Day Start/End panel at the top
- `LMSContext.tsx`: add dayLogs state and CRUD helpers
- `storage.ts`: add dayLogs persistence helpers
- `types/lms.ts`: add DayLog interface and LS_DAYLOGS constant

### Remove
- Nothing

## Implementation Plan
1. Add DayLog interface + LS_DAYLOGS to `types/lms.ts`
2. Add getDayLogs/saveDayLogs to `storage.ts`
3. Add dayLogs state, addDayLog, updateDayLog, getDayLogsForUser, getTodayLog to `LMSContext.tsx`
4. Create DayTracker component (shared banner for TC/FSE) with geolocation + start/end logic
5. Add DayTracker to TeleCallerDashboard and FSEDashboard
6. Add "Day Reports" tab to AdminDashboard, HODDashboard, THODDashboard showing date-filterable table of day logs per user
