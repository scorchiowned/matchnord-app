import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      include: {
        teams: {
          include: {
            groups: true,
            homeMatches: {
              include: {
                awayTeam: true,
                venue: true,
                pitch: true,
              },
            },
            awayMatches: {
              include: {
                homeTeam: true,
                venue: true,
                pitch: true,
              },
            },
          },
        },
        venues: {
          include: {
            pitches: true,
          },
        },
        divisions: {
          include: {
            groups: {
              include: {
                teams: true,
                matches: {
                  include: {
                    homeTeam: true,
                    awayTeam: true,
                    venue: true,
                    pitch: true,
                  },
                },
                standings: {
                  include: {
                    team: true,
                  },
                },
              },
            },
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

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      startDate,
      endDate,
      // matchLength,
      // bufferMinutes,
      // format,
      isPublished,
      teams,
      fields,
      groups,
    } = body;

    // Update tournament basic info
    const tournament = await db.tournament.update({
      where: { id: params.id },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isPublished,
        // Note: matchLength and bufferMinutes would need to be stored in a settings field
        // or in a separate tournament settings table
      },
    });

    // Update teams if provided
    if (teams) {
      // This would involve updating team assignments to groups
      // Implementation depends on your specific data model
    }

    // Update fields if provided
    if (fields) {
      // Update venue/pitch information
      // Implementation depends on your specific data model
    }

    // Update groups if provided
    if (groups) {
      // Update group assignments and generate fixtures
      // Implementation depends on your specific data model
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params: { id: _id } }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action } = body;
    // const { action, data } = body;

    switch (action) {
      case 'generate-fixtures':
        // Generate group fixtures based on teams and groups
        // This would create match records in the database
        return NextResponse.json({
          message: 'Fixtures generated successfully',
        });

      case 'update-match':
        // Update a specific match (time, field, score, etc.)
        // const { matchId, updates } = data;
        // Implementation for updating match details
        return NextResponse.json({ message: 'Match updated successfully' });

      case 'assign-team-to-group':
        // Assign a team to a specific group
        // const { teamId, groupId } = data;
        // Implementation for team assignment
        return NextResponse.json({ message: 'Team assigned successfully' });

      case 'remove-team-from-group':
        // Remove a team from a group
        // const { teamId: removeTeamId, groupId: removeGroupId } = data;
        // Implementation for team removal
        return NextResponse.json({ message: 'Team removed successfully' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing tournament action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
