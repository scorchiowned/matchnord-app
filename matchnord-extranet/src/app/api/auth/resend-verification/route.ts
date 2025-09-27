import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { emailService } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Check for existing unused tokens
    const existingToken = await db.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        used: false,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (existingToken) {
      return NextResponse.json(
        {
          error:
            'A verification email has already been sent. Please check your email or wait before requesting another.',
        },
        { status: 400 }
      );
    }

    // Generate new verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Store verification token
    await db.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    // Send verification email
    const verificationUrl = `${env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

    const emailResult = await emailService.sendUserWelcomeVerification({
      to: user.email!,
      userName: user.name || 'User',
      email: user.email!,
      verificationUrl,
      role: user.role,
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
