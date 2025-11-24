import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PermissionManager } from '@/lib/permissions';
import { emailService } from '@/lib/email';
import { env } from '@/lib/env';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; invitationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tournamentId = params.id;
    const invitationId = params.invitationId;
    const userId = (session.user as any).id;

    // Check if user has permission to resend invitations (must have canConfigure)
    const canResend = await PermissionManager.canConfigureTournament(
      userId,
      tournamentId
    );

    if (!canResend) {
      return NextResponse.json(
        { error: 'Insufficient permissions to resend invitations' },
        { status: 403 }
      );
    }

    // Find the invitation
    const invitation = await db.userInvitation.findUnique({
      where: { id: invitationId },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation belongs to this tournament
    if (!invitation.tournamentId || invitation.tournamentId !== tournamentId) {
      return NextResponse.json(
        { error: 'Invitation does not belong to this tournament' },
        { status: 400 }
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only resend pending invitations' },
        { status: 400 }
      );
    }

    // Get tournament info separately (UserInvitation doesn't have a tournament relation)
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, name: true },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Update expiration date (extend by 7 days from now)
    const newExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await db.userInvitation.update({
      where: { id: invitationId },
      data: {
        expires: newExpires,
        updatedAt: new Date(),
      },
    });

    // Send invitation email
    const invitationUrl = `${env.NEXTAUTH_URL}/en/auth/accept-invitation?token=${invitation.token}`;
    let emailSent = false;
    let emailError: string | null = null;

    try {
      // Get inviter name - fallback to current user if inviter relation is missing
      let inviterName = 'Tournament Organizer';
      if (invitation.inviter?.name) {
        inviterName = invitation.inviter.name;
      } else if (session.user?.name) {
        inviterName = session.user.name;
      }

      const emailResult = await emailService.sendUserInvitation({
        to: invitation.email,
        invitedName: invitation.email.split('@')[0],
        inviterName: inviterName,
        tournamentName: tournament.name,
        tournamentId: tournamentId,
        canConfigure: invitation.canConfigure,
        canManageScores: invitation.canManageScores,
        isReferee: invitation.isReferee,
        invitationUrl,
        from: env.EMAIL_FROM || 'noreply@tournament.com',
      });

      if (emailResult.success) {
        emailSent = true;
      } else {
        emailError = emailResult.error || 'Email service not configured';
        console.warn('Email not sent:', emailError);
      }
    } catch (emailError_) {
      emailError = emailError_ instanceof Error ? emailError_.message : 'Unknown error';
      console.error('Failed to send invitation email:', emailError_);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: emailSent
        ? 'Invitation resent successfully'
        : 'Invitation updated, but email could not be sent',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        invitationUrl,
        emailSent,
        emailError,
        expires: newExpires.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

