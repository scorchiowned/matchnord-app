import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        flag: true,
        phoneCode: true,
        currency: true,
        timezone: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      countries,
      count: countries.length,
    });
  } catch (error) {
    console.error('Error fetching countries:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch countries',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}




