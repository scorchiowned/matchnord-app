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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const tournamentId = params.id;

    // Get tournament
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        divisions: true
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if tournament is locked
    if (!tournament.isLocked) {
      return NextResponse.json(
        { error: 'Tournament is not locked' },
        { status: 400 }
      );
    }

    // Check if user has permission to unlock
    // Only the user who locked it or an admin can unlock
    if (tournament.lockedBy !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to unlock this tournament' },
        { status: 403 }
      );
    }

    // Unlock the tournament
    const updatedTournament = await db.tournament.update({
      where: { id: tournamentId },
      data: {
        isLocked: false,
        lockedAt: null,
        lockedBy: null
      },
      include: {
        divisions: {
          include: {
            groups: {
              include: {
                teams: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      tournament: updatedTournament
    });

  } catch (error) {
    console.error('Error unlocking tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
