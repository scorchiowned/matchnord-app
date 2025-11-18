/**
 * Conflict Detection Utilities for Match Scheduling
 * 
 * These functions check for scheduling conflicts:
 * - Pitch conflicts: Two matches on the same pitch with overlapping times
 * - Team double-booking: Same team(s) scheduled in overlapping time slots
 */

import { calculateEndTimeUTC } from '@/lib/time/timezone';

export interface MatchTimeSlot {
  id: string;
  startTime: string; // UTC ISO string
  endTime?: string; // UTC ISO string
  pitchId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  divisionId?: string;
  matchDuration?: number; // in minutes
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictType?: 'pitch' | 'team';
  conflictingMatchId?: string;
  conflictingMatch?: MatchTimeSlot;
}

/**
 * Check if two time ranges overlap
 * 
 * @param start1 - Start time of first range (UTC ISO string)
 * @param end1 - End time of first range (UTC ISO string)
 * @param start2 - Start time of second range (UTC ISO string)
 * @param end2 - End time of second range (UTC ISO string)
 * @returns true if time ranges overlap
 */
export function doTimesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Times are compared as UTC ISO strings, which can be compared lexicographically
  return start1 < end2 && end1 > start2;
}

/**
 * Get the end time for a match, calculating it if not provided
 * 
 * @param match - Match with startTime and optional endTime
 * @param matchDuration - Duration in minutes (used if endTime not provided)
 * @returns End time as UTC ISO string
 */
export function getMatchEndTime(
  match: MatchTimeSlot,
  matchDuration?: number
): string {
  if (match.endTime) {
    return match.endTime;
  }

  const duration = matchDuration || match.matchDuration || 90;
  return calculateEndTimeUTC(match.startTime, duration);
}

/**
 * Check if a match conflicts with another match on the same pitch
 * 
 * @param newMatch - The match being scheduled
 * @param existingMatch - An existing scheduled match
 * @param matchDuration - Duration in minutes for new match (if endTime not provided)
 * @returns ConflictResult indicating if there's a pitch conflict
 */
export function checkPitchConflict(
  newMatch: MatchTimeSlot,
  existingMatch: MatchTimeSlot,
  matchDuration?: number
): ConflictResult {
  // Must have pitch IDs
  if (!newMatch.pitchId || !existingMatch.pitchId) {
    return { hasConflict: false };
  }

  // Must be on the same pitch
  if (newMatch.pitchId !== existingMatch.pitchId) {
    return { hasConflict: false };
  }

  // Must have start times
  if (!newMatch.startTime || !existingMatch.startTime) {
    return { hasConflict: false };
  }

  // Don't check against self
  if (newMatch.id === existingMatch.id) {
    return { hasConflict: false };
  }

  // Get end times
  const newEndTime = getMatchEndTime(newMatch, matchDuration);
  const existingEndTime = getMatchEndTime(existingMatch);

  // Check for time overlap
  const overlaps = doTimesOverlap(
    newMatch.startTime,
    newEndTime,
    existingMatch.startTime,
    existingEndTime
  );

  if (overlaps) {
    return {
      hasConflict: true,
      conflictType: 'pitch',
      conflictingMatchId: existingMatch.id,
      conflictingMatch: existingMatch,
    };
  }

  return { hasConflict: false };
}

/**
 * Check if a match has team double-booking with another match
 * 
 * @param newMatch - The match being scheduled
 * @param existingMatch - An existing scheduled match
 * @param matchDuration - Duration in minutes for new match (if endTime not provided)
 * @returns ConflictResult indicating if there's a team conflict
 */
export function checkTeamDoubleBooking(
  newMatch: MatchTimeSlot,
  existingMatch: MatchTimeSlot,
  matchDuration?: number
): ConflictResult {
  // Must have start times
  if (!newMatch.startTime || !existingMatch.startTime) {
    return { hasConflict: false };
  }

  // Don't check against self
  if (newMatch.id === existingMatch.id) {
    return { hasConflict: false };
  }

  // Must have team IDs
  if (
    !newMatch.homeTeamId ||
    !newMatch.awayTeamId ||
    !existingMatch.homeTeamId ||
    !existingMatch.awayTeamId
  ) {
    return { hasConflict: false };
  }

  // Check if teams overlap
  const teamsOverlap =
    newMatch.homeTeamId === existingMatch.homeTeamId ||
    newMatch.homeTeamId === existingMatch.awayTeamId ||
    newMatch.awayTeamId === existingMatch.homeTeamId ||
    newMatch.awayTeamId === existingMatch.awayTeamId;

  if (!teamsOverlap) {
    return { hasConflict: false };
  }

  // Get end times
  const newEndTime = getMatchEndTime(newMatch, matchDuration);
  const existingEndTime = getMatchEndTime(existingMatch);

  // Check for time overlap
  const timeOverlaps = doTimesOverlap(
    newMatch.startTime,
    newEndTime,
    existingMatch.startTime,
    existingEndTime
  );

  if (timeOverlaps) {
    return {
      hasConflict: true,
      conflictType: 'team',
      conflictingMatchId: existingMatch.id,
      conflictingMatch: existingMatch,
    };
  }

  return { hasConflict: false };
}

/**
 * Check if a new match conflicts with any existing matches
 * 
 * @param newMatch - The match being scheduled
 * @param existingMatches - Array of existing scheduled matches
 * @param matchDuration - Duration in minutes for new match (if endTime not provided)
 * @returns ConflictResult with first conflict found, or no conflict
 */
export function checkMatchConflicts(
  newMatch: MatchTimeSlot,
  existingMatches: MatchTimeSlot[],
  matchDuration?: number
): ConflictResult {
  for (const existingMatch of existingMatches) {
    // Check pitch conflict first (more restrictive)
    const pitchConflict = checkPitchConflict(newMatch, existingMatch, matchDuration);
    if (pitchConflict.hasConflict) {
      return pitchConflict;
    }

    // Check team double-booking
    const teamConflict = checkTeamDoubleBooking(newMatch, existingMatch, matchDuration);
    if (teamConflict.hasConflict) {
      return teamConflict;
    }
  }

  return { hasConflict: false };
}

/**
 * Find all conflicts for a match
 * 
 * @param newMatch - The match being scheduled
 * @param existingMatches - Array of existing scheduled matches
 * @param matchDuration - Duration in minutes for new match (if endTime not provided)
 * @returns Array of all conflicts found
 */
export function findAllMatchConflicts(
  newMatch: MatchTimeSlot,
  existingMatches: MatchTimeSlot[],
  matchDuration?: number
): ConflictResult[] {
  const conflicts: ConflictResult[] = [];

  for (const existingMatch of existingMatches) {
    const pitchConflict = checkPitchConflict(newMatch, existingMatch, matchDuration);
    if (pitchConflict.hasConflict) {
      conflicts.push(pitchConflict);
    }

    const teamConflict = checkTeamDoubleBooking(newMatch, existingMatch, matchDuration);
    if (teamConflict.hasConflict) {
      conflicts.push(teamConflict);
    }
  }

  return conflicts;
}

