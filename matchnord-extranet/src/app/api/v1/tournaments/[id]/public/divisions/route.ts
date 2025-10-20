import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getTournamentVisibility,
  filterTournamentData,
} from '@/lib/tournament/visibility';

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

    // If teams are not published, return empty array
    if (!visibility.canViewTeams) {
      return NextResponse.json([]);
    }

    // Fetch divisions with related data
    const divisions = await db.division.findMany({
      where: { tournamentId },
      include: {
        groups: {
          include: {
            teams: {
              include: {
                country: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
            standings: {
              include: {
                team: true,
              },
              orderBy: [
                { points: 'desc' },
                { goalDifference: 'desc' },
                { goalsFor: 'desc' },
              ],
            },
          },
        },
        _count: {
          select: {
            teams: true,
            groups: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filter the data based on visibility rules
    const filteredDivisions = divisions.map((division) => {
      const filtered = { ...division };

      // If teams are not visible, remove team data from groups
      if (!visibility.canViewTeams) {
        filtered.groups = filtered.groups.map((group) => ({
          ...group,
          teams: [],
          standings: [],
        }));
      }

      // If schedule is not visible, remove standings
      if (!visibility.canViewStandings) {
        filtered.groups = filtered.groups.map((group) => ({
          ...group,
          standings: [],
        }));
      }

      return filtered;
    });

    return NextResponse.json(filteredDivisions);
  } catch (error) {
    console.error('Error fetching public tournament divisions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
