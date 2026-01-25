import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const ResetPasswordInput = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// GET - Validate token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find the token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if token has been used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'This reset link has already been used' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expires) {
      return NextResponse.json(
        { error: 'This reset link has expired' },
        { status: 400 }
      );
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
      email: resetToken.user.email,
    });
  } catch (error) {
    console.error('Error validating reset token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Reset password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = ResetPasswordInput.parse(body);

    // Find the token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: input.token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if token has been used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'This reset link has already been used' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expires) {
      return NextResponse.json(
        { error: 'This reset link has expired' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Update user's password and mark token as used
    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
