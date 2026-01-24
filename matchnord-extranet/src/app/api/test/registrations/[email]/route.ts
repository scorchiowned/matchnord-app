import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);

    const registrations = await db.team.findMany({
      where: {
        OR: [
          {
            manager: {
              email,
            },
          },
          {
            contactEmail: email,
          },
        ],
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        division: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching test registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
