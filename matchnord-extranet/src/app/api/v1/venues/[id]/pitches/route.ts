import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/v1/venues/[id]/pitches - Get all pitches for a venue
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const venueId = params.id;

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    const pitches = await db.pitch.findMany({
      where: { venueId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(pitches);
  } catch (error) {
    console.error('Error fetching venue pitches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/venues/[id]/pitches - Create a new pitch for a venue
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const venueId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Pitch name is required' },
        { status: 400 }
      );
    }

    // Verify venue exists and user has permission
    const venue = await db.venue.findUnique({
      where: { id: venueId },
      include: {
        tournament: {
          select: {
            id: true,
            createdById: true,
            organizationId: true,
          },
        },
      },
    });

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const user = session.user as any;

    // Check permissions (same logic as venue management)
    const hasPermission =
      user.role === 'ADMIN' ||
      venue.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: venue.tournament.id,
          userId: user.id,
          isActive: true,
        },
      }));

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to add pitches' },
        { status: 403 }
      );
    }

    // Create the pitch
    const pitch = await db.pitch.create({
      data: {
        venueId: venueId,
        name: body.name,
        number: body.number || null,
        surface: body.surface || null,
        size: body.size || null,
        description: body.description || null,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
      },
    });

    return NextResponse.json(pitch, { status: 201 });
  } catch (error) {
    console.error('Error creating pitch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



