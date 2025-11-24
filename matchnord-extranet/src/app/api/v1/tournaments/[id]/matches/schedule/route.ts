import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseUTCTime, formatAsUTC } from '@/lib/time/utc';

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

    // Check permissions - user must have canConfigure permission
    const { PermissionManager } = await import('@/lib/permissions');
    const hasPermission = await PermissionManager.canConfigureTournament(
      (session.user as any).id,
      params.id
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
        // Build update data with proper relation syntax
        // All times are parsed as UTC to ensure consistent storage
        const updateData: any = {
          startTime: matchData.startTime
            ? parseUTCTime(matchData.startTime)
            : undefined,
          endTime: matchData.endTime
            ? parseUTCTime(matchData.endTime)
            : undefined,
          matchNumber: matchData.matchNumber || null,
          scheduledAt: new Date(), // Server timestamp, already UTC
          scheduledBy: session.user.id,
          assignmentType: 'MANUAL',
        };

        // Use relation syntax for venue
        if (matchData.venueId) {
          updateData.venue = { connect: { id: matchData.venueId } };
        } else {
          updateData.venue = { disconnect: true };
        }

        // Use relation syntax for pitch
        if (matchData.pitchId) {
          updateData.pitch = { connect: { id: matchData.pitchId } };
        } else {
          updateData.pitch = { disconnect: true };
        }

        const match = await db.match.update({
          where: { id: matchData.id },
          data: updateData,
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
            division: {
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
    // Parse times as UTC to ensure consistent comparison
    const matchStartTime = parseUTCTime(match.startTime);
    if (!matchStartTime) {
      continue;
    }

    const conflictingMatches = await db.match.findMany({
      where: {
        tournamentId,
        pitchId: match.pitchId,
        startTime: {
          lte: matchStartTime,
        },
        endTime: {
          gte: matchStartTime,
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
          teams: cm.homeTeam && cm.awayTeam 
            ? `${cm.homeTeam.name} vs ${cm.awayTeam.name}`
            : 'TBD vs TBD',
          startTime: cm.startTime,
          endTime: cm.endTime,
        })),
      });
    }
  }

  return conflicts;
}
