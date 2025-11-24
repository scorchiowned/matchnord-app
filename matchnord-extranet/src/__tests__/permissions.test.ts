/**
 * Comprehensive tests for the new permission-based authorization system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionManager, RouteAccess } from '@/lib/permissions';
import { db } from '@/lib/db';
import { User, Tournament, TournamentAssignment } from '@prisma/client';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    tournament: {
      findUnique: vi.fn(),
    },
    tournamentAssignment: {
      findUnique: vi.fn(),
    },
    matchAssignment: {
      findUnique: vi.fn(),
    },
    match: {
      findUnique: vi.fn(),
    },
  },
}));

describe('PermissionManager', () => {
  const mockAdminUser: Partial<User> = {
    id: 'admin-1',
    role: 'ADMIN',
    email: 'admin@test.com',
  };

  const mockRegularUser: Partial<User> = {
    id: 'user-1',
    role: 'USER',
    email: 'user@test.com',
  };

  const mockTournament: Partial<Tournament> = {
    id: 'tournament-1',
    createdById: 'user-1',
    name: 'Test Tournament',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isTournamentOwner', () => {
    it('should return true if user is tournament owner', async () => {
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-1',
      } as Tournament);

      const result = await PermissionManager.isTournamentOwner(
        'user-1',
        'tournament-1'
      );
      expect(result).toBe(true);
    });

    it('should return false if user is not tournament owner', async () => {
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-2',
      } as Tournament);

      const result = await PermissionManager.isTournamentOwner(
        'user-1',
        'tournament-1'
      );
      expect(result).toBe(false);
    });
  });

  describe('getTournamentPermissions', () => {
    it('should return full permissions for ADMIN users', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockAdminUser as User
      );

      const permissions = await PermissionManager.getTournamentPermissions(
        'admin-1',
        'tournament-1'
      );

      expect(permissions.canConfigure).toBe(true);
      expect(permissions.canManageScores).toBe(true);
      expect(permissions.isReferee).toBe(true);
      expect(permissions.isOwner).toBe(false);
    });

    it('should return full permissions for tournament owner', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-1',
      } as Tournament);

      const permissions = await PermissionManager.getTournamentPermissions(
        'user-1',
        'tournament-1'
      );

      expect(permissions.canConfigure).toBe(true);
      expect(permissions.canManageScores).toBe(true);
      expect(permissions.isReferee).toBe(false);
      expect(permissions.isOwner).toBe(true);
    });

    it('should return permissions from assignment for assigned users', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-2', // Different owner
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue({
        userId: 'user-1',
        tournamentId: 'tournament-1',
        canConfigure: true,
        canManageScores: false,
        isReferee: false,
        isActive: true,
      } as TournamentAssignment);

      const permissions = await PermissionManager.getTournamentPermissions(
        'user-1',
        'tournament-1'
      );

      expect(permissions.canConfigure).toBe(true);
      expect(permissions.canManageScores).toBe(false);
      expect(permissions.isReferee).toBe(false);
      expect(permissions.isOwner).toBe(false);
    });

    it('should return no permissions for users without assignment', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-2',
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue(null);

      const permissions = await PermissionManager.getTournamentPermissions(
        'user-1',
        'tournament-1'
      );

      expect(permissions.canConfigure).toBe(false);
      expect(permissions.canManageScores).toBe(false);
      expect(permissions.isReferee).toBe(false);
      expect(permissions.isOwner).toBe(false);
    });
  });

  describe('canConfigureTournament', () => {
    it('should return true for ADMIN users', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockAdminUser as User
      );

      const result = await PermissionManager.canConfigureTournament(
        'admin-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return true for tournament owner', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-1',
      } as Tournament);

      const result = await PermissionManager.canConfigureTournament(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return true for users with canConfigure assignment', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-2',
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue({
        userId: 'user-1',
        tournamentId: 'tournament-1',
        canConfigure: true,
        canManageScores: false,
        isReferee: false,
        isActive: true,
      } as TournamentAssignment);

      const result = await PermissionManager.canConfigureTournament(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return false for users without canConfigure permission', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-2',
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue({
        userId: 'user-1',
        tournamentId: 'tournament-1',
        canConfigure: false,
        canManageScores: true, // Has score management but not configure
        isReferee: false,
        isActive: true,
      } as TournamentAssignment);

      const result = await PermissionManager.canConfigureTournament(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(false);
    });
  });

  describe('canManageScores', () => {
    it('should return true for ADMIN users', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockAdminUser as User
      );

      const result = await PermissionManager.canManageScores(
        'admin-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return true for tournament owner', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-1',
      } as Tournament);

      const result = await PermissionManager.canManageScores(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return true for users with canManageScores assignment', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-2',
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue({
        userId: 'user-1',
        tournamentId: 'tournament-1',
        canConfigure: false,
        canManageScores: true,
        isReferee: false,
        isActive: true,
      } as TournamentAssignment);

      const result = await PermissionManager.canManageScores(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return false for users without canManageScores permission', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-2',
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue({
        userId: 'user-1',
        tournamentId: 'tournament-1',
        canConfigure: true,
        canManageScores: false,
        isReferee: false,
        isActive: true,
      } as TournamentAssignment);

      const result = await PermissionManager.canManageScores(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(false);
    });
  });

  describe('canAccessTournament', () => {
    it('should return true for ADMIN users', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockAdminUser as User
      );

      const result = await PermissionManager.canAccessTournament(
        'admin-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return true if user has any permission', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-2',
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue({
        userId: 'user-1',
        tournamentId: 'tournament-1',
        canConfigure: false,
        canManageScores: false,
        isReferee: true, // Only referee permission
        isActive: true,
      } as TournamentAssignment);

      const result = await PermissionManager.canAccessTournament(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return false for users without any permissions', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-2',
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue(null);

      const result = await PermissionManager.canAccessTournament(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(false);
    });
  });

  describe('canUpdateMatchResults', () => {
    it('should return true for ADMIN users', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockAdminUser as User
      );

      const result = await PermissionManager.canUpdateMatchResults(
        'admin-1',
        'match-1'
      );

      expect(result).toBe(true);
    });

    it('should return true for users with match assignment', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.matchAssignment.findUnique).mockResolvedValue({
        userId: 'user-1',
        matchId: 'match-1',
        role: 'MAIN_REFEREE',
        isActive: true,
      } as any);

      const result = await PermissionManager.canUpdateMatchResults(
        'user-1',
        'match-1'
      );

      expect(result).toBe(true);
    });

    it('should return true for users with canManageScores permission', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.matchAssignment.findUnique).mockResolvedValue(null);
      vi.mocked(db.match.findUnique).mockResolvedValue({
        id: 'match-1',
        tournamentId: 'tournament-1',
      } as any);
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        ...mockTournament,
        createdById: 'user-2',
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue({
        userId: 'user-1',
        tournamentId: 'tournament-1',
        canConfigure: false,
        canManageScores: true,
        isReferee: false,
        isActive: true,
      } as TournamentAssignment);

      const result = await PermissionManager.canUpdateMatchResults(
        'user-1',
        'match-1'
      );

      expect(result).toBe(true);
    });
  });

  describe('canCreateTournament', () => {
    it('should return true for ADMIN users', () => {
      const result = PermissionManager.canCreateTournament(
        mockAdminUser as User
      );
      expect(result).toBe(true);
    });

    it('should return true for USER role', () => {
      const result = PermissionManager.canCreateTournament(
        mockRegularUser as User
      );
      expect(result).toBe(true);
    });
  });
});

describe('RouteAccess', () => {
  const mockAdminUser: Partial<User> = {
    id: 'admin-1',
    role: 'ADMIN',
  };

  const mockRegularUser: Partial<User> = {
    id: 'user-1',
    role: 'USER',
  };

  describe('canAccessAdmin', () => {
    it('should return true for ADMIN users', () => {
      const result = RouteAccess.canAccessAdmin(mockAdminUser as User);
      expect(result).toBe(true);
    });

    it('should return false for non-ADMIN users', () => {
      const result = RouteAccess.canAccessAdmin(mockRegularUser as User);
      expect(result).toBe(false);
    });
  });

  describe('canAccessTournamentManage', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return true for ADMIN users', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockAdminUser as User
      );

      const result = await RouteAccess.canAccessTournamentManage(
        'admin-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return true for tournament owner', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        id: 'tournament-1',
        createdById: 'user-1',
      } as Tournament);

      const result = await RouteAccess.canAccessTournamentManage(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return true for users with canConfigure permission', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        id: 'tournament-1',
        createdById: 'user-2',
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue({
        userId: 'user-1',
        tournamentId: 'tournament-1',
        canConfigure: true,
        canManageScores: false,
        isReferee: false,
        isActive: true,
      } as TournamentAssignment);

      const result = await RouteAccess.canAccessTournamentManage(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });
  });

  describe('canAccessTournamentManagePublic', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return true for ADMIN users', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockAdminUser as User
      );

      const result = await RouteAccess.canAccessTournamentManagePublic(
        'admin-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return true for tournament owner', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        id: 'tournament-1',
        createdById: 'user-1',
      } as Tournament);

      const result = await RouteAccess.canAccessTournamentManagePublic(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return true for users with canManageScores permission', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        id: 'tournament-1',
        createdById: 'user-2',
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue({
        userId: 'user-1',
        tournamentId: 'tournament-1',
        canConfigure: false,
        canManageScores: true,
        isReferee: false,
        isActive: true,
      } as TournamentAssignment);

      const result = await RouteAccess.canAccessTournamentManagePublic(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(true);
    });

    it('should return false for users without canManageScores permission', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(
        mockRegularUser as User
      );
      vi.mocked(db.tournament.findUnique).mockResolvedValue({
        id: 'tournament-1',
        createdById: 'user-2',
      } as Tournament);
      vi.mocked(db.tournamentAssignment.findUnique).mockResolvedValue({
        userId: 'user-1',
        tournamentId: 'tournament-1',
        canConfigure: true,
        canManageScores: false, // No score management permission
        isReferee: false,
        isActive: true,
      } as TournamentAssignment);

      const result = await RouteAccess.canAccessTournamentManagePublic(
        'user-1',
        'tournament-1'
      );

      expect(result).toBe(false);
    });
  });
});

