import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { z } from 'zod';

// Simple schema for testing
const createSimpleTournamentSchema = z.object({
  name: z.string().min(1, 'Tournament name is required'),
  description: z.string().optional(),
  season: z.string().min(1, 'Season is required'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format (YYYY-MM-DD)'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format (YYYY-MM-DD)'),
  maxTeams: z.number().int().positive().optional(),
  countryId: z.string().min(1, 'Country is required'),
  city: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSimpleTournamentSchema.parse(body);

    // Get default organization and user
    const defaultOrg = await prisma.organization.findFirst();
    const defaultUser = await prisma.user.findFirst({
      where: { email: 'admin@test.com' },
    });

    if (!defaultOrg || !defaultUser) {
      throw new Error(
        'Default organization or user not found. Please run the seed script.'
      );
    }

    // Create minimal tournament with country support
    const tournament = await prisma.tournament.create({
      data: {
        name: validatedData.name,
        slug: validatedData.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
        description: validatedData.description,
        season: validatedData.season,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        status: 'DRAFT',
        publishedAt: null,
        maxTeams: validatedData.maxTeams,
        countryId: validatedData.countryId,
        city: validatedData.city,
        address: validatedData.address,
        organizationId: defaultOrg.id,
        createdById: defaultUser.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        tournament,
        message: 'Tournament created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating tournament:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create tournament',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        season: true,
        startDate: true,
        endDate: true,
        status: true,
        maxTeams: true,
        city: true,
        country: {
          select: {
            id: true,
            name: true,
            code: true,
            flag: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      tournaments,
      count: tournaments.length,
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tournaments',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
