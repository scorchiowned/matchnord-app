'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { Users, ArrowLeft } from 'lucide-react';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { StandingsTable } from '@/components/tournament/standings-table';
import { api } from '@/lib/api';

interface Tournament {
  id: string;
  name: string;
  organization: {
    name: string;
  };
  _count: {
    teams: number;
    venues: number;
    divisions: number;
  };
}

interface Team {
  id: string;
  name: string;
  shortName: string;
}

interface Standing {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
  lastMatch: string;
}

// Fetch tournament from the API
async function getTournament(id: string): Promise<Tournament | null> {
  try {
    const tournament = await api.tournaments.getById(id);
    return tournament as Tournament;
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return null;
  }
}

// Calculate standings from matches data
async function getTournamentStandings(
  tournamentId: string
): Promise<Standing[]> {
  try {
    const matches = await api.matches.getAll({ tournamentId });

    // Group matches by team and calculate standings
    const teamStats = new Map<
      string,
      {
        team: Team;
        played: number;
        won: number;
        drawn: number;
        lost: number;
        goalsFor: number;
        goalsAgainst: number;
        form: string[];
        lastMatch: string;
      }
    >();

    // Process each match
    (matches as any[]).forEach((match: any) => {
      const homeTeam = match.homeTeam;
      const awayTeam = match.awayTeam;
      const homeScore = match.homeScore;
      const awayScore = match.awayScore;
      const matchDate = match.startTime;

      // Initialize team stats if not exists
      if (!teamStats.has(homeTeam.id)) {
        teamStats.set(homeTeam.id, {
          team: homeTeam,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          form: [],
          lastMatch: '',
        });
      }
      if (!teamStats.has(awayTeam.id)) {
        teamStats.set(awayTeam.id, {
          team: awayTeam,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          form: [],
          lastMatch: '',
        });
      }

      const homeStats = teamStats.get(homeTeam.id)!;
      const awayStats = teamStats.get(awayTeam.id)!;

      // Update stats
      homeStats.played++;
      awayStats.played++;
      homeStats.goalsFor += homeScore;
      homeStats.goalsAgainst += awayScore;
      awayStats.goalsFor += awayScore;
      awayStats.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        homeStats.won++;
        awayStats.lost++;
        homeStats.form.push('W');
        awayStats.form.push('L');
      } else if (homeScore < awayScore) {
        homeStats.lost++;
        awayStats.won++;
        homeStats.form.push('L');
        awayStats.form.push('W');
      } else {
        homeStats.drawn++;
        awayStats.drawn++;
        homeStats.form.push('D');
        awayStats.form.push('D');
      }

      // Update last match date
      if (matchDate > homeStats.lastMatch) {
        homeStats.lastMatch = matchDate;
      }
      if (matchDate > awayStats.lastMatch) {
        awayStats.lastMatch = matchDate;
      }
    });

    // Convert to standings array
    const standings: Standing[] = Array.from(teamStats.values()).map(
      (stats) => ({
        position: 0, // Will be calculated below
        team: stats.team,
        played: stats.played,
        won: stats.won,
        drawn: stats.drawn,
        lost: stats.lost,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
        goalDifference: stats.goalsFor - stats.goalsAgainst,
        points: stats.won * 3 + stats.drawn,
        form: stats.form.slice(-5), // Last 5 matches
        lastMatch: stats.lastMatch,
      })
    );

    // Sort by points, then goal difference, then goals scored
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Assign positions
    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    return standings;
  } catch (error) {
    console.error('Error calculating standings:', error);
    return [];
  }
}

export default async function TournamentStandingsPage({
  params,
}: {
  params: { id: string };
}) {
  const tournament = await getTournament(params.id);

  if (!tournament) {
    notFound();
  }

  const standings = await getTournamentStandings(params.id);

  // const getFormColor = (result: string) => {
  //   switch (result) {
  //     case 'W':
  //       return 'bg-green-100 text-green-800';
  //     case 'D':
  //       return 'bg-yellow-100 text-yellow-800';
  //     case 'L':
  //       return 'bg-red-100 text-red-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  // const getPositionIcon = (position: number) => {
  //   switch (position) {
  //     case 1:
  //       return <Trophy className="h-4 w-4 text-yellow-600" />;
  //     case 2:
  //       return <Medal className="h-4 w-4 text-gray-400" />;
  //     case 3:
  //       return <Medal className="h-4 w-4 text-amber-600" />;
  //     default:
  //       return <span className="text-sm font-medium">{position}</span>;
  //   }
  // };

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="ghost" asChild>
            <Link href={`/tournaments/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tournament
            </Link>
          </Button>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {tournament.name} - Standings
            </h1>
            <p className="text-muted-foreground">
              Current standings and team performance
            </p>
          </div>

          {/* Standings Table */}
          <Card>
            <CardHeader>
              <CardTitle>League Table</CardTitle>
              <CardDescription>
                {standings.length} teams competing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {standings.length > 0 ? (
                <StandingsTable standings={standings} showForm={true} />
              ) : (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No Standings Available
                  </h3>
                  <p className="text-muted-foreground">
                    Standings will be calculated once matches are played.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
