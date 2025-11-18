# Match Scheduling Logic Documentation

## Overview

The match scheduling system allows tournament managers to assign matches to specific venues, pitches, and time slots. The system includes conflict detection, team double-booking prevention, and supports both manual and automatic scheduling.

## Files Involved in Match Scheduling

### 1. Frontend Components

#### Main Scheduling Component

- **`src/components/tournament/match-scheduling.tsx`**
  - Main wrapper component for match scheduling
  - Displays summary statistics (total, scheduled, unscheduled matches)
  - Fetches matches from API
  - Manages state for matches, venues, and divisions
  - Renders the DayPilot scheduler component

#### DayPilot Scheduler Component

- **`src/components/tournament/match-scheduler-daypilot.tsx`** (1975 lines)
  - Primary scheduling interface using DayPilot calendar
  - Handles drag-and-drop scheduling
  - Manages filters (division, group, venue, team, date range)
  - Conflict detection (pitch conflicts, team double-booking)
  - Two view modes: scheduler (calendar) and list (table)
  - Edit modal for match details
  - Save/clear schedule functionality
  - Key functions:
    - `handleEventMove`: Handles dragging matches to new time/pitch
    - `handleEventResize`: Handles resizing match duration
    - `scheduleMatchAtTime`: Schedules a match at a specific time slot
    - `handleTimeRangeSelected`: Handles clicking time slots
    - `handleSaveSchedule`: Saves schedule to backend
    - `checkSchedulingConflicts`: Client-side conflict detection

### 2. API Routes

#### Schedule Endpoint

- **`src/app/api/v1/tournaments/[id]/matches/schedule/route.ts`**
  - `POST /api/v1/tournaments/[id]/matches/schedule`
  - Saves match schedule to database
  - Validates permissions (ADMIN, TEAM_MANAGER, or tournament MANAGER/ADMIN)
  - Validates all matches belong to tournament
  - Server-side conflict detection via `checkSchedulingConflicts()`
  - Updates match records with:
    - `venueId` and `pitchId` (via Prisma relations)
    - `startTime` and `endTime`
    - `matchNumber`
    - `scheduledAt` and `scheduledBy` (user tracking)
    - `assignmentType: 'MANUAL'`

#### Matches Endpoint

- **`src/app/api/v1/tournaments/[id]/matches/route.ts`**
  - `GET /api/v1/tournaments/[id]/matches`
    - Fetches all matches for a tournament
    - Includes related data: teams, venue, pitch, group, division
    - Checks tournament visibility permissions
    - Orders by startTime, then createdAt
  - `POST /api/v1/tournaments/[id]/matches`
    - Creates new matches
    - Validates permissions and data
    - Auto-generates match numbers if not provided

### 3. Page Components

#### Tournament Management Page

- **`src/app/[locale]/tournaments/[id]/manage/page.tsx`**
  - Main tournament management interface
  - Loads tournament data, matches, venues, teams
  - Renders MatchScheduling component in "schedule" tab
  - Handles data refresh and state management
  - Manages tab navigation (overview, teams, venues, divisions, groups, matches, schedule)

### 4. Database Schema

#### Match Model

- **`prisma/schema.prisma`** (lines 417-451)
  - Match fields relevant to scheduling:
    - `venueId` / `venue` (relation)
    - `pitchId` / `pitch` (relation)
    - `startTime` (DateTime?)
    - `endTime` (DateTime?)
    - `matchNumber` (String?)
    - `assignmentType` (AUTO | MANUAL)
    - `scheduledAt` (DateTime?)
    - `scheduledBy` (String? - User ID)
    - `status` (SCHEDULED, LIVE, FINISHED, CANCELLED, POSTPONED)

### 5. Utility Functions

#### Match Generation

- **`src/lib/tournament/match-generation/round-robin.ts`**
  - Generates round-robin matches
  - Used when creating matches for groups

#### Tournament Utils

- **`src/lib/tournament/utils.ts`**
  - `generateMatchSchedule()`: Generates time slots for matches
  - `calculateTeamStatistics()`: Calculates team stats

## Scheduling Logic Flow

### 1. Data Loading

1. User navigates to `/tournaments/[id]/manage?tab=schedule`
2. `TournamentManagePage` fetches:
   - Tournament data (including divisions)
   - Matches via `GET /api/v1/tournaments/[id]/matches`
   - Venues via `GET /api/v1/tournaments/[id]/venues`
   - Teams via `GET /api/v1/tournaments/[id]/teams`
3. Data passed to `MatchScheduling` component
4. `MatchScheduling` passes data to `MatchSchedulerDayPilot`

### 2. Displaying Matches

1. Matches are filtered by:
   - Date range (selectedDateRange)
   - Division filter
   - Group filter
   - Venue filter
   - Team filter
2. Scheduled matches displayed in DayPilot calendar (one column per pitch)
3. Unscheduled matches shown in sidebar/list view

### 3. Scheduling a Match

#### Method 1: Click-to-Schedule

1. User selects unscheduled match from sidebar
2. User clicks on time slot in calendar
3. `handleTimeRangeSelected` triggered
4. `scheduleMatchAtTime` called with match, start time, end time, pitch
5. Conflict checks performed:
   - **Pitch conflict**: Checks if another match is scheduled on same pitch at overlapping time
   - **Team double-booking**: Checks if either team is already playing at that time
6. If no conflicts, match updated in local state
7. `onScheduleChange` callback updates parent component

#### Method 2: Drag-and-Drop

1. User drags scheduled match to new time/pitch
2. `handleEventMove` triggered
3. Same conflict checks as Method 1
4. Match updated if valid

#### Method 3: Edit Modal

1. User double-clicks scheduled match or clicks "Edit"
2. Edit modal opens with current date/time
3. User modifies date, time, or match number
4. On save, conflict checks performed
5. Match updated if valid

### 4. Conflict Detection

#### Client-Side (Frontend)

- Performed in `match-scheduler-daypilot.tsx`:
  - **Pitch Conflict Check** (lines 349-383, 543-579):
    - Finds matches on same pitch
    - Compares time ranges (start < other.end && end > other.start)
    - Uses division-specific match duration for accurate end times
  - **Team Double-Booking Check** (lines 398-440, 594-636):
    - Finds matches with overlapping time ranges
    - Checks if homeTeam or awayTeam matches
    - Prevents teams from playing multiple matches simultaneously

#### Server-Side (Backend)

- Performed in `schedule/route.ts`:
  - `checkSchedulingConflicts()` function (lines 181-225)
  - Checks database for existing matches with:
    - Same `pitchId`
    - Overlapping time ranges: `startTime <= newStart && endTime >= newStart`
    - Different match ID (excludes the match being updated)
  - Returns array of conflicts if found

### 5. Saving Schedule

1. User clicks "Save Schedule" button
2. `handleSaveSchedule` called
3. All scheduled matches sent to `POST /api/v1/tournaments/[id]/matches/schedule`
4. Request body: `{ matches: [{ id, venueId, pitchId, startTime, endTime, matchNumber }] }`
5. Backend validates:
   - User permissions
   - All matches belong to tournament
   - No scheduling conflicts (server-side check)
6. Database updated using Prisma:
   - `venue: { connect: { id: venueId } }` or `{ disconnect: true }`
   - `pitch: { connect: { id: pitchId } }` or `{ disconnect: true }`
   - `startTime`, `endTime`, `matchNumber` updated
   - `scheduledAt`, `scheduledBy` set
   - `assignmentType` set to 'MANUAL'
7. Success/error toast shown to user

### 6. Match Duration Calculation

- Each division has `matchDuration` (in minutes)
- End time calculated as: `startTime + matchDuration`
- Division duration retrieved from:
  - `divisions` prop passed to scheduler
  - Or from `match.group.division.matchDuration`
- Default duration: 90 minutes if not specified

### 7. Timezone Handling

- System uses ISO date strings without timezone conversion
- Times parsed manually to avoid timezone issues:
  - Date part: `YYYY-MM-DD`
  - Time part: `HH:mm:ss`
  - Combined: `YYYY-MM-DDTHH:mm:ss`
- DayPilot Date objects created from string format
- End times calculated manually using minutes since midnight

## Key Features

### Filters

- **Division Filter**: Filter matches by division
- **Group Filter**: Filter matches by group
- **Venue Filter**: Filter matches by venue
- **Team Filter**: Multi-select filter for teams
- **Date Range Filter**: View matches across multiple days

### View Modes

- **Scheduler View**: DayPilot calendar with drag-and-drop
- **List View**: Table format with edit buttons

### Conflict Prevention

- Pitch double-booking prevention
- Team double-booking prevention
- Real-time conflict detection during scheduling
- Server-side validation on save

### Match Numbering

- Optional match numbers for easier identification
- Can be set manually or auto-generated
- Displayed in calendar events and list view

## Potential Issues to Check

1. **Conflict Detection Logic**:
   - Verify time overlap calculation is correct
   - Check if division duration is properly used
   - Ensure timezone handling doesn't cause issues

2. **State Management**:
   - Check if matches state syncs properly between components
   - Verify `onScheduleChange` callbacks work correctly
   - Ensure unsaved changes are handled properly

3. **Data Flow**:
   - Verify matches are fetched correctly on page load
   - Check if venue/pitch data is available
   - Ensure division data includes matchDuration

4. **Permission Checks**:
   - Verify user has correct permissions
   - Check tournament visibility settings
   - Ensure schedule endpoint validates permissions

5. **UI/UX**:
   - Check if error messages are clear
   - Verify toast notifications work
   - Ensure loading states are shown

## Testing Checklist

- [ ] Schedule a match by clicking time slot
- [ ] Schedule a match by dragging
- [ ] Reschedule a match by dragging to new time
- [ ] Edit match time via modal
- [ ] Try to schedule conflicting matches (same pitch, same time)
- [ ] Try to schedule team double-booking
- [ ] Save schedule and verify persistence
- [ ] Clear schedule and verify all matches unscheduled
- [ ] Filter matches by division/group/venue/team
- [ ] Change date range and verify matches update
- [ ] Switch between scheduler and list view
- [ ] Verify match duration uses division settings
- [ ] Check match numbers are saved correctly
