import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const matchId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
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

    // Get the match and check permissions
    const match = await db.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: {
            id: true,
            createdById: true,
            organizationId: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check permissions
    const canEditMatch =
      user.role === 'ADMIN' ||
      match.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: match.tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canEditMatch) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this match' },
        { status: 403 }
      );
    }

    // Verify teams belong to this tournament
    const teams = await db.team.findMany({
      where: {
        id: { in: [body.homeTeamId, body.awayTeamId] },
        tournamentId: match.tournamentId,
      },
    });

    if (teams.length !== 2) {
      return NextResponse.json(
        { error: 'One or both teams do not belong to this tournament' },
        { status: 400 }
      );
    }

    // Update the match
    const updatedMatch = await db.match.update({
      where: { id: matchId },
      data: {
        homeTeamId: body.homeTeamId,
        awayTeamId: body.awayTeamId,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        venueId: body.venueId || null,
        pitchId: body.pitchId || null,
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
            division: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const matchId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    const user = session.user as any;

    // Get the match and check permissions
    const match = await db.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: {
            id: true,
            createdById: true,
            organizationId: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check if match has events
    if (match._count.events > 0) {
      return NextResponse.json(
        { error: 'Cannot delete match with existing events' },
        { status: 400 }
      );
    }

    // Check permissions
    const canDeleteMatch =
      user.role === 'ADMIN' ||
      match.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: match.tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canDeleteMatch) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this match' },
        { status: 403 }
      );
    }

    // Delete the match
    await db.match.delete({
      where: { id: matchId },
    });

    return NextResponse.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
