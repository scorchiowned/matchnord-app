import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PermissionManager } from '@/lib/permissions';

export async function GET() {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);

    const where: Record<string, unknown> = {};

    // Apply permission-based filtering
    if (session?.user) {
      const user = session.user as any;

      if (user.role === 'ADMIN') {
        // Admins can see all teams - no additional filtering
      } else {
        // Users can see teams from tournaments they created or have any assignment to
        where.tournament = {
          OR: [
            { createdById: user.id }, // Tournaments they created (owners)
            {
              assignments: {
                some: {
                  userId: user.id,
                  isActive: true,
                  // User has any permission
                  OR: [
                    { canConfigure: true },
                    { canManageScores: true },
                    { isReferee: true },
                  ],
                },
              },
            },
          ],
        };
      }
    } else {
      // No session - return empty results
      where.id = 'nonexistent';
    }

    const teams = await db.team.findMany({
      where,
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        clubRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            homeMatches: true,
            awayMatches: true,
            players: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const user = session.user as any;

    // Validate required fields
    if (!body.name || !body.tournamentId || !body.countryId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, tournamentId, countryId' },
        { status: 400 }
      );
    }

    // Check if user has permission to add teams to this tournament
    const tournament = await db.tournament.findUnique({
      where: { id: body.tournamentId },
      include: {
        assignments: {
          where: { userId: user.id },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check permissions: User must have canConfigure permission
    const hasPermission = await PermissionManager.canConfigureTournament(
      user.id,
      body.tournamentId
      );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to add teams to this tournament' },
        { status: 403 }
      );
    }

    const team = await db.team.create({
      data: {
        name: body.name,
        shortName: body.shortName,
        club: body.club,
        city: body.city,
        countryId: body.countryId,
        level: body.level,
        tournamentId: body.tournamentId,
      },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
