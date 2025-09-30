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
  // Contact person details
  contactFirstName: z.string().min(1).max(255),
  contactLastName: z.string().min(1).max(255),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1).max(255),
  contactAddress: z.string().min(1).max(500),
  contactPostalCode: z.string().min(1).max(20),
  contactCity: z.string().min(1).max(255),
  // Billing address (optional)
  billingName: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(255).optional()
  ),
  billingAddress: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(500).optional()
  ),
  billingPostalCode: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(20).optional()
  ),
  billingCity: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().max(255).optional()
  ),
  billingEmail: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().email().optional()
  ),
  // Terms and conditions
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
              select: { teams: true },
            },
            fees: true,
          },
        },
        country: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'PUBLISHED') {
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
    if (division._count.teams >= division.maxTeams) {
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

    // For public registrations, we don't create application users
    // The team registration is standalone and doesn't require user authentication

    // Create the team directly
    const team = await db.team.create({
      data: {
        tournamentId: input.tournamentId,
        divisionId: input.divisionId,
        managerId: null, // No user account required for public registrations
        name: input.teamName,
        club: input.club,
        city: input.city,
        countryId: tournament.countryId, // Use tournament's country
        level: input.level,
        // Contact person details
        contactFirstName: input.contactFirstName,
        contactLastName: input.contactLastName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        contactAddress: input.contactAddress,
        contactPostalCode: input.contactPostalCode,
        contactCity: input.contactCity,
        // Billing address (optional)
        billingName: input.billingName,
        billingAddress: input.billingAddress,
        billingPostalCode: input.billingPostalCode,
        billingCity: input.billingCity,
        billingEmail: input.billingEmail,
        // Registration status
        status: tournament.autoAcceptTeams ? 'APPROVED' : 'PENDING',
        isWaitlisted: division._count.teams >= division.maxTeams,
        submittedAt: new Date(),
        approvedAt: tournament.autoAcceptTeams ? new Date() : null,
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
        country: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create payment record if there are fees
    let payment = null;
    if (division.fees && division.fees.length > 0) {
      const totalFee = division.fees.reduce((sum, fee) => sum + fee.amount, 0);
      if (totalFee > 0) {
        payment = await db.payment.create({
          data: {
            tournamentId: input.tournamentId,
            teamId: team.id,
            amount: totalFee,
            currency: 'EUR',
            status: 'PENDING',
          },
        });
      }
    }

    // Update division team count
    await db.division.update({
      where: { id: input.divisionId },
      data: {
        currentTeams: {
          increment: 1,
        },
      },
    });

    // Send confirmation email to manager
    try {
      await emailService.sendRegistrationConfirmation({
        to: input.contactEmail,
        teamName: team.name,
        tournamentName: team.tournament?.name || 'Unknown Tournament',
        divisionName: team.division?.name || 'Unknown Division',
        managerName: `${input.contactFirstName} ${input.contactLastName}`,
        registrationId: team.id,
        paymentAmount: payment?.amount || 0,
        paymentMethod: payment?.method || undefined,
        tournamentStartDate: tournament.startDate.toLocaleDateString(),
        tournamentLocation: `${tournament.city || 'TBD'}, ${tournament.country?.name || 'TBD'}`,
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
        id: team.id,
        teamName: team.name,
        division: team.division?.name || 'Unknown Division',
        tournament: team.tournament?.name || 'Unknown Tournament',
        status: team.status,
        amount: payment?.amount || 0,
        paymentMethod: payment?.method || undefined,
        submittedAt: team.submittedAt,
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

    const teams = await db.team.findMany({
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
        country: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await db.team.count({ where });

    return NextResponse.json({
      registrations: teams, // Keep the same response structure for compatibility
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
