/**
 * Stage Creation Helpers for Tournament Management
 * Handles automatic creation of stages for divisions
 */

export interface StageCreationOptions {
  includeGroupStage?: boolean;
  includeKnockoutStage?: boolean;
  includePlayoffStage?: boolean;
  groupStageName?: string;
  knockoutStageName?: string;
  playoffStageName?: string;
}

export const DEFAULT_STAGE_OPTIONS: StageCreationOptions = {
  includeGroupStage: true,
  includeKnockoutStage: true,
  includePlayoffStage: false,
  groupStageName: 'Group Stage',
  knockoutStageName: 'Knockout Stage',
  playoffStageName: 'Playoff Stage',
};

/**
 * Create default stages for a division
 */
export function createDefaultStagesForDivision(
  divisionId: string,
  options: StageCreationOptions = DEFAULT_STAGE_OPTIONS
): Array<{
  name: string;
  description: string;
  type: 'GROUP' | 'KNOCKOUT' | 'PLAYOFF';
  order: number;
  divisionId: string;
}> {
  const stages = [];
  let order = 0;

  // Group Stage
  if (options.includeGroupStage) {
    stages.push({
      name: options.groupStageName || 'Group Stage',
      description:
        'Preliminary group stage where teams play round-robin matches',
      type: 'GROUP' as const,
      order: order++,
      divisionId,
    });
  }

  // Knockout Stage
  if (options.includeKnockoutStage) {
    stages.push({
      name: options.knockoutStageName || 'Knockout Stage',
      description: 'Single elimination knockout matches',
      type: 'KNOCKOUT' as const,
      order: order++,
      divisionId,
    });
  }

  // Playoff Stage
  if (options.includePlayoffStage) {
    stages.push({
      name: options.playoffStageName || 'Playoff Stage',
      description: 'Additional playoff matches for final standings',
      type: 'PLAYOFF' as const,
      order: order++,
      divisionId,
    });
  }

  return stages;
}

/**
 * Create Finnish tournament stages
 */
export function createFinnishTournamentStages(
  divisionId: string,
  options: StageCreationOptions = DEFAULT_STAGE_OPTIONS
): Array<{
  name: string;
  description: string;
  type: 'GROUP' | 'KNOCKOUT' | 'PLAYOFF';
  order: number;
  divisionId: string;
}> {
  const stages = [];
  let order = 0;

  // Group Stage (Alkulohko-ottelut)
  if (options.includeGroupStage) {
    stages.push({
      name: 'Alkulohko-ottelut',
      description:
        'Preliminary group stage where teams play round-robin matches',
      type: 'GROUP' as const,
      order: order++,
      divisionId,
    });
  }

  // Knockout Stage (Jatkopelit)
  if (options.includeKnockoutStage) {
    stages.push({
      name: 'Jatkopelit',
      description: 'Knockout stage with quarter-finals, semi-finals, and final',
      type: 'KNOCKOUT' as const,
      order: order++,
      divisionId,
    });
  }

  // Playoff Stage (Sijoituspelit)
  if (options.includePlayoffStage) {
    stages.push({
      name: 'Sijoituspelit',
      description: 'Placement matches for final standings',
      type: 'PLAYOFF' as const,
      order: order++,
      divisionId,
    });
  }

  return stages;
}

/**
 * Get stage type display name
 */
export function getStageTypeDisplayName(type: string): string {
  switch (type) {
    case 'GROUP':
      return 'Group Stage';
    case 'KNOCKOUT':
      return 'Knockout Stage';
    case 'PLAYOFF':
      return 'Playoff Stage';
    default:
      return type;
  }
}

/**
 * Get Finnish stage type display name
 */
export function getFinnishStageTypeDisplayName(type: string): string {
  switch (type) {
    case 'GROUP':
      return 'Alkulohko-ottelut';
    case 'KNOCKOUT':
      return 'Jatkopelit';
    case 'PLAYOFF':
      return 'Sijoituspelit';
    default:
      return type;
  }
}

/**
 * Validate stage configuration
 */
export function validateStageConfiguration(
  stages: Array<{
    name: string;
    type: string;
    order: number;
  }>
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for duplicate names
  const names = stages.map((stage) => stage.name);
  const uniqueNames = new Set(names);
  if (names.length !== uniqueNames.size) {
    errors.push('Stage names must be unique');
  }

  // Check for duplicate orders
  const orders = stages.map((stage) => stage.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    errors.push('Stage orders must be unique');
  }

  // Check for valid stage types
  const validTypes = ['GROUP', 'KNOCKOUT', 'PLAYOFF'];
  stages.forEach((stage, index) => {
    if (!validTypes.includes(stage.type)) {
      errors.push(`Stage ${index + 1} has invalid type: ${stage.type}`);
    }
  });

  // Check for logical stage order
  const groupStages = stages.filter((s) => s.type === 'GROUP');
  const knockoutStages = stages.filter((s) => s.type === 'KNOCKOUT');
  const playoffStages = stages.filter((s) => s.type === 'PLAYOFF');

  if (groupStages.length > 0 && knockoutStages.length > 0) {
    const maxGroupOrder = Math.max(...groupStages.map((s) => s.order));
    const minKnockoutOrder = Math.min(...knockoutStages.map((s) => s.order));

    if (maxGroupOrder >= minKnockoutOrder) {
      warnings.push('Group stages should come before knockout stages');
    }
  }

  if (knockoutStages.length > 0 && playoffStages.length > 0) {
    const maxKnockoutOrder = Math.max(...knockoutStages.map((s) => s.order));
    const minPlayoffOrder = Math.min(...playoffStages.map((s) => s.order));

    if (maxKnockoutOrder >= minPlayoffOrder) {
      warnings.push('Knockout stages should come before playoff stages');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
