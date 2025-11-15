import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTournamentVisibility } from '@/lib/tournament/visibility';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Check tournament visibility for public access
    const visibility = await getTournamentVisibility({
      tournamentId,
    });

    // If tournament is not visible at all, deny access
    if (!visibility.canViewTournament) {
      return NextResponse.json(
        { error: 'Tournament not found or access denied' },
        { status: 404 }
      );
    }

    // If teams are not published, return empty array (groups contain teams)
    if (!visibility.canViewTeams) {
      return NextResponse.json([]);
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
            logo: true,
            club: true,
            clubRef: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
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

