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

    // If schedule is not published, return empty array
    if (!visibility.canViewSchedule || !visibility.canViewMatches) {
      return NextResponse.json([]);
    }

    // Fetch matches with related data
    const matches = await db.match.findMany({
      where: { tournamentId },
      include: {
        homeTeam: {
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
        awayTeam: {
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
        venue: {
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
        pitch: true,
        group: {
          include: {
            division: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ startTime: 'asc' }, { venue: { name: 'asc' } }],
    });

    // Transform matches for public consumption
    const publicMatches = matches.map((match) => ({
      id: match.id,
      startTime: match.startTime,
      endTime: match.endTime,
      status: match.status,
      homeTeam: match.homeTeam
        ? {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            shortName: match.homeTeam.shortName,
            country: match.homeTeam.country,
          }
        : null,
      awayTeam: match.awayTeam
        ? {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            shortName: match.awayTeam.shortName,
            country: match.awayTeam.country,
          }
        : null,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      venue: match.venue
        ? {
            id: match.venue.id,
            name: match.venue.name,
            streetName: match.venue.streetName,
            postalCode: match.venue.postalCode,
            city: match.venue.city,
            country: match.venue.country,
          }
        : null,
      pitch: match.pitch
        ? {
            id: match.pitch.id,
            name: match.pitch.name,
            surface: match.pitch.surface,
          }
        : null,
      group: match.group
        ? {
            id: match.group.id,
            name: match.group.name,
            division: match.group.division,
          }
        : null,
      notes: match.notes,
    }));

    return NextResponse.json(publicMatches);
  } catch (error) {
    console.error('Error fetching public tournament matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
