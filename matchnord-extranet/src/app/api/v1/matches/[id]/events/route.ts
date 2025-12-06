import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CreateMatchEventInput } from '@/server/contracts/match';
import { z } from 'zod';

export async function POST(
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

    // Validate event input (team-level only, no player required)
    const eventInput = CreateMatchEventInput.extend({
      teamId: z.string().min(1), // Require teamId for team-level events
      playerId: z.string().optional(), // Player is optional
    }).parse({
      matchId,
      minute: body.minute,
      type: body.type,
      teamId: body.teamId,
      playerId: body.playerId || null,
    });

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
        homeTeam: {
          select: {
            id: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check permissions - allow ADMIN, tournament creator, or assigned MANAGER
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
        { error: 'Insufficient permissions to add match events' },
        { status: 403 }
      );
    }

    // Verify team belongs to this match
    if (
      eventInput.teamId !== match.homeTeamId &&
      eventInput.teamId !== match.awayTeamId
    ) {
      return NextResponse.json(
        { error: 'Team does not belong to this match' },
        { status: 400 }
      );
    }

    // Verify team belongs to this tournament
    const team = await db.team.findFirst({
      where: {
        id: eventInput.teamId,
        tournamentId: match.tournamentId,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found in this tournament' },
        { status: 400 }
      );
    }

    // Create the match event
    const event = await db.matchEvent.create({
      data: {
        matchId: matchId,
        minute: eventInput.minute,
        type: eventInput.type,
        teamId: eventInput.teamId,
        playerId: eventInput.playerId || null,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        player: eventInput.playerId
          ? {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            }
          : undefined,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating match event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // Get the match to verify it exists
    const match = await db.match.findUnique({
      where: { id: matchId },
      select: { id: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get all events for this match
    const events = await db.matchEvent.findMany({
      where: { matchId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        minute: 'asc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching match events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}









