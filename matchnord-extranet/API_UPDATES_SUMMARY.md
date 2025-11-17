# API Updates Summary

## Overview

This document summarizes the updates made to the public matches API endpoint and the creation of comprehensive client-side documentation.

## Changes Made

### 1. Enhanced Public Matches API Endpoint

**File**: `src/app/api/v1/tournaments/[id]/public/matches/route.ts`

#### Added Query Parameter Support

The endpoint now supports the following query parameters for server-side filtering:

- `divisionId` - Filter matches by division ID
- `groupId` - Filter matches by group ID  
- `status` - Filter by match status (`SCHEDULED`, `LIVE`, `FINISHED`, `CANCELLED`, `POSTPONED`)
- `startDate` - Filter matches starting from this date (ISO 8601 format)
- `endDate` - Filter matches up to this date (ISO 8601 format)

**Benefits**:
- ✅ Server-side filtering reduces data transfer
- ✅ Better performance for large tournaments
- ✅ More efficient database queries
- ✅ Supports complex filtering combinations

#### Added Missing Fields to Response

The match response now includes:

1. **Team Logos** (`homeTeam.logo`, `awayTeam.logo`)
   - Previously missing, now included as `string | null`
   - Allows client applications to display team logos

2. **Division Level** (`group.division.level`)
   - Previously missing, now included as `string | null`
   - Shows division level (e.g., 'ELITE', 'COMPETITIVE', 'CHALLENGE', 'RECREATIONAL')

3. **Match Duration** (`group.division.matchDuration`)
   - Previously missing, now included as `number | null`
   - Match duration in minutes (e.g., 25, 30, 90)

4. **Break Duration** (`group.division.breakDuration`)
   - Previously missing, now included as `number | null`
   - Break duration in minutes between matches

**Benefits**:
- ✅ Complete match information available in a single request
- ✅ No need for additional API calls to get division details
- ✅ Better client-side display capabilities

### 2. Updated Documentation

#### Created Client API Guide

**File**: `matchnord-app/CLIENT_API_GUIDE.md`

Comprehensive guide for client application developers including:

- API base configuration
- Endpoint usage examples
- Query parameter documentation
- Response data structures
- Error handling
- Best practices
- Complete code examples

#### Updated Public API Documentation

**File**: `docs/PUBLIC_API_ENDPOINTS.md`

Updated to reflect:
- New query parameters
- New response fields
- Filtering examples
- Usage patterns

## API Endpoint Details

### Endpoint

```
GET /api/v1/tournaments/{tournamentId}/public/matches
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|-----------|-------------|
| `divisionId` | string | No | Filter by division ID |
| `groupId` | string | No | Filter by group ID |
| `status` | string | No | Filter by match status |
| `startDate` | string (ISO 8601) | No | Filter from date |
| `endDate` | string (ISO 8601) | No | Filter to date |

### Example Requests

```bash
# Get all matches
GET /api/v1/tournaments/clx123/public/matches

# Get matches for a division
GET /api/v1/tournaments/clx123/public/matches?divisionId=clx456

# Get scheduled matches for today
GET /api/v1/tournaments/clx123/public/matches?status=SCHEDULED&startDate=2024-01-15T00:00:00Z&endDate=2024-01-15T23:59:59Z

# Combine filters
GET /api/v1/tournaments/clx123/public/matches?divisionId=clx456&groupId=clx789&status=SCHEDULED
```

### Response Structure

```typescript
interface Match {
  id: string;
  startTime: string;
  endTime: string | null;
  status: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;        // ✅ NEW
    country: { id: string; name: string; code: string; };
  } | null;
  awayTeam: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;         // ✅ NEW
    country: { id: string; name: string; code: string; };
  } | null;
  homeScore: number;
  awayScore: number;
  venue: { /* ... */ } | null;
  pitch: { /* ... */ } | null;
  group: {
    id: string;
    name: string;
    division: {
      id: string;
      name: string;
      level: string | null;           // ✅ NEW
      matchDuration: number | null;   // ✅ NEW
      breakDuration: number | null;   // ✅ NEW
    } | null;
  } | null;
  notes: string | null;
}
```

## Migration Guide for Client Applications

### Before (Client-Side Filtering)

```typescript
// ❌ Old way: Fetch all matches, filter client-side
const allMatches = await api.tournaments.getMatches(tournamentId);
const filtered = allMatches.filter(m => 
  m.group?.division?.id === divisionId && 
  m.status === 'SCHEDULED'
);
```

### After (Server-Side Filtering)

```typescript
// ✅ New way: Filter on server
const matches = await api.tournaments.getMatches(tournamentId, {
  divisionId: divisionId,
  status: 'SCHEDULED'
});
```

### Using New Fields

```typescript
// ✅ Now available: Team logos
{match.homeTeam?.logo && (
  <img src={match.homeTeam.logo} alt={match.homeTeam.name} />
)}

// ✅ Now available: Division level
{match.group?.division?.level && (
  <span>{match.group.division.level}</span>
)}

// ✅ Now available: Match duration
{match.group?.division?.matchDuration && (
  <span>{match.group.division.matchDuration} minutes</span>
)}
```

## Benefits

1. **Performance**: Server-side filtering reduces data transfer and improves response times
2. **Completeness**: All necessary match information available in a single request
3. **Flexibility**: Multiple query parameters can be combined for complex filtering
4. **Developer Experience**: Comprehensive documentation with examples
5. **Type Safety**: TypeScript interfaces provided for all responses

## Testing

To test the new features:

1. **Test Query Parameters**:
   ```bash
   curl "http://localhost:3001/api/v1/tournaments/{id}/public/matches?divisionId={divId}&status=SCHEDULED"
   ```

2. **Verify New Fields**:
   - Check that `homeTeam.logo` and `awayTeam.logo` are included
   - Check that `group.division.level` is included
   - Check that `group.division.matchDuration` and `breakDuration` are included

3. **Test Filtering**:
   - Filter by division
   - Filter by group
   - Filter by status
   - Filter by date range
   - Combine multiple filters

## Backward Compatibility

✅ **Fully backward compatible**

- Existing API calls without query parameters continue to work
- All existing response fields remain unchanged
- New fields are optional (`null` if not available)
- No breaking changes to existing client code

## Next Steps for Client Applications

1. **Update API Client** (if needed):
   - Ensure `getMatches()` method supports query parameters
   - Already implemented in `matchnord-app/src/lib/api-client.ts`

2. **Update Components**:
   - Use server-side filtering instead of client-side filtering
   - Display team logos using `match.homeTeam.logo` and `match.awayTeam.logo`
   - Display division level using `match.group.division.level`
   - Display match duration using `match.group.division.matchDuration`

3. **Review Documentation**:
   - Read `matchnord-app/CLIENT_API_GUIDE.md` for complete usage guide
   - Review examples and best practices

## Files Changed

1. `matchnord-extranet/src/app/api/v1/tournaments/[id]/public/matches/route.ts`
   - Added query parameter parsing
   - Added server-side filtering logic
   - Added team logo fields to response
   - Added division level, matchDuration, and breakDuration to response

2. `matchnord-app/CLIENT_API_GUIDE.md` (NEW)
   - Comprehensive client-side API usage guide

3. `matchnord-extranet/docs/PUBLIC_API_ENDPOINTS.md`
   - Updated with new query parameters
   - Updated with new response fields
   - Added filtering examples

4. `matchnord-extranet/API_UPDATES_SUMMARY.md` (THIS FILE)
   - Summary of all changes

## Questions or Issues?

If you encounter any issues or have questions:

1. Review the documentation in `CLIENT_API_GUIDE.md`
2. Check the API endpoint implementation in `route.ts`
3. Verify query parameters are correctly formatted
4. Ensure tournament visibility settings allow public access

