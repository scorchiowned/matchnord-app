import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTournamentVisibility } from '@/lib/tournament/visibility';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const tournamentId = params.id;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Get user context
    const user = session?.user as any;
    const userId = user?.id;
    const userRole = user?.role;

    // Check tournament visibility
    const visibility = await getTournamentVisibility({
      userId,
      userRole,
      tournamentId,
    });

    // Check if teams are visible (groups contain teams)
    if (!visibility.canViewTeams) {
      return NextResponse.json(
        { error: 'Teams are not published for this tournament' },
        { status: 403 }
      );
    }

    // Fetch groups with related data
    const groups = await db.group.findMany({
      where: {
        division: {
          tournamentId: tournamentId,
        },
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
      orderBy: [{ division: { name: 'asc' } }, { name: 'asc' }],
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching tournament groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const tournamentId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    const user = session.user as any;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.divisionId) {
      return NextResponse.json(
        { error: 'Name and division ID are required' },
        { status: 400 }
      );
    }

    // Check if user has permission to add groups to this tournament
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        createdById: true,
        organizationId: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canAddGroup =
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

    if (!canAddGroup) {
      return NextResponse.json(
        { error: 'Insufficient permissions to add groups' },
        { status: 403 }
      );
    }

    // Verify division belongs to this tournament
    const division = await db.division.findFirst({
      where: {
        id: body.divisionId,
        tournamentId: tournamentId,
      },
    });

    if (!division) {
      return NextResponse.json(
        { error: 'Division not found or does not belong to this tournament' },
        { status: 400 }
      );
    }

    // Create the group
    const group = await db.group.create({
      data: {
        name: body.name,
        divisionId: body.divisionId,
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

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
