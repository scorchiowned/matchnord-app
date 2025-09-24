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

    // Check if user has permission to view divisions for this tournament
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
        // Fetch divisions with related data
        const divisions = await db.division.findMany({
          where: { tournamentId },
          include: {
            _count: {
              select: {
                registrations: true,
                groups: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        });

        return NextResponse.json(divisions);
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
        // Fetch divisions with related data
        const divisions = await db.division.findMany({
          where: { tournamentId },
          include: {
            _count: {
              select: {
                registrations: true,
                groups: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        });

        return NextResponse.json(divisions);
      }
    }

    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching tournament divisions:', error);
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

    // Check if user has permission to add divisions to this tournament
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
    const canAddDivision =
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

    if (!canAddDivision) {
      return NextResponse.json(
        { error: 'Insufficient permissions to add divisions' },
        { status: 403 }
      );
    }

    // Create the division
    const division = await db.division.create({
      data: {
        name: body.name,
        description: body.description || '',
        birthYear: body.birthYear ? parseInt(body.birthYear) : null,
        format: body.format || '',
        level: body.level || 'COMPETITIVE',
        minTeams: body.minTeams ? parseInt(body.minTeams) : 4,
        maxTeams: body.maxTeams ? parseInt(body.maxTeams) : 16,
        currentTeams: 0,
        tournamentId: tournamentId,
      },
      include: {
        _count: {
          select: {
            registrations: true,
            groups: true,
          },
        },
      },
    });

    return NextResponse.json(division, { status: 201 });
  } catch (error) {
    console.error('Error creating division:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
