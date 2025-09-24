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

    // Get tournament with divisions
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
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

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if tournament is already locked
    if (tournament.isLocked) {
      return NextResponse.json(
        { error: 'Tournament is already locked' },
        { status: 400 }
      );
    }

    // Validate tournament can be locked
    const { canLockTournament } = await import('@/lib/tournament/tournament-lock');
    
    // Check if all divisions are locked
    const unlockedDivisions = tournament.divisions.filter(div => !div.isLocked);
    if (unlockedDivisions.length > 0) {
      return NextResponse.json(
        { error: `Unlocked divisions: ${unlockedDivisions.map(d => d.name).join(', ')}` },
        { status: 400 }
      );
    }

    // Lock the tournament
    const updatedTournament = await db.tournament.update({
      where: { id: tournamentId },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: session.user.id
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
    console.error('Error locking tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
