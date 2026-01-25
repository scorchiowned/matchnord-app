import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailService } from '@/lib/email';
import { env } from '@/lib/env';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const ForgotPasswordInput = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = ForgotPasswordInput.parse(body);

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: input.email },
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (!user) {
      return NextResponse.json({
        message: 'Password reset instructions sent if account exists',
      });
    }

    // Note: OAuth is no longer supported, so all users should be able to reset/set their password
    // If user doesn't have a password, they can set one via the reset flow

    // Invalidate any existing unused tokens for this user
    await db.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
        expires: {
          gt: new Date(),
        },
      },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Generate new reset token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token
    try {
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expires,
          used: false,
        },
      });
    } catch (dbError) {
      console.error('Failed to store password reset token:', dbError);
      throw dbError;
    }

    // Send password reset email
    const resetUrl = `${env.NEXTAUTH_URL}/en/auth/reset-password?token=${token}`;

    try {
      await emailService.sendPasswordReset({
        to: user.email!,
        userName: user.name || 'User',
        resetUrl,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email fails, user might retry
    }

    // Always return success message (prevents email enumeration)
    return NextResponse.json({
      message: 'Password reset instructions sent if account exists',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
