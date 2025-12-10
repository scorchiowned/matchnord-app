import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailService } from '@/lib/email';
import { env } from '@/lib/env';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const RegisterInput = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  invitationToken: z.string().optional(), // Optional invitation token to auto-accept
  // Role removed - all users are USER by default, permissions assigned per tournament
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = RegisterInput.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user with unverified email
    const user = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: 'USER', // All new users are USER role by default
        emailVerified: null, // Not verified yet
        isActive: true, // Users are active by default
      },
    });

    // Generate verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Store verification token
    await db.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expires,
        used: false,
      },
    });

    // Send welcome and verification email
    const verificationUrl = `${env.NEXTAUTH_URL}/en/auth/verify-email?token=${token}`;

    try {
      await emailService.sendUserWelcomeVerification({
        to: user.email!,
        userName: user.name!,
        email: user.email!,
        verificationUrl,
        role: 'USER', // All users are USER role
      });

      console.log('✅ Welcome and verification email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail registration if email fails, but log the error
    }

    // If invitation token is provided, try to accept the invitation automatically
    let invitationAccepted = false;
    if (input.invitationToken) {
      try {
        const invitation = await db.userInvitation.findUnique({
          where: { token: input.invitationToken },
        });

        if (
          invitation &&
          invitation.email === user.email &&
          invitation.status === 'PENDING' &&
          new Date() <= invitation.expires
        ) {
          // Create tournament assignment if tournamentId exists
          if (invitation.tournamentId) {
            await db.tournamentAssignment.upsert({
              where: {
                userId_tournamentId: {
                  userId: user.id,
                  tournamentId: invitation.tournamentId,
                },
              },
              update: {
                canConfigure: invitation.canConfigure,
                canManageScores: invitation.canManageScores,
                isReferee: invitation.isReferee,
                isActive: true,
                assignedBy: invitation.inviterId,
              },
              create: {
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

          // Mark invitation as accepted
          await db.userInvitation.update({
            where: { id: invitation.id },
            data: {
              status: 'ACCEPTED',
              acceptedAt: new Date(),
              invitedUserId: user.id,
            },
          });

          invitationAccepted = true;
          console.log(
            '✅ Invitation accepted automatically during registration'
          );
        }
      } catch (invitationError) {
        console.error(
          '❌ Failed to accept invitation during registration:',
          invitationError
        );
        // Don't fail registration if invitation acceptance fails
      }
    }

    return NextResponse.json({
      message: invitationAccepted
        ? 'Registration successful and invitation accepted! Please check your email to verify your account.'
        : 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
      invitationAccepted,
    });
  } catch (error) {
    console.error('Registration error:', error);

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
