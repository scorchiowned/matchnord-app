# Tournament Management Platform

A comprehensive web platform for organizing, managing, and following tournaments, built with Next.js 14, TypeScript, and Prisma. The platform supports everything from tournament creation to live match management and public viewing.

## Features

### Tournament Management

- **Complete Tournament Lifecycle**: Create, configure, and manage tournaments from draft to completion
- **Multi-Format Support**: Round-robin, knockout, and hybrid tournament formats
- **Division Management**: Organize tournaments by age groups, skill levels, and formats (5v5, 7v7, 8v8, 11v11)
- **Team Registration**: Comprehensive team registration with player management
- **Venue & Pitch Management**: Full venue and pitch scheduling system
- **Tournament Wizard**: 10-step guided tournament creation process

### Live Tournament Features

- **Real-time Updates**: Live match scores and status updates via Server-Sent Events
- **Live Scoring**: Real-time match event tracking (goals, cards, substitutions)
- **Standings Calculation**: Automated league table calculations with tie-break rules
- **Bracket Generation**: Dynamic tournament bracket creation and management
- **Match Scheduling**: Intelligent fixture generation and scheduling

### User Management & Permissions

- **Role-Based Access Control**: ADMIN, TEAM_MANAGER, TOURNAMENT_ADMIN, REFEREE roles
- **Organization Management**: Multi-organization support with user assignments
- **Tournament-Specific Roles**: Granular permissions per tournament
- **Team Manager Portal**: Dedicated interface for team managers

### Public Features

- **Public Tournament Pages**: Live standings, match results, and bracket views
- **Multi-language Support**: Finnish, English, Swedish, Norwegian, Danish localization
- **Mobile-First Design**: Fully responsive interface optimized for all devices
- **Real-time Notifications**: Live updates for match events and tournament changes

### Advanced Features

- **Email Integration**: Automated notifications and tournament communications
- **Payment Processing**: Tournament fees and payment management
- **Document Management**: Rules, regulations, and tournament documents
- **Analytics Dashboard**: Tournament statistics and performance metrics
- **File Upload**: Logo and image management for tournaments and teams

## Tech Stack

### Core Framework

- **Next.js 14**: App Router with TypeScript
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety throughout the application

### UI & Styling

- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality, accessible component library
- **Radix UI**: Headless UI primitives for complex components
- **Lucide React**: Beautiful, customizable icons
- **Class Variance Authority**: Component variant management

### Database & ORM

- **PostgreSQL**: Robust relational database
- **Prisma**: Type-safe database ORM with migrations
- **Prisma Client**: Auto-generated database client

### Authentication & Authorization

- **NextAuth.js**: Authentication framework
- **@auth/prisma-adapter**: Prisma integration for NextAuth
- **Role-based Access Control**: Custom permission system
- **Session Management**: Secure session handling

### Forms & Validation

- **react-hook-form**: Performant forms with easy validation
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Integration between react-hook-form and Zod

### Internationalization

- **next-intl**: Internationalization for Next.js
- **Multi-language Support**: Finnish, English, Swedish, Norwegian, Danish

### Real-time Features

- **Server-Sent Events (SSE)**: Live updates for matches and tournaments
- **Real-time Notifications**: Instant updates for users

### Email & Communications

- **Resend**: Email delivery service
- **Automated Notifications**: Tournament and match notifications

### State Management

- **TanStack Query**: Server state management and caching
- **React Context**: Client-side state management

### Testing

- **Vitest**: Fast unit testing framework
- **Playwright**: End-to-end testing
- **Testing Library**: React component testing utilities

### Development Tools

- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Git hooks for code quality
- **Commitlint**: Conventional commit messages
- **TypeScript**: Static type checking

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for local PostgreSQL)
- pnpm/npm/yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd tournament_software
```

2. Install dependencies:

```bash
npm install
```

3. **Quick Setup** (recommended):

```bash
npm run setup
```

This automated script will:

- Create `.env.local` from template
- Start PostgreSQL container
- Run database migrations
- Seed with sample data

4. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Manual Setup (alternative)

If you prefer manual setup:

3. Set up environment variables:

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration. For local development with Docker, the database URL is already set correctly:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/tournament_app"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Start the PostgreSQL database:

```bash
npm run db:up
```

5. Set up the database:

```bash
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
```

5. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run unit tests with Vitest
- `npm run e2e` - Run end-to-end tests with Playwright
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed the database with sample data
- `npm run format` - Format code with Prettier

### Database Management

- `npm run db:up` - Start PostgreSQL container
- `npm run db:down` - Stop PostgreSQL container
- `npm run db:reset` - Reset database (removes all data and restarts)
- `npm run db:logs` - View PostgreSQL container logs
- `npm run test:db:up` - Start test database container
- `npm run test:db:down` - Stop test database container

## Project Structure

The project follows Next.js 14 App Router conventions with a well-organized, scalable architecture.

```
matchnord/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── [locale]/                 # Internationalized routes
│   │   │   ├── admin/                # Admin dashboard and management
│   │   │   │   ├── tournaments/      # Tournament management
│   │   │   │   ├── teams/           # Team management
│   │   │   │   └── venues/          # Venue management
│   │   │   ├── tournaments/          # Public tournament pages
│   │   │   │   └── [id]/            # Individual tournament pages
│   │   │   │       ├── manage/       # Tournament management interface
│   │   │   │       ├── public/       # Public tournament view
│   │   │   │       ├── register/     # Team registration
│   │   │   │       ├── results/      # Tournament results
│   │   │   │       └── standings/    # Tournament standings
│   │   │   ├── teams/                # Team pages
│   │   │   ├── venues/               # Venue pages
│   │   │   ├── matches/              # Match pages
│   │   │   ├── auth/                 # Authentication pages
│   │   │   └── profile/              # User profile
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── v1/                   # Version 1 API
│   │   │   │   ├── tournaments/      # Tournament API
│   │   │   │   ├── teams/           # Team API
│   │   │   │   ├── matches/         # Match API
│   │   │   │   ├── venues/          # Venue API
│   │   │   │   └── registrations/   # Registration API
│   │   │   ├── countries/            # Country data API
│   │   │   ├── upload/               # File upload API
│   │   │   └── test-email/           # Email testing API
│   │   └── globals.css               # Global styles
│   ├── components/                   # React components
│   │   ├── ui/                      # Base UI components (shadcn/ui)
│   │   ├── tournament/              # Tournament-specific components
│   │   │   ├── divisions-management.tsx
│   │   │   ├── groups-management.tsx
│   │   │   ├── matches-management.tsx
│   │   │   ├── standings-table.tsx
│   │   │   ├── tournament-bracket.tsx
│   │   │   └── teams-management.tsx
│   │   ├── navigation/              # Navigation components
│   │   ├── landing/                 # Landing page components
│   │   ├── auth/                    # Authentication components
│   │   └── dashboard/               # Dashboard components
│   ├── lib/                         # Utilities and configuration
│   │   ├── auth.ts                  # Authentication configuration
│   │   ├── db.ts                    # Database connection
│   │   ├── email.ts                 # Email service
│   │   ├── permissions.ts           # Permission system
│   │   ├── sse.ts                   # Server-Sent Events
│   │   └── tournament/              # Tournament-specific utilities
│   │       ├── match-generation/    # Match generation algorithms
│   │       ├── stage-creation.ts    # Tournament stage creation
│   │       └── tournament-lock/     # Tournament locking system
│   ├── i18n/                        # Internationalization
│   │   ├── config.ts                # i18n configuration
│   │   ├── routing.ts               # Localized routing
│   │   ├── request.ts               # Request handling
│   │   └── *.json                   # Translation files
│   ├── server/                      # Server-side logic
│   │   └── contracts/               # Zod validation schemas
│   ├── styles/                      # Global styles
│   ├── types/                       # TypeScript type definitions
│   └── __tests__/                   # Test files
├── prisma/                          # Database schema and migrations
│   ├── schema.prisma               # Prisma schema
│   ├── migrations/                 # Database migrations
│   └── seed.ts                     # Database seeding
├── e2e/                            # End-to-end tests
│   ├── tournaments/                # Tournament E2E tests
│   ├── auth/                       # Authentication E2E tests
│   └── fixtures/                   # Test data
├── public/                         # Static assets
├── scripts/                        # Development and deployment scripts
├── migrations/                     # Database migrations
└── docs/                          # Documentation files
```

### Key Directories

#### `/src/app/`

- **App Router**: Next.js 14 App Router with file-based routing
- **Internationalization**: All routes are localized with `[locale]` parameter
- **API Routes**: RESTful API endpoints with proper HTTP methods
- **Nested Layouts**: Shared layouts for different sections

#### `/src/components/`

- **UI Components**: Reusable shadcn/ui components
- **Feature Components**: Tournament-specific business logic components
- **Layout Components**: Navigation, headers, and layout components

#### `/src/lib/`

- **Utilities**: Shared utility functions and configurations
- **Business Logic**: Tournament-specific algorithms and logic
- **External Services**: Email, database, and third-party integrations

#### `/prisma/`

- **Schema**: Complete database schema definition
- **Migrations**: Version-controlled database changes
- **Seeding**: Development and test data

#### `/e2e/`

- **Playwright Tests**: End-to-end test suites
- **Test Data**: Fixtures and test data management
- **Screenshots**: Test execution screenshots and videos

## Application Pages & Features

### Public Pages

#### Landing Page (`/`)

- **Hero Section**: Compelling tournament management introduction
- **Features Overview**: Key platform capabilities
- **Call-to-Action**: User registration and sign-in
- **Multi-language Support**: Available in 5 languages

#### Tournament Pages (`/tournaments/[id]`)

- **Public View** (`/public`): Live standings, matches, and bracket
- **Registration** (`/register`): Team registration with comprehensive forms
- **Results** (`/results`): Match results and tournament outcomes
- **Standings** (`/standings`): League tables with detailed statistics

#### Team Pages (`/teams`)

- **Team Listings**: Browse all teams
- **Team Details** (`/teams/[id]`): Individual team information
- **Team Creation** (`/teams/new`): New team registration

#### Venue Pages (`/venues`)

- **Venue Listings**: Browse all venues
- **Venue Details** (`/venues/[id]`): Individual venue information

### Admin Pages

#### Admin Dashboard (`/admin`)

- **System Overview**: Key metrics and recent activities
- **Quick Actions**: Create tournaments, manage teams, configure venues
- **User Management**: System user administration
- **Organization Management**: Multi-organization support

#### Tournament Management (`/admin/tournaments`)

- **Tournament List**: All tournaments with status indicators
- **Tournament Creation**: 10-step guided wizard
- **Tournament Management** (`/admin/tournaments/[id]/manage`):
  - Team management and assignment
  - Division and group configuration
  - Match scheduling and generation
  - Venue and pitch management
  - Tournament settings and rules

#### Team Management (`/admin/teams`)

- **Team Administration**: Manage all teams
- **Team Details** (`/admin/teams/[id]/edit`): Edit team information
- **Player Management**: Team roster management

#### Venue Management (`/admin/venues`)

- **Venue Administration**: Manage all venues
- **Pitch Management**: Individual pitch configuration
- **Scheduling**: Venue availability and booking

### Authentication Pages

#### Sign In (`/auth/signin`)

- **Email/Password**: Traditional authentication
- **OAuth Integration**: Google and other providers
- **Magic Links**: Passwordless authentication
- **Role Selection**: User role assignment

#### Sign Up (`/auth/signup`)

- **User Registration**: New user account creation
- **Organization Assignment**: Join existing organizations
- **Role Assignment**: Appropriate role selection

### Key Features

#### Tournament Creation Wizard

1. **Basic Information**: Name, description, dates, location
2. **Organization Details**: Organizing entity information
3. **Divisions & Age Groups**: Tournament categories and formats
4. **Tournament Schedule**: Dates, times, and duration
5. **Venues & Pitches**: Location and field configuration
6. **Rules & Regulations**: Tournament-specific rules
7. **Fees & Payments**: Registration fees and payment methods
8. **Registration Settings**: Team limits and requirements
9. **Email Notifications**: Communication preferences
10. **Preview & Publish**: Final review and publication

#### Live Tournament Management

- **Real-time Scoring**: Live match updates
- **Standings Calculation**: Automatic league table updates
- **Bracket Generation**: Dynamic tournament progression
- **Match Scheduling**: Intelligent fixture generation
- **Team Assignment**: Group and division management

#### Public Tournament View

- **Live Standings**: Real-time league tables
- **Match Results**: Current and historical results
- **Tournament Bracket**: Knockout tournament progression
- **Tournament Info**: Rules, contact, and general information

## Database Schema

The platform uses a comprehensive PostgreSQL database schema designed for complex tournament management scenarios.

### Core Models

#### User Management

- **User** - System users with role-based access
- **Account** - OAuth/authentication accounts
- **Session** - User sessions
- **VerificationToken** - Email verification tokens

#### Organizations

- **Organization** - Tournament organizing entities
- **UserOrganization** - User-organization relationships with roles
- **Country** - Country data with timezone and currency info

#### Tournament Structure

- **Tournament** - Main tournament entities with full configuration
- **Division** - Tournament divisions by age group, format, and skill level
- **Group** - Tournament groups/pools within divisions
- **Team** - Participating teams with manager assignments
- **Player** - Team players with jersey numbers and positions

#### Match Management

- **Match** - Individual matches with scheduling and results
- **MatchEvent** - Match events (goals, cards, substitutions)
- **Standing** - Calculated league table standings
- **Official** - Match officials and referees

#### Venue & Scheduling

- **Venue** - Tournament venues with location data
- **Pitch** - Individual playing fields within venues
- **ScheduleSlot** - Available time slots for matches

#### Registration & Payments

- **Registration** - Team registrations for tournaments
- **Fee** - Tournament fees and pricing
- **Payment** - Payment processing and tracking

#### Content Management

- **Rule** - Tournament rules and regulations
- **Document** - Tournament documents and files
- **Announcement** - Tournament announcements
- **ScheduleSlot** - Time slot management

#### Role-Based Access Control

- **TournamentAssignment** - User roles within specific tournaments
- **MatchAssignment** - User roles for specific matches

### Key Relationships

- **Tournament → Organization**: Each tournament belongs to an organization
- **Tournament → Divisions → Groups → Teams**: Hierarchical tournament structure
- **Team → Players**: Teams have multiple players
- **Match → HomeTeam/AwayTeam**: Matches between teams
- **Match → Venue/Pitch**: Match location assignment
- **Standing → Team/Group**: Calculated standings per group
- **User → Organizations**: Users can belong to multiple organizations
- **User → TournamentAssignments**: Granular tournament permissions

### Enums

- **UserRole**: ADMIN, TEAM_MANAGER, TOURNAMENT_ADMIN, REFEREE
- **OrganizationRole**: OWNER, ADMIN, MANAGER, MEMBER
- **TournamentStatus**: DRAFT, PUBLISHED, REGISTRATION_OPEN, etc.
- **DivisionLevel**: ELITE, COMPETITIVE, CHALLENGE, RECREATIONAL
- **MatchStatus**: SCHEDULED, LIVE, FINISHED, CANCELLED, POSTPONED
- **EventType**: GOAL, PENALTY_GOAL, CARD_YELLOW, CARD_RED, etc.
- **RegistrationStatus**: PENDING, APPROVED, REJECTED, CANCELLED, WAITLISTED
- **PaymentStatus**: PENDING, PAID, FAILED, REFUNDED, CANCELLED
- **TournamentRole**: MANAGER, ADMIN, REFEREE, VIEWER
- **MatchRole**: MAIN_REFEREE, ASSISTANT_REFEREE, FOURTH_OFFICIAL, MATCH_COMMISSIONER

### Database Features

- **Full Referential Integrity**: All foreign key relationships properly defined
- **Cascade Deletes**: Proper cleanup when parent records are deleted
- **Unique Constraints**: Prevents duplicate data where appropriate
- **Indexes**: Optimized for common query patterns
- **Audit Fields**: Created/updated timestamps on all models
- **Soft Deletes**: Logical deletion for critical data
- **JSON Fields**: Flexible data storage for complex configurations

## User Roles & Permissions

The platform implements a sophisticated role-based access control system with multiple levels of permissions.

### System-Level Roles

#### ADMIN

- **Full System Access**: Complete administrative control
- **User Management**: Create, edit, and delete users
- **Organization Management**: Manage all organizations
- **System Settings**: Configure global system settings
- **Tournament Management**: Full access to all tournaments
- **Database Access**: Direct database management capabilities

#### TEAM_MANAGER

- **Tournament Creation**: Create and manage their own tournaments
- **Team Management**: Manage teams they're assigned to
- **Tournament Configuration**: Set up divisions, venues, and rules
- **Registration Management**: Handle team registrations
- **Limited Scope**: Cannot access system administration or other users' tournaments

#### TOURNAMENT_ADMIN

- **Tournament Operations**: Manage specific tournaments they're assigned to
- **Match Management**: Update match results and events
- **Team Management**: Manage teams within their tournaments
- **Real-time Updates**: Live scoring and match management
- **Tournament Settings**: Configure tournament-specific settings

#### REFEREE

- **Match Officiating**: Manage matches they're assigned to
- **Live Scoring**: Update match events and scores
- **Match Reports**: Submit match reports and notes
- **Limited Access**: Only access to assigned matches

### Organization-Level Roles

#### OWNER

- **Full Organization Control**: Complete control over organization
- **User Management**: Add/remove users from organization
- **Tournament Management**: Create and manage organization tournaments
- **Financial Access**: Manage payments and fees

#### ADMIN

- **Organization Management**: Manage organization settings
- **Tournament Management**: Create and manage tournaments
- **User Management**: Add users to organization
- **Limited Financial Access**: View but not modify financial data

#### MANAGER

- **Tournament Management**: Create and manage tournaments
- **Team Management**: Manage teams within organization
- **Limited Settings**: Cannot modify organization settings

#### MEMBER

- **Basic Access**: View organization tournaments
- **Team Participation**: Join teams and participate in tournaments
- **Limited Management**: Cannot create tournaments or manage settings

### Tournament-Specific Roles

#### MANAGER

- **Tournament Setup**: Configure tournament settings and rules
- **Division Management**: Create and manage divisions
- **Team Assignment**: Assign teams to groups
- **Fixture Generation**: Generate match schedules
- **Tournament Publishing**: Publish tournament for public viewing

#### ADMIN

- **Tournament Operations**: Manage ongoing tournament operations
- **Match Management**: Update match results and events
- **Team Management**: Manage participating teams
- **Real-time Updates**: Live scoring and status updates

#### REFEREE

- **Match Officiating**: Officiate assigned matches
- **Live Scoring**: Update match events and scores
- **Match Reports**: Submit match reports

#### VIEWER

- **Read-Only Access**: View tournament data
- **Public Information**: Access to public tournament information
- **No Modifications**: Cannot modify any tournament data

### Permission System Features

- **Granular Permissions**: Fine-grained control over specific actions
- **Context-Aware**: Permissions vary based on user context and relationships
- **Inheritance**: Higher-level roles inherit lower-level permissions
- **Time-Based**: Permissions can have expiration dates
- **Conditional Access**: Permissions based on specific conditions
- **Audit Trail**: Complete logging of permission changes and access

### Security Features

- **Session Management**: Secure session handling with expiration
- **JWT Tokens**: Secure authentication tokens
- **CSRF Protection**: Cross-site request forgery protection
- **Rate Limiting**: API rate limiting based on user roles
- **Input Validation**: Comprehensive input validation and sanitization
- **SQL Injection Prevention**: Parameterized queries and ORM protection

## API Documentation

The platform provides a comprehensive RESTful API with full TypeScript support and Zod validation.

### Authentication Endpoints

- `POST /api/auth/signin` - User authentication
- `POST /api/auth/signup` - User registration
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - User sign out

### Tournament Management API

#### Tournaments

- `GET /api/v1/tournaments` - List all tournaments
- `POST /api/v1/tournaments` - Create new tournament
- `GET /api/v1/tournaments/[id]` - Get tournament details
- `PATCH /api/v1/tournaments/[id]` - Update tournament
- `DELETE /api/v1/tournaments/[id]` - Delete tournament
- `POST /api/v1/tournaments/[id]/lock` - Lock tournament
- `POST /api/v1/tournaments/[id]/unlock` - Unlock tournament

#### Tournament Management

- `GET /api/v1/tournaments/[id]/manage` - Get management data
- `PUT /api/v1/tournaments/[id]/manage` - Update tournament settings
- `POST /api/v1/tournaments/[id]/manage` - Perform management actions

#### Public Tournament Data

- `GET /api/v1/tournaments/[id]/public` - Get public tournament data
- `GET /api/v1/tournaments/[id]/standings` - Get tournament standings
- `GET /api/v1/tournaments/[id]/matches` - Get tournament matches
- `GET /api/v1/tournaments/[id]/bracket` - Get tournament bracket

### Division & Group Management

- `GET /api/v1/tournaments/[id]/divisions` - Get tournament divisions
- `POST /api/v1/tournaments/[id]/divisions` - Create division
- `GET /api/v1/divisions/[id]` - Get division details
- `PATCH /api/v1/divisions/[id]` - Update division
- `POST /api/v1/divisions/[id]/lock` - Lock division
- `POST /api/v1/divisions/[id]/unlock` - Unlock division

#### Groups

- `GET /api/v1/tournaments/[id]/groups` - Get tournament groups
- `POST /api/v1/tournaments/[id]/groups` - Create group
- `GET /api/v1/groups/[id]` - Get group details
- `PATCH /api/v1/groups/[id]` - Update group
- `GET /api/v1/groups/[id]/teams` - Get group teams
- `POST /api/v1/groups/[id]/teams` - Add teams to group

### Team Management

- `GET /api/v1/teams` - List all teams
- `POST /api/v1/teams` - Create team
- `GET /api/v1/teams/[id]` - Get team details
- `PATCH /api/v1/teams/[id]` - Update team
- `DELETE /api/v1/teams/[id]` - Delete team

### Match Management

- `GET /api/v1/matches` - List matches
- `POST /api/v1/matches` - Create match
- `GET /api/v1/matches/[id]` - Get match details
- `PATCH /api/v1/matches/[id]` - Update match
- `POST /api/v1/matches/[id]/events` - Add match event

### Venue & Pitch Management

- `GET /api/v1/venues` - List all venues
- `POST /api/v1/venues` - Create venue
- `GET /api/v1/venues/[id]` - Get venue details
- `PATCH /api/v1/venues/[id]` - Update venue
- `GET /api/v1/venues/[id]/pitches` - Get venue pitches
- `POST /api/v1/venues/[id]/pitches` - Create pitch

### Registration Management

- `GET /api/v1/registrations` - List registrations
- `POST /api/v1/registrations` - Create registration
- `GET /api/v1/registrations/[id]` - Get registration details
- `PATCH /api/v1/registrations/[id]` - Update registration status

### Utility Endpoints

- `GET /api/countries` - Get country list
- `GET /api/v1/age-groups` - Get age group options
- `POST /api/upload` - File upload
- `POST /api/test-email` - Test email functionality

### API Features

- **TypeScript Support**: Full type safety with generated types
- **Zod Validation**: Request/response validation
- **Error Handling**: Comprehensive error responses
- **Authentication**: Role-based access control
- **Rate Limiting**: Built-in rate limiting for public endpoints
- **CORS Support**: Cross-origin request handling

## Deployment

For detailed deployment instructions to Azure, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

### Quick Deploy

```bash
# Set your PostgreSQL password
export POSTGRES_PASSWORD="your-password"

# Deploy to Azure
npm run deploy:now
```

The application will be available at: **https://matchnord.azurewebsites.net**

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.
