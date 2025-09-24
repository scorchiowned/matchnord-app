import { z } from 'zod';

// Base schemas
export const TournamentId = z.string().min(1);
export const DivisionId = z.string().min(1);
export const GroupId = z.string().min(1);

// Tournament schemas
export const CreateTournamentInput = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1).max(255),
  season: z.string().min(1).max(50),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const UpdateTournamentInput = z.object({
  name: z.string().min(1).max(255).optional(),
  season: z.string().min(1).max(50).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const TournamentResponse = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  season: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Division schemas
export const CreateDivisionInput = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(1).max(255),
});

export const UpdateDivisionInput = z.object({
  name: z.string().min(1).max(255).optional(),
});

export const DivisionResponse = z.object({
  id: z.string(),
  tournamentId: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Stage schemas
export const StageType = z.enum(['GROUP', 'KNOCKOUT']);

export const CreateStageInput = z.object({
  divisionId: z.string().min(1),
  type: StageType,
  name: z.string().min(1).max(255),
});

export const StageResponse = z.object({
  id: z.string(),
  divisionId: z.string(),
  type: StageType,
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Group schemas
export const CreateGroupInput = z.object({
  stageId: z.string().min(1),
  name: z.string().min(1).max(255),
});

export const GroupResponse = z.object({
  id: z.string(),
  stageId: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Team schemas
export const CreateTeamInput = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(1).max(255),
  shortName: z.string().max(10).optional(),
});

export const UpdateTeamInput = z.object({
  name: z.string().min(1).max(255).optional(),
  shortName: z.string().max(10).optional(),
});

export const TeamResponse = z.object({
  id: z.string(),
  tournamentId: z.string(),
  name: z.string(),
  shortName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Venue schemas
export const CreateVenueInput = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(1).max(255),
  address: z.string().max(500).optional(),
  capacity: z.number().int().positive().optional(),
});

export const UpdateVenueInput = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().max(500).optional(),
  capacity: z.number().int().positive().optional(),
});

export const VenueResponse = z.object({
  id: z.string(),
  tournamentId: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  capacity: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Inferred types
export type CreateTournamentInput = z.infer<typeof CreateTournamentInput>;
export type UpdateTournamentInput = z.infer<typeof UpdateTournamentInput>;
export type TournamentResponse = z.infer<typeof TournamentResponse>;

export type CreateDivisionInput = z.infer<typeof CreateDivisionInput>;
export type UpdateDivisionInput = z.infer<typeof UpdateDivisionInput>;
export type DivisionResponse = z.infer<typeof DivisionResponse>;

export type CreateStageInput = z.infer<typeof CreateStageInput>;
export type StageResponse = z.infer<typeof StageResponse>;

export type CreateGroupInput = z.infer<typeof CreateGroupInput>;
export type GroupResponse = z.infer<typeof GroupResponse>;

export type CreateTeamInput = z.infer<typeof CreateTeamInput>;
export type UpdateTeamInput = z.infer<typeof UpdateTeamInput>;
export type TeamResponse = z.infer<typeof TeamResponse>;

export type CreateVenueInput = z.infer<typeof CreateVenueInput>;
export type UpdateVenueInput = z.infer<typeof UpdateVenueInput>;
export type VenueResponse = z.infer<typeof VenueResponse>;
