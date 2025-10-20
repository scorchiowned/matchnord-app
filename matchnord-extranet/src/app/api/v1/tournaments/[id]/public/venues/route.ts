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

    // If basic info is not published, return empty array
    if (!visibility.canViewInfo) {
      return NextResponse.json([]);
    }

    // Fetch venues with related data
    const venues = await db.venue.findMany({
      where: { tournamentId },
      include: {
        pitches: {
          orderBy: { name: 'asc' },
        },
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform venues for public consumption
    const publicVenues = venues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      streetName: venue.streetName,
      postalCode: venue.postalCode,
      city: venue.city,
      country: venue.country,
      xCoordinate: venue.xCoordinate,
      yCoordinate: venue.yCoordinate,
      pitches: venue.pitches.map((pitch) => ({
        id: pitch.id,
        name: pitch.name,
        surface: pitch.surface,
        length: pitch.length,
        width: pitch.width,
      })),
    }));

    return NextResponse.json(publicVenues);
  } catch (error) {
    console.error('Error fetching public tournament venues:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
