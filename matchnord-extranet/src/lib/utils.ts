import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(homeScore: number, awayScore: number): string {
  return `${homeScore} - ${awayScore}`;
}

export function calculatePoints(won: number, drawn: number): number {
  return won * 3 + drawn * 1;
}

export function calculateGoalDifference(
  goalsFor: number,
  goalsAgainst: number
): number {
  return goalsFor - goalsAgainst;
}

export function sortStandings(
  standings: Array<{
    points: number;
    goalDifference: number;
    goalsFor: number;
    played: number;
  }>
): Array<{
  points: number;
  goalDifference: number;
  goalsFor: number;
  played: number;
}> {
  return [...standings].sort((a, b) => {
    // First by points (descending)
    if (a.points !== b.points) {
      return b.points - a.points;
    }

    // Then by goal difference (descending)
    if (a.goalDifference !== b.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }

    // Then by goals for (descending)
    if (a.goalsFor !== b.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    // Finally by games played (ascending - teams with fewer games played rank higher)
    return a.played - b.played;
  });
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}
