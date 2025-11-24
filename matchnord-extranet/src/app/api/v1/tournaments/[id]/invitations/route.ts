import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PermissionManager } from '@/lib/permissions';
import { emailService } from '@/lib/email';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { env } from '@/lib/env';

const CreateInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  canConfigure: z.boolean().default(false),
  canManageScores: z.boolean().default(false),
  isReferee: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const userId = (session.user as any).id;

    // Check if user has permission to invite (must have canConfigure)
    const canInvite = await PermissionManager.canConfigureTournament(
      userId,
      tournamentId
    );

    if (!canInvite) {
      return NextResponse.json(
        { error: 'Insufficient permissions to invite users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const input = CreateInvitationSchema.parse(body);

    // Get tournament info
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        createdById: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: input.email },
    });

    // Check if invitation already exists
    const existingInvitation = await db.userInvitation.findFirst({
      where: {
        email: input.email,
        tournamentId: tournamentId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = await db.userInvitation.create({
      data: {
        email: input.email,
        inviterId: userId,
        tournamentId: tournamentId,
        canConfigure: input.canConfigure,
        canManageScores: input.canManageScores,
        isReferee: input.isReferee,
        token,
        expires,
        status: 'PENDING',
        invitedUserId: existingUser?.id || null,
      },
    });

    // Send invitation email
    const invitationUrl = `${env.NEXTAUTH_URL}/en/auth/accept-invitation?token=${token}`;
    let emailSent = false;
    let emailError: string | null = null;

    try {
      const emailResult = await emailService.sendUserInvitation({
        to: input.email,
        invitedName: input.email.split('@')[0],
        inviterName: (session.user as any).name || 'Tournament Organizer',
        tournamentName: tournament.name,
        tournamentId: tournamentId,
        canConfigure: input.canConfigure,
        canManageScores: input.canManageScores,
        isReferee: input.isReferee,
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
        ? 'Invitation sent successfully'
        : 'Invitation created, but email could not be sent',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        canConfigure: invitation.canConfigure,
        canManageScores: invitation.canManageScores,
        isReferee: invitation.isReferee,
        invitationUrl, // Include URL so it can be shared manually
        emailSent,
        emailError,
      },
    });
  } catch (error) {
    console.error('Error creating invitation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const userId = (session.user as any).id;

    // Check if user has permission to view invitations (must have canConfigure)
    const canView = await PermissionManager.canConfigureTournament(
      userId,
      tournamentId
    );

    if (!canView) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all invitations for this tournament
    const invitations = await db.userInvitation.findMany({
      where: {
        tournamentId: tournamentId,
      },
      include: {
        invitedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add invitation URLs to the response
    const invitationsWithUrls = invitations.map((invitation) => ({
      ...invitation,
      invitationUrl: `${env.NEXTAUTH_URL}/en/auth/accept-invitation?token=${invitation.token}`,
    }));

    return NextResponse.json(invitationsWithUrls);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

