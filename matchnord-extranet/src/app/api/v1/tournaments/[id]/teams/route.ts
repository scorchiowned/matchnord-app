import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTournamentVisibility } from '@/lib/tournament/visibility';
import { PermissionManager } from '@/lib/permissions';

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

    // Check if teams are visible
    if (!visibility.canViewTeams) {
      return NextResponse.json(
        { error: 'Teams are not published for this tournament' },
        { status: 403 }
      );
    }

    // Fetch teams with related data
    const teams = await db.team.findMany({
      where: { tournamentId },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            players: true,
            homeMatches: true,
            awayMatches: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get all unique club IDs
    const clubIds = [...new Set(teams.map((t) => t.clubId).filter(Boolean))];

    // Fetch all clubs at once
    const clubs =
      clubIds.length > 0
        ? await db.club.findMany({
            where: {
              id: { in: clubIds as string[] },
            },
            select: {
              id: true,
              name: true,
              logo: true,
              city: true,
            },
          })
        : [];

    // Create a map for quick lookup
    const clubMap = new Map(clubs.map((c) => [c.id, c]));

    // Transform teams to include club information
    const teamsWithClubs = teams.map((team) => ({
      ...team,
      club: team.clubId ? clubMap.get(team.clubId) || null : null,
    }));

    return NextResponse.json(teamsWithClubs);
  } catch (error) {
    console.error('Error fetching tournament teams:', error);
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
    if (!body.name || !body.countryId) {
      return NextResponse.json(
        { error: 'Name and country are required' },
        { status: 400 }
      );
    }

    // Check if user has permission to add teams to this tournament
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

    // Check permissions - user must have canConfigure permission
    const canAddTeam = await PermissionManager.canConfigureTournament(
      user.id,
      tournamentId
    );

    if (!canAddTeam) {
      return NextResponse.json(
        { error: 'Insufficient permissions to add teams' },
        { status: 403 }
      );
    }

    // Validate division exists if provided
    if (body.divisionId) {
      const division = await db.division.findUnique({
        where: { id: body.divisionId },
        select: { id: true, tournamentId: true },
      });

      if (!division) {
        return NextResponse.json(
          { error: 'Division not found' },
          { status: 404 }
        );
      }

      if (division.tournamentId !== tournamentId) {
        return NextResponse.json(
          { error: 'Division does not belong to this tournament' },
          { status: 400 }
        );
      }
    }

    // Create the team
    // Teams added directly by admins/managers should be APPROVED by default
    const team = await db.team.create({
      data: {
        name: body.name,
        shortName: body.shortName || body.name.substring(0, 3).toUpperCase(),
        clubId: body.clubId || null,
        city: body.city || '',
        countryId: body.countryId,
        divisionId: body.divisionId || null,
        tournamentId: tournamentId,
        managerId: body.managerId || null,
        status: 'APPROVED', // Teams added directly are approved immediately
        approvedAt: new Date(),
        submittedAt: new Date(),
      },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            players: true,
            homeMatches: true,
            awayMatches: true,
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
