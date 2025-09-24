import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const GetMatchesQuery = z.object({
  tournamentId: z.string().nullable().optional(),
  status: z
    .enum(['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED'])
    .nullable()
    .optional(),
  venueId: z.string().nullable().optional(),
  limit: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  offset: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = GetMatchesQuery.parse({
      tournamentId: url.searchParams.get('tournamentId'),
      status: url.searchParams.get('status'),
      venueId: url.searchParams.get('venueId'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    });

    const where: Record<string, unknown> = {};

    if (query.tournamentId) {
      where.tournamentId = query.tournamentId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.venueId) {
      where.venueId = query.venueId;
    }

    const matches = await db.match.findMany({
      where,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        venue: {
          select: {
            id: true,
            name: true,
            streetName: true,
            postalCode: true,
            city: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            division: {
              select: {
                id: true,
                name: true,
                tournament: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        events: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            minute: 'asc',
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: query.limit || 50,
      skip: query.offset || 0,
    });

    return NextResponse.json(matches);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
