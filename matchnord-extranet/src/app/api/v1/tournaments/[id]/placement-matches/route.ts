import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PlacementMatch } from '@/lib/tournament/placement-configuration';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { divisionId, placementMatches, bracketName } = body;

    if (!divisionId || !placementMatches || !Array.isArray(placementMatches)) {
      return NextResponse.json(
        { error: 'Division ID and placement matches array are required' },
        { status: 400 }
      );
    }

    // Get tournament and verify permissions
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        countryId: true,
        assignments: {
          where: { userId: session.user.id },
        },
        divisions: {
          where: { id: divisionId },
          include: {
            groups: true,
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

    const division = tournament.divisions[0];
    if (!division) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const hasPermission =
      session.user.role === 'ADMIN' ||
      session.user.role === 'TEAM_MANAGER' ||
      tournament.assignments.some((assignment) =>
        ['MANAGER', 'ADMIN'].includes(assignment.role)
      );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Find or create placement bracket group
    const groupName = bracketName || 'Placement Bracket';
    let bracketGroup = await db.group.findFirst({
      where: {
        divisionId,
        name: {
          contains: groupName,
          mode: 'insensitive',
        },
      },
    });

    if (!bracketGroup) {
      bracketGroup = await db.group.create({
        data: {
          name: groupName,
          divisionId,
        },
      });
    }

    // Helper function to get or create placeholder team
    const getOrCreatePlaceholderTeam = async (
      placeholder: PlacementMatch['homeTeam']
    ) => {
      if (!tournament.countryId) {
        throw new Error('Tournament must have a country');
      }

      // Store placeholder source in notes as JSON
      const placeholderSource = JSON.stringify({
        type: 'placeholder',
        placeholderId: placeholder.id,
        source: placeholder.source,
        position: placeholder.position,
      });

      // Check if placeholder team already exists by placeholderId in notes
      // First try to find by name (simpler lookup)
      let placeholderTeam = await db.team.findFirst({
        where: {
          tournamentId: params.id,
          name: placeholder.name,
          divisionId: divisionId,
        },
      });

      // If found, verify it's the right placeholder by checking notes
      if (placeholderTeam && placeholderTeam.notes) {
        try {
          const notes = JSON.parse(placeholderTeam.notes);
          if (notes.placeholderId !== placeholder.id) {
            // Name matches but placeholder ID doesn't - create new one
            placeholderTeam = null;
          }
        } catch {
          // Notes not in expected format - might be a regular team, create new placeholder
          placeholderTeam = null;
        }
      }

      if (!placeholderTeam) {
        // Create placeholder team
        placeholderTeam = await db.team.create({
          data: {
            tournamentId: params.id,
            name: placeholder.name,
            shortName: placeholder.name,
            countryId: tournament.countryId,
            divisionId,
            status: 'APPROVED', // Placeholder teams are automatically approved
            notes: placeholderSource,
          },
        });
      }

      return placeholderTeam;
    };

    // Process each placement match
    const createdMatches = [];
    const errors = [];

    for (const placementMatch of placementMatches as PlacementMatch[]) {
      try {
        // Get or create placeholder teams
        const homeTeam = await getOrCreatePlaceholderTeam(
          placementMatch.homeTeam
        );
        const awayTeam = await getOrCreatePlaceholderTeam(
          placementMatch.awayTeam
        );

        // Check if match already exists (by checking for same teams in same group)
        const existingMatch = await db.match.findFirst({
          where: {
            groupId: bracketGroup.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
          },
        });

        if (existingMatch) {
          // Update existing match if needed
          const updatedMatch = await db.match.update({
            where: { id: existingMatch.id },
            data: {
              notes: JSON.stringify({
                placementMatchId: placementMatch.id,
                round: placementMatch.round,
                matchNumber: placementMatch.matchNumber,
                matchLabel: placementMatch.matchLabel,
                roundLabel: placementMatch.roundLabel,
              }),
            },
            include: {
              homeTeam: true,
              awayTeam: true,
              group: true,
            },
          });
          createdMatches.push(updatedMatch);
          continue;
        }

        // Create the match
        const match = await db.match.create({
          data: {
            tournamentId: params.id,
            divisionId,
            groupId: bracketGroup.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            status: 'SCHEDULED',
            notes: JSON.stringify({
              placementMatchId: placementMatch.id,
              round: placementMatch.round,
              matchNumber: placementMatch.matchNumber,
              matchLabel: placementMatch.matchLabel,
              roundLabel: placementMatch.roundLabel,
            }),
          },
          include: {
            homeTeam: {
              select: {
                id: true,
                name: true,
                shortName: true,
              },
            },
            awayTeam: {
              select: {
                id: true,
                name: true,
                shortName: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        createdMatches.push(match);
      } catch (error: any) {
        console.error(
          `Error creating match ${placementMatch.id}:`,
          error
        );
        errors.push({
          matchId: placementMatch.id,
          error: error.message || 'Failed to create match',
          details: error.stack,
        });
      }
    }

    return NextResponse.json(
      {
        message: `Created ${createdMatches.length} placement matches`,
        matchesCreated: createdMatches.length,
        matches: createdMatches,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating placement matches:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

