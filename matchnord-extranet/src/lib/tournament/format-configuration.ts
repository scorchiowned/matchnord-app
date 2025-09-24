/**
 * Tournament Format Configuration System
 * Handles different tournament formats and phase management at the division level
 */

export type TournamentFormat = 
  | 'round-robin-only'
  | 'knockout-only' 
  | 'hybrid-groups-knockout'
  | 'hybrid-groups-playoff'
  | 'custom';

export type PhaseType = 'group' | 'knockout' | 'playoff';

export interface PhaseConfiguration {
  id: string;
  type: PhaseType;
  name: string;
  description?: string;
  order: number;
  enabled: boolean;
  // Group phase specific
  groupSettings?: {
    minTeamsPerGroup: number;
    maxTeamsPerGroup: number;
    teamsAdvance: number; // How many teams advance from each group
    tiebreakerRules: string[];
  };
  // Knockout phase specific
  knockoutSettings?: {
    includeThirdPlace: boolean;
    seedingMethod: 'group-standings' | 'random' | 'manual';
    bracketType: 'single-elimination' | 'double-elimination';
  };
  // Playoff phase specific
  playoffSettings?: {
    includeThirdPlace: boolean;
    includeFifthPlace: boolean;
    format: '4-team' | '6-team' | '8-team';
  };
}

export interface TournamentFormatTemplate {
  id: string;
  name: string;
  description: string;
  format: TournamentFormat;
  phases: PhaseConfiguration[];
  minTeams: number;
  maxTeams: number;
  duration: {
    minDays: number;
    maxDays: number;
    estimatedDays: number;
  };
  suitableFor: string[];
}

export interface DivisionFormatConfiguration {
  divisionId: string;
  format: TournamentFormat;
  phases: PhaseConfiguration[];
  customSettings?: {
    [key: string]: any;
  };
}

// Predefined tournament format templates
export const TOURNAMENT_FORMAT_TEMPLATES: TournamentFormatTemplate[] = [
  {
    id: 'youth-league',
    name: 'Youth League',
    description: 'Round-robin only tournament for youth teams',
    format: 'round-robin-only',
    phases: [
      {
        id: 'groups',
        type: 'group',
        name: 'Group Stage',
        description: 'Teams play each other once in groups',
        order: 1,
        enabled: true,
        groupSettings: {
          minTeamsPerGroup: 4,
          maxTeamsPerGroup: 8,
          teamsAdvance: 0, // No advancement in round-robin-only
          tiebreakerRules: ['points', 'goal-difference', 'goals-scored', 'head-to-head']
        }
      }
    ],
    minTeams: 4,
    maxTeams: 32,
    duration: {
      minDays: 1,
      maxDays: 3,
      estimatedDays: 2
    },
    suitableFor: ['Youth tournaments', 'Local leagues', 'Friendly competitions']
  },
  {
    id: 'cup-competition',
    name: 'Cup Competition',
    description: 'Single elimination knockout tournament',
    format: 'knockout-only',
    phases: [
      {
        id: 'knockout',
        type: 'knockout',
        name: 'Knockout Stage',
        description: 'Single elimination bracket',
        order: 1,
        enabled: true,
        knockoutSettings: {
          includeThirdPlace: true,
          seedingMethod: 'random',
          bracketType: 'single-elimination'
        }
      }
    ],
    minTeams: 4,
    maxTeams: 64,
    duration: {
      minDays: 1,
      maxDays: 7,
      estimatedDays: 3
    },
    suitableFor: ['Cup competitions', 'Championships', 'Playoffs']
  },
  {
    id: 'championship',
    name: 'Championship',
    description: 'Groups followed by knockout stage',
    format: 'hybrid-groups-knockout',
    phases: [
      {
        id: 'groups',
        type: 'group',
        name: 'Group Stage',
        description: 'Preliminary group stage',
        order: 1,
        enabled: true,
        groupSettings: {
          minTeamsPerGroup: 4,
          maxTeamsPerGroup: 6,
          teamsAdvance: 2,
          tiebreakerRules: ['points', 'goal-difference', 'goals-scored', 'head-to-head']
        }
      },
      {
        id: 'knockout',
        type: 'knockout',
        name: 'Knockout Stage',
        description: 'Elimination bracket for group winners',
        order: 2,
        enabled: true,
        knockoutSettings: {
          includeThirdPlace: true,
          seedingMethod: 'group-standings',
          bracketType: 'single-elimination'
        }
      }
    ],
    minTeams: 8,
    maxTeams: 32,
    duration: {
      minDays: 2,
      maxDays: 5,
      estimatedDays: 3
    },
    suitableFor: ['Championships', 'Major tournaments', 'Multi-day events']
  },
  {
    id: 'finnish-tournament',
    name: 'Finnish Tournament',
    description: 'Traditional Finnish tournament format with groups and playoffs',
    format: 'hybrid-groups-playoff',
    phases: [
      {
        id: 'groups',
        type: 'group',
        name: 'Alkulohko-ottelut',
        description: 'Preliminary group stage',
        order: 1,
        enabled: true,
        groupSettings: {
          minTeamsPerGroup: 4,
          maxTeamsPerGroup: 6,
          teamsAdvance: 4,
          tiebreakerRules: ['points', 'goal-difference', 'goals-scored', 'head-to-head']
        }
      },
      {
        id: 'playoffs',
        type: 'playoff',
        name: 'Sijoituspelit',
        description: 'Playoff matches for final standings',
        order: 2,
        enabled: true,
        playoffSettings: {
          includeThirdPlace: true,
          includeFifthPlace: true,
          format: '8-team'
        }
      }
    ],
    minTeams: 8,
    maxTeams: 16,
    duration: {
      minDays: 2,
      maxDays: 4,
      estimatedDays: 3
    },
    suitableFor: ['Finnish tournaments', 'Regional competitions', 'Traditional format']
  }
];

/**
 * Get format template by ID
 */
export function getFormatTemplate(templateId: string): TournamentFormatTemplate | undefined {
  return TOURNAMENT_FORMAT_TEMPLATES.find(template => template.id === templateId);
}

/**
 * Get all format templates suitable for a given team count
 */
export function getSuitableTemplates(teamCount: number): TournamentFormatTemplate[] {
  return TOURNAMENT_FORMAT_TEMPLATES.filter(
    template => teamCount >= template.minTeams && teamCount <= template.maxTeams
  );
}

/**
 * Create division format configuration from template
 */
export function createDivisionFormatFromTemplate(
  templateId: string,
  divisionId: string,
  customSettings?: { [key: string]: any }
): DivisionFormatConfiguration | null {
  const template = getFormatTemplate(templateId);
  if (!template) return null;

  return {
    divisionId,
    format: template.format,
    phases: template.phases.map(phase => ({
      ...phase,
      id: `${divisionId}-${phase.id}`
    })),
    customSettings
  };
}

/**
 * Validate division format configuration
 */
export function validateDivisionFormat(config: DivisionFormatConfiguration): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if at least one phase is enabled
  const enabledPhases = config.phases.filter(phase => phase.enabled);
  if (enabledPhases.length === 0) {
    errors.push('At least one phase must be enabled');
  }

  // Check phase order
  const phaseOrders = enabledPhases.map(phase => phase.order);
  const uniqueOrders = new Set(phaseOrders);
  if (phaseOrders.length !== uniqueOrders.size) {
    errors.push('Phase orders must be unique');
  }

  // Check for logical phase sequence
  const sortedPhases = enabledPhases.sort((a, b) => a.order - b.order);
  const groupPhases = sortedPhases.filter(p => p.type === 'group');
  const knockoutPhases = sortedPhases.filter(p => p.type === 'knockout');
  const playoffPhases = sortedPhases.filter(p => p.type === 'playoff');

  // Group phases should come before knockout/playoff phases
  if (groupPhases.length > 0 && (knockoutPhases.length > 0 || playoffPhases.length > 0)) {
    const maxGroupOrder = Math.max(...groupPhases.map(p => p.order));
    const minOtherOrder = Math.min(
      ...knockoutPhases.map(p => p.order),
      ...playoffPhases.map(p => p.order)
    );
    if (maxGroupOrder >= minOtherOrder) {
      warnings.push('Group phases should come before knockout/playoff phases');
    }
  }

  // Validate group settings
  groupPhases.forEach(phase => {
    if (phase.groupSettings) {
      const { minTeamsPerGroup, maxTeamsPerGroup, teamsAdvance } = phase.groupSettings;
      if (minTeamsPerGroup > maxTeamsPerGroup) {
        errors.push(`Phase "${phase.name}": minTeamsPerGroup cannot be greater than maxTeamsPerGroup`);
      }
      if (teamsAdvance > maxTeamsPerGroup) {
        errors.push(`Phase "${phase.name}": teamsAdvance cannot be greater than maxTeamsPerGroup`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get format display information
 */
export function getFormatDisplayInfo(format: TournamentFormat): {
  name: string;
  description: string;
  icon: string;
} {
  const formatInfo = {
    'round-robin-only': {
      name: 'Round Robin Only',
      description: 'Teams play each other once in groups',
      icon: '🔄'
    },
    'knockout-only': {
      name: 'Knockout Only',
      description: 'Single elimination tournament',
      icon: '🏆'
    },
    'hybrid-groups-knockout': {
      name: 'Groups + Knockout',
      description: 'Group stage followed by knockout',
      icon: '⚔️'
    },
    'hybrid-groups-playoff': {
      name: 'Groups + Playoffs',
      description: 'Group stage followed by playoffs',
      icon: '🎯'
    },
    'custom': {
      name: 'Custom Format',
      description: 'Custom tournament configuration',
      icon: '⚙️'
    }
  };

  return formatInfo[format] || formatInfo['custom'];
}

/**
 * Calculate estimated match count for a format
 */
export function calculateEstimatedMatches(
  teamCount: number,
  config: DivisionFormatConfiguration
): number {
  let totalMatches = 0;
  
  for (const phase of config.phases) {
    if (!phase.enabled) continue;
    
    switch (phase.type) {
      case 'group':
        if (phase.groupSettings) {
          const { maxTeamsPerGroup } = phase.groupSettings;
          const groupCount = Math.ceil(teamCount / maxTeamsPerGroup);
          const teamsPerGroup = Math.ceil(teamCount / groupCount);
          // Round-robin formula: n(n-1)/2
          const matchesPerGroup = (teamsPerGroup * (teamsPerGroup - 1)) / 2;
          totalMatches += groupCount * matchesPerGroup;
        }
        break;
        
      case 'knockout':
        if (phase.knockoutSettings) {
          const { includeThirdPlace } = phase.knockoutSettings;
          // Single elimination: n-1 matches, plus third place if enabled
          totalMatches += teamCount - 1 + (includeThirdPlace ? 1 : 0);
        }
        break;
        
      case 'playoff':
        if (phase.playoffSettings) {
          const { format } = phase.playoffSettings;
          const playoffTeamCount = parseInt(format.replace('-team', ''));
          // Playoff matches: semi-finals (2) + final (1) + third place (1) + fifth place (1 if enabled)
          totalMatches += 2 + 1 + 1 + (phase.playoffSettings.includeFifthPlace ? 1 : 0);
        }
        break;
    }
  }
  
  return totalMatches;
}

