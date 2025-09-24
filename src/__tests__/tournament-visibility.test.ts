import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTournamentVisibility,
  filterTournamentData,
} from '@/lib/tournament/visibility';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    tournament: {
      findUnique: vi.fn(),
    },
    tournamentAssignment: {
      findFirst: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';

describe('Tournament Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTournamentVisibility', () => {
    it('should allow full access for tournament creators', async () => {
      const mockTournament = {
        id: 'tournament-1',
        status: 'DRAFT',
        infoPublished: false,
        teamsPublished: false,
        schedulePublished: false,
        createdById: 'user-1',
      };

      vi.mocked(db.tournament.findUnique).mockResolvedValue(mockTournament);

      const visibility = await getTournamentVisibility({
        userId: 'user-1',
        userRole: 'TEAM_MANAGER',
        tournamentId: 'tournament-1',
      });

      expect(visibility).toEqual({
        canViewTournament: true,
        canViewInfo: true,
        canViewTeams: true,
        canViewSchedule: true,
        canViewMatches: true,
        canViewStandings: true,
        canViewBrackets: true,
      });
    });

    it('should allow full access for admins', async () => {
      const mockTournament = {
        id: 'tournament-1',
        status: 'DRAFT',
        infoPublished: false,
        teamsPublished: false,
        schedulePublished: false,
        createdById: 'user-2',
      };

      vi.mocked(db.tournament.findUnique).mockResolvedValue(mockTournament);

      const visibility = await getTournamentVisibility({
        userId: 'user-1',
        userRole: 'ADMIN',
        tournamentId: 'tournament-1',
      });

      expect(visibility).toEqual({
        canViewTournament: true,
        canViewInfo: true,
        canViewTeams: true,
        canViewSchedule: true,
        canViewMatches: true,
        canViewStandings: true,
        canViewBrackets: true,
      });
    });

    it('should deny access for unpublished tournaments (public users)', async () => {
      const mockTournament = {
        id: 'tournament-1',
        status: 'DRAFT',
        infoPublished: false,
        teamsPublished: false,
        schedulePublished: false,
        createdById: 'user-2',
      };

      vi.mocked(db.tournament.findUnique).mockResolvedValue(mockTournament);
      vi.mocked(db.tournamentAssignment.findFirst).mockResolvedValue(null);

      const visibility = await getTournamentVisibility({
        userId: 'user-1',
        userRole: 'TEAM_MANAGER',
        tournamentId: 'tournament-1',
      });

      expect(visibility).toEqual({
        canViewTournament: false,
        canViewInfo: false,
        canViewTeams: false,
        canViewSchedule: false,
        canViewMatches: false,
        canViewStandings: false,
        canViewBrackets: false,
      });
    });

    it('should allow partial access for published tournaments with limited publication', async () => {
      const mockTournament = {
        id: 'tournament-1',
        status: 'PUBLISHED',
        infoPublished: true,
        teamsPublished: true,
        schedulePublished: false,
        createdById: 'user-2',
      };

      vi.mocked(db.tournament.findUnique).mockResolvedValue(mockTournament);
      vi.mocked(db.tournamentAssignment.findFirst).mockResolvedValue(null);

      const visibility = await getTournamentVisibility({
        userId: 'user-1',
        userRole: 'TEAM_MANAGER',
        tournamentId: 'tournament-1',
      });

      expect(visibility).toEqual({
        canViewTournament: true,
        canViewInfo: true,
        canViewTeams: true,
        canViewSchedule: false,
        canViewMatches: false,
        canViewStandings: true,
        canViewBrackets: false,
      });
    });

    it('should allow full access for published tournaments with all content published', async () => {
      const mockTournament = {
        id: 'tournament-1',
        status: 'PUBLISHED',
        infoPublished: true,
        teamsPublished: true,
        schedulePublished: true,
        createdById: 'user-2',
      };

      vi.mocked(db.tournament.findUnique).mockResolvedValue(mockTournament);
      vi.mocked(db.tournamentAssignment.findFirst).mockResolvedValue(null);

      const visibility = await getTournamentVisibility({
        userId: 'user-1',
        userRole: 'TEAM_MANAGER',
        tournamentId: 'tournament-1',
      });

      expect(visibility).toEqual({
        canViewTournament: true,
        canViewInfo: true,
        canViewTeams: true,
        canViewSchedule: true,
        canViewMatches: true,
        canViewStandings: true,
        canViewBrackets: true,
      });
    });

    it('should return false for all permissions when tournament is not found', async () => {
      vi.mocked(db.tournament.findUnique).mockResolvedValue(null);

      const visibility = await getTournamentVisibility({
        userId: 'user-1',
        userRole: 'ADMIN',
        tournamentId: 'non-existent',
      });

      expect(visibility).toEqual({
        canViewTournament: false,
        canViewInfo: false,
        canViewTeams: false,
        canViewSchedule: false,
        canViewMatches: false,
        canViewStandings: false,
        canViewBrackets: false,
      });
    });

    it('should allow basic tournament info when info is published but teams/schedule are not', async () => {
      const mockTournament = {
        id: 'tournament-1',
        status: 'PUBLISHED',
        infoPublished: true,
        teamsPublished: false,
        schedulePublished: false,
        createdById: 'user-2',
      };

      vi.mocked(db.tournament.findUnique).mockResolvedValue(mockTournament);
      vi.mocked(db.tournamentAssignment.findFirst).mockResolvedValue(null);

      const visibility = await getTournamentVisibility({
        userId: 'user-1',
        userRole: 'TEAM_MANAGER',
        tournamentId: 'tournament-1',
      });

      expect(visibility).toEqual({
        canViewTournament: true,
        canViewInfo: true,
        canViewTeams: false,
        canViewSchedule: false,
        canViewMatches: false,
        canViewStandings: false,
        canViewBrackets: false,
      });
    });
  });

  describe('filterTournamentData', () => {
    it('should filter basic info when info is not visible', () => {
      const tournament = {
        id: 'tournament-1',
        name: 'Test Tournament',
        description: 'Tournament description',
        city: 'Test City',
        address: 'Test Address',
        contactEmail: 'test@example.com',
        contactPhone: '+1234567890',
        logo: 'logo-url',
        heroImage: 'hero-url',
        registrationDeadline: '2024-01-01',
        maxTeams: 16,
        autoAcceptTeams: true,
        allowWaitlist: false,
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        status: 'PUBLISHED',
      };

      const visibility = {
        canViewTournament: true,
        canViewInfo: false,
        canViewTeams: true,
        canViewSchedule: true,
        canViewMatches: true,
        canViewStandings: true,
        canViewBrackets: true,
      };

      const filtered = filterTournamentData(tournament, visibility);

      expect(filtered.id).toBe('tournament-1');
      expect(filtered.name).toBe('Test Tournament');
      expect(filtered.status).toBe('PUBLISHED');
      expect(filtered.startDate).toBe('2024-01-01');
      expect(filtered.endDate).toBe('2024-01-02');
      expect(filtered.description).toBeUndefined();
      expect(filtered.city).toBeUndefined();
      expect(filtered.address).toBeUndefined();
      expect(filtered.contactEmail).toBeUndefined();
      expect(filtered.contactPhone).toBeUndefined();
      expect(filtered.logo).toBeUndefined();
      expect(filtered.heroImage).toBeUndefined();
      expect(filtered.registrationDeadline).toBeUndefined();
      expect(filtered.maxTeams).toBeUndefined();
      expect(filtered.autoAcceptTeams).toBeUndefined();
      expect(filtered.allowWaitlist).toBeUndefined();
    });

    it('should filter teams when teams are not visible', () => {
      const tournament = {
        id: 'tournament-1',
        name: 'Test Tournament',
        teams: [
          { id: 'team-1', name: 'Team 1' },
          { id: 'team-2', name: 'Team 2' },
        ],
        divisions: [
          {
            id: 'div-1',
            name: 'Division 1',
            groups: [
              {
                id: 'group-1',
                name: 'Group 1',
                teams: [{ id: 'team-1', name: 'Team 1' }],
              },
            ],
          },
        ],
      };

      const visibility = {
        canViewTournament: true,
        canViewInfo: true,
        canViewTeams: false,
        canViewSchedule: true,
        canViewMatches: true,
        canViewStandings: true,
        canViewBrackets: true,
      };

      const filtered = filterTournamentData(tournament, visibility);

      expect(filtered.teams).toEqual([]);
      expect(filtered.divisions[0].groups[0].teams).toEqual([]);
    });

    it('should filter matches when schedule is not visible', () => {
      const tournament = {
        id: 'tournament-1',
        name: 'Test Tournament',
        matches: [{ id: 'match-1', homeTeam: 'Team 1', awayTeam: 'Team 2' }],
        divisions: [
          {
            id: 'div-1',
            name: 'Division 1',
            groups: [
              {
                id: 'group-1',
                name: 'Group 1',
                matches: [
                  { id: 'match-1', homeTeam: 'Team 1', awayTeam: 'Team 2' },
                ],
              },
            ],
          },
        ],
      };

      const visibility = {
        canViewTournament: true,
        canViewInfo: true,
        canViewTeams: true,
        canViewSchedule: false,
        canViewMatches: false,
        canViewStandings: true,
        canViewBrackets: true,
      };

      const filtered = filterTournamentData(tournament, visibility);

      expect(filtered.matches).toEqual([]);
      expect(filtered.divisions[0].groups[0].matches).toEqual([]);
    });

    it('should filter standings when teams are not visible', () => {
      const tournament = {
        id: 'tournament-1',
        name: 'Test Tournament',
        divisions: [
          {
            id: 'div-1',
            name: 'Division 1',
            groups: [
              {
                id: 'group-1',
                name: 'Group 1',
                standings: [
                  { team: 'Team 1', points: 3 },
                  { team: 'Team 2', points: 1 },
                ],
              },
            ],
          },
        ],
      };

      const visibility = {
        canViewTournament: true,
        canViewInfo: true,
        canViewTeams: false,
        canViewSchedule: true,
        canViewMatches: true,
        canViewStandings: false,
        canViewBrackets: true,
      };

      const filtered = filterTournamentData(tournament, visibility);

      expect(filtered.divisions[0].groups[0].standings).toEqual([]);
    });

    it('should return minimal data when tournament is not visible', () => {
      const tournament = {
        id: 'tournament-1',
        name: 'Test Tournament',
        teams: [{ id: 'team-1', name: 'Team 1' }],
        matches: [{ id: 'match-1' }],
      };

      const visibility = {
        canViewTournament: false,
        canViewInfo: false,
        canViewTeams: false,
        canViewSchedule: false,
        canViewMatches: false,
        canViewStandings: false,
        canViewBrackets: false,
      };

      const filtered = filterTournamentData(tournament, visibility);

      expect(filtered).toEqual({
        id: 'tournament-1',
        name: 'Test Tournament',
        status: 'HIDDEN',
      });
    });
  });
});
