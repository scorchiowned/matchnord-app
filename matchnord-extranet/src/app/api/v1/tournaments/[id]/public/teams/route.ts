import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTournamentVisibility } from '@/lib/tournament/visibility';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Check tournament visibility for public access
    const visibility = await getTournamentVisibility({
      tournamentId,
    });

    // If tournament is not visible at all, deny access
    if (!visibility.canViewTournament) {
      return NextResponse.json(
        { error: 'Tournament not found or access denied' },
        { status: 404 }
      );
    }

    // If teams are not published, return empty array
    if (!visibility.canViewTeams) {
      return NextResponse.json([]);
    }

    // Fetch teams with related data
    const teams = await db.team.findMany({
      where: { tournamentId },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        division: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        clubRef: {
          select: {
            id: true,
            name: true,
            logo: true,
            city: true,
          },
        },
        players: {
          orderBy: { jerseyNumber: 'asc' },
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform teams for public consumption
    const publicTeams = await Promise.all(
      teams.map(async (team) => {
        // Fetch club information if clubId exists
        let clubInfo = null;
        if (team.clubId) {
          try {
            const club = await db.club.findUnique({
              where: { id: team.clubId },
              select: {
                id: true,
                name: true,
                logo: true,
                city: true,
              },
            });
            clubInfo = club;
            // If club is null, try to find it by name as fallback
            if (!clubInfo) {
              console.log(
                `Club not found for ID ${team.clubId}, trying to find by name`
              );
              const clubByName = await db.club.findFirst({
                where: { name: { contains: team.name.split(' ')[0] } },
                select: {
                  id: true,
                  name: true,
                  logo: true,
                  city: true,
                },
              });
              if (clubByName) {
                console.log(`Found club by name: ${clubByName.name}`);
                clubInfo = clubByName;
              }
            }
          } catch (error) {
            console.error('Error fetching club:', error);
          }
        }

        return {
          id: team.id,
          name: team.name,
          shortName: team.shortName,
          club: clubInfo,
          clubId: team.clubId,
          city: team.city,
          country: team.country,
          level: team.level,
          status: team.status,
          division: team.division,
          playerCount: team._count.players,
          // Only include players if teams are published
          players: visibility.canViewTeams
            ? team.players.map((player) => ({
                id: player.id,
                firstName: player.firstName,
                lastName: player.lastName,
                jerseyNumber: player.jerseyNumber,
                position: player.position,
                birthDate: player.birthDate,
              }))
            : [],
        };
      })
    );

    return NextResponse.json(publicTeams);
  } catch (error) {
    console.error('Error fetching public tournament teams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
