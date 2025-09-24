import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { z } from 'zod';
import { db } from '@/lib/db';
import { emailService } from '@/lib/email';

const CreateRegistrationInput = z.object({
  tournamentId: z.string().min(1),
  divisionId: z.string().min(1),
  teamName: z.string().min(1).max(255),
  club: z.string().min(1).max(255),
  city: z.string().min(1).max(255),
  country: z.string().min(1).max(255),
  level: z.string().optional(),
  managerName: z.string().min(1).max(255),
  managerEmail: z.string().email(),
  managerPhone: z.string().min(1).max(255),
  playerCount: z.number().min(1).max(25),
  ageRange: z.string().optional(),
  specialNotes: z.string().optional(),
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'INVOICE']),
  acceptTerms: z.boolean(),
  acceptPrivacy: z.boolean(),
  marketingConsent: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = CreateRegistrationInput.parse(body);

    // Validate that the tournament exists and is accepting registrations
    const tournament = await db.tournament.findUnique({
      where: { id: input.tournamentId },
      include: {
        divisions: {
          where: { id: input.divisionId },
          include: {
            _count: {
              select: { registrations: true },
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

    if (!tournament.isPublished) {
      return NextResponse.json(
        { error: 'Tournament is not accepting registrations' },
        { status: 400 }
      );
    }

    const division = tournament.divisions[0];
    if (!division) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      );
    }

    // Check if division is full
    if (division._count.registrations >= division.maxTeams) {
      return NextResponse.json({ error: 'Division is full' }, { status: 400 });
    }

    // Check if registration deadline has passed
    if (
      tournament.registrationDeadline &&
      new Date() > tournament.registrationDeadline
    ) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }

    // Create or find user for the manager
    let user = await db.user.findUnique({
      where: { email: input.managerEmail },
    });

    let isNewUser = false;
    if (!user) {
      user = await db.user.create({
        data: {
          name: input.managerName,
          email: input.managerEmail,
          phone: input.managerPhone,
          role: 'TEAM_MANAGER',
        },
      });
      isNewUser = true;
    }

    // Create the registration
    const registration = await db.registration.create({
      data: {
        tournamentId: input.tournamentId,
        divisionId: input.divisionId,
        managerId: user.id,
        teamName: input.teamName,
        club: input.club,
        city: input.city,
        country: input.country,
        level: input.level,
        contactEmail: input.managerEmail,
        contactPhone: input.managerPhone,
        notes: input.specialNotes,
        status: tournament.autoAcceptTeams ? 'APPROVED' : 'PENDING',
        isWaitlisted: division._count.registrations >= division.maxTeams,
      },
      include: {
        tournament: {
          select: {
            name: true,
            contactEmail: true,
          },
        },
        division: {
          select: {
            name: true,
            fees: true,
          },
        },
      },
    });

    // Create payment record
    const payment = await db.payment.create({
      data: {
        tournamentId: input.tournamentId,
        registrationId: registration.id,
        amount: (division as any).fees || 0,
        currency: 'EUR',
        status: 'PENDING',
        method: input.paymentMethod,
      },
    });

    // Update division team count
    await db.division.update({
      where: { id: input.divisionId },
      data: {
        currentTeams: {
          increment: 1,
        },
      },
    });

    // Send welcome email to new Team Manager
    if (isNewUser) {
      try {
        await emailService.sendTeamManagerWelcome({
          to: input.managerEmail,
          managerName: input.managerName,
          email: input.managerEmail,
          loginUrl: `${env.NEXTAUTH_URL}/auth/signin`,
          isNewUser: true,
        });
        console.log('✅ Team Manager welcome email sent successfully');
      } catch (emailError) {
        console.error(
          '❌ Failed to send Team Manager welcome email:',
          emailError
        );
        // Don't fail the registration if email fails
      }
    }

    // Send confirmation email to manager
    try {
      await emailService.sendRegistrationConfirmation({
        to: input.managerEmail,
        teamName: registration.teamName,
        tournamentName:
          (registration as any).tournament?.name || 'Unknown Tournament',
        divisionName:
          (registration as any).division?.name || 'Unknown Division',
        managerName: input.managerName,
        registrationId: registration.id,
        paymentAmount: payment.amount,
        paymentMethod: payment.method || undefined,
        tournamentStartDate: tournament.startDate.toLocaleDateString(),
        tournamentLocation: `${tournament.city || 'TBD'}, ${(tournament as any).country?.name || 'TBD'}`,
      });
      console.log('✅ Registration confirmation email sent successfully');
    } catch (emailError) {
      console.error(
        '❌ Failed to send registration confirmation email:',
        emailError
      );
      // Don't fail the registration if email fails
    }

    // TODO: Send notification email to tournament organizers
    // TODO: Process payment if immediate payment is required
    // TODO: Send webhook notifications

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        teamName: registration.teamName,
        division: (registration as any).division?.name || 'Unknown Division',
        tournament:
          (registration as any).tournament?.name || 'Unknown Tournament',
        status: registration.status,
        amount: payment.amount,
        paymentMethod: payment.method || undefined,
        submittedAt: registration.submittedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tournamentId = url.searchParams.get('tournamentId');
    const divisionId = url.searchParams.get('divisionId');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const where: any = {};

    if (tournamentId) {
      where.tournamentId = tournamentId;
    }

    if (divisionId) {
      where.divisionId = divisionId;
    }

    if (status) {
      where.status = status;
    }

    const registrations = await db.registration.findMany({
      where,
      include: {
        tournament: {
          select: {
            name: true,
          },
        },
        division: {
          select: {
            name: true,
          },
        },
        manager: {
          select: {
            name: true,
            email: true,
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
      orderBy: {
        submittedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await db.registration.count({ where });

    return NextResponse.json({
      registrations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
