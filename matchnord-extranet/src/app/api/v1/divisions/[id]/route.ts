import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PermissionManager } from '@/lib/permissions';

async function updateDivisionMatchesEndTime(
  divisionId: string,
  matchDuration: number
) {
  const matches = await db.match.findMany({
    where: {
      divisionId,
      startTime: {
        not: null,
      },
    },
    select: {
      id: true,
      startTime: true,
    },
  });

  await Promise.all(
    matches.map((match) => {
      if (!match.startTime) return Promise.resolve();
      const newEndTime = new Date(
        match.startTime.getTime() + matchDuration * 60 * 1000
      );
      return db.match.update({
        where: { id: match.id },
        data: { endTime: newEndTime },
      });
    })
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const divisionId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!divisionId) {
      return NextResponse.json(
        { error: 'Division ID is required' },
        { status: 400 }
      );
    }

    const user = session.user as any;

    // Get the division with all related data
    const division = await db.division.findUnique({
      where: { id: divisionId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            createdById: true,
            organizationId: true,
          },
        },
        groups: {
          include: {
            teams: {
              select: {
                id: true,
                name: true,
                shortName: true,
              },
            },
            _count: {
              select: {
                teams: true,
                matches: true,
              },
            },
          },
        },
        _count: {
          select: {
            groups: true,
            teams: true,
            fees: true,
          },
        },
      },
    });

    if (!division) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      );
    }

    // Check permissions - user must have access to tournament
    const canViewDivision = await PermissionManager.canAccessTournament(
      user.id,
      division.tournament.id
    );

    if (!canViewDivision) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view this division' },
        { status: 403 }
      );
    }

    return NextResponse.json(division);
  } catch (error) {
    console.error('Error fetching division:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const divisionId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!divisionId) {
      return NextResponse.json(
        { error: 'Division ID is required' },
        { status: 400 }
      );
    }

    const user = session.user as any;
    const body = await request.json();

    // Get the division and check permissions
    const division = await db.division.findUnique({
      where: { id: divisionId },
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

    if (!division) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      );
    }

    // Check permissions - user must have canConfigure permission
    const canEditDivision = await PermissionManager.canConfigureTournament(
      user.id,
      division.tournament.id
    );

    if (!canEditDivision) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this division' },
        { status: 403 }
      );
    }

    // Build update data object - only include fields that are provided
    const updateData: any = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.description !== undefined) {
      updateData.description = body.description || '';
    }
    if (body.birthYear !== undefined) {
      updateData.birthYear = body.birthYear ? parseInt(body.birthYear) : null;
    }
    if (body.format !== undefined) {
      updateData.format = body.format || '';
    }
    if (body.level !== undefined) {
      updateData.level = body.level || 'COMPETITIVE';
    }
    if (body.minTeams !== undefined) {
      updateData.minTeams = body.minTeams ? parseInt(body.minTeams) : 4;
    }
    if (body.maxTeams !== undefined) {
      updateData.maxTeams = body.maxTeams ? parseInt(body.maxTeams) : 16;
    }
    // Match settings
    if (body.matchDuration !== undefined) {
      updateData.matchDuration = parseInt(body.matchDuration) || 90;
    }
    if (body.breakDuration !== undefined) {
      updateData.breakDuration = parseInt(body.breakDuration) || 15;
    }
    if (body.assignmentType !== undefined) {
      updateData.assignmentType = body.assignmentType;
    }

    // Update the division
    const updatedDivision = await db.division.update({
      where: { id: divisionId },
      data: updateData,
      include: {
        _count: {
          select: {
            groups: true,
            teams: true,
            fees: true,
          },
        },
      },
    });

    if (updateData.matchDuration !== undefined) {
      await updateDivisionMatchesEndTime(divisionId, updateData.matchDuration);
    }

    return NextResponse.json(updatedDivision);
  } catch (error) {
    console.error('Error updating division:', error);
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
    const divisionId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!divisionId) {
      return NextResponse.json(
        { error: 'Division ID is required' },
        { status: 400 }
      );
    }

    const user = session.user as any;

    // Get the division and check permissions
    const division = await db.division.findUnique({
      where: { id: divisionId },
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
            groups: true,
            teams: true,
            fees: true,
          },
        },
      },
    });

    if (!division) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      );
    }

    // Check if division has registrations or groups
    if (division._count.registrations > 0 || division._count.groups > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete division with existing registrations or groups',
        },
        { status: 400 }
      );
    }

    // Check permissions - user must have canConfigure permission
    const canDeleteDivision = await PermissionManager.canConfigureTournament(
      user.id,
      division.tournament.id
    );

    if (!canDeleteDivision) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this division' },
        { status: 403 }
      );
    }

    // Delete the division
    await db.division.delete({
      where: { id: divisionId },
    });

    return NextResponse.json({ message: 'Division deleted successfully' });
  } catch (error) {
    console.error('Error deleting division:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
