import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, divisionId, groupId } = body;

    // Get tournament with permissions check
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      include: {
        assignments: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const hasPermission =
      session.user.role === 'ADMIN' ||
      session.user.role === 'TEAM_MANAGER' ||
      tournament.assignments.some((assignment) =>
        ['MANAGER', 'ADMIN'].includes(assignment.role)
      );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    let result;

    switch (action) {
      case 'generate_all':
        result = await generateAllMatches(tournament.id, divisionId);
        break;

      case 'clear_all':
        result = await clearAllMatches(tournament.id, divisionId, groupId);
        break;

      case 'regenerate_all':
        result = await regenerateAllMatches(tournament.id, divisionId, groupId);
        break;

      case 'auto_assign_all':
        result = await autoAssignAllMatches(tournament.id, divisionId, groupId);
        break;

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: generate_all, clear_all, regenerate_all, or auto_assign_all',
          },
          { status: 400 }
        );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in bulk match operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAllMatches(tournamentId: string, divisionId?: string) {
  const whereClause = divisionId
    ? { tournamentId, group: { divisionId } }
    : { tournamentId };

  // Get all groups that need matches
  const groups = await db.group.findMany({
    where: {
      division: {
        tournamentId,
        ...(divisionId && { id: divisionId }),
      },
    },
    include: {
      teams: true,
      matches: true,
      division: true,
    },
  });

  const results = [];

  for (const group of groups) {
    if (group.teams.length < 2) {
      results.push({
        groupId: group.id,
        groupName: group.name,
        status: 'skipped',
        reason: 'Not enough teams',
      });
      continue;
    }

    if (group.matches.length > 0) {
      results.push({
        groupId: group.id,
        groupName: group.name,
        status: 'skipped',
        reason: 'Matches already exist',
      });
      continue;
    }

    // Generate round-robin matches for this group
    const { generateRoundRobinMatches } = await import(
      '@/lib/tournament/match-generation/round-robin'
    );
    const matchResult = generateRoundRobinMatches(group.teams, group.id);

    // Create matches in database
    const createdMatches = await Promise.all(
      matchResult.matches.map((match) =>
        db.match.create({
          data: {
            tournamentId,
            groupId: group.id,
            homeTeamId: match.homeTeam.id,
            awayTeamId: match.awayTeam.id,
            startTime: new Date(),
            assignmentType: group.division.assignmentType,
            status: 'SCHEDULED',
          },
        })
      )
    );

    results.push({
      groupId: group.id,
      groupName: group.name,
      status: 'success',
      matchesCreated: createdMatches.length,
    });
  }

  return {
    action: 'generate_all',
    results,
    totalGroups: groups.length,
    successfulGroups: results.filter((r) => r.status === 'success').length,
  };
}

async function clearAllMatches(
  tournamentId: string,
  divisionId?: string,
  groupId?: string
) {
  const whereClause: any = { tournamentId };

  if (groupId) {
    whereClause.groupId = groupId;
  } else if (divisionId) {
    whereClause.group = { divisionId };
  }

  const deletedMatches = await db.match.deleteMany({
    where: whereClause,
  });

  return {
    action: 'clear_all',
    matchesDeleted: deletedMatches.count,
    scope: groupId ? 'group' : divisionId ? 'division' : 'tournament',
  };
}

async function regenerateAllMatches(
  tournamentId: string,
  divisionId?: string,
  groupId?: string
) {
  // First clear existing matches
  const clearResult = await clearAllMatches(tournamentId, divisionId, groupId);

  // Then generate new matches
  const generateResult = await generateAllMatches(tournamentId, divisionId);

  return {
    action: 'regenerate_all',
    clearResult,
    generateResult,
  };
}

async function autoAssignAllMatches(
  tournamentId: string,
  divisionId?: string,
  groupId?: string
) {
  const whereClause: any = {
    tournamentId,
    assignmentType: 'AUTO',
    venueId: null,
  };

  if (groupId) {
    whereClause.groupId = groupId;
  } else if (divisionId) {
    whereClause.group = { divisionId };
  }

  // Get unassigned matches
  const unassignedMatches = await db.match.findMany({
    where: whereClause,
    include: {
      group: {
        include: {
          division: true,
        },
      },
    },
  });

  if (unassignedMatches.length === 0) {
    return {
      action: 'auto_assign_all',
      message: 'No unassigned matches found',
      matchesAssigned: 0,
    };
  }

  // Get tournament venues
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      venues: {
        include: {
          pitches: {
            where: { isAvailable: true },
          },
        },
      },
    },
  });

  if (!tournament || tournament.venues.length === 0) {
    return {
      action: 'auto_assign_all',
      error: 'No venues with available pitches found',
      matchesAssigned: 0,
    };
  }

  // Simple assignment logic - distribute matches across available pitches
  const allPitches = tournament.venues.flatMap((venue) =>
    venue.pitches.map((pitch) => ({
      ...pitch,
      venueId: venue.id,
    }))
  );

  let assignedCount = 0;
  const startTime = new Date();
  startTime.setHours(9, 0, 0, 0); // Start at 9 AM

  for (let i = 0; i < unassignedMatches.length; i++) {
    const match = unassignedMatches[i];
    const pitch = allPitches[i % allPitches.length];

    const matchDuration = match.group.division.matchDuration || 90;
    const endTime = new Date(startTime.getTime() + matchDuration * 60000);

    await db.match.update({
      where: { id: match.id },
      data: {
        venueId: pitch.venueId,
        pitchId: pitch.id,
        startTime: new Date(startTime),
        endTime: endTime,
        scheduledAt: new Date(),
      },
    });

    assignedCount++;

    // Move to next time slot
    startTime.setTime(endTime.getTime() + 15 * 60000); // 15 min break
  }

  return {
    action: 'auto_assign_all',
    matchesAssigned: assignedCount,
    totalUnassigned: unassignedMatches.length,
  };
}
