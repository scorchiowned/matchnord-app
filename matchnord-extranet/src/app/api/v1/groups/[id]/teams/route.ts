import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
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
    if (!body.teamIds || !Array.isArray(body.teamIds)) {
      return NextResponse.json(
        { error: 'Team IDs array is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to assign teams to this group
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        division: {
          select: {
            id: true,
            level: true,
            name: true,
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
    const canAssignTeams =
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

    if (!canAssignTeams) {
      return NextResponse.json(
        { error: 'Insufficient permissions to assign teams' },
        { status: 403 }
      );
    }

    // Verify all teams belong to this tournament
    const teams = await db.team.findMany({
      where: {
        id: { in: body.teamIds },
        tournamentId: tournament.id,
      },
    });

    if (teams.length !== body.teamIds.length) {
      return NextResponse.json(
        { error: 'One or more teams do not belong to this tournament' },
        { status: 400 }
      );
    }

    // Teams can be assigned to any division - the division level is already determined

    // Remove teams from other groups in the same division first
    // First, find all groups in the same division
    const groupsInSameDivision = await db.group.findMany({
      where: {
        divisionId: group.division.id,
        id: { not: groupId }, // Exclude current group
      },
    });

    // Disconnect teams from all groups in the same division
    for (const otherGroup of groupsInSameDivision) {
      await db.group.update({
        where: { id: otherGroup.id },
        data: {
          teams: {
            disconnect: body.teamIds.map((teamId: string) => ({ id: teamId })),
          },
        },
      });
    }

    // Assign teams to this group
    await db.group.update({
      where: { id: groupId },
      data: {
        teams: {
          connect: body.teamIds.map((teamId: string) => ({ id: teamId })),
        },
      },
    });

    // Fetch updated group with teams
    const updatedGroup = await db.group.findUnique({
      where: { id: groupId },
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
    console.error('Error assigning teams to group:', error);
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
    const body = await request.json();

    // Validate required fields
    if (!body.teamIds || !Array.isArray(body.teamIds)) {
      return NextResponse.json(
        { error: 'Team IDs array is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to remove teams from this group
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
    const canRemoveTeams =
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

    if (!canRemoveTeams) {
      return NextResponse.json(
        { error: 'Insufficient permissions to remove teams' },
        { status: 403 }
      );
    }

    // Remove teams from this group
    await db.group.update({
      where: { id: groupId },
      data: {
        teams: {
          disconnect: body.teamIds.map((teamId: string) => ({ id: teamId })),
        },
      },
    });

    // Fetch updated group with teams
    const updatedGroup = await db.group.findUnique({
      where: { id: groupId },
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
    console.error('Error removing teams from group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
