// API Types based on matchnord-extranet Prisma schema

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  description?: string;
  season: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  publishedAt?: string;
  contactEmail?: string;
  contactPhone?: string;
  logo?: string;
  heroImage?: string;
  country: Country;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  registrationDeadline?: string;
  autoAcceptTeams: boolean;
  allowWaitlist: boolean;
  maxTeams?: number;
  isLocked: boolean;
  teamsPublished: boolean;
  schedulePublished: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  divisions?: Division[];
  teams?: Team[];
  matches?: Match[];
  venues?: Venue[];
}

export interface Division {
  id: string;
  tournamentId: string;
  name: string;
  description?: string;
  birthYear?: number;
  format?: string;
  level: DivisionLevel;
  minTeams: number;
  maxTeams: number;
  currentTeams: number;
  matchDuration: number;
  breakDuration: number;
  assignmentType: AssignmentType;
  metadata?: any;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  tournament?: Tournament;
  groups?: Group[];
}

export interface Group {
  id: string;
  divisionId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  division?: Division;
  teams?: Team[];
  matches?: Match[];
  standings?: Standing[];
}

export interface Team {
  id: string;
  tournamentId: string;
  managerId?: string;
  name: string;
  shortName?: string;
  club?: string | { id: string; name: string; logo?: string; city?: string };
  clubId?: string;
  city?: string;
  country: Country;
  level?: string;
  status?: string;
  division?: { id: string; name: string; description?: string };
  playerCount?: number;
  isPlaceholder?: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  tournament?: Tournament;
  manager?: User;
  players?: Player[];
  groups?: Group[];
  homeMatches?: Match[];
  awayMatches?: Match[];
  standings?: Standing[];
}

export interface Player {
  id: string;
  teamId?: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  jerseyNumber?: number;
  position?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  team?: Team;
}

export interface Match {
  id: string;
  tournamentId: string;
  groupId?: string;
  homeTeamId: string;
  awayTeamId: string;
  venueId?: string;
  pitchId?: string;
  startTime: string;
  endTime?: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  referee?: string;
  notes?: string;
  assignmentType: AssignmentType;
  scheduledAt?: string;
  scheduledBy?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  tournament?: Tournament;
  group?: Group;
  homeTeam?: Team;
  awayTeam?: Team;
  venue?: Venue;
  pitch?: Pitch;
  events?: MatchEvent[];
}

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: EventType;
  teamId?: string;
  playerId?: string;
  createdAt: string;
  // Relations
  match?: Match;
  team?: Team;
  player?: Player;
}

export interface Venue {
  id: string;
  tournamentId: string;
  name: string;
  streetName?: string;
  postalCode?: string;
  city?: string;
  country: Country;
  capacity?: number;
  description?: string;
  facilities?: string;
  parking?: string;
  accessibility?: string;
  xCoordinate?: number;
  yCoordinate?: number;
  createdAt: string;
  updatedAt: string;
  // Relations
  tournament?: Tournament;
  pitches?: Pitch[];
  matches?: Match[];
}

export interface Pitch {
  id: string;
  venueId: string;
  name: string;
  number?: string;
  surface?: string;
  size?: string;
  description?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  venue?: Venue;
  matches?: Match[];
}

export interface Standing {
  id: string;
  teamId: string;
  groupId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  createdAt: string;
  updatedAt: string;
  // Relations
  team?: Team;
  group?: Group;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flag?: string;
  phoneCode?: string;
  currency?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// Enums
export enum TournamentStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
}

export enum DivisionLevel {
  ELITE = "ELITE",
  COMPETITIVE = "COMPETITIVE",
  CHALLENGE = "CHALLENGE",
  RECREATIONAL = "RECREATIONAL",
}

export enum AssignmentType {
  AUTO = "AUTO",
  MANUAL = "MANUAL",
}

export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  LIVE = "LIVE",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
  POSTPONED = "POSTPONED",
}

export enum EventType {
  GOAL = "GOAL",
  PENALTY_GOAL = "PENALTY_GOAL",
  OWN_GOAL = "OWN_GOAL",
  CARD_YELLOW = "CARD_YELLOW",
  CARD_RED = "CARD_RED",
  SUBSTITUTION = "SUBSTITUTION",
}

export enum UserRole {
  ADMIN = "ADMIN",
  TEAM_MANAGER = "TEAM_MANAGER",
  TOURNAMENT_ADMIN = "TOURNAMENT_ADMIN",
  REFEREE = "REFEREE",
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter and search types
export interface TournamentFilters {
  status?: TournamentStatus;
  search?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface MatchFilters {
  status?: MatchStatus;
  divisionId?: string;
  groupId?: string;
  teamId?: string;
  venueId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
