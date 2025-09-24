'use client';
import { Link } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { MatchList } from '@/components/tournament/match-list';
import {
  Trophy,
  Calendar,
  Users,
  ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Match {
  id: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  homeScore: number;
  awayScore: number;
  status: string;
  startTime: string;
  venue?: { name: string; address: string };
  group: {
    name: string;
    stage: {
      name: string;
      division: {
        name: string;
        tournament: {
          name: string;
        };
      };
    };
  };
  events: Array<{
    minute: number;
    type: string;
    team?: { name: string };
    player?: { firstName: string; lastName: string };
  }>;
}

interface Tournament {
  id: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  organization: {
    name: string;
  };
  _count: {
    teams: number;
    venues: number;
    divisions: number;
  };
}

export default async function TournamentResultsPage({
  params,
}: {
  params: { id: string };
}) {
  // Fetch tournament and matches data server-side
  let tournament: Tournament | null = null;
  let matches: Match[] = [];

  try {
    const [tournamentData, matchesData] = await Promise.all([
      api.tournaments.getById(params.id),
      api.matches.getAll({ tournamentId: params.id }),
    ]);
    tournament = tournamentData as Tournament;
    matches = matchesData as Match[];
  } catch (error) {
    console.error('Error fetching tournament data:', error);
  }

  // Group matches by round/group
  // Group matches by round (currently unused but kept for future implementation)
  // const matchesByRound = matches.reduce(
  //   (acc, match) => {
  //     const roundName = match.group.name;
  //     if (!acc[roundName]) {
  //       acc[roundName] = [];
  //     }
  //     acc[roundName].push(match);
  //     return acc;
  //   },
  //   {} as Record<string, Match[]>
  // );

  // const getMatchStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'LIVE':
  //       return 'bg-green-100 text-green-800 animate-pulse';
  //     case 'SCHEDULED':
  //       return 'bg-blue-100 text-blue-800';
  //     case 'FINISHED':
  //       return 'bg-gray-100 text-gray-800';
  //     case 'CANCELLED':
  //       return 'bg-red-100 text-red-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  // const getMatchStatusLabel = (status: string) => {
  //   switch (status) {
  //     case 'LIVE':
  //       return 'Live';
  //     case 'SCHEDULED':
  //       return 'Scheduled';
  //     case 'FINISHED':
  //       return 'Finished';
  //     case 'CANCELLED':
  //       return 'Cancelled';
  //     default:
  //       return status;
  //   }
  // };

  // const getMatchStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'LIVE':
  //       return <Play className="h-3 w-3" />;
  //     case 'SCHEDULED':
  //       return <Clock className="h-3 w-3" />;
  //     case 'FINISHED':
  //       return <CheckCircle className="h-3 w-3" />;
  //     case 'CANCELLED':
  //       return <Clock className="h-3 w-3" />;
  //     default:
  //       return <Clock className="h-3 w-3" />;
  //   }
  // };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <div className="space-y-6">
            <Button variant="ghost" asChild>
              <Link href="/tournaments">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tournaments
              </Link>
            </Button>
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  Tournament Not Found
                </h3>
                <p className="mb-4 text-muted-foreground">
                  The tournament you&apos;re looking for doesn&apos;t exist.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <div className="space-y-6">
            <Button variant="ghost" asChild>
              <Link href={`/tournaments/${params.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tournament
              </Link>
            </Button>
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No Matches Yet</h3>
                <p className="mb-4 text-muted-foreground">
                  This tournament hasn&apos;t scheduled any matches yet.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

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

          {/* Tournament Header */}
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {tournament.name}
              </h1>
              <p className="text-xl text-muted-foreground">
                {tournament.organization.name} - Season {tournament.season}
              </p>
            </div>
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4" />
                <span>{tournament._count.teams} Teams</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(tournament.startDate).toLocaleDateString('fi-FI')} -{' '}
                  {new Date(tournament.endDate).toLocaleDateString('fi-FI')}
                </span>
              </div>
            </div>
          </div>

          {/* Results Tabs */}
          <Tabs defaultValue="results" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="results">Match Results</TabsTrigger>
              <TabsTrigger value="standings">Standings</TabsTrigger>
            </TabsList>

            {/* Match Results Tab */}
            <TabsContent value="results" className="space-y-6">
              <MatchList
                matches={matches.map((match) => ({
                  id: match.id,
                  homeTeam: {
                    id: (match.homeTeam as any).id || '',
                    name: match.homeTeam.name,
                  },
                  awayTeam: {
                    id: (match.awayTeam as any).id || '',
                    name: match.awayTeam.name,
                  },
                  field: match.venue?.name || 'TBD',
                  startTime: match.startTime,
                  status: match.status.toLowerCase() as
                    | 'upcoming'
                    | 'live'
                    | 'finished'
                    | 'cancelled',
                  homeScore: match.homeScore,
                  awayScore: match.awayScore,
                  round: match.group?.name || '',
                }))}
                showField={true}
                showRound={true}
                showViewButton={true}
                groupByRound={true}
              />
            </TabsContent>

            {/* Standings Tab */}
            <TabsContent value="standings">
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Standings</h3>
                  <p className="text-muted-foreground">
                    Standings will be available once the tournament progresses.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
