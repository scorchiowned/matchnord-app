import { User, UserRole, MatchRole } from '@prisma/client';
import { db } from './db';

// Permission types
export interface Permission {
  resource:
    | 'tournament'
    | 'team'
    | 'match'
    | 'user'
    | 'system'
    | 'organization';
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'assign';
  scope: 'own' | 'organization' | 'assigned' | 'all';
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'in' | 'not_equals';
  value: any;
}

export interface UserPermissions {
  role: UserRole;
  permissions: Permission[];
  organizationAccess?: string[];
  tournamentAccess?: string[];
  matchAccess?: string[];
}

// Tournament permission result
export interface TournamentPermissions {
  canConfigure: boolean;
  canManageScores: boolean;
  isReferee: boolean;
  isOwner: boolean;
}

// Enhanced permission manager
export class PermissionManager {
  /**
   * Check if user is tournament owner
   */
  static async isTournamentOwner(
    userId: string,
    tournamentId: string
  ): Promise<boolean> {
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { createdById: true },
    });

    return tournament?.createdById === userId;
  }

  /**
   * Get user's permissions for a tournament
   */
  static async getTournamentPermissions(
    userId: string,
    tournamentId: string
  ): Promise<TournamentPermissions> {
    // Check if user is ADMIN
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      return {
        canConfigure: true,
        canManageScores: true,
        isReferee: true,
        isOwner: false, // Admins aren't owners, but have full access
      };
    }

    // Check if user is tournament owner
    const isOwner = await this.isTournamentOwner(userId, tournamentId);
    if (isOwner) {
      return {
        canConfigure: true,
        canManageScores: true,
        isReferee: false, // Owners don't need referee flag by default
        isOwner: true,
      };
    }

    // Check tournament assignment
    const assignment = await db.tournamentAssignment.findUnique({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
      select: {
        canConfigure: true,
        canManageScores: true,
        isReferee: true,
        isActive: true,
      },
    });

    if (!assignment || !assignment.isActive) {
      return {
        canConfigure: false,
        canManageScores: false,
        isReferee: false,
        isOwner: false,
      };
  }

    return {
      canConfigure: assignment.canConfigure,
      canManageScores: assignment.canManageScores,
      isReferee: assignment.isReferee,
      isOwner: false,
    };
  }

  /**
   * Check if user can configure tournament (access manage route)
   */
  static async canConfigureTournament(
    userId: string,
    tournamentId: string
  ): Promise<boolean> {
    const permissions = await this.getTournamentPermissions(
      userId,
      tournamentId
    );
    return permissions.canConfigure || permissions.isOwner;
  }

  /**
   * Check if user can manage scores (access manage-public route)
   */
  static async canManageScores(
    userId: string,
    tournamentId: string
  ): Promise<boolean> {
    const permissions = await this.getTournamentPermissions(
      userId,
      tournamentId
    );
    return permissions.canManageScores || permissions.isOwner;
  }

  /**
   * Check if user can access a specific tournament
   */
  static async canAccessTournament(
    userId: string,
    tournamentId: string
  ): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      return true;
    }

    const permissions = await this.getTournamentPermissions(
      userId,
      tournamentId
    );

    // User can access if they have any permission or are owner
    return (
      permissions.canConfigure ||
      permissions.canManageScores ||
      permissions.isReferee ||
      permissions.isOwner
    );
  }

  /**
   * Check if user can manage a specific tournament (legacy method for backward compatibility)
   */
  static async canManageTournament(
    userId: string,
    tournamentId: string
  ): Promise<boolean> {
    return this.canConfigureTournament(userId, tournamentId);
  }

  /**
   * Check if user can operate a specific tournament (update results, manage matches)
   */
  static async canOperateTournament(
    userId: string,
    tournamentId: string
  ): Promise<boolean> {
    return this.canManageScores(userId, tournamentId);
  }

  /**
   * Check if user has match assignment
   */
  static async hasMatchAssignment(
    userId: string,
    matchId: string,
    roles?: MatchRole[]
  ): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
        return true;
    }

    const assignment = await db.matchAssignment.findUnique({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
      select: {
        role: true,
        isActive: true,
      },
    });

    if (!assignment || !assignment.isActive) {
        return false;
    }

    if (roles && roles.length > 0) {
      return roles.includes(assignment.role);
    }

    return true;
  }

  /**
   * Check if user can access a specific match
   */
  static async canAccessMatch(
    userId: string,
    matchId: string
  ): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      return true;
    }

    // Check if user has match assignment
    const hasAssignment = await this.hasMatchAssignment(userId, matchId);
    if (hasAssignment) {
        return true;
    }

    // Check if user can manage scores for the tournament this match belongs to
    const match = await db.match.findUnique({
      where: { id: matchId },
      select: { tournamentId: true },
    });

    if (match) {
      return this.canManageScores(userId, match.tournamentId);
    }

    return false;
  }

  /**
   * Check if user can update match results
   */
  static async canUpdateMatchResults(
    userId: string,
    matchId: string
  ): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
        return true;
    }

    // Check if user has match assignment (referee)
    const hasAssignment = await this.hasMatchAssignment(userId, matchId, [
          'MAIN_REFEREE',
          'ASSISTANT_REFEREE',
          'FOURTH_OFFICIAL',
    ]);
    if (hasAssignment) {
      return true;
    }

    // Check if user can manage scores for the tournament
    const match = await db.match.findUnique({
      where: { id: matchId },
      select: { tournamentId: true },
    });

    if (match) {
      return this.canManageScores(userId, match.tournamentId);
    }

        return false;
    }

  /**
   * Check if user can create tournaments
   */
  static canCreateTournament(user: User): boolean {
    // All authenticated users can create tournaments
    // (ADMIN and USER roles)
    return user.role === 'ADMIN' || user.role === 'USER';
  }

  /**
   * Get user's permissions for a specific resource
   */
  static getUserPermissions(
    user: User,
    resource: string,
    resourceId?: string
  ): Permission[] {
    const basePermissions = this.getBasePermissions(user.role);

    if (resourceId) {
      return basePermissions.filter((permission) =>
        this.evaluatePermission(permission, user, resource, resourceId)
      );
    }

    return basePermissions;
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(
    user: User,
    resource: string,
    action: string,
    resourceId?: string
  ): boolean {
    const permissions = this.getUserPermissions(user, resource, resourceId);
    return permissions.some((p) => p.action === action);
  }

  // Private helper methods

  private static getBasePermissions(role: UserRole): Permission[] {
    const permissions: Record<UserRole, Permission[]> = {
      ADMIN: [
        { resource: 'system', action: 'manage', scope: 'all' },
        { resource: 'user', action: 'manage', scope: 'all' },
        { resource: 'organization', action: 'manage', scope: 'all' },
        { resource: 'tournament', action: 'manage', scope: 'all' },
        { resource: 'team', action: 'manage', scope: 'all' },
        { resource: 'match', action: 'manage', scope: 'all' },
      ],
      USER: [
        { resource: 'tournament', action: 'create', scope: 'own' },
        { resource: 'tournament', action: 'read', scope: 'assigned' },
        { resource: 'match', action: 'read', scope: 'assigned' },
      ],
    };

    return permissions[role] || [];
  }

  private static evaluatePermission(
    permission: Permission,
    user: User,
    resource: string,
    resourceId: string
  ): boolean {
    // Check if permission matches resource
    if (permission.resource !== resource) {
      return false;
    }

    // Check scope conditions
    switch (permission.scope) {
      case 'own':
        // This would need async check - simplified for now
        return true;
      case 'assigned':
        // This would need async check - simplified for now
        return true;
      case 'organization':
        // This would need async check - simplified for now
        return true;
      case 'all':
        return true;
      default:
        return false;
    }
  }
}

// Route-based access control
export class RouteAccess {
  /**
   * Check if user can access admin routes
   */
  static canAccessAdmin(user: User): boolean {
    return user.role === 'ADMIN';
  }

  /**
   * Check if user can access tournament manage route
   * Requires canConfigure permission or tournament ownership
   */
  static async canAccessTournamentManage(
    userId: string,
    tournamentId: string
  ): Promise<boolean> {
    return PermissionManager.canConfigureTournament(userId, tournamentId);
  }

  /**
   * Check if user can access tournament manage-public route
   * Requires canManageScores permission or tournament ownership
   */
  static async canAccessTournamentManagePublic(
    userId: string,
    tournamentId: string
  ): Promise<boolean> {
    return PermissionManager.canManageScores(userId, tournamentId);
  }

  /**
   * Get the appropriate dashboard route for a user
   */
  static getDashboardRoute(user: User): string {
    switch (user.role) {
      case 'ADMIN':
        return '/admin';
      case 'USER':
        return '/dashboard';
      default:
        return '/';
    }
  }
}

// Role display utilities
export class RoleDisplay {
  /**
   * Get human-readable role name
   */
  static getRoleName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
      ADMIN: 'System Administrator',
      USER: 'User',
    };
    return roleNames[role] || role;
  }

  /**
   * Get role color for UI
   */
  static getRoleColor(role: UserRole): string {
    const roleColors: Record<UserRole, string> = {
      ADMIN: 'bg-red-100 text-red-800 border-red-200',
      USER: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Get role icon
   */
  static getRoleIcon(role: UserRole): string {
    const roleIcons: Record<UserRole, string> = {
      ADMIN: 'Shield',
      USER: 'User',
    };
    return roleIcons[role] || 'User';
  }
}
