import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);

    const where: Record<string, unknown> = {};

    // Apply role-based filtering
    if (session?.user) {
      const user = session.user as any;

      if (user.role === 'ADMIN') {
        // Admins can see all teams - no additional filtering
      } else if (user.role === 'TEAM_MANAGER') {
        // Team managers can only see teams from tournaments they created or are assigned to manage
        where.tournament = {
          OR: [
            { createdById: user.id }, // Tournaments they created
            {
              assignments: {
                some: {
                  userId: user.id,
                  role: { in: ['MANAGER', 'ADMIN'] },
                },
              },
            },
          ],
        };
      } else if (user.role === 'TOURNAMENT_ADMIN') {
        // Tournament admins can only see teams from tournaments they're assigned to
        where.tournament = {
          assignments: {
            some: {
              userId: user.id,
              role: { in: ['ADMIN', 'MANAGER'] },
            },
          },
        };
      } else if (user.role === 'REFEREE') {
        // Referees can only see teams from tournaments where they have match assignments
        where.tournament = {
          assignments: {
            some: {
              userId: user.id,
              role: 'REFEREE',
            },
          },
        };
      } else {
        // Unknown role - return empty results
        where.id = 'nonexistent';
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

    // Check permissions: Admin, Team Manager (if they created the tournament), or Tournament Admin/Manager
    const hasPermission =
      user.role === 'ADMIN' ||
      tournament.createdById === user.id ||
      tournament.assignments.some(
        (assignment) =>
          assignment.role === 'ADMIN' || assignment.role === 'MANAGER'
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
