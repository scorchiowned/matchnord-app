import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTournamentVisibility } from '@/lib/tournament/visibility';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const tournamentId = params.id;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Get user context
    const user = session?.user as any;
    const userId = user?.id;
    const userRole = user?.role;

    // Check tournament visibility
    const visibility = await getTournamentVisibility({
      userId,
      userRole,
      tournamentId,
    });

    // Check if matches/schedule are visible
    if (!visibility.canViewMatches) {
      return NextResponse.json(
        { error: 'Schedule is not published for this tournament' },
        { status: 403 }
      );
    }

    // Fetch matches with related data
    const matches = await db.match.findMany({
      where: { tournamentId },
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
            division: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching tournament matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const tournamentId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    const user = session.user as any;
    const body = await request.json();

    // Validate required fields
    if (!body.homeTeamId || !body.awayTeamId || !body.startTime) {
      return NextResponse.json(
        { error: 'Home team, away team, and start time are required' },
        { status: 400 }
      );
    }

    // Check if teams are different
    if (body.homeTeamId === body.awayTeamId) {
      return NextResponse.json(
        { error: 'Home team and away team must be different' },
        { status: 400 }
      );
    }

    // Check if user has permission to add matches to this tournament
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        createdById: true,
        organizationId: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canAddMatch =
      user.role === 'ADMIN' ||
      tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canAddMatch) {
      return NextResponse.json(
        { error: 'Insufficient permissions to add matches' },
        { status: 403 }
      );
    }

    // Verify teams belong to this tournament
    const teams = await db.team.findMany({
      where: {
        id: { in: [body.homeTeamId, body.awayTeamId] },
        tournamentId: tournamentId,
      },
    });

    if (teams.length !== 2) {
      return NextResponse.json(
        { error: 'One or both teams do not belong to this tournament' },
        { status: 400 }
      );
    }

    // Create the match
    const match = await db.match.create({
      data: {
        tournamentId: tournamentId,
        homeTeamId: body.homeTeamId,
        awayTeamId: body.awayTeamId,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        venueId: body.venueId || null,
        pitchId: body.pitchId || null,
        groupId: body.groupId || null,
        referee: body.referee || '',
        notes: body.notes || '',
        status: body.status || 'SCHEDULED',
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
            stage: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
