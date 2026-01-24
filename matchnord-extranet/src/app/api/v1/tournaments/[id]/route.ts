import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  getTournamentVisibility,
  filterTournamentData,
} from '@/lib/tournament/visibility';
import { PermissionManager } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const tournamentId = params.id;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Fetch tournament with all related data
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        organization: {
          select: {
            id: true,
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
        divisions: {
          include: {
            groups: {
              include: {
                teams: {
                  select: {
                    id: true,
                    name: true,
                    shortName: true,
                    logo: true,
                    level: true,
                    clubRef: {
                      select: {
                        id: true,
                        name: true,
                        logo: true,
                      },
                    },
                  },
                },
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
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Calculate groups count manually since it's not directly related to tournament
    const groupsCount = tournament.divisions.reduce(
      (sum, division) => sum + division.groups.length,
      0
    );

    // Add groups count to the response
    const tournamentWithGroupsCount = {
      ...tournament,
      _count: {
        ...tournament._count,
        groups: groupsCount,
      },
    };

    // Get user context
    const user = session?.user as any;
    const userId = user?.id;
    const userRole = user?.role;

    // Check tournament visibility based on publication status
    const visibility = await getTournamentVisibility({
      userId,
      userRole,
      tournamentId,
    });

    // If tournament is not visible at all, deny access
    if (!visibility.canViewTournament) {
      return NextResponse.json(
        { error: 'Tournament not found or access denied' },
        { status: 404 }
      );
    }

    // Filter tournament data based on visibility rules
    const filteredTournament = filterTournamentData(
      tournamentWithGroupsCount,
      visibility
    );

    return NextResponse.json(filteredTournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Validation schema for tournament updates
const updateTournamentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  season: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  city: z.string().optional().or(z.null()),
  address: z.string().optional().or(z.null()),
  contactEmail: z.string().email().optional().or(z.literal('')).or(z.null()),
  contactPhone: z.string().optional().or(z.null()),
  countryId: z.string().optional().or(z.null()),
  status: z
    .enum([
      'DRAFT',
      'PUBLISHED',
      'REGISTRATION_OPEN',
      'REGISTRATION_CLOSED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ])
    .optional(),
  infoPublished: z.boolean().optional(),
  teamsPublished: z.boolean().optional(),
  schedulePublished: z.boolean().optional(),
  registrationDeadline: z.string().optional(),
  autoAcceptTeams: z.boolean().optional(),
  allowWaitlist: z.boolean().optional(),
  maxTeams: z.number().int().positive().optional().or(z.null()),
  logo: z.string().optional(),
  heroImage: z.string().optional(),
  isLocked: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const tournamentId = params.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('Tournament update request body:', body);
    const validatedData = updateTournamentSchema.parse(body);
    console.log('Validated tournament data:', validatedData);

    // Check if tournament exists
    const existingTournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        organization: true,
      },
    });

    if (!existingTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check permissions - user must have canConfigure permission
    const user = session.user as any;
    const canEdit = await PermissionManager.canConfigureTournament(
      user.id,
      tournamentId
    );

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Insufficient permissions to configure tournament' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = { ...validatedData };

    // Convert date strings to Date objects
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }
    if (validatedData.registrationDeadline) {
      updateData.registrationDeadline = new Date(
        validatedData.registrationDeadline
      );
    }

    // Handle empty strings for optional fields
    if (validatedData.contactEmail === '') {
      updateData.contactEmail = null;
    }
    if (validatedData.contactPhone === '') {
      updateData.contactPhone = null;
    }
    if (validatedData.city === '') {
      updateData.city = null;
    }
    if (validatedData.address === '') {
      updateData.address = null;
    }
    if (validatedData.maxTeams === null) {
      updateData.maxTeams = null;
    }

    // Handle lock status update
    if (validatedData.isLocked !== undefined) {
      if (validatedData.isLocked) {
        // Locking tournament
        updateData.lockedAt = new Date();
        updateData.lockedBy = user.id;
      } else {
        // Unlocking tournament
        updateData.lockedAt = null;
        updateData.lockedBy = null;
      }
    }

    // Update tournament
    const updatedTournament = await db.tournament.update({
      where: { id: tournamentId },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
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
        divisions: {
          include: {
            groups: true,
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
    });

    // Calculate groups count manually since it's not directly related to tournament
    const groupsCount = updatedTournament.divisions.reduce(
      (sum, division) => sum + division.groups.length,
      0
    );

    // Add groups count to the response
    const updatedTournamentWithGroupsCount = {
      ...updatedTournament,
      _count: {
        ...updatedTournament._count,
        groups: groupsCount,
      },
    };

    return NextResponse.json(updatedTournamentWithGroupsCount);
  } catch (error) {
    console.error('Error updating tournament:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
