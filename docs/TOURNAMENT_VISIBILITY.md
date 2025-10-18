# Tournament Visibility System

This document describes the tournament visibility system that controls what information is visible to different users based on publication status.

## Overview

The tournament visibility system provides granular control over what tournament information is visible to users based on:

1. **Tournament Status**: Whether the tournament is `DRAFT`, `PUBLISHED`, or `CANCELLED`
2. **Info Published**: Whether basic tournament information is publicly visible
3. **Teams Published**: Whether team information is publicly visible
4. **Schedule Published**: Whether match schedules and results are publicly visible
5. **User Role**: Admin, tournament creator, or public user

## Visibility Rules

### Tournament Creators and Admins

- **Full Access**: Can see all tournament information regardless of publication status
- **Management Rights**: Can edit tournament settings and content

### Public Users (Non-authenticated or non-managers)

- **Tournament Visibility**: Only published tournaments (`status = 'PUBLISHED'`) are visible
- **Basic Info Visibility**: Only visible if `infoPublished = true`
- **Teams Visibility**: Only visible if `teamsPublished = true`
- **Schedule Visibility**: Only visible if `schedulePublished = true`
- **Standings Visibility**: Only visible if `teamsPublished = true`
- **Brackets Visibility**: Only visible if `schedulePublished = true`

## API Endpoints Affected

The following API endpoints now respect visibility rules:

### Tournament Information

- `GET /api/v1/tournaments/[id]` - Main tournament endpoint
- `GET /api/v1/tournaments/[id]/public` - Public tournament endpoint
- `GET /api/v1/tournaments` - Tournament list endpoint

### Teams and Groups

- `GET /api/v1/tournaments/[id]/teams` - Tournament teams
- `GET /api/v1/tournaments/[id]/groups` - Tournament groups

### Matches and Schedule

- `GET /api/v1/tournaments/[id]/matches` - Tournament matches

## Implementation Details

### Core Functions

#### `getTournamentVisibility(context)`

Determines what parts of a tournament a user can view based on publication status and user permissions.

**Parameters:**

- `userId`: User ID (optional for public access)
- `userRole`: User role (optional for public access)
- `tournamentId`: Tournament ID

**Returns:**

```typescript
interface TournamentVisibility {
  canViewTournament: boolean;
  canViewInfo: boolean;
  canViewTeams: boolean;
  canViewSchedule: boolean;
  canViewMatches: boolean;
  canViewStandings: boolean;
  canViewBrackets: boolean;
}
```

#### `filterTournamentData(tournament, visibility)`

Filters tournament data based on visibility rules, removing or hiding content that the user shouldn't see.

### Database Fields

The following fields in the `Tournament` model control visibility:

- `status`: Tournament status (`DRAFT`, `PUBLISHED`, `CANCELLED`)
- `infoPublished`: Boolean flag for basic tournament information visibility
- `teamsPublished`: Boolean flag for team visibility
- `schedulePublished`: Boolean flag for schedule visibility

### Basic Tournament Information Fields

When `infoPublished = true`, the following fields become visible to public users:

**Always Visible (Essential Fields):**

- `id`: Tournament ID
- `name`: Tournament name
- `status`: Tournament status
- `startDate`: Tournament start date
- `endDate`: Tournament end date

**Conditionally Visible (Info Published):**

- `description`: Tournament description
- `city`: Tournament city
- `address`: Tournament address
- `contactEmail`: Contact email
- `contactPhone`: Contact phone
- `logo`: Tournament logo URL
- `heroImage`: Tournament hero image URL
- `registrationDeadline`: Registration deadline
- `maxTeams`: Maximum number of teams
- `autoAcceptTeams`: Auto-accept teams setting
- `allowWaitlist`: Allow waitlist setting

## Usage Examples

### Checking Tournament Visibility

```typescript
import { getTournamentVisibility } from '@/lib/tournament/visibility';

const visibility = await getTournamentVisibility({
  userId: 'user-123',
  userRole: 'TEAM_MANAGER',
  tournamentId: 'tournament-456',
});

if (visibility.canViewInfo) {
  // Show basic tournament information
}

if (visibility.canViewTeams) {
  // Show team information
}

if (visibility.canViewSchedule) {
  // Show match schedule
}
```

### Filtering Tournament Data

```typescript
import { filterTournamentData } from '@/lib/tournament/visibility';

const filteredTournament = filterTournamentData(tournament, visibility);
// Returns tournament data with hidden content removed
```

## Error Responses

When users try to access content that's not published, they receive appropriate error messages:

- **403 Forbidden**: "Teams are not published for this tournament"
- **403 Forbidden**: "Schedule is not published for this tournament"
- **404 Not Found**: "Tournament not found or access denied"

Note: Basic tournament information (name, dates) is always visible for published tournaments, but detailed information requires `infoPublished = true`.

## Testing

The visibility system is thoroughly tested with unit tests covering:

- Admin and creator access
- Public user access restrictions
- Partial publication scenarios
- Data filtering functionality
- Error handling

Run tests with:

```bash
npm test -- src/__tests__/tournament-visibility.test.ts
```

## Migration Notes

This system is backward compatible. Existing tournaments will have:

- `infoPublished: false` (default)
- `teamsPublished: false` (default)
- `schedulePublished: false` (default)

Tournament managers need to explicitly publish tournament information, teams, and schedules using the management interface.
