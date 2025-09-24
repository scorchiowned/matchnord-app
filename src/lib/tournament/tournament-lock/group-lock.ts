export interface GroupLockStatus {
  isLocked: boolean;
  lockedAt?: Date;
  lockedBy?: string;
  canUnlock: boolean;
  reason?: string;
}

export interface DivisionLockStatus {
  divisionId: string;
  divisionName: string;
  isLocked: boolean;
  lockedAt?: Date;
  lockedBy?: string;
  groupsCount: number;
  teamsCount: number;
  canUnlock: boolean;
  reason?: string;
}

export interface TournamentLockStatus {
  tournamentId: string;
  isFullyLocked: boolean;
  lockedAt?: Date;
  lockedBy?: string;
  divisions: DivisionLockStatus[];
  canUnlock: boolean;
  reason?: string;
}

/**
 * Validates if a division can be locked
 */
export function canLockDivision(division: {
  id: string;
  name: string;
  groups: Array<{
    id: string;
    name: string;
    teams: Array<{ id: string; name: string }>;
  }>;
}): { canLock: boolean; reason?: string } {
  // Check if division has groups
  if (division.groups.length === 0) {
    return {
      canLock: false,
      reason: 'Division must have at least one group before locking',
    };
  }

  // Check if all groups have teams
  const groupsWithoutTeams = division.groups.filter(
    (group) => group.teams.length === 0
  );
  if (groupsWithoutTeams.length > 0) {
    return {
      canLock: false,
      reason: `Groups without teams: ${groupsWithoutTeams.map((g) => g.name).join(', ')}`,
    };
  }

  // Check if groups have balanced team counts (optional validation)
  const teamCounts = division.groups.map((group) => group.teams.length);
  const minTeams = Math.min(...teamCounts);
  const maxTeams = Math.max(...teamCounts);

  if (maxTeams - minTeams > 1) {
    return {
      canLock: false,
      reason:
        'Groups should have balanced team counts (max difference of 1 team)',
    };
  }

  return { canLock: true };
}

/**
 * Validates if a tournament can be fully locked
 */
export function canLockTournament(divisions: DivisionLockStatus[]): {
  canLock: boolean;
  reason?: string;
} {
  // Check if all divisions are locked
  const unlockedDivisions = divisions.filter((div) => !div.isLocked);
  if (unlockedDivisions.length > 0) {
    return {
      canLock: false,
      reason: `Unlocked divisions: ${unlockedDivisions.map((d) => d.divisionName).join(', ')}`,
    };
  }

  // Check if tournament has at least one division
  if (divisions.length === 0) {
    return {
      canLock: false,
      reason: 'Tournament must have at least one division before locking',
    };
  }

  return { canLock: true };
}

/**
 * Generates lock status for a division
 */
export function generateDivisionLockStatus(division: {
  id: string;
  name: string;
  isLocked: boolean;
  lockedAt?: Date;
  lockedBy?: string;
  groups: Array<{
    id: string;
    name: string;
    teams: Array<{ id: string; name: string }>;
  }>;
}): DivisionLockStatus {
  const validation = canLockDivision(division);

  return {
    divisionId: division.id,
    divisionName: division.name,
    isLocked: division.isLocked,
    lockedAt: division.lockedAt,
    lockedBy: division.lockedBy,
    groupsCount: division.groups.length,
    teamsCount: division.groups.reduce(
      (total, group) => total + group.teams.length,
      0
    ),
    canUnlock: division.isLocked && validation.canLock,
    reason: validation.canLock ? undefined : validation.reason,
  };
}

/**
 * Generates lock status for entire tournament
 */
export function generateTournamentLockStatus(
  tournamentId: string,
  divisions: DivisionLockStatus[],
  isFullyLocked: boolean,
  lockedAt?: Date,
  lockedBy?: string
): TournamentLockStatus {
  const validation = canLockTournament(divisions);

  return {
    tournamentId,
    isFullyLocked,
    lockedAt,
    lockedBy,
    divisions,
    canUnlock: isFullyLocked && validation.canLock,
    reason: validation.canLock ? undefined : validation.reason,
  };
}
