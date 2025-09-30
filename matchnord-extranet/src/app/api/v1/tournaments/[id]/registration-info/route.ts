import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;

    // Get tournament with registration info and divisions with pricing
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        description: true,
        registrationInfo: true, // Rich text content for registration form
        registrationDeadline: true,
        autoAcceptTeams: true,
        allowWaitlist: true,
        maxTeams: true,
        status: true,
        startDate: true,
        endDate: true,
        city: true,
        country: {
          select: {
            name: true,
            code: true,
          },
        },
        divisions: {
          select: {
            id: true,
            name: true,
            description: true,
            birthYear: true,
            format: true,
            level: true,
            minTeams: true,
            maxTeams: true,
            currentTeams: true,
            fees: {
              where: {
                type: 'REGISTRATION',
                isActive: true,
              },
              select: {
                id: true,
                name: true,
                description: true,
                amount: true,
                currency: true,
              },
            },
            _count: {
              select: {
                teams: {
                  where: {
                    status: {
                      in: ['APPROVED', 'PENDING'],
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if tournament is published and accepting registrations
    if (tournament.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Tournament is not accepting registrations' },
        { status: 400 }
      );
    }

    // Check if registration deadline has passed
    const isRegistrationOpen =
      !tournament.registrationDeadline ||
      new Date() <= tournament.registrationDeadline;

    if (!isRegistrationOpen) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }

    // Calculate available spots for each division
    const divisionsWithAvailability = tournament.divisions.map((division) => {
      const registrationFee = division.fees.find(
        (fee) => fee.type === 'REGISTRATION'
      );
      const availableSpots = division.maxTeams - division._count.teams;
      const isFull = availableSpots <= 0;
      const isWaitlistAvailable = tournament.allowWaitlist && isFull;

      return {
        ...division,
        registrationFee: registrationFee || null,
        availableSpots,
        isFull,
        isWaitlistAvailable,
        // Remove internal count field
        _count: undefined,
      };
    });

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        registrationInfo: tournament.registrationInfo,
        registrationDeadline: tournament.registrationDeadline,
        autoAcceptTeams: tournament.autoAcceptTeams,
        allowWaitlist: tournament.allowWaitlist,
        maxTeams: tournament.maxTeams,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        location: {
          city: tournament.city,
          country: tournament.country,
        },
        divisions: divisionsWithAvailability,
        isRegistrationOpen,
      },
    });
  } catch (error) {
    console.error('Error fetching tournament registration info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
