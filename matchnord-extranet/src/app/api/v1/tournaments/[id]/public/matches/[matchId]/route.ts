import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTournamentVisibility } from '@/lib/tournament/visibility';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } }
) {
  try {
    const tournamentId = params.id;
    const matchId = params.matchId;

    if (!tournamentId || !matchId) {
      return NextResponse.json(
        { error: 'Tournament ID and Match ID are required' },
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

    // If schedule is not published, deny access
    if (!visibility.canViewSchedule || !visibility.canViewMatches) {
      return NextResponse.json(
        { error: 'Match schedule is not published' },
        { status: 403 }
      );
    }

    // Fetch match with related data
    const match = await db.match.findUnique({
      where: {
        id: matchId,
        tournamentId: tournamentId, // Ensure match belongs to this tournament
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            club: true,
            city: true,
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
                city: true,
              },
            },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            club: true,
            city: true,
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
                city: true,
              },
            },
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            streetName: true,
            postalCode: true,
            city: true,
            xCoordinate: true,
            yCoordinate: true,
            country: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        pitch: {
          select: {
            id: true,
            name: true,
            number: true,
            surface: true,
            size: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            division: {
              select: {
                id: true,
                name: true,
                level: true,
                format: true,
                matchDuration: true,
                breakDuration: true,
              },
            },
          },
        },
        division: {
          select: {
            id: true,
            name: true,
            level: true,
            format: true,
            matchDuration: true,
            breakDuration: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Transform match for public consumption
    const publicMatch = {
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
            club: match.homeTeam.club,
            city: match.homeTeam.city,
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
            club: match.awayTeam.club,
            city: match.awayTeam.city,
            country: match.awayTeam.country,
            clubRef: match.awayTeam.clubRef,
          }
        : null,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      spectators: match.spectators,
      venue: match.venue,
      pitch: match.pitch,
      group: match.group,
      division: match.division,
      notes: match.notes,
    };

    return NextResponse.json(publicMatch);
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

