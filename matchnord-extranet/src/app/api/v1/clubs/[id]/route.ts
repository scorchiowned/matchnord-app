import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const club = await db.club.findUnique({
      where: { id: params.id },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teams: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
              },
            },
            division: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    return NextResponse.json(club);
  } catch (error) {
    console.error('Error fetching club:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user as any;

    // Only admins can update clubs
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      shortName,
      logo,
      city,
      countryId,
      website,
      description,
      foundedYear,
    } = body;

    // Check if club exists
    const existingClub = await db.club.findUnique({
      where: { id: params.id },
    });

    if (!existingClub) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== existingClub.name) {
      const nameConflict = await db.club.findFirst({
        where: {
          name,
          id: { not: params.id },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Club with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update the club
    const updatedClub = await db.club.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(shortName !== undefined && { shortName }),
        ...(logo !== undefined && { logo }),
        ...(city !== undefined && { city }),
        ...(countryId && { countryId }),
        ...(website !== undefined && { website }),
        ...(description !== undefined && { description }),
        ...(foundedYear !== undefined && {
          foundedYear: foundedYear ? parseInt(foundedYear) : null,
        }),
      },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(updatedClub);
  } catch (error) {
    console.error('Error updating club:', error);
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

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = session.user as any;

    // Only admins can delete clubs
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if club exists
    const existingClub = await db.club.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    if (!existingClub) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Check if club has teams
    if (existingClub._count.teams > 0) {
      return NextResponse.json(
        { error: 'Cannot delete club with existing teams' },
        { status: 409 }
      );
    }

    // Delete the club
    await db.club.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Club deleted successfully' });
  } catch (error) {
    console.error('Error deleting club:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
