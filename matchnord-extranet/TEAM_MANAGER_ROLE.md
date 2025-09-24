# TEAM_MANAGER Role Implementation

## Overview

The `TEAM_MANAGER` role has been implemented in the tournament software to allow specific users to create and manage tournaments. This role provides a controlled way for team managers to set up tournaments without giving them full administrative access.

## Role Permissions

### TEAM_MANAGER can:
- ✅ Create new tournaments
- ✅ Edit tournaments they created
- ✅ Manage tournament divisions, venues, and rules
- ✅ Access tournament management pages
- ✅ View tournament analytics

### TEAM_MANAGER cannot:
- ❌ Access system administration
- ❌ Manage other users
- ❌ Access system-wide settings
- ❌ Delete tournaments (only admins can do this)

## How to Use

### 1. Create a TEAM_MANAGER User

1. Go to `/test-auth` page
2. Use the "Create New User" form
3. Select "Team Manager" as the role
4. Fill in the user details and submit

### 2. Sign in as TEAM_MANAGER

1. Use the credentials you just created
2. Sign in through the `/test-auth` page
3. You'll see your role displayed as "TEAM_MANAGER"

### 3. Create a Tournament

1. Navigate to `/admin/tournaments`
2. Click "Create Tournament"
3. Fill out the comprehensive tournament form:
   - **Step 1**: Basic tournament information
   - **Step 2**: Organization details
   - **Step 3**: Divisions and age groups
   - **Step 4**: Tournament schedule
   - **Step 5**: Venues and pitches
   - **Step 6**: Rules and regulations
   - **Step 7**: Fees and payments
   - **Step 8**: Registration settings
   - **Step 9**: Email notifications
   - **Step 10**: Preview and publish

## Example Tournament Structure

Based on the PINGVIINI CUP example, tournaments should include:

### Basic Information
- Tournament name and description
- Season and dates
- Contact information
- Logo and hero images

### Organization Details
- Organizing club/association name
- Website and contact details
- Address and location

### Divisions
- Age groups (U12, U14, U16, etc.)
- Format (5v5, 7v7, 8v8, 11v11)
- Skill levels (Elite, Competitive, Challenge, Recreational)
- Team limits and registration fees

### Venues
- Location details
- Pitch information
- Facilities and accessibility
- Parking and amenities

### Rules & Regulations
- Match duration
- Substitution rules
- Tie-break procedures
- Fair play guidelines

## Database Schema

The role is defined in the Prisma schema:

```prisma
enum UserRole {
  USER
  TEAM_MANAGER  // ← New role
  TOURNAMENT_ADMIN
  REFEREE
  VIEWER
  ADMIN
}
```

## Security

- Role-based access control is enforced at the page level
- Only users with `TEAM_MANAGER` or `ADMIN` roles can access tournament creation
- Unauthorized users are redirected to the authentication page
- Session validation occurs on every protected route

## Testing

To test the implementation:

1. Create a TEAM_MANAGER user account
2. Sign in and verify access to tournament pages
3. Try to create a tournament with all required fields
4. Verify that regular USER accounts cannot access these pages

## Future Enhancements

- Add organization-level permissions
- Implement tournament ownership tracking
- Add audit logging for tournament changes
- Create role-based dashboard views
