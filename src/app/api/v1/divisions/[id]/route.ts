import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
            registrations: true,
            groups: true,
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

    // Check permissions
    const canViewDivision =
      user.role === 'ADMIN' ||
      user.role === 'TEAM_MANAGER' ||
      division.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: division.tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER', 'TEAM_MANAGER'] },
        },
      }));

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

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

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

    // Check permissions
    const canEditDivision =
      user.role === 'ADMIN' ||
      division.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: division.tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canEditDivision) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this division' },
        { status: 403 }
      );
    }

    // Update the division
    const updatedDivision = await db.division.update({
      where: { id: divisionId },
      data: {
        name: body.name,
        description: body.description || '',
        birthYear: body.birthYear ? parseInt(body.birthYear) : null,
        format: body.format || '',
        level: body.level || 'COMPETITIVE',
        minTeams: body.minTeams ? parseInt(body.minTeams) : 4,
        maxTeams: body.maxTeams ? parseInt(body.maxTeams) : 16,
      },
      include: {
        _count: {
          select: {
            registrations: true,
            groups: true,
          },
        },
      },
    });

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
            registrations: true,
            groups: true,
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

    // Check permissions
    const canDeleteDivision =
      user.role === 'ADMIN' ||
      division.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: division.tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

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
