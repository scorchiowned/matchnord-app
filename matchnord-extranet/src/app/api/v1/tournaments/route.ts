import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getTournamentVisibility,
  filterTournamentData,
} from '@/lib/tournament/visibility';

const GetTournamentsQuery = z.object({
  organizationId: z.string().nullable().optional(),
  status: z.enum(['active', 'upcoming', 'finished']).nullable().optional(),
  countryId: z.string().nullable().optional(),
  tournamentName: z.string().nullable().optional(),
  venueId: z.string().nullable().optional(),
  birthYear: z.string().nullable().optional(),
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
    // Get the current user session
    const session = await getServerSession(authOptions);

    const url = new URL(request.url);
    const query = GetTournamentsQuery.parse({
      organizationId: url.searchParams.get('organizationId'),
      status: url.searchParams.get('status'),
      countryId: url.searchParams.get('countryId'),
      tournamentName: url.searchParams.get('tournamentName'),
      venueId: url.searchParams.get('venueId'),
      birthYear: url.searchParams.get('birthYear'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    });

    const where: Record<string, unknown> = {};

    // Apply permission-based filtering
    if (session?.user) {
      const user = session.user as any; // Type assertion for role

      if (user.role === 'ADMIN') {
        // Admins can see all tournaments - no additional filtering
      } else {
        // Users can see tournaments they created or have any assignment to
        where.OR = [
          { createdById: user.id }, // Tournaments they created (owners)
          {
            assignments: {
              some: {
                userId: user.id,
                isActive: true,
                // User has any permission (canConfigure, canManageScores, or isReferee)
                OR: [
                  { canConfigure: true },
                  { canManageScores: true },
                  { isReferee: true },
                ],
              },
            },
          },
        ];
      }
    } else {
      // No session - return empty results
      where.id = 'nonexistent';
    }

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    if (query.status) {
      const now = new Date();
      switch (query.status) {
        case 'active':
          where.startDate = { lte: now };
          where.endDate = { gte: now };
          break;
        case 'upcoming':
          where.startDate = { gt: now };
          break;
        case 'finished':
          where.endDate = { lt: now };
          break;
      }
    }

    if (query.countryId) {
      where.countryId = query.countryId;
    }

    if (query.tournamentName) {
      where.name = {
        contains: query.tournamentName,
        mode: 'insensitive',
      };
    }

    if (query.venueId) {
      where.venues = {
        some: {
          id: query.venueId,
        },
      };
    }

    if (query.birthYear) {
      where.divisions = {
        some: {
          birthYear: parseInt(query.birthYear),
        },
      };
    }

    const tournaments = await db.tournament.findMany({
      where,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        venues: {
          select: {
            id: true,
            name: true,
            streetName: true,
            postalCode: true,
            city: true,
            xCoordinate: true,
            yCoordinate: true,
          },
        },
        divisions: {
          select: {
            id: true,
            name: true,
            birthYear: true,
            format: true,
          },
        },
        assignments: {
          select: {
            id: true,
            userId: true,
            canConfigure: true,
            canManageScores: true,
            isReferee: true,
            permissions: true,
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            logo: true,
            clubRef: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
        _count: {
          select: {
            teams: true,
            venues: true,
            divisions: true,
            matches: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
      take: query.limit || 50,
      skip: query.offset || 0,
    });

    // Filter tournaments based on visibility for each user
    const filteredTournaments = await Promise.all(
      tournaments.map(async (tournament) => {
        const visibility = await getTournamentVisibility({
          userId: session?.user?.id,
          userRole: (session?.user as any)?.role,
          tournamentId: tournament.id,
        });

        return filterTournamentData(tournament, visibility);
      })
    );

    return NextResponse.json(filteredTournaments);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const sessionUser = session.user as any;

    // Find or create user in database
    let user = await db.user.findUnique({
      where: { email: sessionUser.email },
    });

    if (!user) {
      // Create user if doesn't exist
      user = await db.user.create({
        data: {
          email: sessionUser.email,
          name: sessionUser.name || sessionUser.email,
          role: 'USER', // Default role for new users
        },
      });
    }

    // Validate required fields
    if (!body.name || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startDate, endDate' },
        { status: 400 }
      );
    }

    // Check if user has permission to create tournaments
    // All authenticated users (USER and ADMIN) can create tournaments
    if (user.role !== 'ADMIN' && user.role !== 'USER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create tournaments' },
        { status: 403 }
      );
    }

    // Generate a slug from the tournament name
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim();
    };

    // Handle organization - create a default one if none provided
    let organizationId = body.organizationId;

    if (!organizationId) {
      // Create a default organization for the user
      const defaultOrgName = `${user.name || user.email}'s Organization`;
      const defaultOrgSlug = generateSlug(defaultOrgName);

      // Check if user already has an organization
      const existingOrg = await db.organization.findFirst({
        where: {
          OR: [{ name: defaultOrgName }, { slug: defaultOrgSlug }],
        },
      });

      if (existingOrg) {
        organizationId = existingOrg.id;
      } else {
        // Create new organization
        const newOrg = await db.organization.create({
          data: {
            name: defaultOrgName,
            slug: defaultOrgSlug,
            description: `Default organization for ${user.name || user.email}`,
            countryId: body.countryId || 'cmf9tlwez000113k2z6uhq6ek', // Default to Finland
          },
        });
        organizationId = newOrg.id;
      }
    }

    const baseSlug = generateSlug(body.name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (true) {
      const existingTournament = await db.tournament.findUnique({
        where: { slug },
      });

      if (!existingTournament) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the tournament
    const tournament = await db.tournament.create({
      data: {
        name: body.name,
        slug: slug,
        description: body.description || '',
        season: body.season || new Date().getFullYear().toString(),
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        countryId: body.countryId || null,
        city: body.city || '',
        address: body.address || '',
        contactEmail: body.contactEmail || '',
        contactPhone: body.contactPhone || '',
        createdById: user.id,
        organizationId: organizationId,
        status: 'DRAFT',
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
