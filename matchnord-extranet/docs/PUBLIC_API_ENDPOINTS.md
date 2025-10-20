# Public API Endpoints

This document describes the public API endpoints available for accessing tournament data without authentication. These endpoints respect tournament visibility settings and only return data that has been made publicly available.

## Overview

The public API endpoints provide access to tournament data based on the tournament's publication settings:

- **`infoPublished`**: Controls basic tournament information visibility
- **`teamsPublished`**: Controls team information visibility
- **`schedulePublished`**: Controls match schedules and results visibility

## Available Endpoints

### 1. Tournament Divisions

**Endpoint**: `GET /api/v1/tournaments/[id]/public/divisions`

**Visibility**: Returns data only if `teamsPublished = true`

**Response**: Array of divisions with groups, teams, and standings

```typescript
interface PublicDivision {
  id: string;
  name: string;
  description: string;
  birthYear: number;
  format: string;
  level: string;
  groups: Array<{
    id: string;
    name: string;
    teams: Array<{
      id: string;
      name: string;
      shortName: string;
      country: {
        id: string;
        name: string;
        code: string;
      };
    }>;
    standings: Array<{
      position: number;
      team: Team;
      points: number;
      goalDifference: number;
      // ... other standing fields
    }>;
  }>;
}
```

### 2. Tournament Venues

**Endpoint**: `GET /api/v1/tournaments/[id]/public/venues`

**Visibility**: Returns data only if `infoPublished = true`

**Response**: Array of venues with pitches and location information

```typescript
interface PublicVenue {
  id: string;
  name: string;
  streetName: string;
  postalCode: string;
  city: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
  xCoordinate: number;
  yCoordinate: number;
  pitches: Array<{
    id: string;
    name: string;
    surface: string;
    length: number;
    width: number;
  }>;
}
```

### 3. Tournament Teams

**Endpoint**: `GET /api/v1/tournaments/[id]/public/teams`

**Visibility**: Returns data only if `teamsPublished = true`

**Response**: Array of teams with players and division information

```typescript
interface PublicTeam {
  id: string;
  name: string;
  shortName: string;
  club: string;
  city: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
  level: string;
  status: string;
  division: {
    id: string;
    name: string;
    description: string;
  };
  playerCount: number;
  players: Array<{
    id: string;
    firstName: string;
    lastName: string;
    jerseyNumber: number;
    position: string;
    birthDate: string;
  }>;
}
```

### 4. Tournament Matches

**Endpoint**: `GET /api/v1/tournaments/[id]/public/matches`

**Visibility**: Returns data only if `schedulePublished = true`

**Response**: Array of matches with teams, venues, and schedule information

```typescript
interface PublicMatch {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    country: {
      id: string;
      name: string;
      code: string;
    };
  } | null;
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    country: {
      id: string;
      name: string;
      code: string;
    };
  } | null;
  homeScore: number | null;
  awayScore: number | null;
  venue: {
    id: string;
    name: string;
    streetName: string;
    postalCode: string;
    city: string;
    country: {
      id: string;
      name: string;
      code: string;
    };
  } | null;
  pitch: {
    id: string;
    name: string;
    surface: string;
  } | null;
  group: {
    id: string;
    name: string;
    division: {
      id: string;
      name: string;
    };
  } | null;
  notes: string | null;
}
```

## Migration Guide

### From Authenticated Endpoints to Public Endpoints

**Before (Authentication Required)**:

```typescript
// ❌ Old way - requires authentication
const response = await fetch('/api/v1/tournaments/[id]/divisions', {
  headers: {
    Authorization: 'Bearer <token>',
  },
});
```

**After (Public Access)**:

```typescript
// ✅ New way - no authentication required
const response = await fetch('/api/v1/tournaments/[id]/public/divisions');
```

### Endpoint Mapping

| Old Endpoint                         | New Public Endpoint                         | Visibility Control  |
| ------------------------------------ | ------------------------------------------- | ------------------- |
| `/api/v1/tournaments/[id]/divisions` | `/api/v1/tournaments/[id]/public/divisions` | `teamsPublished`    |
| `/api/v1/tournaments/[id]/venues`    | `/api/v1/tournaments/[id]/public/venues`    | `infoPublished`     |
| `/api/v1/tournaments/[id]/teams`     | `/api/v1/tournaments/[id]/public/teams`     | `teamsPublished`    |
| `/api/v1/tournaments/[id]/matches`   | `/api/v1/tournaments/[id]/public/matches`   | `schedulePublished` |

## Error Handling

### Common Responses

**Tournament Not Found (404)**:

```json
{
  "error": "Tournament not found or access denied"
}
```

**Data Not Published (Empty Array)**:

```json
[]
```

**Server Error (500)**:

```json
{
  "error": "Internal server error"
}
```

## Usage Examples

### Fetching Tournament Divisions

```typescript
async function getTournamentDivisions(tournamentId: string) {
  try {
    const response = await fetch(
      `/api/v1/tournaments/${tournamentId}/public/divisions`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Tournament not found or not published');
      }
      throw new Error('Failed to fetch divisions');
    }

    const divisions = await response.json();
    return divisions;
  } catch (error) {
    console.error('Error fetching divisions:', error);
    return [];
  }
}
```

### Fetching Tournament Teams

```typescript
async function getTournamentTeams(tournamentId: string) {
  try {
    const response = await fetch(
      `/api/v1/tournaments/${tournamentId}/public/teams`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Tournament not found or teams not published');
      }
      throw new Error('Failed to fetch teams');
    }

    const teams = await response.json();
    return teams;
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}
```

### Fetching Tournament Matches

```typescript
async function getTournamentMatches(tournamentId: string) {
  try {
    const response = await fetch(
      `/api/v1/tournaments/${tournamentId}/public/matches`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Tournament not found or schedule not published');
      }
      throw new Error('Failed to fetch matches');
    }

    const matches = await response.json();
    return matches;
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}
```

## Best Practices

1. **Always handle empty responses**: Public endpoints may return empty arrays if data is not published
2. **Check response status**: Handle 404 responses for unpublished tournaments
3. **Use appropriate endpoints**: Choose the right endpoint based on the data you need
4. **Respect visibility settings**: Don't try to access data that isn't publicly available
5. **Cache responses**: Public data can be cached since it doesn't require authentication

## Security Notes

- These endpoints are **publicly accessible** - no authentication required
- Data is filtered based on tournament publication settings
- Sensitive information is automatically excluded
- Tournament creators and admins can still use authenticated endpoints for full access
- Public endpoints respect the same visibility rules as the main public tournament endpoint
