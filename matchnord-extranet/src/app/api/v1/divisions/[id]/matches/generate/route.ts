import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateRoundRobinMatches } from '@/lib/tournament/match-generation/round-robin';
import { generateSingleEliminationBracket } from '@/lib/tournament/match-generation/elimination';

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
    const { groupId, format = 'round-robin', autoAssign = true } = body;

    // Get division with tournament and groups
    const division = await db.division.findUnique({
      where: { id: params.id },
      include: {
        tournament: {
          include: {
            assignments: {
              where: { userId: session.user.id },
            },
          },
        },
        groups: {
          include: {
            teams: true,
            matches: true,
          },
        },
      },
    });

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
      division.tournament.assignments.some((assignment) =>
        ['MANAGER', 'ADMIN'].includes(assignment.role)
      );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Find the group to generate matches for
    const group = division.groups.find((g) => g.id === groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.teams.length < 2) {
      return NextResponse.json(
        { error: 'Group must have at least 2 teams to generate matches' },
        { status: 400 }
      );
    }

    // Check if matches already exist
    if (group.matches.length > 0) {
      return NextResponse.json(
        {
          error:
            'Matches already exist for this group. Use regenerate option to replace them.',
        },
        { status: 400 }
      );
    }

    let matches = [];

    // Generate matches based on format
    if (format === 'round-robin') {
      const result = generateRoundRobinMatches(group.teams, group.id);
      matches = result.matches;
    } else if (format === 'elimination') {
      const result = generateSingleEliminationBracket(group.teams, group.id);
      matches = result.matches;
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use "round-robin" or "elimination"' },
        { status: 400 }
      );
    }

    // Create matches in database
    const createdMatches = await Promise.all(
      matches.map((match, index) =>
        db.match.create({
          data: {
            tournamentId: division.tournamentId,
            divisionId: division.id,
            groupId: group.id,
            homeTeamId: match.homeTeam.id,
            awayTeamId: match.awayTeam.id,
            startTime: null, // Will be scheduled later
            assignmentType: autoAssign ? 'AUTO' : 'MANUAL',
            status: 'SCHEDULED',
            // Auto-assign match number based on generation order
            matchNumber: match.matchNumber
              ? `G${group.name}-M${match.matchNumber}`
              : `G${group.name}-M${index + 1}`,
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
          },
        })
      )
    );

    return NextResponse.json(
      {
        message: `Generated ${createdMatches.length} matches for ${group.name}`,
        matches: createdMatches,
        format,
        autoAssign,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
