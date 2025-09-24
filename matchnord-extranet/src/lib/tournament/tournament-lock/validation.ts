export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GroupValidationData {
  id: string;
  name: string;
  teams: Array<{
    id: string;
    name: string;
    level?: string;
  }>;
  // Direct division reference
  division: {
    id: string;
    name: string;
    level?: string;
  };
}

export interface DivisionValidationData {
  id: string;
  name: string;
  level?: string;
  groups: GroupValidationData[];
}

/**
 * Validates a single group for locking
 */
export function validateGroupForLock(
  group: GroupValidationData
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if group has teams
  if (group.teams.length === 0) {
    errors.push(`Group "${group.name}" has no teams assigned`);
  }

  // Check if group has minimum teams for meaningful competition
  if (group.teams.length < 2) {
    errors.push(`Group "${group.name}" needs at least 2 teams for competition`);
  }

  // Check if all teams have the same level as division
  const divisionLevel = group.division?.level;
  if (divisionLevel) {
    const teamsWithWrongLevel = group.teams.filter(
      (team) =>
        team.level && team.level.toLowerCase() !== divisionLevel.toLowerCase()
    );
    if (teamsWithWrongLevel.length > 0) {
      errors.push(
        `Group "${group.name}" has teams with incorrect level: ${teamsWithWrongLevel.map((t) => t.name).join(', ')}`
      );
    }
  }

  // Check for balanced group sizes (warning, not error)
  // Note: This validation requires access to all groups in the division
  // For now, we'll skip this validation as it requires the full division context
  // This should be handled at the division level instead

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates a division for locking
 */
export function validateDivisionForLock(
  division: DivisionValidationData
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if division has groups
  if (division.groups.length === 0) {
    errors.push(`Division "${division.name}" has no groups`);
    return { isValid: false, errors, warnings };
  }

  // Validate each group
  const groupValidations = division.groups.map((group) =>
    validateGroupForLock(group)
  );

  // Collect all errors and warnings
  groupValidations.forEach((validation) => {
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
  });

  // Check if all groups have teams
  const groupsWithoutTeams = division.groups.filter(
    (group) => group.teams.length === 0
  );
  if (groupsWithoutTeams.length > 0) {
    errors.push(
      `Division "${division.name}" has groups without teams: ${groupsWithoutTeams.map((g) => g.name).join(', ')}`
    );
  }

  // Check for balanced group sizes (warning, not error)
  if (division.groups.length > 1) {
    const teamCounts = division.groups.map((group) => group.teams.length);
    const minTeams = Math.min(...teamCounts);
    const maxTeams = Math.max(...teamCounts);

    if (maxTeams - minTeams > 1) {
      warnings.push(
        `Division "${division.name}" has unbalanced group sizes (${minTeams}-${maxTeams} teams per group). Consider balancing group sizes.`
      );
    }
  }

  // Check for overall division balance
  const totalTeams = division.groups.reduce(
    (total, group) => total + group.teams.length,
    0
  );
  if (totalTeams < 4) {
    warnings.push(
      `Division "${division.name}" has only ${totalTeams} teams total. Consider if this is enough for meaningful competition.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates entire tournament for locking
 */
export function validateTournamentForLock(
  divisions: DivisionValidationData[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if tournament has divisions
  if (divisions.length === 0) {
    errors.push('Tournament has no divisions');
    return { isValid: false, errors, warnings };
  }

  // Validate each division
  const divisionValidations = divisions.map((division) =>
    validateDivisionForLock(division)
  );

  // Collect all errors and warnings
  divisionValidations.forEach((validation) => {
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
  });

  // Check if all divisions are valid
  const invalidDivisions = divisions.filter(
    (_, index) => !divisionValidations[index].isValid
  );
  if (invalidDivisions.length > 0) {
    errors.push(
      `Invalid divisions: ${invalidDivisions.map((d) => d.name).join(', ')}`
    );
  }

  // Tournament-level warnings
  const totalTeams = divisions.reduce(
    (total, division) =>
      total +
      division.groups.reduce(
        (divTotal, group) => divTotal + group.teams.length,
        0
      ),
    0
  );

  if (totalTeams < 8) {
    warnings.push(
      `Tournament has only ${totalTeams} teams total. Consider if this is enough for a meaningful tournament.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets a summary of validation results for display
 */
export function getValidationSummary(validation: ValidationResult): {
  status: 'valid' | 'warning' | 'error';
  message: string;
  details: string[];
} {
  if (validation.isValid && validation.warnings.length === 0) {
    return {
      status: 'valid',
      message: 'Ready to lock',
      details: [],
    };
  }

  if (validation.isValid && validation.warnings.length > 0) {
    return {
      status: 'warning',
      message: `Ready to lock with ${validation.warnings.length} warning(s)`,
      details: validation.warnings,
    };
  }

  return {
    status: 'error',
    message: `Cannot lock: ${validation.errors.length} error(s) found`,
    details: validation.errors,
  };
}
