import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getTournamentVisibility,
  filterTournamentData,
} from '@/lib/tournament/visibility';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await db.tournament.findUnique({
      where: { id: params.id },
      include: {
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
                teams: true,
                matches: {
                  include: {
                    homeTeam: true,
                    awayTeam: true,
                    venue: true,
                    pitch: true,
                  },
                  orderBy: {
                    startTime: 'asc',
                  },
                },
                standings: {
                  include: {
                    team: true,
                  },
                  orderBy: [
                    { points: 'desc' },
                    { goalDifference: 'desc' },
                    { goalsFor: 'desc' },
                  ],
                },
              },
            },
          },
        },
        venues: {
          include: {
            pitches: true,
          },
        },
        rules: {
          orderBy: { order: 'asc' },
        },
        documents: {
          where: { isPublic: true },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check tournament visibility for public access
    const visibility = await getTournamentVisibility({
      tournamentId: params.id,
    });

    // If tournament is not visible at all, deny access
    if (!visibility.canViewTournament) {
      return NextResponse.json(
        { error: 'Tournament not found or access denied' },
        { status: 404 }
      );
    }

    // Transform the data for public consumption
    const publicTournament = {
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      logo: tournament.logo,
      heroImage: tournament.heroImage,
      country: tournament.country,
      city: tournament.city,
      venue: tournament.venues[0]?.name || 'TBD',
      rulesUrl: tournament.documents.find(
        (doc) => doc.fileType === 'application/pdf'
      )?.fileUrl,
      groups: tournament.divisions.flatMap((division) =>
        division.groups.map((group) => ({
          id: group.id,
          name: group.name,
          division: division.name,
          standings: group.standings.map((standing, index) => ({
            position: index + 1,
            team: standing.team,
            played: standing.played,
            won: standing.won,
            drawn: standing.drawn,
            lost: standing.lost,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst,
            goalDifference: standing.goalDifference,
            points: standing.points,
          })),
        }))
      ),
      matches: tournament.divisions.flatMap((division) =>
        division.groups.flatMap((group) =>
          group.matches.map((match) => ({
            id: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            field: match.pitch?.name || match.venue?.name || 'TBD',
            startTime: match.startTime,
            status: match.status.toLowerCase(),
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            round: group.name,
            division: division.name,
          }))
        )
      ),
      bracket: [], // This would be populated with knockout matches
      rules: tournament.rules.map((rule) => ({
        id: rule.id,
        title: rule.title,
        content: rule.content,
        order: rule.order,
      })),
    };

    // Filter the public tournament data based on visibility rules
    const filteredPublicTournament = filterTournamentData(
      publicTournament,
      visibility
    );

    return NextResponse.json(filteredPublicTournament);
  } catch (error) {
    console.error('Error fetching public tournament data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
