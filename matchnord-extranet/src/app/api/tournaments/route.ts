import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { z } from 'zod';

// Schema for tournament creation validation
const createTournamentSchema = z.object({
  name: z.string().min(1, 'Tournament name is required'),
  description: z.string().optional(),
  season: z.string().min(1, 'Season is required'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  organizationName: z.string().min(1, 'Organization name is required'),
  registrationDeadline: z
    .string()
    .datetime('Invalid registration deadline format')
    .optional(),
  maxTeams: z.number().int().positive().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  autoAcceptTeams: z.boolean().default(false),
  allowWaitlist: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = createTournamentSchema.parse(body);

    // Get existing organization or use the first available one
    // For now, we'll use a simple approach
    let organization = await prisma.organization.findFirst();

    if (!organization) {
      // If no organizations exist, create a default one
      // First check if we have any countries
      let country = await prisma.country.findFirst();

      if (!country) {
        // Create a default country
        country = await prisma.country.create({
          data: {
            id: 'finland',
            name: 'Finland',
            code: 'FI',
          },
        });
      }

      organization = await prisma.organization.create({
        data: {
          name: validatedData.organizationName,
          slug: validatedData.organizationName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
          countryId: country.id,
        },
      });
    }

    // Create a default user for tournament creation
    // In a real app, this would come from the authenticated user
    let user = await prisma.user.findFirst({
      where: {
        email: 'admin@test.com',
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@test.com',
          role: 'ADMIN',
        },
      });
    }

    // Generate a unique slug for the tournament
    const baseSlug = validatedData.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.tournament.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Determine tournament status
    const status = 'DRAFT';

    // Create the tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: validatedData.name,
        slug,
        description: validatedData.description,
        season: validatedData.season,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        organizationId: organization.id,
        createdById: user.id,
        countryId: '1', // Default country ID
        status,
        registrationDeadline: validatedData.registrationDeadline
          ? new Date(validatedData.registrationDeadline)
          : null,
        maxTeams: validatedData.maxTeams,
        contactEmail: validatedData.contactEmail,
        contactPhone: validatedData.contactPhone,
        autoAcceptTeams: validatedData.autoAcceptTeams,
        allowWaitlist: validatedData.allowWaitlist,
      },
      include: {
        organization: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const organizationId = searchParams.get('organizationId');

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { organization: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            teams: true,
            venues: true,
          },
        },
      },
      orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
    });

    // Transform the data to match the frontend expectations
    const transformedTournaments = tournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      slug: tournament.slug,
      description: tournament.description,
      season: tournament.season,
      startDate: tournament.startDate.toISOString(),
      endDate: tournament.endDate.toISOString(),
      organization: tournament.organization.name,
      organizationId: tournament.organizationId,
      status: tournament.status.toLowerCase(),
      isPublished: tournament.status === 'PUBLISHED',
      registrationDeadline: tournament.registrationDeadline?.toISOString(),
      maxTeams: tournament.maxTeams,
      contactEmail: tournament.contactEmail,
      contactPhone: tournament.contactPhone,
      teamsCount: tournament._count.teams,
      matchesCount: 0, // We'll calculate this later when divisions/matches are implemented
      venuesCount: tournament._count.venues,
      createdBy: tournament.createdBy,
      createdAt: tournament.createdAt.toISOString(),
      updatedAt: tournament.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      tournaments: transformedTournaments,
      count: transformedTournaments.length,
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
