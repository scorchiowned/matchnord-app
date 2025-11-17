# Client Application API Usage Guide

This guide provides comprehensive instructions for the `matchnord-app` client application to correctly call the `matchnord-extranet` API endpoints for matches, time schedules, and venues.

## Table of Contents

1. [API Base Configuration](#api-base-configuration)
2. [Fetching Tournament Matches](#fetching-tournament-matches)
3. [Fetching Tournament Venues](#fetching-tournament-venues)
4. [Query Parameters and Filtering](#query-parameters-and-filtering)
5. [Response Data Structures](#response-data-structures)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

---

## API Base Configuration

### Environment Variable

Ensure your `.env.local` file includes the API base URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# or for production:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

The API client is configured in `src/lib/api-client.ts` and automatically uses this environment variable.

---

## Fetching Tournament Matches

### Endpoint

```
GET /api/v1/tournaments/{tournamentId}/public/matches
```

### Visibility Requirements

- Tournament must be published (`infoPublished = true`)
- Schedule must be published (`schedulePublished = true`)
- If schedule is not published, the endpoint returns an empty array `[]`

### Query Parameters

The endpoint supports the following query parameters for filtering:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `divisionId` | string | Filter matches by division ID | `?divisionId=clx123abc` |
| `groupId` | string | Filter matches by group ID | `?groupId=clx456def` |
| `status` | string | Filter by match status | `?status=SCHEDULED` |
| `startDate` | string (ISO 8601) | Filter matches starting from this date | `?startDate=2024-01-15T00:00:00Z` |
| `endDate` | string (ISO 8601) | Filter matches up to this date | `?endDate=2024-01-20T23:59:59Z` |

**Note**: You can combine multiple parameters: `?divisionId=clx123&status=SCHEDULED&startDate=2024-01-15`

### Using the API Client

```typescript
import { api } from '@/lib/api-client';

// Get all matches for a tournament
const allMatches = await api.tournaments.getMatches(tournamentId);

// Get matches filtered by division
const divisionMatches = await api.tournaments.getMatches(tournamentId, {
  divisionId: 'clx123abc'
});

// Get matches filtered by group
const groupMatches = await api.tournaments.getMatches(tournamentId, {
  groupId: 'clx456def'
});

// Get matches by status
const scheduledMatches = await api.tournaments.getMatches(tournamentId, {
  status: 'SCHEDULED'
});

// Get matches for a date range
const dateRangeMatches = await api.tournaments.getMatches(tournamentId, {
  startDate: '2024-01-15T00:00:00Z',
  endDate: '2024-01-20T23:59:59Z'
});

// Combine filters
const filteredMatches = await api.tournaments.getMatches(tournamentId, {
  divisionId: 'clx123abc',
  status: 'SCHEDULED',
  startDate: '2024-01-15T00:00:00Z'
});
```

### Using React Query Hooks

```typescript
import { useTournamentMatches } from '@/hooks/use-tournaments';

// In your component
function MatchSchedule({ tournamentId, divisionId }) {
  const { data: matches, isLoading, error } = useTournamentMatches(
    tournamentId,
    {
      divisionId: divisionId, // Optional filter
      status: 'SCHEDULED'    // Optional filter
    }
  );

  if (isLoading) return <div>Loading matches...</div>;
  if (error) return <div>Error loading matches</div>;

  return (
    <div>
      {matches?.map(match => (
        <div key={match.id}>
          {match.homeTeam.name} vs {match.awayTeam.name}
        </div>
      ))}
    </div>
  );
}
```

---

## Fetching Tournament Venues

### Endpoint

```
GET /api/v1/tournaments/{tournamentId}/public/venues
```

### Visibility Requirements

- Tournament must be published (`infoPublished = true`)
- If info is not published, the endpoint returns an empty array `[]`

### Using the API Client

```typescript
import { api } from '@/lib/api-client';

// Get all venues for a tournament
const venues = await api.tournaments.getVenues(tournamentId);
```

### Using React Query Hooks

```typescript
import { useTournamentVenues } from '@/hooks/use-tournaments';

// In your component
function VenueList({ tournamentId }) {
  const { data: venues, isLoading, error } = useTournamentVenues(tournamentId);

  if (isLoading) return <div>Loading venues...</div>;
  if (error) return <div>Error loading venues</div>;

  return (
    <div>
      {venues?.map(venue => (
        <div key={venue.id}>
          <h3>{venue.name}</h3>
          <p>{venue.city}, {venue.country.name}</p>
          <p>Pitches: {venue.pitches.length}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Response Data Structures

### Match Response

```typescript
interface Match {
  id: string;
  startTime: string;           // ISO 8601 datetime string
  endTime: string | null;       // ISO 8601 datetime string
  status: MatchStatus;          // 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'POSTPONED'
  homeTeam: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;         // ✅ NEW: Team logo URL
    country: {
      id: string;
      name: string;
      code: string;
    };
  } | null;
  awayTeam: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;         // ✅ NEW: Team logo URL
    country: {
      id: string;
      name: string;
      code: string;
    };
  } | null;
  homeScore: number;
  awayScore: number;
  venue: {
    id: string;
    name: string;
    streetName: string | null;
    postalCode: string | null;
    city: string | null;
    country: {
      id: string;
      name: string;
      code: string;
    };
  } | null;
  pitch: {
    id: string;
    name: string;
    surface: string | null;
  } | null;
  group: {
    id: string;
    name: string;
    division: {
      id: string;
      name: string;
      level: string | null;           // ✅ NEW: Division level (e.g., 'ELITE', 'COMPETITIVE')
      matchDuration: number | null;    // ✅ NEW: Match duration in minutes
      breakDuration: number | null;     // ✅ NEW: Break duration in minutes
    } | null;
  } | null;
  notes: string | null;
}
```

### Venue Response

```typescript
interface Venue {
  id: string;
  name: string;
  streetName: string | null;
  postalCode: string | null;
  city: string | null;
  country: {
    id: string;
    name: string;
    code: string;
  };
  xCoordinate: number | null;  // Longitude for mapping
  yCoordinate: number | null;   // Latitude for mapping
  pitches: Array<{
    id: string;
    name: string;
    surface: string | null;
    length: number | null;
    width: number | null;
  }>;
}
```

---

## Query Parameters and Filtering

### Division Filtering

Filter matches by division ID. This will return all matches in groups belonging to the specified division.

```typescript
// Get all matches in a specific division
const matches = await api.tournaments.getMatches(tournamentId, {
  divisionId: 'clx123abc'
});
```

### Group Filtering

Filter matches by group ID. This returns only matches in the specified group.

```typescript
// Get all matches in a specific group
const matches = await api.tournaments.getMatches(tournamentId, {
  groupId: 'clx456def'
});
```

### Status Filtering

Filter matches by status. Valid statuses:
- `SCHEDULED` - Match is scheduled but not started
- `LIVE` - Match is currently in progress
- `FINISHED` - Match has completed
- `CANCELLED` - Match was cancelled
- `POSTPONED` - Match was postponed

```typescript
// Get only scheduled matches
const scheduledMatches = await api.tournaments.getMatches(tournamentId, {
  status: 'SCHEDULED'
});

// Get live matches
const liveMatches = await api.tournaments.getMatches(tournamentId, {
  status: 'LIVE'
});
```

### Date Range Filtering

Filter matches by start time using ISO 8601 date strings.

```typescript
// Get matches for a specific day
const todayMatches = await api.tournaments.getMatches(tournamentId, {
  startDate: '2024-01-15T00:00:00Z',
  endDate: '2024-01-15T23:59:59Z'
});

// Get matches from a date onwards
const upcomingMatches = await api.tournaments.getMatches(tournamentId, {
  startDate: new Date().toISOString()
});
```

### Combining Filters

You can combine multiple filters for more specific queries:

```typescript
// Get scheduled matches in a division for today
const matches = await api.tournaments.getMatches(tournamentId, {
  divisionId: 'clx123abc',
  status: 'SCHEDULED',
  startDate: '2024-01-15T00:00:00Z',
  endDate: '2024-01-15T23:59:59Z'
});
```

---

## Error Handling

### Common Error Responses

#### 404 - Tournament Not Found

```json
{
  "error": "Tournament not found or access denied"
}
```

**Handling:**
```typescript
try {
  const matches = await api.tournaments.getMatches(tournamentId);
} catch (error) {
  if (error.status === 404) {
    // Tournament doesn't exist or is not published
    console.error('Tournament not found');
  }
}
```

#### 400 - Bad Request

```json
{
  "error": "Tournament ID is required"
}
```

#### 500 - Server Error

```json
{
  "error": "Internal server error"
}
```

### Empty Responses

If the tournament schedule is not published, the matches endpoint returns an empty array:

```json
[]
```

**Always check for empty arrays:**
```typescript
const matches = await api.tournaments.getMatches(tournamentId);

if (!matches || matches.length === 0) {
  // No matches available or schedule not published
  return <div>No matches available</div>;
}
```

---

## Best Practices

### 1. Use React Query for Caching

Always use the provided React Query hooks for automatic caching and refetching:

```typescript
// ✅ Good: Uses React Query with caching
const { data: matches } = useTournamentMatches(tournamentId, filters);

// ❌ Bad: Direct fetch without caching
const [matches, setMatches] = useState([]);
useEffect(() => {
  fetch(`/api/v1/tournaments/${tournamentId}/public/matches`)
    .then(res => res.json())
    .then(setMatches);
}, [tournamentId]);
```

### 2. Filter on the Server, Not Client

Use query parameters to filter on the server side:

```typescript
// ✅ Good: Server-side filtering
const matches = await api.tournaments.getMatches(tournamentId, {
  divisionId: divisionId,
  status: 'SCHEDULED'
});

// ❌ Bad: Fetch all matches and filter client-side
const allMatches = await api.tournaments.getMatches(tournamentId);
const filtered = allMatches.filter(m => 
  m.group?.division?.id === divisionId && m.status === 'SCHEDULED'
);
```

### 3. Handle Loading and Error States

Always handle loading and error states:

```typescript
function MatchList({ tournamentId }) {
  const { data: matches, isLoading, error } = useTournamentMatches(tournamentId);

  if (isLoading) {
    return <div>Loading matches...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!matches || matches.length === 0) {
    return <div>No matches available</div>;
  }

  return (
    <div>
      {matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
```

### 4. Use Team Logos

The API now includes team logos. Always check if a logo exists before displaying:

```typescript
function TeamLogo({ team }) {
  if (!team.logo) {
    return <div className="team-placeholder">{team.shortName || team.name}</div>;
  }
  
  return (
    <img 
      src={team.logo} 
      alt={team.name}
      className="team-logo"
      onError={(e) => {
        // Fallback if image fails to load
        e.target.style.display = 'none';
      }}
    />
  );
}
```

### 5. Display Division Information

Use the division level and match duration from the match response:

```typescript
function MatchCard({ match }) {
  const division = match.group?.division;
  
  return (
    <div className="match-card">
      {division && (
        <div className="division-info">
          {division.level && <span>{division.level}</span>}
          <span>{division.name}</span>
          {division.matchDuration && (
            <span>{division.matchDuration} min</span>
          )}
        </div>
      )}
      <div className="teams">
        <TeamLogo team={match.homeTeam} />
        <span>vs</span>
        <TeamLogo team={match.awayTeam} />
      </div>
      <div className="time">
        {format(new Date(match.startTime), 'HH:mm')}
      </div>
    </div>
  );
}
```

### 6. Format Dates Correctly

Always parse ISO 8601 date strings properly:

```typescript
import { format, parseISO } from 'date-fns';

function MatchTime({ startTime }) {
  const date = parseISO(startTime); // Parse ISO string
  return <time>{format(date, 'MMM dd, yyyy HH:mm')}</time>;
}
```

### 7. Handle Null Values

Many fields can be `null`. Always check before accessing:

```typescript
function MatchVenue({ match }) {
  if (!match.venue) {
    return <span>TBA</span>;
  }
  
  return (
    <div>
      <strong>{match.venue.name}</strong>
      {match.venue.city && <span>, {match.venue.city}</span>}
      {match.pitch && <span> - {match.pitch.name}</span>}
    </div>
  );
}
```

---

## Examples

### Example 1: Match Schedule Component

```typescript
'use client';

import { useTournamentMatches } from '@/hooks/use-tournaments';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';

export function MatchSchedule({ tournamentId, divisionId }) {
  const { data: matches, isLoading, error } = useTournamentMatches(
    tournamentId,
    { divisionId, status: 'SCHEDULED' }
  );

  if (isLoading) return <div>Loading schedule...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!matches || matches.length === 0) {
    return <div>No matches scheduled</div>;
  }

  // Group matches by date
  const matchesByDate = matches.reduce((acc, match) => {
    const date = format(parseISO(match.startTime), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});

  return (
    <div className="match-schedule">
      {Object.entries(matchesByDate).map(([date, dayMatches]) => (
        <div key={date} className="day-schedule">
          <h3>{format(parseISO(date), 'EEEE, MMMM dd')}</h3>
          {dayMatches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MatchCard({ match }) {
  const division = match.group?.division;
  
  return (
    <div className="match-card">
      <div className="match-header">
        {division && (
          <div className="division">
            {division.level && <span className="level">{division.level}</span>}
            <span className="name">{division.name}</span>
            {match.group && <span className="group">{match.group.name}</span>}
          </div>
        )}
        <div className="time">
          {format(parseISO(match.startTime), 'HH:mm')}
        </div>
      </div>
      
      <div className="teams">
        <div className="team">
          {match.homeTeam?.logo && (
            <Image 
              src={match.homeTeam.logo} 
              alt={match.homeTeam.name}
              width={24}
              height={24}
            />
          )}
          <span>{match.homeTeam?.shortName || match.homeTeam?.name}</span>
        </div>
        <span className="vs">vs</span>
        <div className="team">
          {match.awayTeam?.logo && (
            <Image 
              src={match.awayTeam.logo} 
              alt={match.awayTeam.name}
              width={24}
              height={24}
            />
          )}
          <span>{match.awayTeam?.shortName || match.awayTeam?.name}</span>
        </div>
      </div>
      
      {match.venue && (
        <div className="venue">
          <strong>{match.venue.name}</strong>
          {match.pitch && <span> - {match.pitch.name}</span>}
        </div>
      )}
    </div>
  );
}
```

### Example 2: Venue Map Component

```typescript
'use client';

import { useTournamentVenues } from '@/hooks/use-tournaments';
import { useTournamentMatches } from '@/hooks/use-tournaments';

export function VenueMap({ tournamentId }) {
  const { data: venues } = useTournamentVenues(tournamentId);
  const { data: matches } = useTournamentMatches(tournamentId);

  if (!venues || venues.length === 0) {
    return <div>No venues available</div>;
  }

  return (
    <div className="venue-map">
      {venues.map(venue => {
        const venueMatches = matches?.filter(m => m.venue?.id === venue.id) || [];
        
        return (
          <div key={venue.id} className="venue-marker">
            <h3>{venue.name}</h3>
            <p>{venue.city}, {venue.country.name}</p>
            {venue.xCoordinate && venue.yCoordinate && (
              <div 
                className="map-pin"
                style={{
                  position: 'absolute',
                  left: `${venue.xCoordinate}%`,
                  top: `${venue.yCoordinate}%`
                }}
              >
                {venueMatches.length} matches
              </div>
            )}
            <div className="pitches">
              {venue.pitches.map(pitch => (
                <span key={pitch.id}>{pitch.name}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Example 3: Filtered Match List

```typescript
'use client';

import { useState } from 'react';
import { useTournamentMatches } from '@/hooks/use-tournaments';
import { useTournamentDivisions } from '@/hooks/use-tournaments';

export function FilteredMatchList({ tournamentId }) {
  const [selectedDivision, setSelectedDivision] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string>('SCHEDULED');
  
  const { data: divisions } = useTournamentDivisions(tournamentId);
  const { data: matches, isLoading } = useTournamentMatches(tournamentId, {
    divisionId: selectedDivision,
    status: selectedStatus
  });

  return (
    <div>
      <div className="filters">
        <select 
          value={selectedDivision || ''} 
          onChange={(e) => setSelectedDivision(e.target.value || undefined)}
        >
          <option value="">All Divisions</option>
          {divisions?.map(div => (
            <option key={div.id} value={div.id}>
              {div.name}
            </option>
          ))}
        </select>
        
        <select 
          value={selectedStatus} 
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="SCHEDULED">Scheduled</option>
          <option value="LIVE">Live</option>
          <option value="FINISHED">Finished</option>
        </select>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="matches">
          {matches?.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Summary

### Key Points

1. ✅ **Use public endpoints**: `/api/v1/tournaments/{id}/public/matches` and `/api/v1/tournaments/{id}/public/venues`
2. ✅ **Filter on the server**: Use query parameters (`divisionId`, `groupId`, `status`, `startDate`, `endDate`)
3. ✅ **Use React Query hooks**: `useTournamentMatches()` and `useTournamentVenues()` for automatic caching
4. ✅ **Handle null values**: Many fields can be `null`, always check before accessing
5. ✅ **Use new fields**: Team logos, division level, and match duration are now available
6. ✅ **Format dates correctly**: Parse ISO 8601 strings with `parseISO()` from `date-fns`
7. ✅ **Handle errors**: Check for 404, 400, and 500 errors
8. ✅ **Check visibility**: Empty arrays may indicate unpublished data

### API Endpoints Summary

| Endpoint | Method | Query Params | Returns |
|----------|--------|--------------|---------|
| `/api/v1/tournaments/{id}/public/matches` | GET | `divisionId`, `groupId`, `status`, `startDate`, `endDate` | `Match[]` |
| `/api/v1/tournaments/{id}/public/venues` | GET | None | `Venue[]` |

---

For more information, see:
- [API Endpoints Documentation](../../matchnord-extranet/API_ENDPOINTS.md)
- [Public API Endpoints Documentation](../../matchnord-extranet/docs/PUBLIC_API_ENDPOINTS.md)

