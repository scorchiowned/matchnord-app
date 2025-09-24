'use client';
import { Link } from '@/i18n/routing';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MainNavigation } from '@/components/navigation/main-navigation';
import {
  Users,
  Trophy,
  MapPin,
  Calendar,
  Globe,
  Palette,
  Award,
  Edit,
  Plus,
  ArrowLeft,
  Shirt,
} from 'lucide-react';

// Mock data - in a real app, this would fetch from the API
async function getTeam(id: string) {
  const teams = [
    {
      id: '1',
      name: 'Helsinki United',
      city: 'Helsinki',
      founded: 1995,
      homeVenue: 'Olympic Stadium',
      tournament: 'Youth Championship 2024',
      tournamentId: '1',
      players: 22,
      coach: 'Mika Kivinen',
      assistantCoach: 'Jukka Laine',
      manager: 'Antti Virtanen',
      status: 'active',
      achievements: [
        'League Champions 2023',
        'Cup Winners 2022',
        'League Champions 2021',
        'Regional Champions 2020',
      ],
      colors: 'Blue & White',
      website: 'https://helsinkiunited.fi',
      email: 'info@helsinkiunited.fi',
      phone: '+358 40 123 4567',
      description:
        'Helsinki United is one of the most successful youth football clubs in Finland, known for developing talented players and maintaining high standards both on and off the pitch.',
      roster: {
        goalkeepers: [
          {
            id: '1',
            name: 'Elias Virtanen',
            number: 1,
            age: 18,
            position: 'GK',
            height: '185cm',
            weight: '78kg',
            nationality: 'Finnish',
            joined: 2020,
            goals: 0,
            assists: 0,
            cleanSheets: 12,
          },
          {
            id: '2',
            name: 'Olli Koskinen',
            number: 12,
            age: 17,
            position: 'GK',
            height: '182cm',
            weight: '75kg',
            nationality: 'Finnish',
            joined: 2021,
            goals: 0,
            assists: 0,
            cleanSheets: 8,
          },
        ],
        defenders: [
          {
            id: '3',
            name: 'Mikael Laine',
            number: 2,
            age: 18,
            position: 'RB',
            height: '178cm',
            weight: '72kg',
            nationality: 'Finnish',
            joined: 2019,
            goals: 2,
            assists: 8,
            cleanSheets: 0,
          },
          {
            id: '4',
            name: 'Timo Nieminen',
            number: 3,
            age: 18,
            position: 'LB',
            height: '175cm',
            weight: '70kg',
            nationality: 'Finnish',
            joined: 2019,
            goals: 1,
            assists: 6,
            cleanSheets: 0,
          },
          {
            id: '5',
            name: 'Aleksi Kivinen',
            number: 4,
            age: 19,
            position: 'CB',
            height: '188cm',
            weight: '82kg',
            nationality: 'Finnish',
            joined: 2018,
            goals: 5,
            assists: 2,
            cleanSheets: 0,
          },
          {
            id: '6',
            name: 'Petri Virtanen',
            number: 5,
            age: 18,
            position: 'CB',
            height: '185cm',
            weight: '80kg',
            nationality: 'Finnish',
            joined: 2020,
            goals: 3,
            assists: 1,
            cleanSheets: 0,
          },
        ],
        midfielders: [
          {
            id: '7',
            name: 'Jukka Nieminen',
            number: 6,
            age: 18,
            position: 'DM',
            height: '180cm',
            weight: '75kg',
            nationality: 'Finnish',
            joined: 2019,
            goals: 2,
            assists: 12,
            cleanSheets: 0,
          },
          {
            id: '8',
            name: 'Mikael Koskinen',
            number: 8,
            age: 19,
            position: 'CM',
            height: '178cm',
            weight: '73kg',
            nationality: 'Finnish',
            joined: 2018,
            goals: 8,
            assists: 15,
            cleanSheets: 0,
          },
          {
            id: '9',
            name: 'Aleksi Laine',
            number: 10,
            age: 18,
            position: 'AM',
            height: '175cm',
            weight: '70kg',
            nationality: 'Finnish',
            joined: 2020,
            goals: 15,
            assists: 18,
            cleanSheets: 0,
          },
          {
            id: '10',
            name: 'Timo Virtanen',
            number: 11,
            age: 17,
            position: 'RW',
            height: '172cm',
            weight: '68kg',
            nationality: 'Finnish',
            joined: 2021,
            goals: 12,
            assists: 10,
            cleanSheets: 0,
          },
        ],
        forwards: [
          {
            id: '11',
            name: 'Petri Koskinen',
            number: 9,
            age: 18,
            position: 'ST',
            height: '182cm',
            weight: '76kg',
            nationality: 'Finnish',
            joined: 2019,
            goals: 25,
            assists: 8,
            cleanSheets: 0,
          },
          {
            id: '12',
            name: 'Jari Laine',
            number: 7,
            age: 19,
            position: 'LW',
            height: '175cm',
            weight: '71kg',
            nationality: 'Finnish',
            joined: 2018,
            goals: 18,
            assists: 14,
            cleanSheets: 0,
          },
        ],
      },
      statistics: {
        matchesPlayed: 24,
        wins: 18,
        draws: 4,
        losses: 2,
        goalsFor: 67,
        goalsAgainst: 23,
        goalDifference: 44,
        points: 58,
        cleanSheets: 12,
        topScorer: 'Petri Koskinen (25 goals)',
        topAssister: 'Aleksi Laine (18 assists)',
        mostCleanSheets: 'Elias Virtanen (12)',
      },
      recentMatches: [
        {
          id: '1',
          opponent: 'Espoo Eagles',
          result: 'W 3-1',
          date: '2024-06-10',
          home: true,
        },
        {
          id: '2',
          opponent: 'Oulu Owls',
          result: 'D 2-2',
          date: '2024-06-03',
          home: false,
        },
        {
          id: '3',
          opponent: 'Local Heroes',
          result: 'W 4-0',
          date: '2024-05-27',
          home: true,
        },
        {
          id: '4',
          opponent: 'Visiting Stars',
          result: 'W 2-1',
          date: '2024-05-20',
          home: false,
        },
      ],
    },
    {
      id: '2',
      name: 'Espoo Eagles',
      city: 'Espoo',
      founded: 1998,
      homeVenue: 'Espoo Sports Center',
      tournament: 'Youth Championship 2024',
      tournamentId: '1',
      players: 20,
      coach: 'Jari Virtanen',
      assistantCoach: 'Mikael Koskinen',
      manager: 'Petri Laine',
      status: 'active',
      achievements: ['League Runners-up 2023', 'Cup Semi-finalists 2022'],
      colors: 'Green & Gold',
      website: 'https://espooeagles.fi',
      email: 'info@espooeagles.fi',
      phone: '+358 40 234 5678',
      description:
        'Espoo Eagles is a competitive youth football club known for its strong defensive play and developing talented midfielders.',
      roster: {
        goalkeepers: [
          {
            id: '1',
            name: 'Antti Virtanen',
            number: 1,
            age: 18,
            position: 'GK',
            height: '183cm',
            weight: '76kg',
            nationality: 'Finnish',
            joined: 2020,
            goals: 0,
            assists: 0,
            cleanSheets: 10,
          },
        ],
        defenders: [
          {
            id: '2',
            name: 'Jukka Koskinen',
            number: 2,
            age: 18,
            position: 'RB',
            height: '176cm',
            weight: '71kg',
            nationality: 'Finnish',
            joined: 2019,
            goals: 1,
            assists: 5,
            cleanSheets: 0,
          },
        ],
        midfielders: [
          {
            id: '3',
            name: 'Mikael Laine',
            number: 8,
            age: 18,
            position: 'CM',
            height: '177cm',
            weight: '72kg',
            nationality: 'Finnish',
            joined: 2020,
            goals: 6,
            assists: 12,
            cleanSheets: 0,
          },
        ],
        forwards: [
          {
            id: '4',
            name: 'Timo Virtanen',
            number: 9,
            age: 19,
            position: 'ST',
            height: '180cm',
            weight: '74kg',
            nationality: 'Finnish',
            joined: 2019,
            goals: 18,
            assists: 6,
            cleanSheets: 0,
          },
        ],
      },
      statistics: {
        matchesPlayed: 24,
        wins: 15,
        draws: 6,
        losses: 3,
        goalsFor: 52,
        goalsAgainst: 28,
        goalDifference: 24,
        points: 51,
        cleanSheets: 8,
        topScorer: 'Timo Virtanen (18 goals)',
        topAssister: 'Mikael Laine (12 assists)',
        mostCleanSheets: 'Antti Virtanen (10)',
      },
      recentMatches: [
        {
          id: '1',
          opponent: 'Helsinki United',
          result: 'L 1-3',
          date: '2024-06-10',
          home: false,
        },
        {
          id: '2',
          opponent: 'Oulu Owls',
          result: 'W 2-1',
          date: '2024-06-03',
          home: true,
        },
      ],
    },
    {
      id: '3',
      name: 'Oulu Owls',
      city: 'Oulu',
      founded: 1992,
      homeVenue: 'Oulu Sports Center',
      tournament: 'Youth Championship 2024',
      tournamentId: '1',
      players: 18,
      coach: 'Timo Koskinen',
      assistantCoach: 'Aleksi Virtanen',
      manager: 'Jari Laine',
      status: 'active',
      achievements: ['Regional Champions 2023', 'League Champions 2021'],
      colors: 'Orange & Black',
      website: 'https://ouluowls.fi',
      email: 'info@ouluowls.fi',
      phone: '+358 40 345 6789',
      description:
        'Oulu Owls is one of the oldest youth football clubs in northern Finland, with a rich history of developing regional talent.',
      roster: {
        goalkeepers: [
          {
            id: '1',
            name: 'Petri Koskinen',
            number: 1,
            age: 18,
            position: 'GK',
            height: '186cm',
            weight: '79kg',
            nationality: 'Finnish',
            joined: 2020,
            goals: 0,
            assists: 0,
            cleanSheets: 9,
          },
        ],
        defenders: [
          {
            id: '2',
            name: 'Mikael Nieminen',
            number: 4,
            age: 19,
            position: 'CB',
            height: '185cm',
            weight: '81kg',
            nationality: 'Finnish',
            joined: 2019,
            goals: 3,
            assists: 1,
            cleanSheets: 0,
          },
        ],
        midfielders: [
          {
            id: '3',
            name: 'Aleksi Koskinen',
            number: 10,
            age: 18,
            position: 'AM',
            height: '175cm',
            weight: '70kg',
            nationality: 'Finnish',
            joined: 2020,
            goals: 12,
            assists: 15,
            cleanSheets: 0,
          },
        ],
        forwards: [
          {
            id: '4',
            name: 'Jukka Virtanen',
            number: 7,
            age: 18,
            position: 'ST',
            height: '179cm',
            weight: '73kg',
            nationality: 'Finnish',
            joined: 2019,
            goals: 20,
            assists: 8,
            cleanSheets: 0,
          },
        ],
      },
      statistics: {
        matchesPlayed: 24,
        wins: 12,
        draws: 8,
        losses: 4,
        goalsFor: 45,
        goalsAgainst: 32,
        goalDifference: 13,
        points: 44,
        cleanSheets: 6,
        topScorer: 'Jukka Virtanen (20 goals)',
        topAssister: 'Aleksi Koskinen (15 assists)',
        mostCleanSheets: 'Petri Koskinen (9)',
      },
      recentMatches: [
        {
          id: '1',
          opponent: 'Helsinki United',
          result: 'D 2-2',
          date: '2024-06-03',
          home: true,
        },
        {
          id: '2',
          opponent: 'Espoo Eagles',
          result: 'L 1-2',
          date: '2024-06-03',
          home: false,
        },
      ],
    },
    {
      id: '4',
      name: 'Local Heroes',
      city: 'Vantaa',
      founded: 2000,
      homeVenue: 'Summer Arena',
      tournament: 'Summer Cup 2024',
      tournamentId: '2',
      players: 16,
      coach: 'Petri Laine',
      assistantCoach: 'Timo Virtanen',
      manager: 'Mikael Koskinen',
      status: 'active',
      achievements: [],
      colors: 'Red & White',
      website: 'https://localheroes.fi',
      email: 'info@localheroes.fi',
      phone: '+358 40 456 7890',
      description:
        'Local Heroes is a newer club focused on developing young talent and building a strong community presence in Vantaa.',
      roster: {
        goalkeepers: [
          {
            id: '1',
            name: 'Jari Koskinen',
            number: 1,
            age: 17,
            position: 'GK',
            height: '181cm',
            weight: '75kg',
            nationality: 'Finnish',
            joined: 2021,
            goals: 0,
            assists: 0,
            cleanSheets: 5,
          },
        ],
        defenders: [
          {
            id: '2',
            name: 'Antti Laine',
            number: 3,
            age: 18,
            position: 'LB',
            height: '174cm',
            weight: '69kg',
            nationality: 'Finnish',
            joined: 2020,
            goals: 0,
            assists: 4,
            cleanSheets: 0,
          },
        ],
        midfielders: [
          {
            id: '3',
            name: 'Mikael Nieminen',
            number: 6,
            age: 18,
            position: 'CM',
            height: '176cm',
            weight: '71kg',
            nationality: 'Finnish',
            joined: 2020,
            goals: 4,
            assists: 8,
            cleanSheets: 0,
          },
        ],
        forwards: [
          {
            id: '4',
            name: 'Timo Koskinen',
            number: 9,
            age: 17,
            position: 'ST',
            height: '178cm',
            weight: '72kg',
            nationality: 'Finnish',
            joined: 2021,
            goals: 12,
            assists: 5,
            cleanSheets: 0,
          },
        ],
      },
      statistics: {
        matchesPlayed: 20,
        wins: 8,
        draws: 5,
        losses: 7,
        goalsFor: 32,
        goalsAgainst: 28,
        goalDifference: 4,
        points: 29,
        cleanSheets: 4,
        topScorer: 'Timo Koskinen (12 goals)',
        topAssister: 'Mikael Nieminen (8 assists)',
        mostCleanSheets: 'Jari Koskinen (5)',
      },
      recentMatches: [
        {
          id: '1',
          opponent: 'Helsinki United',
          result: 'L 0-4',
          date: '2024-05-27',
          home: false,
        },
        {
          id: '2',
          opponent: 'Visiting Stars',
          result: 'W 2-1',
          date: '2024-05-20',
          home: true,
        },
      ],
    },
    {
      id: '5',
      name: 'Visiting Stars',
      city: 'Tampere',
      founded: 1996,
      homeVenue: 'Summer Arena',
      tournament: 'Summer Cup 2024',
      tournamentId: '2',
      players: 19,
      coach: 'Antti Nieminen',
      assistantCoach: 'Jukka Laine',
      manager: 'Mikael Virtanen',
      status: 'active',
      achievements: ['Summer Cup Winners 2023', 'League Champions 2022'],
      colors: 'Purple & Silver',
      website: 'https://visitingstars.fi',
      email: 'info@visitingstars.fi',
      phone: '+358 40 567 8901',
      description:
        'Visiting Stars is a competitive club from Tampere known for its attacking style and technical players.',
      roster: {
        goalkeepers: [
          {
            id: '1',
            name: 'Mikael Virtanen',
            number: 1,
            age: 18,
            position: 'GK',
            height: '184cm',
            weight: '77kg',
            nationality: 'Finnish',
            joined: 2020,
            goals: 0,
            assists: 0,
            cleanSheets: 11,
          },
        ],
        defenders: [
          {
            id: '2',
            name: 'Jukka Koskinen',
            number: 4,
            age: 19,
            position: 'CB',
            height: '187cm',
            weight: '83kg',
            nationality: 'Finnish',
            joined: 2019,
            goals: 2,
            assists: 3,
            cleanSheets: 0,
          },
        ],
        midfielders: [
          {
            id: '3',
            name: 'Aleksi Laine',
            number: 8,
            age: 18,
            position: 'CM',
            height: '177cm',
            weight: '72kg',
            nationality: 'Finnish',
            joined: 2020,
            goals: 8,
            assists: 14,
            cleanSheets: 0,
          },
        ],
        forwards: [
          {
            id: '4',
            name: 'Petri Virtanen',
            number: 11,
            age: 18,
            position: 'ST',
            height: '181cm',
            weight: '75kg',
            nationality: 'Finnish',
            joined: 2019,
            goals: 22,
            assists: 9,
            cleanSheets: 0,
          },
        ],
      },
      statistics: {
        matchesPlayed: 20,
        wins: 14,
        draws: 3,
        losses: 3,
        goalsFor: 48,
        goalsAgainst: 22,
        goalDifference: 26,
        points: 45,
        cleanSheets: 9,
        topScorer: 'Petri Virtanen (22 goals)',
        topAssister: 'Aleksi Laine (14 assists)',
        mostCleanSheets: 'Mikael Virtanen (11)',
      },
      recentMatches: [
        {
          id: '1',
          opponent: 'Helsinki United',
          result: 'L 1-2',
          date: '2024-05-20',
          home: true,
        },
        {
          id: '2',
          opponent: 'Local Heroes',
          result: 'L 1-2',
          date: '2024-05-20',
          home: false,
        },
      ],
    },
  ];

  return teams.find((team) => team.id === id);
}

export default async function TeamDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const team = await getTeam(params.id);

  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="mb-2 text-lg font-semibold">Team Not Found</h3>
              <p className="mb-4 text-muted-foreground">
                The team you&apos;re looking for doesn&apos;t exist.
              </p>
              <Button asChild>
                <Link href="/teams">Back to Teams</Link>
              </Button>
            </CardContent>
          </Card>
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
            <Link href="/teams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teams
            </Link>
          </Button>

          {/* Team Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  {team.name}
                </h1>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{team.city}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Founded {team.founded}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{team.players} players</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button asChild variant="outline">
                  <Link href={`/admin/teams/${team.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Team
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/admin/teams/${team.id}/players/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Player
                  </Link>
                </Button>
              </div>
            </div>

            {/* Team Description */}
            <p className="max-w-3xl text-lg text-muted-foreground">
              {team.description}
            </p>
          </div>

          {/* Key Information Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coach</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{team.coach}</div>
                <p className="text-xs text-muted-foreground">Head Coach</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Home Venue
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{team.homeVenue}</div>
                <p className="text-xs text-muted-foreground">Stadium</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Colors</CardTitle>
                <Palette className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{team.colors}</div>
                <p className="text-xs text-muted-foreground">Team Colors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tournament
                </CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{team.tournament}</div>
                <p className="text-xs text-muted-foreground">Current Season</p>
              </CardContent>
            </Card>
          </div>

          {/* Team Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Season Statistics</CardTitle>
              <CardDescription>
                Performance overview for the current season
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {team.statistics.wins}
                  </div>
                  <p className="text-xs text-muted-foreground">Wins</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {team.statistics.draws}
                  </div>
                  <p className="text-xs text-muted-foreground">Draws</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {team.statistics.losses}
                  </div>
                  <p className="text-xs text-muted-foreground">Losses</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {team.statistics.points}
                  </div>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {team.statistics.goalsFor}
                  </div>
                  <p className="text-xs text-muted-foreground">Goals For</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {team.statistics.goalsAgainst}
                  </div>
                  <p className="text-xs text-muted-foreground">Goals Against</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    +{team.statistics.goalDifference}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Goal Difference
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {team.statistics.cleanSheets}
                  </div>
                  <p className="text-xs text-muted-foreground">Clean Sheets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Roster */}
          <Card>
            <CardHeader>
              <CardTitle>Team Roster</CardTitle>
              <CardDescription>
                Complete player list with statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Goalkeepers */}
                <div>
                  <h3 className="mb-3 flex items-center text-lg font-semibold">
                    <Shirt className="mr-2 h-5 w-5 text-blue-600" />
                    Goalkeepers ({team.roster.goalkeepers.length})
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {team.roster.goalkeepers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                            {player.number}
                          </div>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {player.position} • {player.age} years
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">
                            {player.cleanSheets} clean sheets
                          </div>
                          <div className="text-muted-foreground">
                            Joined {player.joined}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Defenders */}
                <div>
                  <h3 className="mb-3 flex items-center text-lg font-semibold">
                    <Shirt className="mr-2 h-5 w-5 text-green-600" />
                    Defenders ({team.roster.defenders.length})
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {team.roster.defenders.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800">
                            {player.number}
                          </div>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {player.position} • {player.age} years
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">
                            {player.goals} goals, {player.assists} assists
                          </div>
                          <div className="text-muted-foreground">
                            Joined {player.joined}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Midfielders */}
                <div>
                  <h3 className="mb-3 flex items-center text-lg font-semibold">
                    <Shirt className="mr-2 h-5 w-5 text-yellow-600" />
                    Midfielders ({team.roster.midfielders.length})
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {team.roster.midfielders.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-800">
                            {player.number}
                          </div>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {player.position} • {player.age} years
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">
                            {player.goals} goals, {player.assists} assists
                          </div>
                          <div className="text-muted-foreground">
                            Joined {player.joined}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forwards */}
                <div>
                  <h3 className="mb-3 flex items-center text-lg font-semibold">
                    <Shirt className="mr-2 h-5 w-5 text-red-600" />
                    Forwards ({team.roster.forwards.length})
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {team.roster.forwards.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-800">
                            {player.number}
                          </div>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {player.position} • {player.age} years
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">
                            {player.goals} goals, {player.assists} assists
                          </div>
                          <div className="text-muted-foreground">
                            Joined {player.joined}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Matches */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
              <CardDescription>
                Latest results and upcoming fixtures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-3 w-3 rounded-full ${match.home ? 'bg-blue-500' : 'bg-gray-400'}`}
                      ></div>
                      <div>
                        <div className="font-medium">
                          {match.home
                            ? `${team.name} vs ${match.opponent}`
                            : `${match.opponent} vs ${team.name}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(match.date).toLocaleDateString('fi-FI')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          match.result.startsWith('W')
                            ? 'default'
                            : match.result.startsWith('D')
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {match.result}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Team honors and accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {team.achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 rounded-lg border p-3"
                  >
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">{achievement}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Get in touch with the team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={team.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {team.website}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{team.email}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Manager: {team.manager}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Assistant Coach: {team.assistantCoach}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
