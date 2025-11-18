# Timestamp/DateTime Management Analysis

## Current State

### Client-Side (Frontend)

**Location**: `src/components/tournament/match-scheduler-daypilot.tsx`

**Current Approach**:
- **Manual string parsing** to avoid timezone conversion
- Formats dates as `YYYY-MM-DDTHH:mm:ss` (no timezone indicator, no 'Z')
- Parses ISO strings by manually splitting on 'T' and extracting parts
- Uses DayPilot.Date with string format: `"YYYY-MM-DD HH:mm:ss"`
- Multiple comments throughout code: "avoid timezone conversion", "avoid timezone issues"

**Example Code** (lines 245-255):
```typescript
// Parse time without timezone conversion by reconstructing as local time string
const [datePart = '', timePart = ''] = match.startTime.split('T');
const timeParts = timePart.split(':');
const hours = Number(timeParts[0]) || 0;
const minutes = Number(timeParts[1]) || 0;
const seconds = Number(timeParts[2]) || 0;

// Create DayPilot.Date using string format that doesn't trigger timezone conversion
// Format: "YYYY-MM-DD HH:mm:ss"
const startStr = `${datePart} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
const start = new DayPilot.Date(startStr);
```

**When Saving** (line 1842):
```typescript
// Create ISO string directly without timezone conversion
const newStartTimeString = `${editStartDate}T${editStartTime}:00`;
```

**Issues**:
- Sends times without timezone indicator (e.g., `"2024-01-15T14:00:00"`)
- JavaScript `new Date()` interprets these as **local time**, not UTC
- No explicit timezone handling
- Relies on manual string manipulation which is error-prone

### Server-Side (Backend)

**Location**: `src/app/api/v1/tournaments/[id]/matches/schedule/route.ts`

**Current Approach**:
- Uses `new Date(matchData.startTime)` to parse incoming ISO strings
- Database uses `TIMESTAMP(3)` (PostgreSQL) which stores in UTC
- Database timezone set to UTC in `init-db.sql`: `SET timezone = 'UTC';`
- Prisma DateTime fields map to PostgreSQL TIMESTAMP

**Example Code** (lines 91-95):
```typescript
startTime: matchData.startTime
  ? new Date(matchData.startTime)
  : undefined,
endTime: matchData.endTime
  ? new Date(matchData.endTime)
  : undefined,
```

**Conflict Check** (lines 195-198):
```typescript
startTime: {
  lte: new Date(match.startTime),
},
endTime: {
  gte: new Date(match.startTime),
},
```

**Issues**:
- `new Date()` interprets ISO strings without timezone as **local server time**
- If server is in different timezone than client, times will be wrong
- No explicit UTC conversion
- Database stores in UTC, but conversion happens implicitly

### Database

**Schema**: `prisma/schema.prisma`
- `startTime DateTime?` → PostgreSQL `TIMESTAMP(3)`
- `endTime DateTime?` → PostgreSQL `TIMESTAMP(3)`
- Database timezone: UTC (set in `init-db.sql`)

**Storage**:
- PostgreSQL stores TIMESTAMP in UTC internally
- Prisma handles conversion when reading/writing

## Problems with Current Implementation

1. **Timezone Ambiguity**: 
   - Client sends `"2024-01-15T14:00:00"` (no timezone)
   - Server interprets as local time (could be different timezone)
   - Database stores in UTC
   - Result: Times can shift based on server timezone

2. **Inconsistent Behavior**:
   - If server is in UTC: works correctly
   - If server is in different timezone: times are wrong
   - No guarantee of consistent behavior across deployments

3. **Manual String Parsing**:
   - Error-prone
   - Hard to maintain
   - Doesn't handle edge cases well

4. **No Explicit Timezone Handling**:
   - Relies on implicit conversions
   - Difficult to debug timezone issues
   - No way to specify tournament timezone

## Recommended Solution

### Client-Side: Handle Timezone for Display, Send UTC to Server

**Principle**: Client should:
1. Display times in user's local timezone (or tournament timezone if specified)
2. Convert to UTC before sending to server
3. Parse UTC times from server and convert to local for display

**Implementation**:

```typescript
// Utility functions for timezone handling
import { format, parseISO, toZonedTime, fromZonedTime } from 'date-fns-tz';

// When creating time string to send to server
function createUTCTimeString(date: string, time: string): string {
  // Parse as local time, then convert to UTC
  const localDateTime = `${date}T${time}:00`;
  const localDate = new Date(localDateTime);
  // Return ISO string with UTC timezone
  return localDate.toISOString(); // Returns "2024-01-15T12:00:00.000Z"
}

// When parsing time from server
function parseUTCTimeString(utcString: string): { date: string; time: string } {
  const date = parseISO(utcString); // Parses UTC string
  const localDate = new Date(date); // Converts to local time
  const dateStr = format(localDate, 'yyyy-MM-dd');
  const timeStr = format(localDate, 'HH:mm');
  return { date: dateStr, time: timeStr };
}
```

**Changes Needed**:
1. Update `match-scheduler-daypilot.tsx` to use UTC conversion utilities
2. When saving: Convert local time to UTC before sending
3. When loading: Parse UTC from server, convert to local for display
4. Use `date-fns-tz` or similar library for timezone handling

### Server-Side: Always Use UTC

**Principle**: Server should:
1. Treat all incoming times as UTC (or explicitly convert from specified timezone)
2. Store everything in UTC in database
3. Return times in UTC (ISO format with 'Z' suffix)

**Implementation**:

```typescript
// In schedule/route.ts
import { parseISO } from 'date-fns';

// When receiving times from client
function parseUTCTime(timeString: string): Date {
  // If timezone is missing, assume UTC
  if (!timeString.includes('Z') && !timeString.includes('+') && !timeString.includes('-', 10)) {
    // Add 'Z' to indicate UTC
    timeString = timeString + 'Z';
  }
  return new Date(timeString); // Will parse as UTC
}

// When saving to database
const updateData = {
  startTime: matchData.startTime
    ? parseUTCTime(matchData.startTime)
    : undefined,
  endTime: matchData.endTime
    ? parseUTCTime(matchData.endTime)
    : undefined,
  // ... rest of data
};
```

**Changes Needed**:
1. Update `schedule/route.ts` to explicitly handle UTC
2. Add validation to ensure times are in UTC format
3. Update conflict checking to use UTC
4. Ensure all DateTime fields are stored/retrieved as UTC

### Database: Already Correct

**Current State**: ✅ Good
- Database timezone set to UTC
- Prisma DateTime maps to TIMESTAMP(3)
- No changes needed

## Implementation Plan

### Phase 1: Server-Side UTC Enforcement

1. **Create UTC utility functions**:
   - `src/lib/time/utc.ts` - UTC parsing and formatting utilities
   - Functions to ensure all times are treated as UTC

2. **Update schedule endpoint**:
   - Modify `schedule/route.ts` to use UTC utilities
   - Ensure all `new Date()` calls explicitly handle UTC
   - Add validation for timezone format

3. **Update conflict checking**:
   - Ensure conflict checks use UTC times
   - Update `checkSchedulingConflicts()` function

### Phase 2: Client-Side Timezone Handling

1. **Create timezone utilities**:
   - `src/lib/time/timezone.ts` - Client-side timezone conversion
   - Functions to convert between local and UTC
   - Functions to format times for display

2. **Update scheduler component**:
   - Modify `match-scheduler-daypilot.tsx` to use timezone utilities
   - Convert local times to UTC before sending to server
   - Parse UTC times from server and convert to local for display

3. **Update time formatting**:
   - Use `date-fns-tz` for timezone-aware formatting
   - Update `src/lib/time.ts` to handle timezones

### Phase 3: Tournament Timezone Support (Optional)

1. **Add timezone to tournament model**:
   - Add `timezone` field to Tournament schema
   - Default to UTC or user's timezone

2. **Update scheduling logic**:
   - Use tournament timezone for display
   - Still store in UTC in database

## Files to Modify

### Server-Side
- `src/app/api/v1/tournaments/[id]/matches/schedule/route.ts`
- `src/app/api/v1/tournaments/[id]/matches/route.ts`
- Create: `src/lib/time/utc.ts`

### Client-Side
- `src/components/tournament/match-scheduler-daypilot.tsx`
- `src/components/tournament/match-scheduling.tsx`
- `src/lib/time.ts` (update existing)
- Create: `src/lib/time/timezone.ts`

### Dependencies
- Add: `date-fns-tz` (if not already present)

## Testing Checklist

- [ ] Schedule match in one timezone, verify stored correctly in UTC
- [ ] Load match from server, verify displays correctly in local timezone
- [ ] Test with server in different timezone than client
- [ ] Test conflict detection with UTC times
- [ ] Verify times don't shift when saving/loading
- [ ] Test with daylight saving time transitions
- [ ] Verify all API endpoints return UTC times

## Current Code Locations

### Client-Side Timezone Handling
- `src/components/tournament/match-scheduler-daypilot.tsx`:
  - Lines 245-255: Manual time parsing
  - Lines 344-383: Conflict checking with manual parsing
  - Lines 511-664: `scheduleMatchAtTime` function
  - Lines 1841-1856: Edit modal time handling

### Server-Side Timezone Handling
- `src/app/api/v1/tournaments/[id]/matches/schedule/route.ts`:
  - Lines 91-95: Date parsing
  - Lines 195-198: Conflict check date parsing

### Time Formatting Utilities
- `src/lib/time.ts`: Uses `date-fns` for formatting (no timezone handling)

