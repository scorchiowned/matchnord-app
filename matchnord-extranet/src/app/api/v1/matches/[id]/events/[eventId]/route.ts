import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EventType } from '@/server/contracts/match';
import { z } from 'zod';

const UpdateEventInput = z.object({
  minute: z.number().int().min(0).max(120).optional(),
  type: EventType.optional(),
  teamId: z.string().optional(),
  playerId: z.string().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: matchId, eventId } = params;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!matchId || !eventId) {
      return NextResponse.json(
        { error: 'Match ID and Event ID are required' },
        { status: 400 }
      );
    }

    const user = session.user as any;
    const body = await request.json();

    // Validate event input
    const eventInput = UpdateEventInput.parse(body);

    // Get the event and match to check permissions
    const event = await db.matchEvent.findUnique({
      where: { id: eventId },
      include: {
        match: {
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
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.matchId !== matchId) {
      return NextResponse.json(
        { error: 'Event does not belong to this match' },
        { status: 400 }
      );
    }

    // Check permissions - allow ADMIN, tournament creator, or assigned MANAGER
    const canEditMatch =
      user.role === 'ADMIN' ||
      event.match.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: event.match.tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canEditMatch) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update match events' },
        { status: 403 }
      );
    }

    // Verify team belongs to this match (if teamId is being updated)
    if (eventInput.teamId) {
      if (
        eventInput.teamId !== event.match.homeTeamId &&
        eventInput.teamId !== event.match.awayTeamId
      ) {
        return NextResponse.json(
          { error: 'Team does not belong to this match' },
          { status: 400 }
        );
      }
    }

    // Update the event
    const updatedEvent = await db.matchEvent.update({
      where: { id: eventId },
      data: {
        ...(eventInput.minute !== undefined && { minute: eventInput.minute }),
        ...(eventInput.type && { type: eventInput.type }),
        ...(eventInput.teamId && { teamId: eventInput.teamId }),
        ...(eventInput.playerId !== undefined && {
          playerId: eventInput.playerId,
        }),
      },
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
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating match event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: matchId, eventId } = params;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!matchId || !eventId) {
      return NextResponse.json(
        { error: 'Match ID and Event ID are required' },
        { status: 400 }
      );
    }

    const user = session.user as any;

    // Get the event and match to check permissions
    const event = await db.matchEvent.findUnique({
      where: { id: eventId },
      include: {
        match: {
          include: {
            tournament: {
              select: {
                id: true,
                createdById: true,
                organizationId: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.matchId !== matchId) {
      return NextResponse.json(
        { error: 'Event does not belong to this match' },
        { status: 400 }
      );
    }

    // Check permissions - allow ADMIN, tournament creator, or assigned MANAGER
    const canEditMatch =
      user.role === 'ADMIN' ||
      event.match.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: event.match.tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canEditMatch) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete match events' },
        { status: 403 }
      );
    }

    // Delete the event
    await db.matchEvent.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting match event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


