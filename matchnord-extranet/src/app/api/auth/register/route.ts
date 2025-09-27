import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailService } from '@/lib/email';
import { env } from '@/lib/env';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const RegisterInput = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z
    .enum(['TEAM_MANAGER', 'TOURNAMENT_MANAGER', 'REFEREE'])
    .default('TEAM_MANAGER'),
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

    // Create user with unverified email
    const user = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        emailVerified: null, // Not verified yet
        isActive: input.role === 'TEAM_MANAGER' ? false : true, // Team managers need approval
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
        role: user.role as 'TEAM_MANAGER' | 'TOURNAMENT_MANAGER' | 'REFEREE',
      });

      console.log('✅ Welcome and verification email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail registration if email fails, but log the error
    }

    return NextResponse.json({
      message:
        'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
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
