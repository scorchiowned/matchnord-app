# API Endpoints Documentation

## Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email
- `GET/POST /api/auth/[...nextauth]` - NextAuth authentication handlers

## Health & Test
- `GET /api/health` - Health check endpoint
- `POST /api/test-email` - Test email sending
- `GET /api/test/user/[id]` - Test user endpoint
- `GET /api/test/registrations/[email]` - Test registrations
- `GET /api/test/invitations/[email]` - Test invitations
- `POST /api/test/create-verification-token` - Create verification token
- `POST /api/test/create-expired-token` - Create expired token

## Tournaments

### Tournament Management
- `GET /api/v1/tournaments` - List all tournaments
- `POST /api/v1/tournaments` - Create new tournament
- `GET /api/v1/tournaments/[id]` - Get tournament by ID
- `PATCH /api/v1/tournaments/[id]` - Update tournament
- `GET /api/v1/tournaments/[id]/manage` - Get tournament management data
- `PUT /api/v1/tournaments/[id]/manage` - Update tournament management data
- `POST /api/v1/tournaments/[id]/manage` - Perform tournament actions
- `POST /api/v1/tournaments/[id]/lock` - Lock tournament
- `POST /api/v1/tournaments/[id]/unlock` - Unlock tournament

### Tournament Public Endpoints
- `GET /api/v1/tournaments/[id]/public` - Get public tournament info
- `GET /api/v1/tournaments/[id]/public/divisions` - Get public divisions
- `GET /api/v1/tournaments/[id]/public/matches` - Get public matches
- `GET /api/v1/tournaments/[id]/public/teams` - Get public teams
- `GET /api/v1/tournaments/[id]/public/venues` - Get public venues

### Tournament Divisions
- `GET /api/v1/tournaments/[id]/divisions` - List tournament divisions
- `POST /api/v1/tournaments/[id]/divisions` - Create division
- `GET /api/v1/divisions/[id]` - Get division by ID
- `PUT /api/v1/divisions/[id]` - Update division
- `POST /api/v1/divisions/[id]/lock` - Lock division
- `POST /api/v1/divisions/[id]/unlock` - Unlock division
- `GET /api/v1/divisions/[id]/format` - Get division format
- `POST /api/v1/divisions/[id]/matches/generate` - Generate division matches

### Tournament Groups
- `GET /api/v1/tournaments/[id]/groups` - List tournament groups
- `POST /api/v1/tournaments/[id]/groups` - Create group
- `GET /api/v1/groups/[id]` - Get group by ID
- `PUT /api/v1/groups/[id]` - Update group
- `GET /api/v1/groups/[id]/teams` - Get teams in group

### Tournament Matches
- `GET /api/v1/tournaments/[id]/matches` - List tournament matches
- `POST /api/v1/tournaments/[id]/matches` - Create match
- `POST /api/v1/tournaments/[id]/matches/bulk` - Bulk match operations
- `POST /api/v1/tournaments/[id]/matches/schedule` - Schedule matches

### Tournament Teams
- `GET /api/v1/tournaments/[id]/teams` - List tournament teams
- `POST /api/v1/tournaments/[id]/teams` - Add team to tournament

### Tournament Venues
- `GET /api/v1/tournaments/[id]/venues` - List tournament venues
- `POST /api/v1/tournaments/[id]/venues` - Add venue to tournament

### Tournament Registrations
- `GET /api/v1/tournaments/[id]/registrations` - List tournament registrations
- `GET /api/v1/tournaments/[id]/registration-info` - Get registration info

### Tournament Placement Config
- `GET /api/v1/tournaments/[id]/placement-config` - Get placement configuration
- `POST /api/v1/tournaments/[id]/placement-config` - Update placement configuration

## Matches
- `GET /api/v1/matches` - List matches (with query params: tournamentId, status, venueId, limit, offset)
- `GET /api/v1/matches/[id]` - Get match by ID
- `PUT /api/v1/matches/[id]` - Update match
- `DELETE /api/v1/matches/[id]` - Delete match

## Teams
- `GET /api/v1/teams` - List teams (with query params: tournamentId)
- `POST /api/v1/teams` - Create team
- `GET /api/v1/teams/[id]` - Get team by ID
- `PUT /api/v1/teams/[id]` - Update team

## Registrations
- `GET /api/v1/registrations` - List registrations
- `POST /api/v1/registrations` - Create registration
- `GET /api/v1/registrations/[id]` - Get registration by ID
- `GET /api/v1/registrations/[id]/status` - Get registration status
- `PUT /api/v1/registrations/[id]/status` - Update registration status

## Venues
- `GET /api/v1/venues` - List venues
- `POST /api/v1/venues` - Create venue
- `GET /api/v1/venues/[id]` - Get venue by ID
- `PUT /api/v1/venues/[id]` - Update venue
- `GET /api/v1/venues/[id]/pitches` - Get venue pitches
- `POST /api/v1/venues/[id]/pitches` - Create pitch in venue

## Pitches
- `GET /api/v1/pitches/[id]` - Get pitch by ID
- `PUT /api/v1/pitches/[id]` - Update pitch
- `DELETE /api/v1/pitches/[id]` - Delete pitch

## Clubs
- `GET /api/v1/clubs` - List clubs
- `POST /api/v1/clubs` - Create club
- `GET /api/v1/clubs/[id]` - Get club by ID
- `PATCH /api/v1/clubs/[id]` - Update club

## Reference Data
- `GET /api/v1/countries` - List countries
- `GET /api/countries` - List countries (legacy)
- `GET /api/v1/age-groups` - List age groups
- `GET /api/v1/tournament-formats` - List tournament formats

## Upload
- `POST /api/upload` - Upload file

## Legacy Endpoints
- `GET /api/tournaments` - List tournaments (legacy)
- `POST /api/tournaments` - Create tournament (legacy)
- `GET /api/tournaments/simple` - Get simple tournament list

## Notes
- Most endpoints require authentication (session cookie)
- Public endpoints (under `/public`) do not require authentication
- Query parameters are used for filtering and pagination
- Dynamic routes use `[id]` notation (e.g., `/api/v1/tournaments/[id]` becomes `/api/v1/tournaments/abc123`)










