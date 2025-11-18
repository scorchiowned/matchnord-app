import { describe, it, expect } from 'vitest';
import {
  doTimesOverlap,
  getMatchEndTime,
  checkPitchConflict,
  checkTeamDoubleBooking,
  checkMatchConflicts,
  findAllMatchConflicts,
  type MatchTimeSlot,
} from '../conflict-detection';

describe('Conflict Detection Utilities', () => {
  // Helper to create test matches
  const createMatch = (
    id: string,
    startTime: string,
    options: {
      endTime?: string;
      pitchId?: string;
      homeTeamId?: string;
      awayTeamId?: string;
      matchDuration?: number;
      divisionId?: string;
    } = {}
  ): MatchTimeSlot => ({
    id,
    startTime,
    endTime: options.endTime,
    pitchId: options.pitchId || 'pitch-1',
    homeTeamId: options.homeTeamId || 'team-1',
    awayTeamId: options.awayTeamId || 'team-2',
    matchDuration: options.matchDuration || 90,
    divisionId: options.divisionId,
  });

  describe('doTimesOverlap', () => {
    it('should detect exact time overlap', () => {
      const start1 = '2024-01-15T14:00:00.000Z';
      const end1 = '2024-01-15T15:30:00.000Z';
      const start2 = '2024-01-15T14:00:00.000Z';
      const end2 = '2024-01-15T15:30:00.000Z';

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should detect partial overlap - new match starts during existing', () => {
      const start1 = '2024-01-15T14:00:00.000Z';
      const end1 = '2024-01-15T15:30:00.000Z';
      const start2 = '2024-01-15T14:30:00.000Z';
      const end2 = '2024-01-15T16:00:00.000Z';

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should detect partial overlap - new match ends during existing', () => {
      const start1 = '2024-01-15T14:00:00.000Z';
      const end1 = '2024-01-15T15:30:00.000Z';
      const start2 = '2024-01-15T13:30:00.000Z';
      const end2 = '2024-01-15T15:00:00.000Z';

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should detect overlap - new match completely within existing', () => {
      const start1 = '2024-01-15T14:00:00.000Z';
      const end1 = '2024-01-15T16:00:00.000Z';
      const start2 = '2024-01-15T14:30:00.000Z';
      const end2 = '2024-01-15T15:30:00.000Z';

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should detect overlap - new match completely encompasses existing', () => {
      const start1 = '2024-01-15T14:30:00.000Z';
      const end1 = '2024-01-15T15:30:00.000Z';
      const start2 = '2024-01-15T14:00:00.000Z';
      const end2 = '2024-01-15T16:00:00.000Z';

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should not detect overlap - adjacent times (end = start)', () => {
      const start1 = '2024-01-15T14:00:00.000Z';
      const end1 = '2024-01-15T15:30:00.000Z';
      const start2 = '2024-01-15T15:30:00.000Z';
      const end2 = '2024-01-15T17:00:00.000Z';

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    it('should not detect overlap - completely separate times', () => {
      const start1 = '2024-01-15T14:00:00.000Z';
      const end1 = '2024-01-15T15:30:00.000Z';
      const start2 = '2024-01-15T16:00:00.000Z';
      const end2 = '2024-01-15T17:30:00.000Z';

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    it('should handle UTC time string comparison correctly', () => {
      const start1 = '2024-01-15T12:00:00.000Z';
      const end1 = '2024-01-15T13:00:00.000Z';
      const start2 = '2024-01-15T12:30:00.000Z';
      const end2 = '2024-01-15T13:30:00.000Z';

      expect(doTimesOverlap(start1, end1, start2, end2)).toBe(true);
    });
  });

  describe('getMatchEndTime', () => {
    it('should return provided endTime if available', () => {
      const match = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        endTime: '2024-01-15T15:30:00.000Z',
      });

      const endTime = getMatchEndTime(match);
      expect(endTime).toBe('2024-01-15T15:30:00.000Z');
    });

    it('should calculate endTime from startTime and duration', () => {
      const match = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        matchDuration: 90,
      });

      const endTime = getMatchEndTime(match);
      const expectedEnd = new Date('2024-01-15T14:00:00.000Z');
      expectedEnd.setMinutes(expectedEnd.getMinutes() + 90);
      expect(endTime).toBe(expectedEnd.toISOString());
    });

    it('should use provided matchDuration parameter', () => {
      const match = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        matchDuration: 60,
      });

      const endTime = getMatchEndTime(match, 120);
      const expectedEnd = new Date('2024-01-15T14:00:00.000Z');
      expectedEnd.setMinutes(expectedEnd.getMinutes() + 120);
      expect(endTime).toBe(expectedEnd.toISOString());
    });

    it('should default to 90 minutes if no duration provided', () => {
      const match: MatchTimeSlot = {
        id: 'match-1',
        startTime: '2024-01-15T14:00:00.000Z',
      };

      const endTime = getMatchEndTime(match);
      const expectedEnd = new Date('2024-01-15T14:00:00.000Z');
      expectedEnd.setMinutes(expectedEnd.getMinutes() + 90);
      expect(endTime).toBe(expectedEnd.toISOString());
    });
  });

  describe('checkPitchConflict', () => {
    it('should detect conflict - same pitch, exact time overlap', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });

      const result = checkPitchConflict(newMatch, existingMatch);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('pitch');
      expect(result.conflictingMatchId).toBe('match-2');
    });

    it('should detect conflict - same pitch, partial overlap', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:30:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-15T16:00:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });

      const result = checkPitchConflict(newMatch, existingMatch);
      expect(result.hasConflict).toBe(true);
    });

    it('should not detect conflict - different pitches', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-2',
        endTime: '2024-01-15T15:30:00.000Z',
      });

      const result = checkPitchConflict(newMatch, existingMatch);
      expect(result.hasConflict).toBe(false);
    });

    it('should not detect conflict - same pitch, different times', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T16:00:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-15T17:30:00.000Z',
      });

      const result = checkPitchConflict(newMatch, existingMatch);
      expect(result.hasConflict).toBe(false);
    });

    it('should not detect conflict - same match (self-exclusion)', () => {
      const match = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });

      const result = checkPitchConflict(match, match);
      expect(result.hasConflict).toBe(false);
    });

    it('should not detect conflict - missing pitchId', () => {
      const newMatch: MatchTimeSlot = {
        id: 'match-1',
        startTime: '2024-01-15T14:00:00.000Z',
        endTime: '2024-01-15T15:30:00.000Z',
        // pitchId is undefined
      };
      const existingMatch = createMatch('match-2', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
      });

      const result = checkPitchConflict(newMatch, existingMatch);
      expect(result.hasConflict).toBe(false);
    });

    it('should calculate endTime if not provided', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        matchDuration: 90,
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:30:00.000Z', {
        pitchId: 'pitch-1',
        matchDuration: 90,
      });

      const result = checkPitchConflict(newMatch, existingMatch, 90);
      expect(result.hasConflict).toBe(true);
    });
  });

  describe('checkTeamDoubleBooking', () => {
    it('should detect conflict - same home team, overlapping times', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:30:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-3',
        endTime: '2024-01-15T16:00:00.000Z',
      });

      const result = checkTeamDoubleBooking(newMatch, existingMatch);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('team');
    });

    it('should detect conflict - same away team, overlapping times', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:30:00.000Z', {
        homeTeamId: 'team-3',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T16:00:00.000Z',
      });

      const result = checkTeamDoubleBooking(newMatch, existingMatch);
      expect(result.hasConflict).toBe(true);
    });

    it('should detect conflict - home team vs away team overlap', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:30:00.000Z', {
        homeTeamId: 'team-2',
        awayTeamId: 'team-3',
        endTime: '2024-01-15T16:00:00.000Z',
      });

      const result = checkTeamDoubleBooking(newMatch, existingMatch);
      expect(result.hasConflict).toBe(true);
    });

    it('should not detect conflict - different teams, same time', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:00:00.000Z', {
        homeTeamId: 'team-3',
        awayTeamId: 'team-4',
        endTime: '2024-01-15T15:30:00.000Z',
      });

      const result = checkTeamDoubleBooking(newMatch, existingMatch);
      expect(result.hasConflict).toBe(false);
    });

    it('should not detect conflict - same teams, different times', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T16:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T17:30:00.000Z',
      });

      const result = checkTeamDoubleBooking(newMatch, existingMatch);
      expect(result.hasConflict).toBe(false);
    });

    it('should not detect conflict - same team but no time overlap', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T16:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-3',
        endTime: '2024-01-15T17:30:00.000Z',
      });

      const result = checkTeamDoubleBooking(newMatch, existingMatch);
      expect(result.hasConflict).toBe(false);
    });

    it('should not detect conflict - same match (self-exclusion)', () => {
      const match = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
      });

      const result = checkTeamDoubleBooking(match, match);
      expect(result.hasConflict).toBe(false);
    });

    it('should not detect conflict - missing team IDs', () => {
      const newMatch: MatchTimeSlot = {
        id: 'match-1',
        startTime: '2024-01-15T14:00:00.000Z',
      };
      const existingMatch = createMatch('match-2', '2024-01-15T14:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
      });

      const result = checkTeamDoubleBooking(newMatch, existingMatch);
      expect(result.hasConflict).toBe(false);
    });

    it('should handle different match durations correctly', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        matchDuration: 60,
      });
      const existingMatch = createMatch('match-2', '2024-01-15T15:00:00.000Z', {
        homeTeamId: 'team-1',
        awayTeamId: 'team-3',
        matchDuration: 90,
      });

      // New match ends at 15:00, existing starts at 15:00 - no overlap
      const result1 = checkTeamDoubleBooking(newMatch, existingMatch, 60);
      expect(result1.hasConflict).toBe(false);

      // But if new match is 90 minutes, it ends at 15:30, overlapping with existing
      const result2 = checkTeamDoubleBooking(newMatch, existingMatch, 90);
      expect(result2.hasConflict).toBe(true);
    });
  });

  describe('checkMatchConflicts', () => {
    it('should detect pitch conflict first', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:30:00.000Z', {
        pitchId: 'pitch-1',
        homeTeamId: 'team-3',
        awayTeamId: 'team-4',
        endTime: '2024-01-15T16:00:00.000Z',
      });

      const result = checkMatchConflicts(newMatch, [existingMatch]);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('pitch');
    });

    it('should detect team conflict when no pitch conflict', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:30:00.000Z', {
        pitchId: 'pitch-2', // Different pitch
        homeTeamId: 'team-1', // Same team
        awayTeamId: 'team-3',
        endTime: '2024-01-15T16:00:00.000Z',
      });

      const result = checkMatchConflicts(newMatch, [existingMatch]);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('team');
    });

    it('should return no conflict when no conflicts exist', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T16:00:00.000Z', {
        pitchId: 'pitch-2',
        homeTeamId: 'team-3',
        awayTeamId: 'team-4',
        endTime: '2024-01-15T17:30:00.000Z',
      });

      const result = checkMatchConflicts(newMatch, [existingMatch]);
      expect(result.hasConflict).toBe(false);
    });

    it('should check against multiple existing matches', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existing1 = createMatch('match-2', '2024-01-15T16:00:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-15T17:30:00.000Z',
      });
      const existing2 = createMatch('match-3', '2024-01-15T14:30:00.000Z', {
        pitchId: 'pitch-1', // Same pitch, overlapping time
        endTime: '2024-01-15T16:00:00.000Z',
      });

      const result = checkMatchConflicts(newMatch, [existing1, existing2]);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictingMatchId).toBe('match-3');
    });
  });

  describe('findAllMatchConflicts', () => {
    it('should find all conflicts, not just the first', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existing1 = createMatch('match-2', '2024-01-15T14:30:00.000Z', {
        pitchId: 'pitch-1', // Pitch conflict
        homeTeamId: 'team-3', // Different teams
        awayTeamId: 'team-4',
        endTime: '2024-01-15T16:00:00.000Z',
      });
      const existing2 = createMatch('match-3', '2024-01-15T14:30:00.000Z', {
        pitchId: 'pitch-2', // Different pitch
        homeTeamId: 'team-1', // Team conflict (same home team)
        awayTeamId: 'team-3',
        endTime: '2024-01-15T16:00:00.000Z',
      });

      const conflicts = findAllMatchConflicts(newMatch, [existing1, existing2]);
      // Should find: pitch conflict with existing1, team conflict with existing2
      // Note: existing1 might also have team conflict if teams overlap, but we check pitch first
      expect(conflicts.length).toBeGreaterThanOrEqual(2);
      // First conflict should be pitch conflict
      const pitchConflicts = conflicts.filter(c => c.conflictType === 'pitch');
      const teamConflicts = conflicts.filter(c => c.conflictType === 'team');
      expect(pitchConflicts.length).toBeGreaterThanOrEqual(1);
      expect(teamConflicts.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when no conflicts', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T16:00:00.000Z', {
        pitchId: 'pitch-2',
        endTime: '2024-01-15T17:30:00.000Z',
      });

      const conflicts = findAllMatchConflicts(newMatch, [existingMatch]);
      expect(conflicts.length).toBe(0);
    });
  });

  describe('Cross-Division/Group Conflict Detection', () => {
    it('should detect conflict - different divisions, same pitch, overlapping times', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        divisionId: 'division-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:30:00.000Z', {
        pitchId: 'pitch-1',
        divisionId: 'division-2', // Different division
        endTime: '2024-01-15T16:00:00.000Z',
      });

      const result = checkPitchConflict(newMatch, existingMatch);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictType).toBe('pitch');
    });

    it('should detect conflict - different groups, same pitch, overlapping times', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        divisionId: 'division-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        divisionId: 'division-1', // Same division
        endTime: '2024-01-15T15:30:00.000Z',
      });

      // Note: groupId is not in MatchTimeSlot interface, but divisionId is
      // The conflict should still be detected regardless of group
      const result = checkPitchConflict(newMatch, existingMatch);
      expect(result.hasConflict).toBe(true);
    });

    it('should detect conflict - same division, different groups, same pitch, overlapping times', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        divisionId: 'division-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:30:00.000Z', {
        pitchId: 'pitch-1',
        divisionId: 'division-1', // Same division, but could be different group
        endTime: '2024-01-15T16:00:00.000Z',
      });

      const result = checkPitchConflict(newMatch, existingMatch);
      expect(result.hasConflict).toBe(true);
    });

    it('should not allow matches from different divisions on same pitch at same time', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        divisionId: 'division-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        divisionId: 'division-2', // Different division
        endTime: '2024-01-15T15:30:00.000Z', // Exact same time
      });

      const result = checkPitchConflict(newMatch, existingMatch);
      expect(result.hasConflict).toBe(true);
    });

    it('should allow matches from different divisions on different pitches at same time', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        divisionId: 'division-1',
        endTime: '2024-01-15T15:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-2', // Different pitch
        divisionId: 'division-2', // Different division
        endTime: '2024-01-15T15:30:00.000Z',
      });

      const result = checkPitchConflict(newMatch, existingMatch);
      expect(result.hasConflict).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle matches crossing midnight', () => {
      const newMatch = createMatch('match-1', '2024-01-15T23:00:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-16T00:30:00.000Z',
      });
      const existingMatch = createMatch('match-2', '2024-01-15T23:30:00.000Z', {
        pitchId: 'pitch-1',
        endTime: '2024-01-16T01:00:00.000Z',
      });

      const result = checkPitchConflict(newMatch, existingMatch);
      expect(result.hasConflict).toBe(true);
    });

    it('should handle very short matches', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        matchDuration: 15,
      });
      const existingMatch = createMatch('match-2', '2024-01-15T14:10:00.000Z', {
        pitchId: 'pitch-1',
        matchDuration: 15,
      });

      const result = checkPitchConflict(newMatch, existingMatch, 15);
      expect(result.hasConflict).toBe(true);
    });

    it('should handle very long matches', () => {
      const newMatch = createMatch('match-1', '2024-01-15T14:00:00.000Z', {
        pitchId: 'pitch-1',
        matchDuration: 180, // 3 hours
      });
      const existingMatch = createMatch('match-2', '2024-01-15T16:00:00.000Z', {
        pitchId: 'pitch-1',
        matchDuration: 90,
      });

      const result = checkPitchConflict(newMatch, existingMatch, 180);
      expect(result.hasConflict).toBe(true);
    });
  });
});

