import { db } from '@/lib/db';

export interface TournamentVisibility {
  canViewTournament: boolean;
  canViewInfo: boolean;
  canViewTeams: boolean;
  canViewSchedule: boolean;
  canViewMatches: boolean;
  canViewStandings: boolean;
  canViewBrackets: boolean;
}

export interface VisibilityContext {
  userId?: string;
  userRole?: string;
  tournamentId: string;
}

/**
 * Determines what parts of a tournament a user can view based on publication status
 * and user permissions
 */
export async function getTournamentVisibility(
  context: VisibilityContext
): Promise<TournamentVisibility> {
  const { userId, userRole, tournamentId } = context;

  // Fetch tournament with publication settings
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      status: true,
      infoPublished: true,
      teamsPublished: true,
      schedulePublished: true,
      createdById: true,
    },
  });

  if (!tournament) {
    return {
      canViewTournament: false,
      canViewInfo: false,
      canViewTeams: false,
      canViewSchedule: false,
      canViewMatches: false,
      canViewStandings: false,
      canViewBrackets: false,
    };
  }

  // Check if user has management access
  const hasManagementAccess = await checkManagementAccess(
    userId,
    userRole,
    tournament
  );

  // If user has management access, they can see everything
  if (hasManagementAccess) {
    return {
      canViewTournament: true,
      canViewInfo: true,
      canViewTeams: true,
      canViewSchedule: true,
      canViewMatches: true,
      canViewStandings: true,
      canViewBrackets: true,
    };
  }

  // For public access, check publication status
  const isTournamentPublished = tournament.status === 'PUBLISHED';

  return {
    canViewTournament: isTournamentPublished,
    // For public site, show basic info if tournament is published (even if infoPublished is false)
    canViewInfo: isTournamentPublished,
    canViewTeams: isTournamentPublished && tournament.teamsPublished,
    canViewSchedule: isTournamentPublished && tournament.schedulePublished,
    canViewMatches: isTournamentPublished && tournament.schedulePublished,
    canViewStandings: isTournamentPublished && tournament.teamsPublished,
    canViewBrackets: isTournamentPublished && tournament.schedulePublished,
  };
}

/**
 * Checks if a user has management access to a tournament
 */
async function checkManagementAccess(
  userId?: string,
  userRole?: string,
  tournament?: { createdById: string }
): Promise<boolean> {
  if (!userId || !tournament) {
    return false;
  }

  // Admins can see everything
  if (userRole === 'ADMIN') {
    return true;
  }

  // Tournament creator can see everything
  if (tournament.createdById === userId) {
    return true;
  }

  // Check if user has tournament assignments
  const assignment = await db.tournamentAssignment.findFirst({
    where: {
      tournamentId: tournament.id,
      userId: userId,
      isActive: true,
    },
  });

  return !!assignment;
}

/**
 * Filters tournament data based on visibility rules
 */
export function filterTournamentData(
  tournament: any,
  visibility: TournamentVisibility
): any {
  const filtered = { ...tournament };

  // If tournament is not visible, return minimal data
  if (!visibility.canViewTournament) {
    return {
      id: tournament.id,
      name: tournament.name,
      status: 'HIDDEN',
    };
  }

  // Filter basic tournament info if not visible
  if (!visibility.canViewInfo) {
    // Keep only essential fields for unpublished info
    const essentialFields = {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
    };

    // Remove detailed info fields
    delete filtered.description;
    delete filtered.city;
    delete filtered.address;
    delete filtered.contactEmail;
    delete filtered.contactPhone;
    delete filtered.logo;
    delete filtered.heroImage;
    delete filtered.registrationDeadline;
    delete filtered.maxTeams;
    delete filtered.autoAcceptTeams;
    delete filtered.allowWaitlist;

    // Merge essential fields back
    Object.assign(filtered, essentialFields);
  }

  // Filter teams if not visible
  if (!visibility.canViewTeams) {
    if (filtered.teams) {
      filtered.teams = [];
    }
    if (filtered.divisions) {
      filtered.divisions = filtered.divisions.map((division: any) => ({
        ...division,
        groups: division.groups?.map((group: any) => ({
          ...group,
          teams: [],
        })),
      }));
    }
  }

  // Filter matches/schedule if not visible
  if (!visibility.canViewSchedule || !visibility.canViewMatches) {
    if (filtered.matches) {
      filtered.matches = [];
    }
    if (filtered.divisions) {
      filtered.divisions = filtered.divisions.map((division: any) => ({
        ...division,
        groups: division.groups?.map((group: any) => ({
          ...group,
          matches: [],
        })),
      }));
    }
  }

  // Filter standings if not visible
  if (!visibility.canViewStandings) {
    if (filtered.divisions) {
      filtered.divisions = filtered.divisions.map((division: any) => ({
        ...division,
        groups: division.groups?.map((group: any) => ({
          ...group,
          standings: [],
        })),
      }));
    }
  }

  return filtered;
}

/**
 * Creates a standardized error response for access denied
 */
export function createAccessDeniedResponse(message: string = 'Access denied') {
  return {
    error: message,
    code: 'ACCESS_DENIED',
  };
}
