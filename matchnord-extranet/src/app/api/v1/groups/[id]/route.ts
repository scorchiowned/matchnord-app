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
    const groupId = params.id;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to view this group
    if (session?.user) {
      const user = session.user as any;

      // Fetch group with related data
      const group = await db.group.findUnique({
        where: { id: groupId },
        include: {
          division: {
            select: {
              id: true,
              name: true,
              level: true,
              tournament: {
                select: {
                  id: true,
                  createdById: true,
                  organizationId: true,
                },
              },
            },
          },
          teams: {
            select: {
              id: true,
              name: true,
              shortName: true,
              club: true,
              city: true,
            },
          },
          _count: {
            select: {
              teams: true,
              matches: true,
            },
          },
        },
      });

      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      // Check permissions
      const tournament = group.division.tournament;
      const hasAccess =
        user.role === 'ADMIN' ||
        tournament.createdById === user.id ||
        (await db.tournamentAssignment.findFirst({
          where: {
            tournamentId: tournament.id,
            userId: user.id,
            isActive: true,
          },
        }));

      if (hasAccess) {
        return NextResponse.json(group);
      }
    }

    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching group:', error);
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
    const groupId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const user = session.user as any;
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if user has permission to update this group
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        division: {
          select: {
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

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const tournament = group.division.tournament;
    const canUpdateGroup =
      user.role === 'ADMIN' ||
      tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canUpdateGroup) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update group' },
        { status: 403 }
      );
    }

    // Update the group
    const updatedGroup = await db.group.update({
      where: { id: groupId },
      data: {
        name: body.name,
      },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            shortName: true,
            club: true,
            city: true,
          },
        },
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
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
    const groupId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const user = session.user as any;

    // Check if user has permission to delete this group
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        division: {
          select: {
            tournament: {
              select: {
                id: true,
                createdById: true,
                organizationId: true,
              },
            },
          },
        },
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const tournament = group.division.tournament;
    const canDeleteGroup =
      user.role === 'ADMIN' ||
      tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canDeleteGroup) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete group' },
        { status: 403 }
      );
    }

    // Check if group has teams or matches
    if (group._count.teams > 0) {
      return NextResponse.json(
        { error: 'Cannot delete group with teams. Remove teams first.' },
        { status: 400 }
      );
    }

    if (group._count.matches > 0) {
      return NextResponse.json(
        { error: 'Cannot delete group with matches. Remove matches first.' },
        { status: 400 }
      );
    }

    // Delete the group
    await db.group.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
