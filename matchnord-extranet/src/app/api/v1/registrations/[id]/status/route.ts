import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const UpdateTeamStatusInput = z.object({
  status: z.enum([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'WAITLISTED',
  ]),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    const body = await request.json();
    const input = UpdateTeamStatusInput.parse(body);

    // Get the team with tournament info
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        tournament: {
          include: {
            organization: true,
            createdBy: true,
          },
        },
        division: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check permissions
    const canManage =
      session.user.role === 'ADMIN' ||
      team.tournament.createdById === session.user.id ||
      team.tournament.organizationId === session.user.organizationId;

    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If approving, check if division has capacity
    if (input.status === 'APPROVED') {
      const divisionCapacity = await db.team.count({
        where: {
          divisionId: team.divisionId,
          status: 'APPROVED',
        },
      });

      if (divisionCapacity >= team.division.maxTeams) {
        return NextResponse.json(
          { error: 'Division is at maximum capacity' },
          { status: 400 }
        );
      }
    }

    // Update the team status
    const updateData: any = {
      status: input.status,
      notes: input.notes,
      updatedAt: new Date(),
    };

    // Set approval/rejection timestamps
    if (input.status === 'APPROVED' && team.status !== 'APPROVED') {
      updateData.approvedAt = new Date();
    } else if (input.status === 'REJECTED' && team.status !== 'REJECTED') {
      updateData.rejectedAt = new Date();
    }

    const updatedTeam = await db.team.update({
      where: { id: teamId },
      data: updateData,
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
            name: true,
            code: true,
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
    });

    // TODO: Send email notification to team contact person
    // if (input.status === 'APPROVED') {
    //   // Send approval email
    // } else if (input.status === 'REJECTED') {
    //   // Send rejection email
    // }

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
