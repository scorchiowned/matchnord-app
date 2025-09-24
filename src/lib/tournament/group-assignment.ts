/**
 * Group Assignment Logic for Tournament Management
 * Handles team assignment to groups within divisions
 */

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  club?: string;
  city?: string;
  level?: string;
  seed?: number; // Optional seeding for balanced groups
}

export interface Group {
  id: string;
  name: string;
  maxTeams: number;
  teams: Team[];
  divisionId: string;
}

export interface Division {
  id: string;
  name: string;
  maxTeams: number;
  minTeams: number;
  teams: Team[];
  groups: Group[];
}

export type AssignmentStrategy = 'random' | 'seeded' | 'balanced' | 'manual';

export interface GroupAssignmentOptions {
  strategy: AssignmentStrategy;
  maxTeamsPerGroup?: number;
  minTeamsPerGroup?: number;
  preferEvenDistribution?: boolean;
}

/**
 * Assign teams to groups using the specified strategy
 */
export function assignTeamsToGroups(
  teams: Team[],
  groups: Group[],
  options: GroupAssignmentOptions
): Group[] {
  if (teams.length === 0 || groups.length === 0) {
    return groups;
  }

  switch (options.strategy) {
    case 'random':
      return assignTeamsRandomly(teams, groups, options);
    case 'seeded':
      return assignTeamsSeeded(teams, groups, options);
    case 'balanced':
      return assignTeamsBalanced(teams, groups, options);
    default:
      return groups;
  }
}

/**
 * Random assignment of teams to groups
 */
function assignTeamsRandomly(
  teams: Team[],
  groups: Group[],
  options: GroupAssignmentOptions
): Group[] {
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  const updatedGroups = groups.map((group) => ({ ...group, teams: [] }));

  let teamIndex = 0;
  let groupIndex = 0;

  while (
    teamIndex < shuffledTeams.length &&
    groupIndex < updatedGroups.length
  ) {
    const currentGroup = updatedGroups[groupIndex];

    if (currentGroup.teams.length < currentGroup.maxTeams) {
      currentGroup.teams.push(shuffledTeams[teamIndex]);
      teamIndex++;
    }

    groupIndex = (groupIndex + 1) % updatedGroups.length;
  }

  return updatedGroups;
}

/**
 * Generate group names (A, B, C, etc.)
 */
export function generateGroupNames(count: number): string[] {
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    names.push(String.fromCharCode(65 + i)); // A, B, C, etc.
  }
  return names;
}

/**
 * Seeded assignment based on team ranking/seeding
 */
function assignTeamsSeeded(
  teams: Team[],
  groups: Group[],
  options: GroupAssignmentOptions
): Group[] {
  // Sort teams by seed (lower seed number = better team)
  const sortedTeams = [...teams].sort((a, b) => {
    const seedA = a.seed ?? 999;
    const seedB = b.seed ?? 999;
    return seedA - seedB;
  });

  const updatedGroups = groups.map((group) => ({ ...group, teams: [] }));

  // Snake draft assignment: 1st team goes to group 1, 2nd to group 2, etc.
  // Then reverse order for next round
  for (let i = 0; i < sortedTeams.length; i++) {
    const team = sortedTeams[i];
    const groupIndex = i % groups.length;
    const isReverseRound = Math.floor(i / groups.length) % 2 === 1;
    const actualGroupIndex = isReverseRound
      ? groups.length - 1 - groupIndex
      : groupIndex;

    if (
      updatedGroups[actualGroupIndex].teams.length <
      updatedGroups[actualGroupIndex].maxTeams
    ) {
      updatedGroups[actualGroupIndex].teams.push(team);
    }
  }

  return updatedGroups;
}

/**
 * Balanced assignment trying to distribute teams evenly
 */
function assignTeamsBalanced(
  teams: Team[],
  groups: Group[],
  options: GroupAssignmentOptions
): Group[] {
  const updatedGroups = groups.map((group) => ({ ...group, teams: [] }));

  // Calculate target teams per group
  const totalTeams = teams.length;
  const numGroups = groups.length;
  const targetTeamsPerGroup = Math.floor(totalTeams / numGroups);
  const remainder = totalTeams % numGroups;

  // Distribute teams evenly
  let teamIndex = 0;
  for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
    const teamsForThisGroup =
      targetTeamsPerGroup + (groupIndex < remainder ? 1 : 0);

    for (let i = 0; i < teamsForThisGroup && teamIndex < teams.length; i++) {
      updatedGroups[groupIndex].teams.push(teams[teamIndex]);
      teamIndex++;
    }
  }

  return updatedGroups;
}

/**
 * Create groups for a division based on team count and preferences
 */
export function createGroupsForDivision(
  division: Division,
  options: {
    maxTeamsPerGroup?: number;
    minTeamsPerGroup?: number;
    groupNames?: string[];
  }
): Group[] {
  const {
    maxTeamsPerGroup = 8,
    minTeamsPerGroup = 4,
    groupNames = [],
  } = options;
  const teamCount = division.teams.length;

  if (teamCount < minTeamsPerGroup) {
    return []; // Not enough teams for any group
  }

  // Calculate optimal number of groups
  const optimalGroups = Math.ceil(teamCount / maxTeamsPerGroup);
  const actualGroups = Math.max(
    1,
    Math.min(optimalGroups, Math.floor(teamCount / minTeamsPerGroup))
  );

  const groups: Group[] = [];

  for (let i = 0; i < actualGroups; i++) {
    const groupName = groupNames[i] || `Group ${String.fromCharCode(65 + i)}`; // A, B, C, etc.

    groups.push({
      id: `group-${i}`,
      name: groupName,
      maxTeams: maxTeamsPerGroup,
      teams: [],
      divisionId: division.id,
    });
  }

  return groups;
}

/**
 * Validate group assignments
 */
export function validateGroupAssignments(groups: Group[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  groups.forEach((group, index) => {
    // Check if group is over capacity
    if (group.teams.length > group.maxTeams) {
      errors.push(
        `Group ${group.name} has ${group.teams.length} teams but max capacity is ${group.maxTeams}`
      );
    }

    // Check if group is under minimum
    if (group.teams.length < 2) {
      warnings.push(
        `Group ${group.name} has only ${group.teams.length} teams (minimum recommended: 2)`
      );
    }

    // Check for duplicate teams
    const teamIds = group.teams.map((team) => team.id);
    const uniqueTeamIds = new Set(teamIds);
    if (teamIds.length !== uniqueTeamIds.size) {
      errors.push(`Group ${group.name} has duplicate teams`);
    }
  });

  // Check if all teams are assigned
  const allAssignedTeams = groups.flatMap((group) => group.teams);
  const uniqueAssignedTeams = new Set(allAssignedTeams.map((team) => team.id));

  if (allAssignedTeams.length !== uniqueAssignedTeams.size) {
    errors.push('Some teams are assigned to multiple groups');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get group statistics
 */
export function getGroupStatistics(groups: Group[]) {
  const totalTeams = groups.reduce((sum, group) => sum + group.teams.length, 0);
  const averageTeamsPerGroup =
    groups.length > 0 ? totalTeams / groups.length : 0;

  const groupStats = groups.map((group) => ({
    groupName: group.name,
    teamCount: group.teams.length,
    maxTeams: group.maxTeams,
    utilization:
      group.maxTeams > 0 ? (group.teams.length / group.maxTeams) * 100 : 0,
    isFull: group.teams.length >= group.maxTeams,
    isEmpty: group.teams.length === 0,
  }));

  return {
    totalGroups: groups.length,
    totalTeams,
    averageTeamsPerGroup: Math.round(averageTeamsPerGroup * 100) / 100,
    groupStats,
    isBalanced: groupStats.every(
      (stat) => Math.abs(stat.teamCount - averageTeamsPerGroup) <= 1
    ),
  };
}

/**
 * Rebalance groups by moving teams between groups
 */
export function rebalanceGroups(groups: Group[]): Group[] {
  const updatedGroups = groups.map((group) => ({
    ...group,
    teams: [...group.teams],
  }));

  // Calculate target teams per group
  const totalTeams = updatedGroups.reduce(
    (sum, group) => sum + group.teams.length,
    0
  );
  const numGroups = updatedGroups.length;
  const targetTeamsPerGroup = Math.floor(totalTeams / numGroups);

  // Sort groups by team count
  updatedGroups.sort((a, b) => a.teams.length - b.teams.length);

  // Move teams from overpopulated groups to underpopulated ones
  for (let i = 0; i < updatedGroups.length - 1; i++) {
    const currentGroup = updatedGroups[i];
    const nextGroup = updatedGroups[i + 1];

    while (
      currentGroup.teams.length < targetTeamsPerGroup &&
      nextGroup.teams.length > targetTeamsPerGroup
    ) {
      const teamToMove = nextGroup.teams.pop();
      if (teamToMove) {
        currentGroup.teams.push(teamToMove);
      }
    }
  }

  return updatedGroups;
}
