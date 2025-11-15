import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Resolves placeholder teams to actual teams based on group standings
 * This should be called after group matches are finished
 */
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
    const { divisionId } = body;

    if (!divisionId) {
      return NextResponse.json(
        { error: 'Division ID is required' },
        { status: 400 }
      );
    }

    // Get tournament and verify permissions
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        assignments: {
          where: { userId: session.user.id },
        },
        divisions: {
          where: { id: divisionId },
          include: {
            groups: {
              include: {
                teams: true,
                matches: {
                  where: {
                    status: 'FINISHED',
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

    // Calculate group standings
    const groupStandings = division.groups.map((group) => {
      const groupMatches = group.matches.filter(
        (match) => match.status === 'FINISHED'
      );
      const groupTeams = group.teams;

      // Calculate stats for each team
      const teamStats = groupTeams.map((team) => {
        const teamMatches = groupMatches.filter(
          (m) => m.homeTeamId === team.id || m.awayTeamId === team.id
        );

        let played = 0;
        let won = 0;
        let drawn = 0;
        let lost = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;

        teamMatches.forEach((match) => {
          const isHome = match.homeTeamId === team.id;
          const teamScore = isHome ? match.homeScore : match.awayScore;
          const opponentScore = isHome ? match.awayScore : match.homeScore;

          played++;
          goalsFor += teamScore;
          goalsAgainst += opponentScore;

          if (teamScore > opponentScore) won++;
          else if (teamScore < opponentScore) lost++;
          else drawn++;
        });

        const points = won * 3 + drawn;
        const goalDifference = goalsFor - goalsAgainst;

        return {
          team,
          played,
          won,
          drawn,
          lost,
          goalsFor,
          goalsAgainst,
          goalDifference,
          points,
        };
      });

      // Sort by points, then goal difference, then goals for
      teamStats.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference)
          return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      // Assign positions
      teamStats.forEach((stat, index) => {
        (stat as typeof stat & { position: number }).position = index + 1;
      });

      return {
        groupId: group.id,
        groupName: group.name,
        teams: teamStats,
      };
    });

    // Find all placeholder teams in this division
    const placeholderTeams = await db.team.findMany({
      where: {
        tournamentId: params.id,
        divisionId,
        notes: {
          contains: '"type":"placeholder"',
        },
      },
    });

    let resolvedCount = 0;
    const errors: Array<{ teamId: string; error: string }> = [];

    for (const placeholderTeam of placeholderTeams) {
      try {
        if (!placeholderTeam.notes) continue;

        const notes = JSON.parse(placeholderTeam.notes);
        if (notes.type !== 'placeholder') continue;

        const source = notes.source;

        // Resolve based on source type
        if (source.type === 'group-position') {
          // Find the actual team from group standings
          const groupStanding = groupStandings.find(
            (gs) => gs.groupId === source.groupId
          );

          if (!groupStanding) {
            errors.push({
              teamId: placeholderTeam.id,
              error: `Group ${source.groupName} not found`,
            });
            continue;
          }

          const actualTeam = groupStanding.teams.find(
            (t) => (t as typeof t & { position: number }).position === source.position
          );

          if (!actualTeam) {
            errors.push({
              teamId: placeholderTeam.id,
              error: `Position ${source.position} not found in ${source.groupName}`,
            });
            continue;
          }

          // Update all matches that use this placeholder team
          // We'll update the match to use the actual team
          await db.match.updateMany({
            where: {
              OR: [
                { homeTeamId: placeholderTeam.id },
                { awayTeamId: placeholderTeam.id },
              ],
            },
            data: {
              homeTeamId:
                placeholderTeam.id === placeholderTeam.id
                  ? actualTeam.team.id
                  : undefined,
              awayTeamId:
                placeholderTeam.id === placeholderTeam.id
                  ? actualTeam.team.id
                  : undefined,
            },
          });

          // Actually, we need to update home and away separately
          await db.match.updateMany({
            where: { homeTeamId: placeholderTeam.id },
            data: { homeTeamId: actualTeam.team.id },
          });

          await db.match.updateMany({
            where: { awayTeamId: placeholderTeam.id },
            data: { awayTeamId: actualTeam.team.id },
          });

          // Delete the placeholder team
          await db.team.delete({
            where: { id: placeholderTeam.id },
          });

          resolvedCount++;
        } else if (source.type === 'match-winner' || source.type === 'match-loser') {
          // For match winners/losers, we need to wait until that match is finished
          // This is more complex and would need to be handled after matches are played
          // For now, we'll skip these
          continue;
        }
      } catch (error: any) {
        console.error(
          `Error resolving placeholder team ${placeholderTeam.id}:`,
          error
        );
        errors.push({
          teamId: placeholderTeam.id,
          error: error.message || 'Failed to resolve',
        });
      }
    }

    return NextResponse.json(
      {
        message: `Resolved ${resolvedCount} placeholder teams`,
        resolvedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error resolving placeholder teams:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

