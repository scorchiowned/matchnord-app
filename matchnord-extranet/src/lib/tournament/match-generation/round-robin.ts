export interface Team {
  id: string;
  name: string;
  shortName?: string;
  level?: string;
}

export interface RoundRobinMatch {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  round: number;
  matchNumber: number;
  groupId: string;
  groupId: string;
}

export interface RoundRobinResult {
  matches: RoundRobinMatch[];
  totalRounds: number;
  matchesPerRound: number;
  totalMatches: number;
}

/**
 * Generates round-robin matches for a group
 * Each team plays every other team exactly once
 */
export function generateRoundRobinMatches(
  teams: Team[],
  groupId: string
): RoundRobinResult {
  if (!teams || teams.length < 2) {
    return {
      matches: [],
      totalRounds: 0,
      matchesPerRound: 0,
      totalMatches: 0,
    };
  }

  // For odd number of teams, add a "bye" team
  const teamsWithBye =
    teams.length % 2 === 1 ? [...teams, { id: 'bye', name: 'Bye' }] : teams;
  const numTeams = teamsWithBye.length;
  const totalRounds = numTeams - 1;
  const matchesPerRound = Math.floor(numTeams / 2);
  const totalMatches = totalRounds * matchesPerRound;

  const matches: RoundRobinMatch[] = [];
  let matchCounter = 1;

  // Generate matches using round-robin algorithm
  for (let round = 1; round <= totalRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const homeIndex = match;
      const awayIndex = numTeams - 1 - match;

      // Skip matches involving bye team
      if (
        teamsWithBye[homeIndex].id !== 'bye' &&
        teamsWithBye[awayIndex].id !== 'bye'
      ) {
        matches.push({
          id: `match-${groupId}-${round}-${matchCounter}`,
          homeTeam: teamsWithBye[homeIndex],
          awayTeam: teamsWithBye[awayIndex],
          round,
          matchNumber: matchCounter++,
          groupId,
        });
      }
    }

    // Rotate teams (except the first one)
    const lastTeam = teamsWithBye.pop();
    if (lastTeam) {
      teamsWithBye.splice(1, 0, lastTeam);
    }
  }

  return {
    matches,
    totalRounds,
    matchesPerRound,
    totalMatches,
  };
}

/**
 * Generates round-robin matches for multiple groups
 */
export function generateMultipleGroupRoundRobin(
  groups: Array<{
    id: string;
    name: string;
    teams: Team[];
    groupId: string;
  }>
): RoundRobinResult[] {
  return groups.map((group) =>
    generateRoundRobinMatches(group.teams, group.id)
  );
}

/**
 * Calculates the number of matches needed for round-robin
 */
export function calculateRoundRobinMatches(numTeams: number): number {
  if (numTeams < 2) return 0;

  // For n teams, each team plays n-1 other teams
  // Total matches = n * (n-1) / 2
  return (numTeams * (numTeams - 1)) / 2;
}

/**
 * Calculates the number of rounds needed for round-robin
 */
export function calculateRoundRobinRounds(numTeams: number): number {
  if (numTeams < 2) return 0;

  // For n teams, need n-1 rounds (or n rounds if odd number of teams)
  return numTeams % 2 === 0 ? numTeams - 1 : numTeams;
}

/**
 * Validates if round-robin is possible for given teams
 */
export function validateRoundRobin(teams: Team[]): {
  isValid: boolean;
  reason?: string;
} {
  if (teams.length < 2) {
    return {
      isValid: false,
      reason: 'Need at least 2 teams for round-robin',
    };
  }

  if (teams.length > 16) {
    return {
      isValid: false,
      reason: 'Too many teams for round-robin (max 16 recommended)',
    };
  }

  return { isValid: true };
}
