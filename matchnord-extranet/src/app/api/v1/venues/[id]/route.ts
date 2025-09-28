import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
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

    const user = session.user as any;
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get the venue and check permissions
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

    // Check permissions
    const canEditVenue =
      user.role === 'ADMIN' ||
      venue.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: venue.tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canEditVenue) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this venue' },
        { status: 403 }
      );
    }

    // Get Finland as the default country if not provided
    let countryId = body.countryId;
    if (!countryId) {
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
      countryId = finland.id;
    }

    // Update the venue
    const updatedVenue = await db.venue.update({
      where: { id: venueId },
      data: {
        name: body.name,
        streetName: body.address || body.streetName || '',
        postalCode: body.postalCode || '',
        city: body.city || '',
        countryId: countryId,
        capacity: body.capacity ? parseInt(body.capacity) : null,
        description: body.description || '',
        facilities: body.facilities || '',
        parking: body.parking || '',
        accessibility: body.accessibility || '',
        xCoordinate: body.xCoordinate ? parseFloat(body.xCoordinate) : null,
        yCoordinate: body.yCoordinate ? parseFloat(body.yCoordinate) : null,
      },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            pitches: true,
            matches: true,
          },
        },
      },
    });

    return NextResponse.json(updatedVenue);
  } catch (error) {
    console.error('Error updating venue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const user = session.user as any;

    // Get the venue and check permissions
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
        _count: {
          select: {
            matches: true,
            pitches: true,
          },
        },
      },
    });

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Check if venue has matches
    if (venue._count.matches > 0) {
      return NextResponse.json(
        { error: 'Cannot delete venue with existing matches' },
        { status: 400 }
      );
    }

    // Check permissions
    const canDeleteVenue =
      user.role === 'ADMIN' ||
      venue.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: venue.tournament.id,
          userId: user.id,
          isActive: true,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      }));

    if (!canDeleteVenue) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this venue' },
        { status: 403 }
      );
    }

    // Delete the venue
    await db.venue.delete({
      where: { id: venueId },
    });

    return NextResponse.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
