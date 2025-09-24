import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/v1/pitches/[id] - Get a specific pitch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pitchId = params.id;

    if (!pitchId) {
      return NextResponse.json(
        { error: 'Pitch ID is required' },
        { status: 400 }
      );
    }

    const pitch = await db.pitch.findUnique({
      where: { id: pitchId },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            tournament: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!pitch) {
      return NextResponse.json({ error: 'Pitch not found' }, { status: 404 });
    }

    return NextResponse.json(pitch);
  } catch (error) {
    console.error('Error fetching pitch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/pitches/[id] - Update a pitch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const pitchId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!pitchId) {
      return NextResponse.json(
        { error: 'Pitch ID is required' },
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

    // Get pitch with venue and tournament info for permission check
    const existingPitch = await db.pitch.findUnique({
      where: { id: pitchId },
      include: {
        venue: {
          include: {
            tournament: {
              select: {
                id: true,
                createdById: true,
                organizationId: true,
              },
            },
          },
        },
      },
    });

    if (!existingPitch) {
      return NextResponse.json({ error: 'Pitch not found' }, { status: 404 });
    }

    const user = session.user as any;

    // Check permissions
    const hasPermission =
      user.role === 'ADMIN' ||
      existingPitch.venue.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: existingPitch.venue.tournament.id,
          userId: user.id,
          isActive: true,
        },
      }));

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update pitch' },
        { status: 403 }
      );
    }

    // Update the pitch
    const pitch = await db.pitch.update({
      where: { id: pitchId },
      data: {
        name: body.name,
        number: body.number || null,
        surface: body.surface || null,
        size: body.size || null,
        description: body.description || null,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
      },
    });

    return NextResponse.json(pitch);
  } catch (error) {
    console.error('Error updating pitch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/pitches/[id] - Delete a pitch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const pitchId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!pitchId) {
      return NextResponse.json(
        { error: 'Pitch ID is required' },
        { status: 400 }
      );
    }

    // Get pitch with venue and tournament info for permission check
    const existingPitch = await db.pitch.findUnique({
      where: { id: pitchId },
      include: {
        venue: {
          include: {
            tournament: {
              select: {
                id: true,
                createdById: true,
                organizationId: true,
              },
            },
          },
        },
      },
    });

    if (!existingPitch) {
      return NextResponse.json({ error: 'Pitch not found' }, { status: 404 });
    }

    const user = session.user as any;

    // Check permissions
    const hasPermission =
      user.role === 'ADMIN' ||
      existingPitch.venue.tournament.createdById === user.id ||
      (await db.tournamentAssignment.findFirst({
        where: {
          tournamentId: existingPitch.venue.tournament.id,
          userId: user.id,
          isActive: true,
        },
      }));

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete pitch' },
        { status: 403 }
      );
    }

    // Delete the pitch
    await db.pitch.delete({
      where: { id: pitchId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pitch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



