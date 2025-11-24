# Role to Permissions Refactor - Summary

## ✅ Completed Tasks

### 1. Database Migration ✅
- ✅ Updated Prisma schema to use USER/ADMIN roles only
- ✅ Added permission booleans to TournamentAssignment (canConfigure, canManageScores, isReferee)
- ✅ Updated UserInvitation model to use permission booleans
- ✅ Successfully migrated database with data preservation
- ✅ All users converted to USER role (except ADMIN)

### 2. Permission System ✅
- ✅ Completely rewrote PermissionManager with async permission checks
- ✅ Implemented tournament ownership detection
- ✅ Created permission-based route access controls
- ✅ All 31 permission tests passing

### 3. API Routes Updated ✅
- ✅ Tournament routes (GET, POST, PATCH)
- ✅ Match score routes
- ✅ Teams routes
- ✅ Divisions routes
- ✅ Match schedule/bulk routes
- ✅ Placement matches/config routes
- ✅ Created permissions API endpoint

### 4. UI Components ✅
- ✅ Updated manage page route guard (uses canConfigure)
- ✅ Updated manage-public page route guard (uses canManageScores)
- ✅ Created permissions API client method
- ✅ Removed role selection from signup page

### 5. Invitation System ✅
- ✅ Updated UserInvitation model in schema
- ✅ Updated email service to use permissions instead of roles
- ✅ Created tournament invitation API endpoints
- ✅ Created invitation acceptance endpoint

## 📋 Remaining Tasks

### API Routes Still Needing Updates (~12 files)
These routes follow the same pattern and can be updated using the examples in `REMAINING_ROUTES_TO_UPDATE.md`:

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

**Pattern to follow:**
```typescript
// Replace old checks:
const hasPermission =
  user.role === 'ADMIN' ||
  user.role === 'TEAM_MANAGER' ||
  tournament.assignments.some((assignment) =>
    ['MANAGER', 'ADMIN'].includes(assignment.role)
  );

// With:
import { PermissionManager } from '@/lib/permissions';
const hasPermission = await PermissionManager.canConfigureTournament(
  (session.user as any).id,
  tournamentId
);
```

### Additional Tasks
- [ ] Update i18n translation files to remove old role references
- [ ] Update any remaining UI components that display roles
- [ ] Create UI for sending tournament invitations with permissions
- [ ] Update documentation

## Key Changes Summary

### Permission Model
- **Before**: System-wide roles (TEAM_MANAGER, TOURNAMENT_ADMIN, REFEREE)
- **After**: All users are USER (except ADMIN), permissions assigned per tournament

### Route Access
- `/tournaments/[id]/manage` → Requires `canConfigure` permission
- `/tournaments/[id]/manage-public` → Requires `canManageScores` permission

### Tournament Ownership
- Owner determined by `Tournament.createdById`
- Owners automatically have `canConfigure` and `canManageScores`
- Owners can invite users with specific permissions

### Invitation System
- Invitations now include permission booleans instead of roles
- Tournament-specific invitations with granular permissions
- API endpoints for creating and accepting invitations

## Testing Status

✅ All 31 permission tests passing
- Permission checks for ADMIN, owners, assigned users
- Route access controls
- Tournament ownership detection
- Match permissions

## Next Steps

1. Update remaining API routes using the established pattern
2. Test invitation flow end-to-end
3. Update i18n translations
4. Create invitation management UI
5. Update any remaining role displays in UI

