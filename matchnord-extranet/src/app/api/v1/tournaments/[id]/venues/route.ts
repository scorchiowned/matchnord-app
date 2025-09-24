import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    // Check if user has permission to view venues for this tournament
    if (session?.user) {
      const user = session.user as any;

      // Check if user has access to this tournament
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

      // Admins can see all tournaments
      if (user.role === 'ADMIN') {
        // Fetch venues with pitches for match management
        const venues = await db.venue.findMany({
          where: { tournamentId },
          select: {
            id: true,
            name: true,
            streetName: true,
            postalCode: true,
            city: true,
            pitches: {
              select: {
                id: true,
                name: true,
                number: true,
                surface: true,
                size: true,
                isAvailable: true,
              },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        });

        return NextResponse.json(venues);
      }

      // Check if user created this tournament or has assignments
      const hasAccess =
        tournament.createdById === user.id ||
        (await db.tournamentAssignment.findFirst({
          where: {
            tournamentId: tournament.id,
            userId: user.id,
            isActive: true,
          },
        }));

      if (hasAccess) {
        // Fetch venues with pitches for match management
        const venues = await db.venue.findMany({
          where: { tournamentId },
          select: {
            id: true,
            name: true,
            streetName: true,
            postalCode: true,
            city: true,
            pitches: {
              select: {
                id: true,
                name: true,
                number: true,
                surface: true,
                size: true,
                isAvailable: true,
              },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        });

        return NextResponse.json(venues);
      }
    }

    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching tournament venues:', error);
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
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if user has permission to add venues to this tournament
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

    // Check permissions
    const canAddVenue =
      user.role === 'ADMIN' ||
      tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canAddVenue) {
      return NextResponse.json(
        { error: 'Insufficient permissions to add venues' },
        { status: 403 }
      );
    }

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

    // Create the venue
    const venue = await db.venue.create({
      data: {
        name: body.name,
        streetName: body.streetName || '',
        postalCode: body.postalCode || '',
        city: body.city || '',
        countryId: finland.id,
        tournamentId: tournamentId,
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
