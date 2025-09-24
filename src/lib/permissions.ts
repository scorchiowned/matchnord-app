import { User, UserRole, TournamentRole, MatchRole } from '@prisma/client';

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

// Enhanced permission manager
export class PermissionManager {
  // Helper methods (moved to top for forward declaration)
  static hasTournamentAccess(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _user: User,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tournamentId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _roles: TournamentRole[]
  ): boolean {
    // This would query the database for tournament assignments
    // For now, return false - will be implemented with database queries
    return false;
  }

  static hasMatchAccess(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _user: User,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _matchId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _roles: MatchRole[]
  ): boolean {
    // This would query the database for match assignments
    // For now, return false - will be implemented with database queries
    return false;
  }

  static isOwnResource(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _user: User,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _resource: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _resourceId: string
  ): boolean {
    // This would check if the user owns the resource
    // For now, return false - will be implemented with database queries
    return false;
  }

  static isAssignedResource(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _user: User,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _resource: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _resourceId: string
  ): boolean {
    // This would check if the user is assigned to the resource
    // For now, return false - will be implemented with database queries
    return false;
  }

  static isOrganizationResource(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _user: User,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _resource: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _resourceId: string
  ): boolean {
    // This would check if the user belongs to the same organization as the resource
    // For now, return false - will be implemented with database queries
    return false;
  }

  /**
   * Check if user can access a specific tournament
   */
  static canAccessTournament(user: User, tournamentId: string): boolean {
    switch (user.role) {
      case 'ADMIN':
        return true; // Admins can access all tournaments
      case 'TEAM_MANAGER':
        return PermissionManager.hasTournamentAccess(user, tournamentId, [
          'MANAGER',
          'ADMIN',
        ]);
      case 'TOURNAMENT_ADMIN':
        return PermissionManager.hasTournamentAccess(user, tournamentId, [
          'ADMIN',
          'MANAGER',
        ]);
      case 'REFEREE':
        return PermissionManager.hasTournamentAccess(user, tournamentId, [
          'REFEREE',
          'ADMIN',
          'MANAGER',
        ]);
      default:
        return false;
    }
  }

  /**
   * Check if user can manage a specific tournament
   */
  static canManageTournament(user: User, tournamentId: string): boolean {
    switch (user.role) {
      case 'ADMIN':
        return true;
      case 'TEAM_MANAGER':
        return PermissionManager.hasTournamentAccess(user, tournamentId, [
          'MANAGER',
        ]);
      case 'TOURNAMENT_ADMIN':
        return PermissionManager.hasTournamentAccess(user, tournamentId, [
          'ADMIN',
          'MANAGER',
        ]);
      default:
        return false;
    }
  }

  /**
   * Check if user can operate a specific tournament (update results, manage matches)
   */
  static canOperateTournament(user: User, tournamentId: string): boolean {
    switch (user.role) {
      case 'ADMIN':
        return true;
      case 'TEAM_MANAGER':
        return PermissionManager.hasTournamentAccess(user, tournamentId, [
          'MANAGER',
          'ADMIN',
        ]);
      case 'TOURNAMENT_ADMIN':
        return PermissionManager.hasTournamentAccess(user, tournamentId, [
          'ADMIN',
        ]);
      default:
        return false;
    }
  }

  /**
   * Check if user can access a specific match
   */
  static canAccessMatch(user: User, matchId: string): boolean {
    switch (user.role) {
      case 'ADMIN':
        return true;
      case 'TEAM_MANAGER':
        return PermissionManager.hasMatchAccess(user, matchId, [
          'MAIN_REFEREE',
          'ASSISTANT_REFEREE',
          'FOURTH_OFFICIAL',
          'MATCH_COMMISSIONER',
        ]);
      case 'TOURNAMENT_ADMIN':
        return PermissionManager.hasMatchAccess(user, matchId, [
          'MAIN_REFEREE',
          'ASSISTANT_REFEREE',
          'FOURTH_OFFICIAL',
          'MATCH_COMMISSIONER',
        ]);
      case 'REFEREE':
        return PermissionManager.hasMatchAccess(user, matchId, [
          'MAIN_REFEREE',
          'ASSISTANT_REFEREE',
          'FOURTH_OFFICIAL',
        ]);
      default:
        return false;
    }
  }

  /**
   * Check if user can update match results
   */
  static canUpdateMatchResults(user: User, matchId: string): boolean {
    switch (user.role) {
      case 'ADMIN':
        return true;
      case 'TOURNAMENT_ADMIN':
        return PermissionManager.hasMatchAccess(user, matchId, [
          'MAIN_REFEREE',
          'ASSISTANT_REFEREE',
          'FOURTH_OFFICIAL',
          'MATCH_COMMISSIONER',
        ]);
      case 'REFEREE':
        return PermissionManager.hasMatchAccess(user, matchId, [
          'MAIN_REFEREE',
          'ASSISTANT_REFEREE',
        ]);
      default:
        return false;
    }
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

  // Private helper methods (commented out for now)

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
      TEAM_MANAGER: [
        { resource: 'tournament', action: 'create', scope: 'own' },
        { resource: 'tournament', action: 'manage', scope: 'assigned' },
        { resource: 'team', action: 'manage', scope: 'own' },
        { resource: 'match', action: 'read', scope: 'assigned' },
        { resource: 'match', action: 'update', scope: 'assigned' },
      ],
      TOURNAMENT_ADMIN: [
        { resource: 'tournament', action: 'manage', scope: 'assigned' },
        { resource: 'team', action: 'read', scope: 'assigned' },
        { resource: 'team', action: 'update', scope: 'assigned' },
        { resource: 'match', action: 'manage', scope: 'assigned' },
      ],
      REFEREE: [
        { resource: 'match', action: 'read', scope: 'assigned' },
        { resource: 'match', action: 'update', scope: 'assigned' },
        { resource: 'tournament', action: 'read', scope: 'assigned' },
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
        return PermissionManager.isOwnResource(user, resource, resourceId);
      case 'assigned':
        return PermissionManager.isAssignedResource(user, resource, resourceId);
      case 'organization':
        return PermissionManager.isOrganizationResource(
          user,
          resource,
          resourceId
        );
      case 'all':
        return true;
      default:
        return false;
    }
  }
}

// Role-based route access
export class RouteAccess {
  /**
   * Check if user can access admin routes
   */
  static canAccessAdmin(user: User): boolean {
    return user.role === 'ADMIN';
  }

  /**
   * Check if user can access team manager routes
   */
  static canAccessTeamManager(user: User): boolean {
    return ['ADMIN', 'TEAM_MANAGER'].includes(user.role);
  }

  /**
   * Check if user can access tournament admin routes
   */
  static canAccessTournamentAdmin(user: User): boolean {
    return ['ADMIN', 'TOURNAMENT_ADMIN'].includes(user.role);
  }

  /**
   * Check if user can access referee routes
   */
  static canAccessReferee(user: User): boolean {
    return ['ADMIN', 'REFEREE'].includes(user.role);
  }

  /**
   * Get the appropriate dashboard route for a user
   */
  static getDashboardRoute(user: User): string {
    switch (user.role) {
      case 'ADMIN':
        return '/admin';
      case 'TEAM_MANAGER':
        return '/team-manager';
      case 'TOURNAMENT_ADMIN':
        return '/tournament-admin';
      case 'REFEREE':
        return '/referee';
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
      TEAM_MANAGER: 'Team Manager',
      TOURNAMENT_ADMIN: 'Tournament Administrator',
      REFEREE: 'Referee',
    };
    return roleNames[role] || role;
  }

  /**
   * Get role color for UI
   */
  static getRoleColor(role: UserRole): string {
    const roleColors: Record<UserRole, string> = {
      ADMIN: 'bg-red-100 text-red-800 border-red-200',
      TEAM_MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
      TOURNAMENT_ADMIN: 'bg-green-100 text-green-800 border-green-200',
      REFEREE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Get role icon
   */
  static getRoleIcon(role: UserRole): string {
    const roleIcons: Record<UserRole, string> = {
      ADMIN: 'Shield',
      TEAM_MANAGER: 'Users',
      TOURNAMENT_ADMIN: 'Trophy',
      REFEREE: 'UserCheck',
    };
    return roleIcons[role] || 'User';
  }
}
