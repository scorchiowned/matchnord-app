# Tournament Pages Implementation

This document describes the new tournament pages implementation based on the MVP specification.

## Overview

The tournament system now includes two main views:

1. **Team Manager View** - For tournament configuration and management
2. **Public View** - For viewing tournament information, standings, matches, and brackets

## Pages Structure

### Team Manager Pages

**Location**: `/admin/tournaments/[id]/manage`

**Features**:

- Teams list with contact information and status
- Tournament format selection (Groups → Knockout or Round-robin only)
- Group assignment with drag/drop functionality
- Auto-generation of group fixtures
- Manual match editing (time/field)
- Fields & times configuration
- Publish toggle (Draft ↔ Live)

**Key Components**:

- Team management with status tracking
- Group assignment interface
- Fixture generation
- Match scheduling
- Tournament settings

### Public Pages

**Location**: `/tournaments/[id]/public`

**Features**:

- **Groups Tab**: Standings tables with P, W, D, L, GF, GA, GD, Pts
- **Matches Tab**: Match list with time, field, teams, scores, and status
- **Bracket Tab**: Knockout tournament bracket with scores
- **Info Tab**: Tournament details, rules, and contact information

**Key Components**:

- Responsive standings tables
- Match results with live status
- Tournament bracket visualization
- Tournament information display

## Reusable Components

### StandingsTable

- Displays team standings with all required statistics
- Supports form indicators (W/D/L)
- Responsive design with mobile support
- Position icons for top 3 teams

### MatchList

- Shows matches with scores and status
- Supports grouping by round
- Configurable display options (field, round, view button)
- Status indicators with animations for live matches

### TournamentBracket

- Displays knockout tournament progression
- Shows match results and upcoming fixtures
- Supports different round types (Semi-Final, Final, etc.)
- Responsive grid layout

## API Routes

### Management API

**Location**: `/api/v1/tournaments/[id]/manage`

**Endpoints**:

- `GET` - Fetch tournament management data
- `PUT` - Update tournament settings
- `POST` - Perform actions (generate fixtures, update matches, etc.)

### Public API

**Location**: `/api/v1/tournaments/[id]/public`

**Endpoints**:

- `GET` - Fetch public tournament data (standings, matches, bracket)

## Data Model

The implementation uses the existing Prisma schema with the following key models:

- `Tournament` - Main tournament information
- `Team` - Team details and contact information
- `Group` - Tournament groups
- `Match` - Match fixtures and results
- `Standing` - Calculated standings
- `Venue`/`Pitch` - Field information

## Features Implemented

### Team Manager Features

✅ Teams list with contact information  
✅ Format selection (Groups → Knockout / Round-robin)  
✅ Group assignment interface  
✅ Auto-generate group fixtures  
✅ Manual match editing  
✅ Fields & times configuration  
✅ Publish toggle

### Public Features

✅ Groups standings tables  
✅ Match results with scores  
✅ Tournament bracket  
✅ Tournament information  
✅ Responsive design  
✅ Mobile-friendly interface

## Usage

### For Tournament Managers

1. Navigate to `/admin/tournaments/[id]/manage`
2. Configure tournament settings
3. Add teams and assign to groups
4. Generate fixtures
5. Publish tournament when ready

### For Public Users

1. Navigate to `/tournaments/[id]/public`
2. View standings, matches, and bracket
3. Access tournament information and rules

## Future Enhancements

- Real-time match updates
- Advanced bracket generation
- Tournament statistics
- Export functionality
- Mobile app integration
- Live streaming integration

## Technical Notes

- Uses Next.js 14 with App Router
- Implements internationalization with next-intl
- Responsive design with Tailwind CSS
- Type-safe with TypeScript
- Reusable component architecture
- Mock data for development (replace with real API calls)
