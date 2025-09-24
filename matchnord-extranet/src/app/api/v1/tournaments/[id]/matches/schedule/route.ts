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
    const { matches } = body;

    if (!Array.isArray(matches)) {
      return NextResponse.json(
        { error: 'Matches must be an array' },
        { status: 400 }
      );
    }

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

    // Validate all matches belong to this tournament
    const matchIds = matches.map((m) => m.id);
    const existingMatches = await db.match.findMany({
      where: {
        id: { in: matchIds },
        tournamentId: params.id,
      },
    });

    if (existingMatches.length !== matchIds.length) {
      return NextResponse.json(
        { error: 'One or more matches do not belong to this tournament' },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const conflicts = await checkSchedulingConflicts(matches, params.id);
    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: 'Scheduling conflicts detected',
          conflicts,
        },
        { status: 400 }
      );
    }

    // Update matches
    const updatedMatches = await Promise.all(
      matches.map(async (matchData) => {
        const match = await db.match.update({
          where: { id: matchData.id },
          data: {
            venueId: matchData.venueId || null,
            pitchId: matchData.pitchId || null,
            startTime: matchData.startTime
              ? new Date(matchData.startTime)
              : undefined,
            endTime: matchData.endTime
              ? new Date(matchData.endTime)
              : undefined,
            scheduledAt: new Date(),
            scheduledBy: session.user.id,
            assignmentType: 'MANUAL',
          },
          include: {
            homeTeam: {
              select: {
                id: true,
                name: true,
                shortName: true,
              },
            },
            awayTeam: {
              select: {
                id: true,
                name: true,
                shortName: true,
              },
            },
            venue: {
              select: {
                id: true,
                name: true,
              },
            },
            pitch: {
              select: {
                id: true,
                name: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        return match;
      })
    );

    return NextResponse.json(
      {
        message: `Updated ${updatedMatches.length} matches`,
        matches: updatedMatches,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating match schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkSchedulingConflicts(matches: any[], tournamentId: string) {
  const conflicts = [];

  for (const match of matches) {
    if (!match.venueId || !match.pitchId || !match.startTime) {
      continue;
    }

    // Check for conflicts with existing matches
    const conflictingMatches = await db.match.findMany({
      where: {
        tournamentId,
        pitchId: match.pitchId,
        startTime: {
          lte: new Date(match.startTime),
        },
        endTime: {
          gte: new Date(match.startTime),
        },
        id: { not: match.id },
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    if (conflictingMatches.length > 0) {
      conflicts.push({
        matchId: match.id,
        conflictType: 'time_overlap',
        conflictingMatches: conflictingMatches.map((cm) => ({
          id: cm.id,
          teams: `${cm.homeTeam.name} vs ${cm.awayTeam.name}`,
          startTime: cm.startTime,
          endTime: cm.endTime,
        })),
      });
    }
  }

  return conflicts;
}
