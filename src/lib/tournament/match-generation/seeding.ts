export interface Team {
  id: string;
  name: string;
  shortName?: string;
  level?: string;
  position?: number;
  points?: number;
  goalDifference?: number;
  goalsFor?: number;
  goalsAgainst?: number;
}

export interface SeedingRule {
  groupPosition: number;
  seed: number;
  description: string;
  priority: number; // Lower number = higher priority
}

export interface SeedingResult {
  team: Team;
  seed: number;
  groupPosition: number;
  groupName: string;
  description: string;
}

/**
 * Standard seeding rules for 4-team groups
 */
export const STANDARD_4_TEAM_SEEDING: SeedingRule[] = [
  {
    groupPosition: 1,
    seed: 1,
    description: 'Group Winner',
    priority: 1,
  },
  {
    groupPosition: 2,
    seed: 2,
    description: 'Group Runner-up',
    priority: 2,
  },
  {
    groupPosition: 3,
    seed: 3,
    description: 'Group Third Place',
    priority: 3,
  },
  {
    groupPosition: 4,
    seed: 4,
    description: 'Group Fourth Place',
    priority: 4,
  },
];

/**
 * Standard seeding rules for 8-team groups
 */
export const STANDARD_8_TEAM_SEEDING: SeedingRule[] = [
  {
    groupPosition: 1,
    seed: 1,
    description: 'Group Winner',
    priority: 1,
  },
  {
    groupPosition: 2,
    seed: 2,
    description: 'Group Runner-up',
    priority: 2,
  },
  {
    groupPosition: 3,
    seed: 3,
    description: 'Group Third Place',
    priority: 3,
  },
  {
    groupPosition: 4,
    seed: 4,
    description: 'Group Fourth Place',
    priority: 4,
  },
  {
    groupPosition: 5,
    seed: 5,
    description: 'Group Fifth Place',
    priority: 5,
  },
  {
    groupPosition: 6,
    seed: 6,
    description: 'Group Sixth Place',
    priority: 6,
  },
  {
    groupPosition: 7,
    seed: 7,
    description: 'Group Seventh Place',
    priority: 7,
  },
  {
    groupPosition: 8,
    seed: 8,
    description: 'Group Eighth Place',
    priority: 8,
  },
];

/**
 * Cross-division seeding rules
 * e.g., Position 1 from Group A vs Position 4 from Group B
 */
export const CROSS_DIVISION_SEEDING: Array<{
  group1Position: number;
  group2Position: number;
  description: string;
  priority: number;
}> = [
  {
    group1Position: 1,
    group2Position: 4,
    description: 'Group A Winner vs Group B Fourth Place',
    priority: 1,
  },
  {
    group1Position: 2,
    group2Position: 3,
    description: 'Group A Runner-up vs Group B Third Place',
    priority: 2,
  },
  {
    group1Position: 3,
    group2Position: 2,
    description: 'Group A Third Place vs Group B Runner-up',
    priority: 3,
  },
  {
    group1Position: 4,
    group2Position: 1,
    description: 'Group A Fourth Place vs Group B Winner',
    priority: 4,
  },
];

/**
 * Seeds teams based on group positions and seeding rules
 */
export function seedTeams(
  groups: Array<{
    id: string;
    name: string;
    teams: Team[];
  }>,
  seedingRules: SeedingRule[] = STANDARD_4_TEAM_SEEDING
): SeedingResult[] {
  const seededTeams: SeedingResult[] = [];

  groups.forEach((group) => {
    group.teams.forEach((team) => {
      const rule = seedingRules.find((r) => r.groupPosition === team.position);
      if (rule) {
        seededTeams.push({
          team,
          seed: rule.seed,
          groupPosition: team.position || 0,
          groupName: group.name,
          description: rule.description,
        });
      }
    });
  });

  // Sort by seed (lower number = higher seed)
  return seededTeams.sort((a, b) => a.seed - b.seed);
}

/**
 * Generates cross-division match pairings
 */
export function generateCrossDivisionPairings(
  groups: Array<{
    id: string;
    name: string;
    teams: Team[];
  }>,
  crossDivisionRules: Array<{
    group1Position: number;
    group2Position: number;
    description: string;
    priority: number;
  }> = CROSS_DIVISION_SEEDING
): Array<{
  team1: Team;
  team2: Team;
  description: string;
  priority: number;
}> {
  const pairings: Array<{
    team1: Team;
    team2: Team;
    description: string;
    priority: number;
  }> = [];

  if (groups.length < 2) {
    return pairings;
  }

  const group1 = groups[0];
  const group2 = groups[1];

  crossDivisionRules.forEach((rule) => {
    const team1 = group1.teams.find((t) => t.position === rule.group1Position);
    const team2 = group2.teams.find((t) => t.position === rule.group2Position);

    if (team1 && team2) {
      pairings.push({
        team1,
        team2,
        description: rule.description,
        priority: rule.priority,
      });
    }
  });

  return pairings.sort((a, b) => a.priority - b.priority);
}

/**
 * Validates seeding rules
 */
export function validateSeedingRules(
  groups: Array<{
    id: string;
    name: string;
    teams: Team[];
  }>,
  seedingRules: SeedingRule[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if all groups have teams with positions
  groups.forEach((group) => {
    const teamsWithoutPositions = group.teams.filter((t) => !t.position);
    if (teamsWithoutPositions.length > 0) {
      errors.push(
        `Group "${group.name}" has teams without positions: ${teamsWithoutPositions.map((t) => t.name).join(', ')}`
      );
    }
  });

  // Check if seeding rules cover all positions
  const maxPosition = Math.max(
    ...groups.flatMap((g) => g.teams.map((t) => t.position || 0))
  );
  const coveredPositions = new Set(seedingRules.map((r) => r.groupPosition));

  for (let i = 1; i <= maxPosition; i++) {
    if (!coveredPositions.has(i)) {
      warnings.push(`No seeding rule for position ${i}`);
    }
  }

  // Check for duplicate seeds
  const seeds = seedingRules.map((r) => r.seed);
  const duplicateSeeds = seeds.filter(
    (seed, index) => seeds.indexOf(seed) !== index
  );
  if (duplicateSeeds.length > 0) {
    errors.push(`Duplicate seeds found: ${duplicateSeeds.join(', ')}`);
  }

  // Check for duplicate priorities
  const priorities = seedingRules.map((r) => r.priority);
  const duplicatePriorities = priorities.filter(
    (priority, index) => priorities.indexOf(priority) !== index
  );
  if (duplicatePriorities.length > 0) {
    errors.push(
      `Duplicate priorities found: ${duplicatePriorities.join(', ')}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets seeding rules for a specific group size
 */
export function getSeedingRulesForGroupSize(groupSize: number): SeedingRule[] {
  if (groupSize <= 4) {
    return STANDARD_4_TEAM_SEEDING;
  } else if (groupSize <= 8) {
    return STANDARD_8_TEAM_SEEDING;
  } else {
    // Generate rules for larger groups
    const rules: SeedingRule[] = [];
    for (let i = 1; i <= groupSize; i++) {
      rules.push({
        groupPosition: i,
        seed: i,
        description: `Group Position ${i}`,
        priority: i,
      });
    }
    return rules;
  }
}
