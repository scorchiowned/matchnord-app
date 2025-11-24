# Role to Permissions Refactor - Progress Report

## Overview
This document tracks the progress of refactoring from role-based access control to a permission-based system.

## Completed Tasks ✅

### 1. Database Schema Updates
- ✅ Updated `UserRole` enum to only `USER` and `ADMIN`
- ✅ Updated `TournamentAssignment` model to use permission booleans:
  - `canConfigure` - Can manage tournament settings
  - `canManageScores` - Can manage match scores
  - `isReferee` - Can be assigned as referee
- ✅ Updated `UserInvitation` model to use permission booleans instead of role
- ✅ Removed `TournamentRole` enum
- ✅ Updated User model default role to `USER`

### 2. Migration Scripts
- ✅ Created data migration script: `scripts/migrate-roles-to-permissions.ts`
  - Converts all non-ADMIN users to USER role
  - Migrates TournamentAssignment roles to permission booleans
  - Ensures tournament owners have proper permissions
  - Updates UserInvitation records

### 3. Permission System
- ✅ Completely rewrote `PermissionManager` class with new permission-based logic
- ✅ Implemented async permission checks:
  - `canConfigureTournament()` - Check if user can configure tournament
  - `canManageScores()` - Check if user can manage scores
  - `canAccessTournament()` - Check if user can access tournament
  - `canUpdateMatchResults()` - Check if user can update match scores
  - `getTournamentPermissions()` - Get all permissions for a tournament
- ✅ Updated `RouteAccess` class:
  - `canAccessTournamentManage()` - For `/tournaments/[id]/manage` route
  - `canAccessTournamentManagePublic()` - For `/tournaments/[id]/manage-public` route
- ✅ Updated `RoleDisplay` class for USER role

### 4. API Routes Updated
- ✅ `/api/v1/tournaments` (GET) - Updated filtering logic
- ✅ `/api/v1/tournaments` (POST) - Updated to allow USER role, default to USER
- ✅ `/api/v1/tournaments/[id]` (PATCH) - Updated to use `canConfigureTournament()`
- ✅ `/api/v1/matches/[id]/score` (PUT) - Updated to use `canUpdateMatchResults()`
- ✅ `/api/auth/register` - Updated to default to USER role, removed role selection

### 5. Tests
- ✅ Created comprehensive test suite: `src/__tests__/permissions.test.ts`
  - Tests for `PermissionManager` class
  - Tests for `RouteAccess` class
  - Tests for all permission checks
  - Tests for tournament owner permissions
  - Tests for assignment-based permissions

## In Progress 🚧

### API Routes Still Needing Updates
The following routes still need to be updated to use the new permission system:

1. `/api/v1/tournaments/[id]/matches/*` - Match management routes
2. `/api/v1/tournaments/[id]/divisions/*` - Division management routes
3. `/api/v1/tournaments/[id]/placement-*` - Placement match routes
4. `/api/v1/teams/*` - Team management routes
5. `/api/v1/matches/[id]/events/*` - Match event routes
6. `/api/v1/matches/[id]/status/*` - Match status routes
7. `/api/v1/divisions/[id]/*` - Division routes

## Pending Tasks 📋

### 1. Database Migration
- [ ] Generate Prisma migration: `npx prisma migrate dev --name migrate_to_permissions`
- [ ] Run data migration script: `tsx scripts/migrate-roles-to-permissions.ts`
- [ ] Verify migration on development database

### 2. User Invitation System
- [ ] Update invitation API endpoints to use permission booleans
- [ ] Update invitation acceptance flow
- [ ] Update email templates for invitations
- [ ] Create UI for sending tournament invitations with permissions

### 3. UI Components
- [ ] Update route guards for `/tournaments/[id]/manage` page
- [ ] Update route guards for `/tournaments/[id]/manage-public` page
- [ ] Update all role displays to show USER instead of old roles
- [ ] Create permission management UI for tournament owners
- [ ] Update navigation/routing based on permissions

### 4. Registration & Authentication
- [ ] Update signup page to remove role selection
- [ ] Update email service to handle USER role
- [ ] Update any role-based redirects

### 5. Documentation & Translations
- [ ] Update i18n translation files (en.json, fi.json, etc.)
- [ ] Update README.md with new permission system
- [ ] Update API documentation
- [ ] Remove/update TEAM_MANAGER_ROLE.md

### 6. Cleanup
- [ ] Remove organization references from user-related code (if needed)
- [ ] Update any remaining role checks in components
- [ ] Remove deprecated role enums from TypeScript types

## Key Changes Summary

### Permission Model
- **Before**: Users had system-wide roles (TEAM_MANAGER, TOURNAMENT_ADMIN, REFEREE)
- **After**: All users are USER (except ADMIN), permissions assigned per tournament

### Tournament Ownership
- Tournament owner is determined by `Tournament.createdById`
- Owners automatically have `canConfigure` and `canManageScores` permissions
- Owners can invite other users with specific permissions

### Permission Flags
- `canConfigure`: Access to `/tournaments/[id]/manage` route
- `canManageScores`: Access to `/tournaments/[id]/manage-public` route
- `isReferee`: Can be assigned to matches via `MatchAssignment`

### ADMIN Role
- ADMIN users have full access to everything
- No changes to ADMIN functionality

## Testing Checklist

Before deploying:
- [ ] Run permission tests: `npm test permissions.test.ts`
- [ ] Test tournament creation as USER
- [ ] Test tournament management as owner
- [ ] Test tournament management with canConfigure permission
- [ ] Test score management with canManageScores permission
- [ ] Test match assignment as referee
- [ ] Test invitation flow
- [ ] Test route guards for manage/manage-public pages
- [ ] Test migration script on development database

## Notes

- The migration script preserves old role data in the `permissions` JSON field for reference
- Tournament owners are automatically granted full permissions (canConfigure + canManageScores)
- Match assignments (MatchAssignment) remain unchanged - they still use MatchRole enum
- Organization relationships are kept in schema but not used for permissions

