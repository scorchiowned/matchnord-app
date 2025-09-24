/**
 * Tournament Utility Functions
 * Common utilities for tournament management
 */

export interface TournamentSettings {
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  tiebreakerRules: string[];
  matchDuration: number; // minutes
  breakDuration: number; // minutes
  maxTeamsPerGroup: number;
  minTeamsPerGroup: number;
  includePlayoffs: boolean;
  doubleRoundRobin: boolean;
}

export const DEFAULT_TOURNAMENT_SETTINGS: TournamentSettings = {
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
  tiebreakerRules: ['points', 'goal_difference', 'goals_for', 'head_to_head'],
  matchDuration: 90,
  breakDuration: 15,
  maxTeamsPerGroup: 8,
  minTeamsPerGroup: 4,
  includePlayoffs: true,
  doubleRoundRobin: false,
};

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
 * Generate Finnish group names (Lohko A, Lohko B, etc.)
 */
export function generateFinnishGroupNames(count: number): string[] {
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    names.push(`Lohko ${String.fromCharCode(65 + i)}`);
  }
  return names;
}

/**
 * Calculate tournament duration based on matches and settings
 */
export function calculateTournamentDuration(
  matchCount: number,
  settings: TournamentSettings
): {
  totalDays: number;
  totalHours: number;
  matchesPerDay: number;
  estimatedSchedule: {
    day: number;
    matches: number;
    hours: number;
  }[];
} {
  const matchDuration = settings.matchDuration + settings.breakDuration;
  const totalMatchHours = matchCount * (matchDuration / 60);

  // Assume 8 hours of play per day
  const hoursPerDay = 8;
  const totalDays = Math.ceil(totalMatchHours / hoursPerDay);
  const matchesPerDay = Math.ceil(matchCount / totalDays);

  const estimatedSchedule = [];
  let remainingMatches = matchCount;

  for (let day = 1; day <= totalDays; day++) {
    const matchesThisDay = Math.min(matchesPerDay, remainingMatches);
    const hoursThisDay = matchesThisDay * (matchDuration / 60);

    estimatedSchedule.push({
      day,
      matches: matchesThisDay,
      hours: Math.round(hoursThisDay * 100) / 100,
    });

    remainingMatches -= matchesThisDay;
  }

  return {
    totalDays,
    totalHours: Math.round(totalMatchHours * 100) / 100,
    matchesPerDay,
    estimatedSchedule,
  };
}

/**
 * Validate tournament settings
 */
export function validateTournamentSettings(settings: TournamentSettings): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate points system
  if (settings.pointsForWin < 0) {
    errors.push('Points for win cannot be negative');
  }
  if (settings.pointsForDraw < 0) {
    errors.push('Points for draw cannot be negative');
  }
  if (settings.pointsForLoss < 0) {
    errors.push('Points for loss cannot be negative');
  }

  // Validate match duration
  if (settings.matchDuration < 30) {
    warnings.push('Match duration is very short (less than 30 minutes)');
  }
  if (settings.matchDuration > 180) {
    warnings.push('Match duration is very long (more than 3 hours)');
  }

  // Validate group settings
  if (settings.maxTeamsPerGroup < settings.minTeamsPerGroup) {
    errors.push(
      'Maximum teams per group cannot be less than minimum teams per group'
    );
  }
  if (settings.maxTeamsPerGroup > 32) {
    warnings.push('Maximum teams per group is very high (more than 32)');
  }
  if (settings.minTeamsPerGroup < 2) {
    errors.push('Minimum teams per group must be at least 2');
  }

  // Validate tiebreaker rules
  if (settings.tiebreakerRules.length === 0) {
    warnings.push('No tiebreaker rules specified');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format tournament duration for display
 */
export function formatTournamentDuration(days: number, hours: number): string {
  if (days === 1) {
    return `${hours} hours`;
  } else if (days < 7) {
    return `${days} days`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else {
      return `${weeks} week${weeks > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
    }
  } else {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
    }
  }
}

/**
 * Generate tournament bracket structure
 */
export function generateBracketStructure(teamCount: number): {
  rounds: {
    round: number;
    name: string;
    matches: number;
    teams: number;
  }[];
  totalMatches: number;
} {
  const rounds = [];
  let currentTeams = teamCount;
  let round = 1;
  let totalMatches = 0;

  // First round (if not power of 2)
  if (!isPowerOfTwo(teamCount)) {
    const firstRoundTeams = getNextPowerOfTwo(teamCount);
    const firstRoundMatches = (firstRoundTeams - teamCount) * 2;

    rounds.push({
      round: 1,
      name: 'First Round',
      matches: firstRoundMatches,
      teams: teamCount,
    });

    totalMatches += firstRoundMatches;
    currentTeams = firstRoundTeams - firstRoundMatches;
    round++;
  }

  // Main bracket rounds
  while (currentTeams > 1) {
    const matches = currentTeams / 2;
    const teams = currentTeams;

    let roundName = '';
    if (currentTeams === 2) {
      roundName = 'Final';
    } else if (currentTeams === 4) {
      roundName = 'Semi-finals';
    } else if (currentTeams === 8) {
      roundName = 'Quarter-finals';
    } else {
      roundName = `Round of ${currentTeams}`;
    }

    rounds.push({
      round,
      name: roundName,
      matches,
      teams,
    });

    totalMatches += matches;
    currentTeams = matches;
    round++;
  }

  return {
    rounds,
    totalMatches,
  };
}

/**
 * Check if a number is a power of 2
 */
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Get the next power of 2 greater than or equal to n
 */
function getNextPowerOfTwo(n: number): number {
  if (n <= 0) return 1;
  if (n === 1) return 2;

  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

/**
 * Generate match schedule with time slots
 */
export function generateMatchSchedule(
  matches: any[],
  startDate: Date,
  settings: TournamentSettings
): {
  matchId: string;
  startTime: Date;
  endTime: Date;
  venue?: string;
  pitch?: string;
}[] {
  const schedule = [];
  const matchDuration = settings.matchDuration + settings.breakDuration;
  let currentTime = new Date(startDate);

  matches.forEach((match, index) => {
    const startTime = new Date(currentTime);
    const endTime = new Date(
      currentTime.getTime() + settings.matchDuration * 60000
    );

    schedule.push({
      matchId: match.id,
      startTime,
      endTime,
    });

    // Move to next time slot
    currentTime = new Date(currentTime.getTime() + matchDuration * 60000);
  });

  return schedule;
}

/**
 * Calculate team statistics
 */
export function calculateTeamStatistics(
  teamId: string,
  matches: any[]
): {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
} {
  const teamMatches = matches.filter(
    (match) => match.homeTeamId === teamId || match.awayTeamId === teamId
  );

  let played = 0;
  let won = 0;
  let drawn = 0;
  let lost = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  teamMatches.forEach((match) => {
    if (match.status === 'FINISHED') {
      played++;

      const isHome = match.homeTeamId === teamId;
      const teamGoals = isHome ? match.homeScore : match.awayScore;
      const opponentGoals = isHome ? match.awayScore : match.homeScore;

      goalsFor += teamGoals;
      goalsAgainst += opponentGoals;

      if (teamGoals > opponentGoals) {
        won++;
      } else if (teamGoals === opponentGoals) {
        drawn++;
      } else {
        lost++;
      }
    }
  });

  const goalDifference = goalsFor - goalsAgainst;
  const points = won * 3 + drawn * 1; // Standard 3-1-0 system

  return {
    played,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference,
    points,
  };
}

/**
 * Sort teams by standings
 */
export function sortTeamsByStandings(
  teams: any[],
  matches: any[],
  tiebreakerRules: string[] = ['points', 'goal_difference', 'goals_for']
): any[] {
  return teams
    .map((team) => ({
      ...team,
      ...calculateTeamStatistics(team.id, matches),
    }))
    .sort((a, b) => {
      for (const rule of tiebreakerRules) {
        let comparison = 0;

        switch (rule) {
          case 'points':
            comparison = b.points - a.points;
            break;
          case 'goal_difference':
            comparison = b.goalDifference - a.goalDifference;
            break;
          case 'goals_for':
            comparison = b.goalsFor - a.goalsFor;
            break;
          case 'head_to_head':
            // This would require more complex logic to compare head-to-head records
            comparison = 0;
            break;
        }

        if (comparison !== 0) {
          return comparison;
        }
      }

      return 0;
    });
}
