# Remaining Routes to Update

## Pattern for Updates

All routes should follow this pattern:

### For canConfigure (tournament management):
```typescript
import { PermissionManager } from '@/lib/permissions';

// Replace old checks like:
const hasPermission =
  session.user.role === 'ADMIN' ||
  session.user.role === 'TEAM_MANAGER' ||
  tournament.assignments.some((assignment) =>
    ['MANAGER', 'ADMIN'].includes(assignment.role)
  );

// With:
const hasPermission = await PermissionManager.canConfigureTournament(
  (session.user as any).id,
  tournamentId
);
```

### For canManageScores (score management):
```typescript
const hasPermission = await PermissionManager.canManageScores(
  (session.user as any).id,
  tournamentId
);
```

### For match updates:
```typescript
const hasPermission = await PermissionManager.canUpdateMatchResults(
  (session.user as any).id,
  matchId
);
```

## Files Still Needing Updates

1. `src/app/api/v1/matches/[id]/status/route.ts`
2. `src/app/api/v1/matches/[id]/route.ts`
3. `src/app/api/v1/matches/[id]/events/route.ts`
4. `src/app/api/v1/matches/[id]/events/[eventId]/route.ts`
5. `src/app/api/v1/groups/[id]/route.ts`
6. `src/app/api/v1/groups/[id]/teams/route.ts`
7. `src/app/api/v1/venues/[id]/route.ts`
8. `src/app/api/v1/teams/[id]/route.ts`
9. `src/app/api/v1/tournaments/[id]/matches/route.ts`
10. `src/app/api/v1/tournaments/[id]/groups/route.ts`
11. `src/app/api/v1/tournaments/[id]/venues/route.ts`
12. `src/app/api/v1/tournaments/[id]/divisions/route.ts`
13. `src/app/api/v1/tournaments/[id]/teams/route.ts`
14. `src/app/api/v1/tournaments/[id]/placement-matches/resolve/route.ts`

## Routes Already Updated ✅

- `/api/v1/tournaments` (GET, POST)
- `/api/v1/tournaments/[id]` (PATCH)
- `/api/v1/tournaments/[id]/matches/schedule` (POST)
- `/api/v1/tournaments/[id]/matches/bulk` (POST)
- `/api/v1/tournaments/[id]/placement-matches` (POST)
- `/api/v1/tournaments/[id]/placement-config` (GET, POST)
- `/api/v1/divisions/[id]` (GET, PUT, DELETE)
- `/api/v1/divisions/[id]/matches/generate` (POST)
- `/api/v1/teams` (GET, POST)
- `/api/v1/matches/[id]/score` (PUT)

