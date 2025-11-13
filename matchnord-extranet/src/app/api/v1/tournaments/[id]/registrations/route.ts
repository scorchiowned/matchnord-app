import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tournamentId = params.id;

    // Check if user has permission to view registrations for this tournament
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        organization: true,
        createdBy: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check permissions (admin, tournament creator, or organization member)
    const canView =
      session.user.role === 'ADMIN' ||
      tournament.createdById === session.user.id ||
      tournament.organizationId === session.user.organizationId;

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all teams (registrations) for this tournament
    const teams = await db.team.findMany({
      where: { tournamentId },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
        payments: {
          select: {
            amount: true,
            status: true,
            method: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first, then APPROVED, then REJECTED
        { submittedAt: 'desc' },
      ],
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching tournament registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
