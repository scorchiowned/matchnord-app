/**
 * Placement Match Configuration System
 * Handles different placement match scenarios and bracket generation
 */

export type PlacementSystemType =
  | 'simple-placement' // 1st vs 2nd, 3rd vs 4th, etc.
  | 'tiered-brackets' // Multiple brackets based on group position
  | 'cross-group' // Cross-group placement matches
  | 'swiss-style' // Swiss-system style placement
  | 'custom';

export interface PlacementBracket {
  id: string;
  name: string;
  description: string;
  positions: number[]; // Group positions that advance to this bracket
  matchFormat: 'single-elimination' | 'round-robin' | 'playoff';
  includeThirdPlace?: boolean;
  includeFifthPlace?: boolean;
  includeSeventhPlace?: boolean;
}

interface PlacementTeamSourceGroupPosition {
  type: 'group-position';
  groupId: string;
  groupName: string;
  position: number;
}

interface PlacementTeamSourceMatchResult {
  type: 'match-winner' | 'match-loser';
  matchId: string;
  matchNumber: number;
  round: number;
}

export type PlacementTeamSource =
  | PlacementTeamSourceGroupPosition
  | PlacementTeamSourceMatchResult;

export interface PlacementTeam {
  id: string;
  name: string;
  position: number;
  source: PlacementTeamSource;
}

export interface PlacementMatch {
  id: string;
  homeTeam: PlacementTeam;
  awayTeam: PlacementTeam;
  round: number;
  roundLabel?: string;
  matchNumber: number;
  matchLabel: string;
}

export interface PlacementSystemConfiguration {
  id: string;
  name: string;
  description: string;
  type: PlacementSystemType;
  brackets: PlacementBracket[];
  crossGroupMatching?: {
    enabled: boolean;
    rules: {
      championship: { groupA: number; groupB: number };
      thirdPlace: { groupA: number; groupB: number };
      fifthPlace?: { groupA: number; groupB: number };
      seventhPlace?: { groupA: number; groupB: number };
    };
  };
  seedingRules?: {
    method: 'group-standings' | 'random' | 'manual';
    tiebreakerRules: string[];
  };
}

// Predefined placement system templates
export const PLACEMENT_SYSTEM_TEMPLATES: PlacementSystemConfiguration[] = [
  {
    id: 'simple-placement',
    name: 'Simple Placement',
    description: 'Basic placement matches: 1st vs 2nd, 3rd vs 4th, etc.',
    type: 'simple-placement',
    brackets: [
      {
        id: 'championship',
        name: 'Championship',
        description: '1st and 2nd place teams',
        positions: [1, 2],
        matchFormat: 'single-elimination',
        includeThirdPlace: true,
      },
      {
        id: 'consolation',
        name: 'Consolation',
        description: '3rd and 4th place teams',
        positions: [3, 4],
        matchFormat: 'single-elimination',
        includeThirdPlace: false,
      },
    ],
    seedingRules: {
      method: 'group-standings',
      tiebreakerRules: [
        'points',
        'goal-difference',
        'goals-scored',
        'head-to-head',
      ],
    },
  },
  {
    id: 'tiered-brackets',
    name: 'Tiered Brackets',
    description: 'Multiple brackets based on group performance',
    type: 'tiered-brackets',
    brackets: [
      {
        id: 'championship',
        name: 'Championship Bracket',
        description: 'Top 2 teams from each group',
        positions: [1, 2],
        matchFormat: 'single-elimination',
        includeThirdPlace: true,
      },
      {
        id: 'consolation',
        name: 'Consolation Bracket',
        description: '3rd and 4th place teams',
        positions: [3, 4],
        matchFormat: 'single-elimination',
        includeThirdPlace: true,
      },
      {
        id: 'elimination',
        name: 'Elimination Bracket',
        description: '5th place teams (if applicable)',
        positions: [5],
        matchFormat: 'single-elimination',
        includeThirdPlace: false,
      },
    ],
    seedingRules: {
      method: 'group-standings',
      tiebreakerRules: [
        'points',
        'goal-difference',
        'goals-scored',
        'head-to-head',
      ],
    },
  },
  {
    id: 'cross-group-placement',
    name: 'Cross-Group Placement',
    description: 'Placement matches between different groups',
    type: 'cross-group',
    brackets: [
      {
        id: 'championship',
        name: 'Championship',
        description: 'Group winners face off',
        positions: [1],
        matchFormat: 'single-elimination',
        includeThirdPlace: true,
      },
    ],
    crossGroupMatching: {
      enabled: true,
      rules: {
        championship: { groupA: 1, groupB: 1 },
        thirdPlace: { groupA: 2, groupB: 2 },
        fifthPlace: { groupA: 3, groupB: 3 },
        seventhPlace: { groupA: 4, groupB: 4 },
      },
    },
    seedingRules: {
      method: 'group-standings',
      tiebreakerRules: [
        'points',
        'goal-difference',
        'goals-scored',
        'head-to-head',
      ],
    },
  },
  {
    id: 'finnish-traditional',
    name: 'Finnish Traditional',
    description: 'Traditional Finnish tournament placement system',
    type: 'tiered-brackets',
    brackets: [
      {
        id: 'championship',
        name: 'Mestaruusottelut',
        description: 'Championship matches for top teams',
        positions: [1, 2],
        matchFormat: 'single-elimination',
        includeThirdPlace: true,
      },
      {
        id: 'sijoituspelit',
        name: 'Sijoituspelit',
        description: 'Placement matches for remaining teams',
        positions: [3, 4, 5, 6],
        matchFormat: 'playoff',
        includeThirdPlace: true,
        includeFifthPlace: true,
      },
    ],
    seedingRules: {
      method: 'group-standings',
      tiebreakerRules: [
        'points',
        'goal-difference',
        'goals-scored',
        'head-to-head',
      ],
    },
  },
  {
    id: 'swiss-style',
    name: 'Swiss-Style Placement',
    description: 'Swiss-system style placement with multiple tiers',
    type: 'swiss-style',
    brackets: [
      {
        id: 'championship',
        name: 'Championship Tier',
        description: 'Top 4 teams overall',
        positions: [1, 2, 3, 4],
        matchFormat: 'single-elimination',
        includeThirdPlace: true,
      },
      {
        id: 'middle-tier',
        name: 'Middle Tier',
        description: 'Teams 5-8',
        positions: [5, 6, 7, 8],
        matchFormat: 'single-elimination',
        includeThirdPlace: true,
      },
      {
        id: 'lower-tier',
        name: 'Lower Tier',
        description: 'Remaining teams',
        positions: [9, 10, 11, 12],
        matchFormat: 'single-elimination',
        includeThirdPlace: true,
      },
    ],
    seedingRules: {
      method: 'group-standings',
      tiebreakerRules: [
        'points',
        'goal-difference',
        'goals-scored',
        'head-to-head',
      ],
    },
  },
  {
    id: 'custom-5-team',
    name: 'Custom 5-Team Group',
    description: 'Your example: Top 2 to championship, rest to consolation',
    type: 'tiered-brackets',
    brackets: [
      {
        id: 'championship',
        name: 'Championship Bracket',
        description: 'Top 2 teams from group',
        positions: [1, 2],
        matchFormat: 'single-elimination',
        includeThirdPlace: false,
      },
      {
        id: 'consolation',
        name: 'Consolation Bracket',
        description: '3rd, 4th, and 5th place teams',
        positions: [3, 4, 5],
        matchFormat: 'single-elimination',
        includeThirdPlace: true,
      },
    ],
    seedingRules: {
      method: 'group-standings',
      tiebreakerRules: [
        'points',
        'goal-difference',
        'goals-scored',
        'head-to-head',
      ],
    },
  },
];

/**
 * Get placement system template by ID
 */
export function getPlacementSystemTemplate(
  templateId: string
): PlacementSystemConfiguration | undefined {
  return PLACEMENT_SYSTEM_TEMPLATES.find(
    (template) => template.id === templateId
  );
}

/**
 * Get all placement system templates
 */
export function getAllPlacementSystemTemplates(): PlacementSystemConfiguration[] {
  return PLACEMENT_SYSTEM_TEMPLATES;
}

/**
 * Get placement system templates by type
 */
export function getPlacementSystemTemplatesByType(
  type: PlacementSystemType
): PlacementSystemConfiguration[] {
  return PLACEMENT_SYSTEM_TEMPLATES.filter(
    (template) => template.type === type
  );
}

/**
 * Validate placement system configuration
 */
export function validatePlacementSystemConfiguration(
  config: PlacementSystemConfiguration
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.name || config.name.trim().length === 0) {
    errors.push('Placement system name is required');
  }

  if (!config.brackets || config.brackets.length === 0) {
    errors.push('At least one bracket must be defined');
  }

  // Check for duplicate bracket IDs
  const bracketIds = config.brackets.map((b) => b.id);
  const uniqueBracketIds = new Set(bracketIds);
  if (bracketIds.length !== uniqueBracketIds.size) {
    errors.push('Bracket IDs must be unique');
  }

  // Check for duplicate positions across brackets
  const allPositions = config.brackets.flatMap((b) => b.positions);
  const uniquePositions = new Set(allPositions);
  if (allPositions.length !== uniquePositions.size) {
    errors.push('Team positions cannot be assigned to multiple brackets');
  }

  // Validate cross-group matching if enabled
  if (config.crossGroupMatching?.enabled) {
    if (!config.crossGroupMatching.rules) {
      errors.push('Cross-group matching rules are required when enabled');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate placement matches based on configuration
 */
export function generatePlacementMatches(
  groupStandings: Array<{
    groupId: string;
    groupName: string;
    teams: Array<{
      id: string;
      name: string;
      position: number;
      points: number;
      goalDifference: number;
    }>;
  }>,
  placementConfig: PlacementSystemConfiguration
): Array<{
  bracketId: string;
  bracketName: string;
  matches: PlacementMatch[];
}> {
  const results: Array<{
    bracketId: string;
    bracketName: string;
    matches: PlacementMatch[];
  }> = [];

  for (const bracket of placementConfig.brackets) {
    const bracketMatches: PlacementMatch[] = [];

    // Get teams for this bracket from all groups
    const bracketTeams: Array<{
      id: string;
      name: string;
      position: number;
      groupId: string;
      groupName: string;
    }> = [];

    for (const group of groupStandings) {
      const groupTeams = group.teams.filter((team) =>
        bracket.positions.includes(team.position)
      );

      bracketTeams.push(
        ...groupTeams.map((team) => ({
          id: team.id,
          name: team.name,
          position: team.position,
          groupId: group.groupId,
          groupName: group.groupName,
        }))
      );
    }

    // Generate matches based on bracket format
    if (bracket.matchFormat === 'single-elimination') {
      // Generate single elimination bracket
      const matches = generateSingleEliminationPlacementMatches(
        bracketTeams,
        bracket
      );
      bracketMatches.push(...matches);
    } else if (bracket.matchFormat === 'playoff') {
      // Generate playoff matches (semi-finals, finals, etc.)
      const matches = generatePlayoffPlacementMatches(bracketTeams, bracket);
      bracketMatches.push(...matches);
    }

    results.push({
      bracketId: bracket.id,
      bracketName: bracket.name,
      matches: bracketMatches,
    });
  }

  return results;
}

/**
 * Helper function to get ordinal numbers (1st, 2nd, 3rd, etc.)
 */
function getOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function assignRoundLabels(matches: PlacementMatch[]): PlacementMatch[] {
  if (matches.length === 0) {
    return matches;
  }

  const maxRound = matches.reduce(
    (max, match) => (match.round > max ? match.round : max),
    0
  );

  return matches.map((match) => {
    if (match.roundLabel) {
      return match;
    }

    if (match.id.includes('-third-')) {
      return {
        ...match,
        roundLabel: 'Third Place',
      };
    }

    if (maxRound <= 1) {
      return {
        ...match,
        roundLabel: 'Final',
      };
    }

    if (match.round === maxRound) {
      return {
        ...match,
        roundLabel: 'Final',
      };
    }

    if (match.round === maxRound - 1) {
      return {
        ...match,
        roundLabel: 'Semi-Final',
      };
    }

    if (match.round === maxRound - 2) {
      return {
        ...match,
        roundLabel: 'Quarter-Final',
      };
    }

    return {
      ...match,
      roundLabel: `Round ${match.round}`,
    };
  });
}

/**
 * Generate single elimination placement matches
 */
function generateSingleEliminationPlacementMatches(
  teams: Array<{
    id: string;
    name: string;
    position: number;
    groupId: string;
    groupName: string;
  }>,
  bracket: PlacementBracket
): PlacementMatch[] {
  const matches: PlacementMatch[] = [];

  if (teams.length < 2) {
    return matches;
  }

  const sortedTeams = [...teams].sort((a, b) => a.position - b.position);

  type Competitor = {
    placeholderId: string;
    displayName: string;
    position: number;
    source: PlacementTeamSource;
  };

  let currentCompetitors: Competitor[] = sortedTeams.map((team) => ({
    placeholderId: `pos-${team.position}-${team.groupId}`,
    displayName: `${getOrdinal(team.position)} ${team.groupName}`,
    position: team.position,
    source: {
      type: 'group-position',
      groupId: team.groupId,
      groupName: team.groupName,
      position: team.position,
    },
  }));

  let matchCounter = 1;
  let round = 1;
  const roundHistory: PlacementMatch[][] = [];

  while (currentCompetitors.length > 1) {
    const roundMatches: PlacementMatch[] = [];
    const nextRoundCompetitors: Competitor[] = [];

    for (let i = 0; i < currentCompetitors.length; i += 2) {
      const home = currentCompetitors[i];
      const away = currentCompetitors[i + 1];

      if (!away) {
        nextRoundCompetitors.push(home);
        continue;
      }

      const matchId = `placement-${bracket.id}-r${round}-m${matchCounter}`;
      const matchLabel = `Game ${matchCounter}`;

      const match: PlacementMatch = {
        id: matchId,
        homeTeam: {
          id: home.placeholderId,
          name: home.displayName,
          position: home.position,
          source: home.source,
        },
        awayTeam: {
          id: away.placeholderId,
          name: away.displayName,
          position: away.position,
          source: away.source,
        },
        round,
        matchNumber: matchCounter,
        matchLabel,
      };

      roundMatches.push(match);

      nextRoundCompetitors.push({
        placeholderId: `winner-${matchId}`,
        displayName: `Winner of ${matchLabel}`,
        position: 0,
        source: {
          type: 'match-winner',
          matchId,
          matchNumber: match.matchNumber,
          round: match.round,
        },
      });

      matchCounter++;
    }

    if (roundMatches.length > 0) {
      roundHistory.push(roundMatches);
      matches.push(...roundMatches);
    }

    currentCompetitors = nextRoundCompetitors;
    round++;
  }

  if (bracket.includeThirdPlace && roundHistory.length >= 2) {
    const semiFinalMatches = roundHistory[roundHistory.length - 2];
    if (semiFinalMatches?.length >= 2) {
      const matchId = `placement-${bracket.id}-third-${matchCounter}`;
      const matchLabel = `Game ${matchCounter}`;

      const thirdPlaceMatch: PlacementMatch = {
        id: matchId,
        homeTeam: {
          id: `loser-${semiFinalMatches[0].id}`,
          name: `Loser of ${semiFinalMatches[0].matchLabel}`,
          position: 0,
          source: {
            type: 'match-loser',
            matchId: semiFinalMatches[0].id,
            matchNumber: semiFinalMatches[0].matchNumber,
            round: semiFinalMatches[0].round,
          },
        },
        awayTeam: {
          id: `loser-${semiFinalMatches[1].id}`,
          name: `Loser of ${semiFinalMatches[1].matchLabel}`,
          position: 0,
          source: {
            type: 'match-loser',
            matchId: semiFinalMatches[1].id,
            matchNumber: semiFinalMatches[1].matchNumber,
            round: semiFinalMatches[1].round,
          },
        },
        round: semiFinalMatches[0].round + 1,
        matchNumber: matchCounter,
        matchLabel,
        roundLabel: 'Third Place',
      };

      matches.push(thirdPlaceMatch);
      matchCounter++;
    }
  }

  return assignRoundLabels(matches);
}

/**
 * Generate playoff placement matches
 */
function generatePlayoffPlacementMatches(
  teams: Array<{
    id: string;
    name: string;
    position: number;
    groupId: string;
    groupName: string;
  }>,
  bracket: PlacementBracket
): PlacementMatch[] {
  const matches: PlacementMatch[] = [];

  if (teams.length < 2) {
    return matches;
  }

  // Sort teams by position for seeding
  const sortedTeams = [...teams].sort((a, b) => a.position - b.position);
  let matchCounter = 1;

  const semifinals: PlacementMatch[] = [];

  if (sortedTeams.length >= 4) {
    const semiFinal1Id = `placement-${bracket.id}-sf1-${matchCounter}`;
    const semiFinal1Label = `Game ${matchCounter}`;
    const semiFinal1: PlacementMatch = {
      id: semiFinal1Id,
      homeTeam: {
        id: `pos-${sortedTeams[0].position}-${sortedTeams[0].groupId}`,
        name: `${getOrdinal(sortedTeams[0].position)} ${sortedTeams[0].groupName}`,
        position: sortedTeams[0].position,
        source: {
          type: 'group-position',
          groupId: sortedTeams[0].groupId,
          groupName: sortedTeams[0].groupName,
          position: sortedTeams[0].position,
        },
      },
      awayTeam: {
        id: `pos-${sortedTeams[1].position}-${sortedTeams[1].groupId}`,
        name: `${getOrdinal(sortedTeams[1].position)} ${sortedTeams[1].groupName}`,
        position: sortedTeams[1].position,
        source: {
          type: 'group-position',
          groupId: sortedTeams[1].groupId,
          groupName: sortedTeams[1].groupName,
          position: sortedTeams[1].position,
        },
      },
      round: 1,
      matchNumber: matchCounter,
      matchLabel: semiFinal1Label,
      roundLabel: 'Semi-Final',
    };
    matches.push(semiFinal1);
    semifinals.push(semiFinal1);
    matchCounter++;

    const semiFinal2Id = `placement-${bracket.id}-sf2-${matchCounter}`;
    const semiFinal2Label = `Game ${matchCounter}`;
    const semiFinal2: PlacementMatch = {
      id: semiFinal2Id,
      homeTeam: {
        id: `pos-${sortedTeams[2].position}-${sortedTeams[2].groupId}`,
        name: `${getOrdinal(sortedTeams[2].position)} ${sortedTeams[2].groupName}`,
        position: sortedTeams[2].position,
        source: {
          type: 'group-position',
          groupId: sortedTeams[2].groupId,
          groupName: sortedTeams[2].groupName,
          position: sortedTeams[2].position,
        },
      },
      awayTeam: {
        id: `pos-${sortedTeams[3].position}-${sortedTeams[3].groupId}`,
        name: `${getOrdinal(sortedTeams[3].position)} ${sortedTeams[3].groupName}`,
        position: sortedTeams[3].position,
        source: {
          type: 'group-position',
          groupId: sortedTeams[3].groupId,
          groupName: sortedTeams[3].groupName,
          position: sortedTeams[3].position,
        },
      },
      round: 1,
      matchNumber: matchCounter,
      matchLabel: semiFinal2Label,
      roundLabel: 'Semi-Final',
    };
    matches.push(semiFinal2);
    semifinals.push(semiFinal2);
    matchCounter++;

    const finalMatchId = `placement-${bracket.id}-final-${matchCounter}`;
    const finalMatchLabel = `Game ${matchCounter}`;
    matches.push({
      id: finalMatchId,
      homeTeam: {
        id: `winner-${semiFinal1Id}`,
        name: `Winner of ${semiFinal1.matchLabel}`,
        position: 0,
        source: {
          type: 'match-winner',
          matchId: semiFinal1.id,
          matchNumber: semiFinal1.matchNumber,
          round: semiFinal1.round,
        },
      },
      awayTeam: {
        id: `winner-${semiFinal2Id}`,
        name: `Winner of ${semiFinal2.matchLabel}`,
        position: 0,
        source: {
          type: 'match-winner',
          matchId: semiFinal2.id,
          matchNumber: semiFinal2.matchNumber,
          round: semiFinal2.round,
        },
      },
      round: 2,
      matchNumber: matchCounter,
      matchLabel: finalMatchLabel,
      roundLabel: 'Final',
    });
    matchCounter++;

    if (bracket.includeThirdPlace) {
      const thirdPlaceMatchId = `placement-${bracket.id}-3rd-${matchCounter}`;
      const thirdPlaceMatchLabel = `Game ${matchCounter}`;
      matches.push({
        id: thirdPlaceMatchId,
        homeTeam: {
          id: `loser-${semiFinal1Id}`,
          name: `Loser of ${semiFinal1.matchLabel}`,
          position: 0,
          source: {
            type: 'match-loser',
            matchId: semiFinal1.id,
            matchNumber: semiFinal1.matchNumber,
            round: semiFinal1.round,
          },
        },
        awayTeam: {
          id: `loser-${semiFinal2Id}`,
          name: `Loser of ${semiFinal2.matchLabel}`,
          position: 0,
          source: {
            type: 'match-loser',
            matchId: semiFinal2.id,
            matchNumber: semiFinal2.matchNumber,
            round: semiFinal2.round,
          },
        },
        round: 2,
        matchNumber: matchCounter,
        matchLabel: thirdPlaceMatchLabel,
        roundLabel: 'Third Place',
      });
      matchCounter++;
    }
  } else if (sortedTeams.length === 2) {
    const matchId = `placement-${bracket.id}-final-${matchCounter}`;
    const matchLabel = `Game ${matchCounter}`;
    matches.push({
      id: matchId,
      homeTeam: {
        id: `pos-${sortedTeams[0].position}-${sortedTeams[0].groupId}`,
        name: `${getOrdinal(sortedTeams[0].position)} ${sortedTeams[0].groupName}`,
        position: sortedTeams[0].position,
        source: {
          type: 'group-position',
          groupId: sortedTeams[0].groupId,
          groupName: sortedTeams[0].groupName,
          position: sortedTeams[0].position,
        },
      },
      awayTeam: {
        id: `pos-${sortedTeams[1].position}-${sortedTeams[1].groupId}`,
        name: `${getOrdinal(sortedTeams[1].position)} ${sortedTeams[1].groupName}`,
        position: sortedTeams[1].position,
        source: {
          type: 'group-position',
          groupId: sortedTeams[1].groupId,
          groupName: sortedTeams[1].groupName,
          position: sortedTeams[1].position,
        },
      },
      round: 1,
      matchNumber: matchCounter,
      matchLabel,
      roundLabel: 'Final',
    });
    matchCounter++;
  }

  return assignRoundLabels(matches);
}
