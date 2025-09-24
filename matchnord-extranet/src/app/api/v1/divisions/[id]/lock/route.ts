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

    const divisionId = params.id;

    // Get division with groups and teams
    const division = await db.division.findUnique({
      where: { id: divisionId },
      include: {
        groups: {
          include: {
            teams: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!division) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      );
    }

    // Check if division is already locked
    if (division.isLocked) {
      return NextResponse.json(
        { error: 'Division is already locked' },
        { status: 400 }
      );
    }

    // Validate division can be locked
    const { canLockDivision } = await import('@/lib/tournament/tournament-lock');
    const validation = canLockDivision({
      id: division.id,
      name: division.name,
      groups: division.groups.map(group => ({
        id: group.id,
        name: group.name,
        teams: group.teams.map(team => ({
          id: team.id,
          name: team.name
        }))
      }))
    });

    if (!validation.canLock) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 400 }
      );
    }

    // Lock the division
    const updatedDivision = await db.division.update({
      where: { id: divisionId },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: session.user.id
      },
      include: {
        groups: {
          include: {
            teams: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      division: updatedDivision
    });

  } catch (error) {
    console.error('Error locking division:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
