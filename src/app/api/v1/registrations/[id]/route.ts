import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { emailService } from '@/lib/email';

const ParamsSchema = z.object({
  id: z.string(),
});

const UpdateRegistrationInput = z.object({
  status: z
    .enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'WAITLISTED'])
    .optional(),
  notes: z.string().optional(),
  processedAt: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = ParamsSchema.parse(params);

    const registration = await db.registration.findUnique({
      where: { id },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            contactEmail: true,
          },
        },
        division: {
          select: {
            id: true,
            name: true,
            fees: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            paidAt: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            players: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                jerseyNumber: true,
              },
            },
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(registration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching registration:', error);
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
    const { id } = ParamsSchema.parse(params);
    const body = await request.json();
    const input = UpdateRegistrationInput.parse(body);

    const registration = await db.registration.findUnique({
      where: { id },
      include: {
        division: true,
        payments: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Update registration
    const updatedRegistration = await db.registration.update({
      where: { id },
      data: {
        status: input.status,
        notes: input.notes,
        processedAt: input.processedAt
          ? new Date(input.processedAt)
          : undefined,
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
          },
        },
      },
    });

    // If status changed to APPROVED, update payment status
    if (
      input.status === 'APPROVED' &&
      registration.payments?.[0]?.status === 'PENDING'
    ) {
      await db.payment.update({
        where: { id: registration.payments[0].id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });
    }

    // Send email notification to manager about status change
    if (input.status && input.status !== registration.status) {
      try {
        await emailService.sendRegistrationStatusUpdate({
          to: updatedRegistration.manager.email || '',
          teamName: updatedRegistration.teamName,
          tournamentName: updatedRegistration.tournament.name,
          status: input.status as 'APPROVED' | 'REJECTED' | 'WAITLISTED',
          managerName: updatedRegistration.manager.name || '',
          notes: input.notes,
        });
        console.log('✅ Registration status update email sent successfully');
      } catch (emailError) {
        console.error(
          '❌ Failed to send registration status update email:',
          emailError
        );
        // Don't fail the update if email fails
      }
    }

    // TODO: Send notification to tournament organizers
    // TODO: Update team count in division if needed
    // TODO: Send webhook notifications

    return NextResponse.json({
      success: true,
      registration: updatedRegistration,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating registration:', error);
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
    const { id } = ParamsSchema.parse(params);

    const registration = await db.registration.findUnique({
      where: { id },
      include: {
        division: true,
        payments: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Check if registration can be deleted (not approved/paid)
    if (
      registration.status === 'APPROVED' &&
      registration.payments?.[0]?.status === 'PAID'
    ) {
      return NextResponse.json(
        { error: 'Cannot delete approved and paid registration' },
        { status: 400 }
      );
    }

    // Update division team count
    await db.division.update({
      where: { id: registration.divisionId || undefined },
      data: {
        currentTeams: {
          decrement: 1,
        },
      },
    });

    // Delete registration (this will cascade to payment due to foreign key)
    await db.registration.delete({
      where: { id },
    });

    // In a real app, you would:
    // 1. Send cancellation email to manager
    // 2. Process refund if payment was made
    // 3. Send notification to tournament organizers
    // 4. Send webhook notifications

    return NextResponse.json({
      success: true,
      message: 'Registration deleted successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
