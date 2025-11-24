import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UpdateScoreInput } from '@/server/contracts/match';
import { z } from 'zod';

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

    // Validate score input
    const scoreInput = UpdateScoreInput.parse({
      homeScore: body.homeScore,
      awayScore: body.awayScore,
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
        { error: 'Insufficient permissions to update match score' },
        { status: 403 }
      );
    }

    // Only log if score actually changed
    const scoreChanged =
      match.homeScore !== scoreInput.homeScore ||
      match.awayScore !== scoreInput.awayScore;

    // Update the match score and create log entry in a transaction
    const updatedMatch = await db.$transaction(async (tx) => {
      // Update match score
      const match = await tx.match.update({
        where: { id: matchId },
        data: {
          homeScore: scoreInput.homeScore,
          awayScore: scoreInput.awayScore,
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
          scoreLogs: {
            include: {
              updatedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10, // Get last 10 log entries
          },
        },
      });

      // Create log entry if score changed
      if (scoreChanged) {
        await tx.matchScoreLog.create({
          data: {
            matchId: matchId,
            homeScore: scoreInput.homeScore,
            awayScore: scoreInput.awayScore,
            updatedById: user.id,
          },
        });
      }

      return match;
    });

    return NextResponse.json(updatedMatch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid score input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating match score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

