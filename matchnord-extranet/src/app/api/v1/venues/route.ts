import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const venues = await db.venue.findMany({
      select: {
        id: true,
        name: true,
        streetName: true,
        postalCode: true,
        city: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get Finland as the default country
    const finland = await db.country.findFirst({
      where: { code: 'FI' },
      select: { id: true },
    });

    if (!finland) {
      return NextResponse.json(
        { error: 'Default country not found' },
        { status: 500 }
      );
    }

    // For now, we'll use a default tournament ID since venues are tied to tournaments
    // In a real app, you'd get this from the user's context or form
    const defaultTournamentId = 'default-tournament-id';

    const venue = await db.venue.create({
      data: {
        name: body.name,
        streetName: body.streetName || '',
        postalCode: body.postalCode || '',
        city: body.city || '',
        countryId: finland.id,
        tournamentId: defaultTournamentId,
      },
    });

    return NextResponse.json(venue, { status: 201 });
  } catch (error) {
    console.error('Error creating venue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
