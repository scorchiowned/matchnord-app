import { z } from 'zod';

// Base schemas
export const MatchId = z.string().min(1);
export const TeamId = z.string().min(1);
export const PlayerId = z.string().min(1);

// Match status and event types
export const MatchStatus = z.enum([
  'SCHEDULED',
  'LIVE',
  'FINISHED',
  'CANCELLED',
  'POSTPONED',
]);
export const EventType = z.enum([
  'GOAL',
  'PENALTY_GOAL',
  'OWN_GOAL',
  'CARD_YELLOW',
  'CARD_RED',
  'SUBSTITUTION',
]);

// Match schemas
export const CreateMatchInput = z.object({
  divisionId: z.string().min(1),
  groupId: z.string().min(1),
  homeTeamId: z.string().optional(),
  awayTeamId: z.string().optional(),
  venueId: z.string().optional(),
  startTime: z.string().datetime().optional(),
});

export const UpdateMatchInput = z.object({
  divisionId: z.string().optional(),
  groupId: z.string().optional(),
  homeTeamId: z.string().optional(),
  awayTeamId: z.string().optional(),
  venueId: z.string().optional(),
  startTime: z.string().datetime().optional(),
  status: MatchStatus.optional(),
});

export const UpdateScoreInput = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export const MatchResponse = z.object({
  id: z.string(),
  divisionId: z.string(),
  groupId: z.string(),
  homeTeamId: z.string().nullable(),
  awayTeamId: z.string().nullable(),
  venueId: z.string().nullable(),
  startTime: z.string().nullable(),
  status: MatchStatus,
  homeScore: z.number(),
  awayScore: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Match event schemas
export const CreateMatchEventInput = z.object({
  matchId: z.string().min(1),
  minute: z.number().int().min(0).max(120),
  type: EventType,
  teamId: z.string().optional(),
  playerId: z.string().optional(),
});

export const MatchEventResponse = z.object({
  id: z.string(),
  matchId: z.string(),
  minute: z.number(),
  type: EventType,
  teamId: z.string().nullable(),
  playerId: z.string().nullable(),
  createdAt: z.string(),
});

// Player schemas
export const CreatePlayerInput = z.object({
  teamId: z.string().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  birthDate: z.string().datetime().optional(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
});

export const UpdatePlayerInput = z.object({
  teamId: z.string().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  birthDate: z.string().datetime().optional(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
});

export const PlayerResponse = z.object({
  id: z.string(),
  teamId: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  birthDate: z.string().nullable(),
  jerseyNumber: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Standing schemas
export const StandingResponse = z.object({
  id: z.string(),
  teamId: z.string(),
  groupId: z.string(),
  played: z.number(),
  won: z.number(),
  drawn: z.number(),
  lost: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  goalDifference: z.number(),
  points: z.number(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    shortName: z.string().nullable(),
  }),
});

// Bulk operations
export const BulkCreateMatchesInput = z.object({
  matches: z.array(CreateMatchInput),
});

export const BulkUpdateScoresInput = z.object({
  scores: z.array(
    z.object({
      matchId: z.string().min(1),
      homeScore: z.number().int().min(0),
      awayScore: z.number().int().min(0),
    })
  ),
});

// Live match data
export const LiveMatchUpdate = z.object({
  matchId: z.string(),
  status: MatchStatus,
  homeScore: z.number(),
  awayScore: z.number(),
  currentMinute: z.number().optional(),
  events: z.array(MatchEventResponse).optional(),
});

// Inferred types
export type CreateMatchInput = z.infer<typeof CreateMatchInput>;
export type UpdateMatchInput = z.infer<typeof UpdateMatchInput>;
export type UpdateScoreInput = z.infer<typeof UpdateScoreInput>;
export type MatchResponse = z.infer<typeof MatchResponse>;

export type CreateMatchEventInput = z.infer<typeof CreateMatchEventInput>;
export type MatchEventResponse = z.infer<typeof MatchEventResponse>;

export type CreatePlayerInput = z.infer<typeof CreatePlayerInput>;
export type UpdatePlayerInput = z.infer<typeof UpdatePlayerInput>;
export type PlayerResponse = z.infer<typeof PlayerResponse>;

export type StandingResponse = z.infer<typeof StandingResponse>;

export type BulkCreateMatchesInput = z.infer<typeof BulkCreateMatchesInput>;
export type BulkUpdateScoresInput = z.infer<typeof BulkUpdateScoresInput>;

export type LiveMatchUpdate = z.infer<typeof LiveMatchUpdate>;
