# Scheduling Conflict Detection - Test Cases Specification

## Overview

The scheduling conflict detection system has two main components:
1. **Server-side**: `checkSchedulingConflicts()` in `schedule/route.ts`
2. **Client-side**: Conflict checks in `match-scheduler-daypilot.tsx`

Both check for:
- **Pitch conflicts**: Two matches scheduled on the same pitch with overlapping times
- **Team double-booking**: Same team(s) scheduled in overlapping time slots

## Test Cases for Server-Side Conflict Detection

### 1. Pitch Conflict Detection

#### 1.1 Exact Time Overlap
- **Setup**: Match A on Pitch 1 at 14:00-15:30, Match B on Pitch 1 at 14:00-15:30
- **Expected**: Conflict detected
- **Test**: Both matches start and end at the same time

#### 1.2 Partial Overlap - New Match Starts During Existing Match
- **Setup**: Match A on Pitch 1 at 14:00-15:30, Match B on Pitch 1 at 14:30-16:00
- **Expected**: Conflict detected
- **Test**: New match starts before existing match ends

#### 1.3 Partial Overlap - New Match Ends During Existing Match
- **Setup**: Match A on Pitch 1 at 14:00-15:30, Match B on Pitch 1 at 13:30-15:00
- **Expected**: Conflict detected
- **Test**: New match ends after existing match starts

#### 1.4 New Match Completely Within Existing Match
- **Setup**: Match A on Pitch 1 at 14:00-16:00, Match B on Pitch 1 at 14:30-15:30
- **Expected**: Conflict detected
- **Test**: New match is fully contained within existing match

#### 1.5 New Match Completely Encompasses Existing Match
- **Setup**: Match A on Pitch 1 at 14:30-15:30, Match B on Pitch 1 at 14:00-16:00
- **Expected**: Conflict detected
- **Test**: New match starts before and ends after existing match

#### 1.6 No Overlap - Adjacent Times
- **Setup**: Match A on Pitch 1 at 14:00-15:30, Match B on Pitch 1 at 15:30-17:00
- **Expected**: No conflict
- **Test**: Matches end/start exactly at the same time (boundary case)

#### 1.7 No Overlap - Different Times
- **Setup**: Match A on Pitch 1 at 14:00-15:30, Match B on Pitch 1 at 16:00-17:30
- **Expected**: No conflict
- **Test**: Matches are completely separate in time

#### 1.8 No Overlap - Different Pitches
- **Setup**: Match A on Pitch 1 at 14:00-15:30, Match B on Pitch 2 at 14:00-15:30
- **Expected**: No conflict
- **Test**: Same time but different pitches

#### 1.9 No Overlap - Different Venues
- **Setup**: Match A at Venue 1, Pitch 1 at 14:00-15:30, Match B at Venue 2, Pitch 1 at 14:00-15:30
- **Expected**: No conflict
- **Test**: Same pitch name but different venues

### 2. Edge Cases and Boundary Conditions

#### 2.1 Match Without Required Fields
- **Setup**: Match without `venueId`, `pitchId`, or `startTime`
- **Expected**: Skipped (no conflict check)
- **Test**: Invalid match data should be ignored

#### 2.2 Invalid UTC Time String
- **Setup**: Match with invalid `startTime` format
- **Expected**: Skipped (no conflict check)
- **Test**: `parseUTCTime()` returns undefined

#### 2.3 Updating Existing Match (Excluding Self)
- **Setup**: Updating Match A, checking against Match A
- **Expected**: No conflict (self-exclusion)
- **Test**: Match ID exclusion works correctly

#### 2.4 Multiple Conflicts
- **Setup**: New match conflicts with 2+ existing matches
- **Expected**: All conflicts reported
- **Test**: Conflict array contains all conflicting matches

### 3. Timezone Handling

#### 3.1 UTC Time Parsing
- **Setup**: Match with UTC time string (with 'Z' suffix)
- **Expected**: Correctly parsed and compared
- **Test**: UTC times are handled correctly

#### 3.2 Time Without Timezone Indicator
- **Setup**: Match with time string without timezone (e.g., "2024-01-15T14:00:00")
- **Expected**: Treated as UTC (adds 'Z')
- **Test**: Assumes UTC when timezone missing

#### 3.3 Timezone Offset Conversion
- **Setup**: Match with timezone offset (e.g., "+02:00")
- **Expected**: Converted to UTC for comparison
- **Test**: Timezone offsets are handled correctly

## Test Cases for Client-Side Conflict Detection

### 4. Pitch Conflict Detection (Client-Side)

#### 4.1 Same Pitch, Overlapping Times
- **Setup**: Match A on Pitch 1 at 14:00-15:30, trying to schedule Match B on Pitch 1 at 14:30-16:00
- **Expected**: Conflict detected, drag prevented
- **Test**: Overlap detection using UTC time comparison

#### 4.2 Same Pitch, No Overlap
- **Setup**: Match A on Pitch 1 at 14:00-15:30, trying to schedule Match B on Pitch 1 at 16:00-17:30
- **Expected**: No conflict, scheduling allowed
- **Test**: Non-overlapping times on same pitch

#### 4.3 Different Pitches, Same Time
- **Setup**: Match A on Pitch 1 at 14:00-15:30, trying to schedule Match B on Pitch 2 at 14:00-15:30
- **Expected**: No conflict
- **Test**: Different pitches allow same time

### 5. Team Double-Booking Detection

#### 5.1 Same Home Team, Overlapping Times
- **Setup**: Team X plays at 14:00-15:30, trying to schedule Team X (home) at 14:30-16:00
- **Expected**: Conflict detected
- **Test**: Home team cannot play twice simultaneously

#### 5.2 Same Away Team, Overlapping Times
- **Setup**: Team X plays at 14:00-15:30, trying to schedule Team X (away) at 14:30-16:00
- **Expected**: Conflict detected
- **Test**: Away team cannot play twice simultaneously

#### 5.3 Home Team vs Away Team Overlap
- **Setup**: Team X (home) plays at 14:00-15:30, trying to schedule Team X (away) at 14:30-16:00
- **Expected**: Conflict detected
- **Test**: Team cannot be both home and away simultaneously

#### 5.4 Different Teams, Same Time
- **Setup**: Team X vs Team Y at 14:00-15:30, trying to schedule Team Z vs Team W at 14:00-15:30
- **Expected**: No conflict
- **Test**: Different teams can play at same time

#### 5.5 Same Teams, Different Times
- **Setup**: Team X vs Team Y at 14:00-15:30, trying to schedule Team X vs Team Y at 16:00-17:30
- **Expected**: No conflict
- **Test**: Same teams can play at different times

#### 5.6 Partial Team Overlap - One Team Same
- **Setup**: Team X vs Team Y at 14:00-15:30, trying to schedule Team X vs Team Z at 14:30-16:00
- **Expected**: Conflict detected
- **Test**: One team overlap with time overlap causes conflict

#### 5.7 Partial Team Overlap - No Time Overlap
- **Setup**: Team X vs Team Y at 14:00-15:30, trying to schedule Team X vs Team Z at 16:00-17:30
- **Expected**: No conflict
- **Test**: Same team but different times - no conflict

### 6. Match Duration Handling

#### 6.1 Different Match Durations
- **Setup**: Match A (90 min) at 14:00-15:30, Match B (60 min) at 15:00-16:00
- **Expected**: Conflict detected (overlap from 15:00-15:30)
- **Test**: Different durations correctly calculated

#### 6.2 Match Without End Time
- **Setup**: Match A with only startTime, Match B trying to schedule during calculated end time
- **Expected**: End time calculated from division duration
- **Test**: Missing endTime handled correctly

#### 6.3 Division-Specific Duration
- **Setup**: Division A (90 min), Division B (60 min), matches from different divisions
- **Expected**: Correct duration used for each match
- **Test**: Division duration correctly applied

### 7. UTC Time Comparison (Client-Side)

#### 7.1 UTC String Comparison
- **Setup**: Times stored as UTC ISO strings
- **Expected**: String comparison works correctly for time ordering
- **Test**: "2024-01-15T12:00:00.000Z" < "2024-01-15T13:00:00.000Z"

#### 7.2 Time Conversion Accuracy
- **Setup**: Local time converted to UTC, then compared
- **Expected**: Conversion maintains correct ordering
- **Test**: Local 14:00 (UTC+2) = UTC 12:00, correctly compared

#### 7.3 Edge Case - Midnight Crossing
- **Setup**: Match ending at 23:30, new match starting at 00:00 next day
- **Expected**: No conflict (different dates)
- **Test**: Date boundaries handled correctly

### 8. Multiple Conflict Scenarios

#### 8.1 Multiple Pitch Conflicts
- **Setup**: Trying to schedule match that conflicts with 2+ matches on same pitch
- **Expected**: First conflict detected and reported
- **Test**: Conflict detection stops at first match

#### 8.2 Pitch Conflict and Team Conflict
- **Setup**: Match conflicts with pitch AND has team double-booking
- **Expected**: Pitch conflict detected first (checked first)
- **Test**: Conflict checks in correct order

#### 8.3 Batch Scheduling - Multiple Conflicts
- **Setup**: Scheduling multiple matches, some with conflicts
- **Expected**: All conflicts reported
- **Test**: Server-side batch conflict detection

## Test Implementation Strategy

### Unit Tests (Isolated Functions)

1. **Time Overlap Calculation**
   - Test the overlap logic: `start1 < end2 && end1 > start2`
   - Test with various time combinations
   - Test with UTC strings

2. **Conflict Detection Logic**
   - Extract conflict checking logic into testable functions
   - Test with mock match data
   - Test edge cases

### Integration Tests (With Database)

1. **Server-Side API Tests**
   - Test `/api/v1/tournaments/[id]/matches/schedule` endpoint
   - Test with real database queries
   - Test permission checks

2. **Client-Side Component Tests**
   - Test scheduler component with mock data
   - Test drag-and-drop conflict detection
   - Test edit modal conflict detection

### Test Data Structure

```typescript
interface TestMatch {
  id: string;
  tournamentId: string;
  pitchId: string;
  venueId: string;
  startTime: string; // UTC ISO string
  endTime?: string; // UTC ISO string
  homeTeamId: string;
  awayTeamId: string;
  divisionId: string;
  groupId: string;
}
```

## Priority Test Cases

### High Priority (Must Have)
1. Exact time overlap on same pitch
2. Partial time overlap on same pitch
3. Team double-booking with time overlap
4. No conflict - different pitches
5. No conflict - different times
6. Self-exclusion when updating match

### Medium Priority (Should Have)
7. Different match durations
8. Missing endTime calculation
9. UTC time parsing and comparison
10. Multiple conflicts detection
11. Edge cases (midnight, boundaries)

### Low Priority (Nice to Have)
12. Timezone offset handling
13. Invalid data handling
14. Performance with many matches
15. Complex multi-conflict scenarios

