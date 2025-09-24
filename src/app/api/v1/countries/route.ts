import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const countries = await db.country.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        flag: true,
        phoneCode: true,
        currency: true,
        timezone: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      countries,
      total: countries.length,
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
