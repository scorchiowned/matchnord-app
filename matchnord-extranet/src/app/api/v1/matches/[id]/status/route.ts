import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MatchStatus } from '@/server/contracts/match';
import { z } from 'zod';

const UpdateStatusInput = z.object({
  status: MatchStatus,
});

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

    // Validate status input
    const statusInput = UpdateStatusInput.parse({
      status: body.status,
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
        { error: 'Insufficient permissions to update match status' },
        { status: 403 }
      );
    }

    // Update the match status (no transition restrictions)
    const newStatus = statusInput.status;
    const updateData: any = {
      status: newStatus,
    };

    // If finishing the match, set endTime if not already set
    if (newStatus === 'FINISHED' && !match.endTime) {
      updateData.endTime = new Date();
    }

    // If starting the match, ensure startTime is set
    if (newStatus === 'LIVE' && !match.startTime) {
      updateData.startTime = new Date();
    }

    const updatedMatch = await db.match.update({
      where: { id: matchId },
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
            division: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        events: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            minute: 'asc',
          },
        },
      },
    });

    // If match is finished, trigger standings recalculation
    if (newStatus === 'FINISHED') {
      // This will be handled in a separate task/function
      // For now, we'll just update the match
    }

    return NextResponse.json(updatedMatch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid status input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating match status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

