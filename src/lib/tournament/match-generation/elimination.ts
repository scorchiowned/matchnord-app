export interface Team {
  id: string;
  name: string;
  shortName?: string;
  level?: string;
  position?: number; // Position from group stage
  points?: number;
  goalDifference?: number;
}

export interface EliminationMatch {
  id: string;
  homeTeam?: Team;
  awayTeam?: Team;
  round: number;
  matchNumber: number;
  groupId: string;
  isBye: boolean;
  winnerAdvancesTo?: string; // ID of next match
  loserEliminated?: boolean;
}

export interface EliminationBracket {
  matches: EliminationMatch[];
  totalRounds: number;
  totalMatches: number;
  format: 'single' | 'double' | 'playoff';
}

export interface SeedingRule {
  groupPosition: number;
  seed: number;
  description: string;
}

/**
 * Generates single elimination bracket
 */
export function generateSingleEliminationBracket(
  teams: Team[],
  groupId: string,
  seedingRules?: SeedingRule[]
): EliminationBracket {
  if (teams.length < 2) {
    return {
      matches: [],
      totalRounds: 0,
      totalMatches: 0,
      format: 'single',
    };
  }

  // Sort teams by seeding rules or by position
  const seededTeams = [...teams].sort((a, b) => {
    if (seedingRules) {
      const aRule = seedingRules.find(
        (rule) => rule.groupPosition === a.position
      );
      const bRule = seedingRules.find(
        (rule) => rule.groupPosition === b.position
      );
      if (aRule && bRule) {
        return aRule.seed - bRule.seed;
      }
    }

    // Fallback to position-based seeding
    return (a.position || 0) - (b.position || 0);
  });

  const numTeams = seededTeams.length;
  const totalRounds = Math.ceil(Math.log2(numTeams));
  const totalMatches = numTeams - 1;

  const matches: EliminationMatch[] = [];
  let matchCounter = 1;

  // Create first round matches
  const firstRoundMatches = Math.floor(numTeams / 2);
  const byes = numTeams - Math.pow(2, totalRounds - 1);

  // Handle byes in first round
  let teamIndex = 0;
  for (let i = 0; i < firstRoundMatches; i++) {
    const isBye = i < byes;

    matches.push({
      id: `elim-${groupId}-1-${matchCounter}`,
      homeTeam: isBye ? seededTeams[teamIndex++] : seededTeams[teamIndex++],
      awayTeam: isBye ? undefined : seededTeams[teamIndex++],
      round: 1,
      matchNumber: matchCounter++,
      groupId,
      isBye,
      winnerAdvancesTo: `elim-${groupId}-2-${Math.ceil(matchCounter / 2)}`,
    });
  }

  // Create subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = Math.floor(totalMatches / Math.pow(2, round - 1));

    for (let i = 0; i < matchesInRound; i++) {
      const matchId = `elim-${groupId}-${round}-${matchCounter}`;
      const nextMatchId =
        round < totalRounds
          ? `elim-${groupId}-${round + 1}-${Math.ceil(matchCounter / 2)}`
          : undefined;

      matches.push({
        id: matchId,
        round,
        matchNumber: matchCounter++,
        groupId,
        isBye: false,
        winnerAdvancesTo: nextMatchId,
        loserEliminated: round < totalRounds,
      });
    }
  }

  return {
    matches,
    totalRounds,
    totalMatches,
    format: 'single',
  };
}

/**
 * Generates playoff bracket (3rd place match, etc.)
 */
export function generatePlayoffBracket(
  teams: Team[],
  groupId: string,
  includeThirdPlace: boolean = true
): EliminationBracket {
  if (teams.length < 2) {
    return {
      matches: [],
      totalRounds: 0,
      totalMatches: 0,
      format: 'playoff',
    };
  }

  const matches: EliminationMatch[] = [];
  let matchCounter = 1;

  // Semi-finals
  matches.push({
    id: `playoff-${groupId}-sf1-${matchCounter}`,
    homeTeam: teams[0],
    awayTeam: teams[1],
    round: 1,
    matchNumber: matchCounter++,
    groupId,
    isBye: false,
    winnerAdvancesTo: `playoff-${groupId}-final-${matchCounter}`,
    loserEliminated: false,
  });

  matches.push({
    id: `playoff-${groupId}-sf2-${matchCounter}`,
    homeTeam: teams[2],
    awayTeam: teams[3],
    round: 1,
    matchNumber: matchCounter++,
    groupId,
    isBye: false,
    winnerAdvancesTo: `playoff-${groupId}-final-${matchCounter - 1}`,
    loserEliminated: false,
  });

  // Third place match
  if (includeThirdPlace && teams.length >= 4) {
    matches.push({
      id: `playoff-${groupId}-3rd-${matchCounter}`,
      round: 2,
      matchNumber: matchCounter++,
      groupId,
      isBye: false,
      winnerAdvancesTo: undefined,
      loserEliminated: false,
    });
  }

  // Final
  matches.push({
    id: `playoff-${groupId}-final-${matchCounter}`,
    round: includeThirdPlace ? 3 : 2,
    matchNumber: matchCounter++,
    groupId,
    isBye: false,
    winnerAdvancesTo: undefined,
    loserEliminated: false,
  });

  return {
    matches,
    totalRounds: includeThirdPlace ? 3 : 2,
    totalMatches: matches.length,
    format: 'playoff',
  };
}

/**
 * Generates cross-division elimination matches
 * e.g., Position 1 from Group A vs Position 4 from Group B
 */
export function generateCrossDivisionElimination(
  groups: Array<{
    id: string;
    name: string;
    teams: Team[];
    groupId: string;
  }>,
  crossDivisionRules: Array<{
    group1Position: number;
    group2Position: number;
    description: string;
  }>
): EliminationMatch[] {
  const matches: EliminationMatch[] = [];
  let matchCounter = 1;

  crossDivisionRules.forEach((rule, index) => {
    const group1 = groups[0];
    const group2 = groups[1];

    if (!group1 || !group2) return;

    const team1 = group1.teams.find((t) => t.position === rule.group1Position);
    const team2 = group2.teams.find((t) => t.position === rule.group2Position);

    if (team1 && team2) {
      matches.push({
        id: `cross-${group1.id}-${group2.id}-${matchCounter}`,
        homeTeam: team1,
        awayTeam: team2,
        round: 1,
        matchNumber: matchCounter++,
        stageId: group1.stageId,
        isBye: false,
        winnerAdvancesTo: `cross-${group1.id}-${group2.id}-${matchCounter}`,
        loserEliminated: true,
      });
    }
  });

  return matches;
}

/**
 * Calculates elimination bracket size
 */
export function calculateEliminationMatches(
  numTeams: number,
  format: 'single' | 'double' | 'playoff'
): number {
  switch (format) {
    case 'single':
      return numTeams - 1;
    case 'double':
      return (numTeams - 1) * 2;
    case 'playoff':
      return numTeams === 4 ? 3 : numTeams - 1;
    default:
      return 0;
  }
}

/**
 * Validates elimination bracket generation
 */
export function validateEliminationBracket(
  teams: Team[],
  format: 'single' | 'double' | 'playoff'
): {
  isValid: boolean;
  reason?: string;
} {
  if (teams.length < 2) {
    return {
      isValid: false,
      reason: 'Need at least 2 teams for elimination bracket',
    };
  }

  if (format === 'playoff' && teams.length !== 4) {
    return {
      isValid: false,
      reason: 'Playoff format requires exactly 4 teams',
    };
  }

  if (teams.length > 32) {
    return {
      isValid: false,
      reason: 'Too many teams for elimination bracket (max 32 recommended)',
    };
  }

  return { isValid: true };
}
