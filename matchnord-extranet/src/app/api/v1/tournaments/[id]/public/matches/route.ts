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

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const divisionId = searchParams.get('divisionId');
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause for filtering
    const where: any = { tournamentId };

    // Filter by division (through group)
    if (divisionId) {
      where.group = {
        divisionId: divisionId,
      };
    }

    // Filter by group
    if (groupId) {
      where.groupId = groupId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by date range
    if (startDate) {
      where.startTime = {
        ...where.startTime,
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      where.startTime = {
        ...where.startTime,
        lte: new Date(endDate),
      };
    }

    // Fetch matches with related data
    const matches = await db.match.findMany({
      where,
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
            clubRef: {
              select: {
                id: true,
                name: true,
                logo: true,
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
            clubRef: {
              select: {
                id: true,
                name: true,
                logo: true,
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
                level: true,
                matchDuration: true,
                breakDuration: true,
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
      matchNumber: match.matchNumber || null,
      startTime: match.startTime,
      endTime: match.endTime,
      status: match.status,
      homeTeam: match.homeTeam
        ? {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            shortName: match.homeTeam.shortName,
            logo: match.homeTeam.logo || null,
            country: match.homeTeam.country,
            clubRef: match.homeTeam.clubRef,
          }
        : null,
      awayTeam: match.awayTeam
        ? {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            shortName: match.awayTeam.shortName,
            logo: match.awayTeam.logo || null,
            country: match.awayTeam.country,
            clubRef: match.awayTeam.clubRef,
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
            division: match.group.division
              ? {
                  id: match.group.division.id,
                  name: match.group.division.name,
                  level: match.group.division.level || null,
                  matchDuration: match.group.division.matchDuration || null,
                  breakDuration: match.group.division.breakDuration || null,
                }
              : null,
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
