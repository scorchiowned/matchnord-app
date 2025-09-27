import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate expired verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Store verification token
    const verificationToken = await db.emailVerificationToken.create({
      data: {
        userId,
        token,
        expires,
        used: false,
      },
    });

    return NextResponse.json({
      token: verificationToken.token,
      expires: verificationToken.expires,
    });
  } catch (error) {
    console.error('Error creating expired token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
