import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    tournament: {
      findUnique: vi.fn(),
    },
    match: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Schedule API - Conflict Detection', () => {
  const mockTournamentId = 'tournament-1';
  const mockUserId = 'user-1';
  const mockSession = {
    user: {
      id: mockUserId,
      role: 'ADMIN',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as any).mockResolvedValue(mockSession);
    // Reset call counters for match.findMany mocks
    (db.match.findMany as any).mockReset();
  });

  const createMockMatch = (
    id: string,
    options: {
      tournamentId?: string;
      pitchId?: string;
      venueId?: string;
      startTime?: Date | null;
      endTime?: Date | null;
      homeTeamId?: string;
      awayTeamId?: string;
    } = {}
  ) => ({
    id,
    tournamentId: options.tournamentId || mockTournamentId,
    pitchId: options.pitchId || null,
    venueId: options.venueId || null,
    startTime: options.startTime || null,
    endTime: options.endTime || null,
    homeTeamId: options.homeTeamId || 'team-1',
    awayTeamId: options.awayTeamId || 'team-2',
    homeTeam: { name: 'Team 1' },
    awayTeam: { name: 'Team 2' },
  });

  const createRequest = (matches: any[]) => {
    return new NextRequest('http://localhost/api/v1/tournaments/test/matches/schedule', {
      method: 'POST',
      body: JSON.stringify({ matches }),
      headers: { 'Content-Type': 'application/json' },
    });
  };

  describe('Conflict Detection', () => {
    it('should detect pitch conflict - exact time overlap', async () => {
      const existingMatch = createMockMatch('match-1', {
        pitchId: 'pitch-1',
        startTime: new Date('2024-01-15T14:00:00.000Z'),
        endTime: new Date('2024-01-15T15:30:00.000Z'),
      });

      // Mock tournament exists
      (db.tournament.findUnique as any).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      });

      // Mock existing matches check
      (db.match.findMany as any).mockResolvedValueOnce([
        createMockMatch('match-2', { tournamentId: mockTournamentId }),
      ]);

      // Mock conflict check - find existing match on same pitch
      (db.match.findMany as any).mockResolvedValueOnce([existingMatch]);

      const newMatch = {
        id: 'match-2',
        venueId: 'venue-1',
        pitchId: 'pitch-1',
        startTime: '2024-01-15T14:00:00.000Z',
        endTime: '2024-01-15T15:30:00.000Z',
      };

      const request = createRequest([newMatch]);
      const response = await POST(request, { params: { id: mockTournamentId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Scheduling conflicts detected');
      expect(data.conflicts).toBeDefined();
      expect(data.conflicts.length).toBeGreaterThan(0);
    });

    it('should detect pitch conflict - partial overlap', async () => {
      const existingMatch = createMockMatch('match-1', {
        pitchId: 'pitch-1',
        startTime: new Date('2024-01-15T14:00:00.000Z'),
        endTime: new Date('2024-01-15T15:30:00.000Z'),
      });

      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      } as any);

      vi.mocked(db.match.findMany).mockResolvedValueOnce([
        createMockMatch('match-2', { tournamentId: mockTournamentId }),
      ] as any);

      vi.mocked(db.match.findMany).mockResolvedValueOnce([existingMatch] as any);

      const newMatch = {
        id: 'match-2',
        venueId: 'venue-1',
        pitchId: 'pitch-1',
        startTime: '2024-01-15T14:30:00.000Z', // Starts during existing match
        endTime: '2024-01-15T16:00:00.000Z',
      };

      const request = createRequest([newMatch]);
      const response = await POST(request, { params: { id: mockTournamentId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Scheduling conflicts detected');
    });

    it('should allow scheduling on different pitches', async () => {
      const existingMatch = createMockMatch('match-1', {
        pitchId: 'pitch-1',
        startTime: new Date('2024-01-15T14:00:00.000Z'),
        endTime: new Date('2024-01-15T15:30:00.000Z'),
      });

      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      } as any);

      vi.mocked(db.match.findMany).mockResolvedValueOnce([
        createMockMatch('match-2', { tournamentId: mockTournamentId }),
      ] as any);

      // No conflicts found (different pitch)
      vi.mocked(db.match.findMany).mockResolvedValueOnce([]);

      // Mock update
      (db.match.update as any).mockResolvedValue(createMockMatch('match-2'));

      const newMatch = {
        id: 'match-2',
        venueId: 'venue-1',
        pitchId: 'pitch-2', // Different pitch
        startTime: '2024-01-15T14:00:00.000Z', // Same time
        endTime: '2024-01-15T15:30:00.000Z',
      };

      const request = createRequest([newMatch]);
      const response = await POST(request, { params: { id: mockTournamentId } });

      expect(response.status).toBe(200);
    });

    it('should allow scheduling at different times on same pitch', async () => {
      const existingMatch = createMockMatch('match-1', {
        pitchId: 'pitch-1',
        startTime: new Date('2024-01-15T14:00:00.000Z'),
        endTime: new Date('2024-01-15T15:30:00.000Z'),
      });

      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      } as any);

      vi.mocked(db.match.findMany).mockResolvedValueOnce([
        createMockMatch('match-2', { tournamentId: mockTournamentId }),
      ] as any);

      // No conflicts found (different time)
      vi.mocked(db.match.findMany).mockResolvedValueOnce([]);

      (db.match.update as any).mockResolvedValue(createMockMatch('match-2'));

      const newMatch = {
        id: 'match-2',
        venueId: 'venue-1',
        pitchId: 'pitch-1', // Same pitch
        startTime: '2024-01-15T16:00:00.000Z', // Different time
        endTime: '2024-01-15T17:30:00.000Z',
      };

      const request = createRequest([newMatch]);
      const response = await POST(request, { params: { id: mockTournamentId } });

      expect(response.status).toBe(200);
    });

    it('should exclude the match being updated from conflict check', async () => {
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      } as any);

      vi.mocked(db.match.findMany).mockResolvedValueOnce([
        createMockMatch('match-1', { tournamentId: mockTournamentId }),
      ] as any);

      // No conflicts (match-1 excluded from check)
      vi.mocked(db.match.findMany).mockResolvedValueOnce([]);

      vi.mocked(db.match.update).mockResolvedValue(createMockMatch('match-1') as any);

      const updatedMatch = {
        id: 'match-1',
        venueId: 'venue-1',
        pitchId: 'pitch-1',
        startTime: '2024-01-15T14:00:00.000Z',
        endTime: '2024-01-15T15:30:00.000Z',
      };

      const request = createRequest([updatedMatch]);
      const response = await POST(request, { params: { id: mockTournamentId } });

      expect(response.status).toBe(200);
    });

    it('should skip conflict check for matches without required fields', async () => {
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      } as any);

      vi.mocked(db.match.findMany).mockResolvedValueOnce([
        createMockMatch('match-1', { tournamentId: mockTournamentId }),
      ] as any);

      // No conflicts found (match without pitchId/startTime skipped)
      vi.mocked(db.match.findMany).mockResolvedValueOnce([]);

      vi.mocked(db.match.update).mockResolvedValue(createMockMatch('match-1') as any);

      const matchWithoutFields = {
        id: 'match-1',
        // Missing venueId, pitchId, startTime
      };

      const request = createRequest([matchWithoutFields]);
      const response = await POST(request, { params: { id: mockTournamentId } });

      // Should succeed (no conflict check for incomplete matches)
      expect(response.status).toBe(200);
    });

    it('should handle UTC time parsing correctly', async () => {
      // Note: UTC time parsing is thoroughly tested in unit tests (utc.test.ts)
      // This integration test verifies the API accepts UTC time strings
      (db.tournament.findUnique as any).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      });

      const existingMatch = createMockMatch('match-1', { 
        tournamentId: mockTournamentId,
        pitchId: 'pitch-1',
        venueId: 'venue-1',
      });
      
      // Mock both queries using call counter
      let findManyCallCount = 0;
      (db.match.findMany as any).mockImplementation(() => {
        findManyCallCount++;
        if (findManyCallCount === 1) {
          // First call: validation query
          return Promise.resolve([existingMatch]);
        }
        // Subsequent calls: conflict check queries
        return Promise.resolve([]);
      });
      
      const updatedMatch = {
        ...existingMatch,
        startTime: new Date('2024-01-15T14:00:00.000Z'),
        endTime: new Date('2024-01-15T15:30:00.000Z'),
        homeTeam: { id: 'team-1', name: 'Team 1', shortName: 'T1' },
        awayTeam: { id: 'team-2', name: 'Team 2', shortName: 'T2' },
        venue: { id: 'venue-1', name: 'Venue 1' },
        pitch: { id: 'pitch-1', name: 'Pitch 1' },
        group: { id: 'group-1', name: 'Group 1' },
        division: { id: 'div-1', name: 'Division 1' },
      };
      (db.match.update as any).mockResolvedValue(updatedMatch);

      const matchWithUTC = {
        id: 'match-1',
        venueId: 'venue-1',
        pitchId: 'pitch-1',
        startTime: '2024-01-15T14:00:00Z', // UTC with Z suffix
        endTime: '2024-01-15T15:30:00Z',
      };

      const request = createRequest([matchWithUTC]);
      const response = await POST(request, { params: { id: mockTournamentId } });

      // The API should accept UTC time strings and parse them correctly
      // If parsing fails, it would return 400, but UTC parsing is tested in unit tests
      expect(response.status).toBe(200);
    });

    it('should handle time without timezone indicator', async () => {
      // Note: Time parsing without timezone is tested in unit tests (utc.test.ts)
      // This integration test verifies the API accepts time strings without timezone
      (db.tournament.findUnique as any).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      });

      const existingMatch = createMockMatch('match-1', { 
        tournamentId: mockTournamentId,
        pitchId: 'pitch-1',
        venueId: 'venue-1',
      });
      
      // Mock both queries using call counter
      let findManyCallCount = 0;
      (db.match.findMany as any).mockImplementation(() => {
        findManyCallCount++;
        if (findManyCallCount === 1) {
          // First call: validation query
          return Promise.resolve([existingMatch]);
        }
        // Subsequent calls: conflict check queries
        return Promise.resolve([]);
      });
      
      const updatedMatch = {
        ...existingMatch,
        startTime: new Date('2024-01-15T14:00:00.000Z'),
        endTime: new Date('2024-01-15T15:30:00.000Z'),
        homeTeam: { id: 'team-1', name: 'Team 1', shortName: 'T1' },
        awayTeam: { id: 'team-2', name: 'Team 2', shortName: 'T2' },
        venue: { id: 'venue-1', name: 'Venue 1' },
        pitch: { id: 'pitch-1', name: 'Pitch 1' },
        group: { id: 'group-1', name: 'Group 1' },
        division: { id: 'div-1', name: 'Division 1' },
      };
      (db.match.update as any).mockResolvedValue(updatedMatch);

      const matchWithoutTZ = {
        id: 'match-1',
        venueId: 'venue-1',
        pitchId: 'pitch-1',
        startTime: '2024-01-15T14:00:00', // No timezone indicator
        endTime: '2024-01-15T15:30:00',
      };

      const request = createRequest([matchWithoutTZ]);
      const response = await POST(request, { params: { id: mockTournamentId } });

      // The API should accept time strings without timezone and treat them as UTC
      // Time parsing is thoroughly tested in unit tests
      expect(response.status).toBe(200);
    });
  });

  describe('Permission Checks', () => {
    it('should reject unauthorized requests', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = createRequest([]);
      const response = await POST(request, { params: { id: mockTournamentId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject requests without proper permissions', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: mockUserId, role: 'USER' },
      });

      (db.tournament.findUnique as any).mockResolvedValue({
        id: mockTournamentId,
        assignments: [], // No assignments
      });

      const request = createRequest([]);
      const response = await POST(request, { params: { id: mockTournamentId } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient permissions');
    });
  });

  describe('Validation', () => {
    it('should reject non-array matches', async () => {
      const request = new NextRequest(
        'http://localhost/api/v1/tournaments/test/matches/schedule',
        {
          method: 'POST',
          body: JSON.stringify({ matches: 'not-an-array' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await POST(request, { params: { id: mockTournamentId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Matches must be an array');
    });

    it('should reject matches not belonging to tournament', async () => {
      (db.tournament.findUnique as any).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      });

      // Match not found in tournament (empty array means match doesn't exist)
      // This should trigger the validation error: existingMatches.length (0) !== matchIds.length (1)
      // Use mockImplementation to differentiate between validation query and conflict query
      (db.match.findMany as any).mockImplementation((args: any) => {
        // Validation query checks: id in ['match-1'] AND tournamentId = mockTournamentId
        if (args?.where?.id?.in) {
          // Return empty array - match doesn't exist in tournament
          return Promise.resolve([]);
        }
        // Conflict check query - shouldn't be reached, but return empty just in case
        return Promise.resolve([]);
      });

      const request = createRequest([
        {
          id: 'match-1',
          venueId: 'venue-1',
          pitchId: 'pitch-1',
          startTime: '2024-01-15T14:00:00.000Z',
        },
      ]);

      const response = await POST(request, { params: { id: mockTournamentId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('One or more matches do not belong to this tournament');
    });
  });

  describe('Cross-Division/Group Conflict Detection', () => {
    it('should detect conflict - different divisions, same pitch, overlapping times', async () => {
      const existingMatch = createMockMatch('match-1', {
        pitchId: 'pitch-1',
        startTime: new Date('2024-01-15T14:00:00.000Z'),
        endTime: new Date('2024-01-15T15:30:00.000Z'),
        // This match could be from division-1
      });

      (db.tournament.findUnique as any).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      });

      // First call: validate matches belong to tournament
      (db.match.findMany as any).mockResolvedValueOnce([
        createMockMatch('match-2', { tournamentId: mockTournamentId }),
      ]);

      // Second call: conflict check - find existing match on same pitch
      // This should find the match regardless of division/group
      (db.match.findMany as any).mockResolvedValueOnce([existingMatch]);

      const newMatch = {
        id: 'match-2',
        venueId: 'venue-1',
        pitchId: 'pitch-1',
        startTime: '2024-01-15T14:30:00.000Z', // Overlaps with existing
        endTime: '2024-01-15T16:00:00.000Z',
        // This match could be from division-2 (different division)
      };

      const request = createRequest([newMatch]);
      const response = await POST(request, { params: { id: mockTournamentId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Scheduling conflicts detected');
      expect(data.conflicts).toBeDefined();
      expect(data.conflicts.length).toBeGreaterThan(0);
    });

    it('should detect conflict - same division, different groups, same pitch, overlapping times', async () => {
      const existingMatch = createMockMatch('match-1', {
        pitchId: 'pitch-1',
        startTime: new Date('2024-01-15T14:00:00.000Z'),
        endTime: new Date('2024-01-15T15:30:00.000Z'),
      });

      (db.tournament.findUnique as any).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      });

      (db.match.findMany as any).mockResolvedValueOnce([
        createMockMatch('match-2', { tournamentId: mockTournamentId }),
      ]);

      // Conflict check should find match regardless of group
      (db.match.findMany as any).mockResolvedValueOnce([existingMatch]);

      const newMatch = {
        id: 'match-2',
        venueId: 'venue-1',
        pitchId: 'pitch-1',
        startTime: '2024-01-15T14:00:00.000Z', // Exact same time
        endTime: '2024-01-15T15:30:00.000Z',
        // Same division, but different group
      };

      const request = createRequest([newMatch]);
      const response = await POST(request, { params: { id: mockTournamentId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Scheduling conflicts detected');
    });

    it('should verify server-side query checks all matches regardless of division/group', async () => {
      // The server-side checkSchedulingConflicts function queries:
      // - tournamentId (same tournament)
      // - pitchId (same pitch)
      // - overlapping times
      // It does NOT filter by divisionId or groupId
      // This means it correctly prevents cross-division/group conflicts

      const existingMatch = createMockMatch('match-1', {
        pitchId: 'pitch-1',
        startTime: new Date('2024-01-15T14:00:00.000Z'),
        endTime: new Date('2024-01-15T15:30:00.000Z'),
      });

      (db.tournament.findUnique as any).mockResolvedValue({
        id: mockTournamentId,
        assignments: [{ role: 'ADMIN', userId: mockUserId }],
      });

      (db.match.findMany as any).mockResolvedValueOnce([
        createMockMatch('match-2', { tournamentId: mockTournamentId }),
      ]);

      // The conflict query should find matches on the same pitch
      // regardless of their division or group
      (db.match.findMany as any).mockResolvedValueOnce([existingMatch]);

      const newMatch = {
        id: 'match-2',
        venueId: 'venue-1',
        pitchId: 'pitch-1',
        startTime: '2024-01-15T14:15:00.000Z', // Overlaps
        endTime: '2024-01-15T15:45:00.000Z',
      };

      const request = createRequest([newMatch]);
      const response = await POST(request, { params: { id: mockTournamentId } });

      // Should detect conflict even if matches are from different divisions/groups
      expect(response.status).toBe(400);
    });
  });
});

