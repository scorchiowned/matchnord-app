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

    // Get division
    const division = await db.division.findUnique({
      where: { id: divisionId },
      include: {
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

    // Check if division is locked
    if (!division.isLocked) {
      return NextResponse.json(
        { error: 'Division is not locked' },
        { status: 400 }
      );
    }

    // Check if user has permission to unlock
    // Only the user who locked it or an admin can unlock
    if (division.lockedBy !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to unlock this division' },
        { status: 403 }
      );
    }

    // Unlock the division
    const updatedDivision = await db.division.update({
      where: { id: divisionId },
      data: {
        isLocked: false,
        lockedAt: null,
        lockedBy: null
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
    console.error('Error unlocking division:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
