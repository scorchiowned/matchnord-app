import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PermissionManager } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await db.userInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation has already been used or expired' },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expires) {
      // Mark as expired
      await db.userInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if email matches
    const user = session.user as any;
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    // Create or update tournament assignment
    if (invitation.tournamentId) {
      // Check if assignment already exists
      const existingAssignment = await db.tournamentAssignment.findUnique({
        where: {
          userId_tournamentId: {
            userId: user.id,
            tournamentId: invitation.tournamentId,
          },
        },
      });

      if (existingAssignment) {
        // Update existing assignment
        await db.tournamentAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            canConfigure: invitation.canConfigure,
            canManageScores: invitation.canManageScores,
            isReferee: invitation.isReferee,
            isActive: true,
            assignedBy: invitation.inviterId,
          },
        });
      } else {
        // Create new assignment
        await db.tournamentAssignment.create({
          data: {
            userId: user.id,
            tournamentId: invitation.tournamentId,
            canConfigure: invitation.canConfigure,
            canManageScores: invitation.canManageScores,
            isReferee: invitation.isReferee,
            assignedBy: invitation.inviterId,
            isActive: true,
          },
        });
      }
    }

    // Mark invitation as accepted
    await db.userInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        invitedUserId: user.id,
      },
    });

    // Get tournament info if tournamentId exists
    let tournament: { id: string; name: string } | null = null;
    if (invitation.tournamentId) {
      const tournamentData = await db.tournament.findUnique({
        where: { id: invitation.tournamentId },
        select: { id: true, name: true },
      });
      tournament = tournamentData;
    }

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      tournament,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

