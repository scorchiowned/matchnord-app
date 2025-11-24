'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SafeHtml } from '@/components/ui/safe-html';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { PublicVenueMap } from '@/components/tournament/public-venue-map';
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Clock,
  Target,
  FileText,
  ExternalLink,
  ArrowLeft,
  Play,
  CheckCircle,
  Award,
  Settings,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  shortName?: string;
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
}

interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  field: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
  round?: string;
}

interface BracketMatch {
  id: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore?: number;
  awayScore?: number;
  round: string;
  status: 'upcoming' | 'live' | 'finished';
}

interface Venue {
  id: string;
  name: string;
  streetName?: string;
  postalCode?: string;
  city?: string;
  country?: {
    id: string;
    name: string;
    code: string;
  };
  xCoordinate?: number;
  yCoordinate?: number;
}

interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  venue: string;
  venues: Venue[];
  rulesUrl?: string;
  groups: {
    id: string;
    name: string;
    standings: Standing[];
  }[];
  matches: Match[];
  bracket: BracketMatch[];
}

export default function PublicTournamentPage({
  params,
}: {
  params: { id: string };
}) {
  const locale = useLocale();
  const t = useTranslations();
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === 'ADMIN';
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('groups');
  const [canManage, setCanManage] = useState(false);
  const [canManageScores, setCanManageScores] = useState(false);

  // Load tournament data from API
  useEffect(() => {
    const loadTournament = async () => {
      try {
        setIsLoading(true);
        const data = await api.tournaments.getPublic(params.id);
        setTournament(data as Tournament);
      } catch (error) {
        console.error('Error loading tournament:', error);
        setTournament(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTournament();
  }, [params.id]);

  // Check if user has permission to manage this tournament
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || !params.id) {
        setCanManage(false);
        setCanManageScores(false);
        return;
      }

      // Admins can always manage
      if (isAdmin) {
        setCanManage(true);
        setCanManageScores(true);
        return;
      }

      try {
        const permissions = await api.tournaments.getPermissions(params.id);
        setCanManage(permissions.canConfigure || false);
        setCanManageScores(permissions.canManageScores || false);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setCanManage(false);
        setCanManageScores(false);
      }
    };

    checkPermissions();
  }, [user, params.id, isAdmin]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800 animate-pulse';
      case 'finished':
        return 'bg-gray-100 text-gray-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="h-3 w-3" />;
      case 'finished':
        return <CheckCircle className="h-3 w-3" />;
      case 'upcoming':
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-600" />;
      case 2:
        return <Award className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium">{position}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <div className="text-center">{t('tournament.loading')}</div>
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <div className="text-center">
            {t('tournament.tournamentNotFound')}
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href={`/tournaments`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('tournament.backToTournaments')}
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {tournament.name}
                </h1>
                {tournament.description ? (
                  <SafeHtml
                    content={tournament.description}
                    className="text-muted-foreground"
                  />
                ) : (
                  <p className="text-muted-foreground">
                    No description available
                  </p>
                )}
              </div>
            </div>

            {/* Permission-based actions */}
            <div className="flex items-center space-x-2">
              {canManage && (
                <Button asChild>
                  <Link href={`/tournaments/${params.id}/manage`}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('tournament.manageTournament')}
                  </Link>
                </Button>
              )}
              {!canManage && canManageScores && (
                <Button variant="outline" asChild>
                  <Link href={`/tournaments/${params.id}/manage-public`}>
                    <Target className="mr-2 h-4 w-4" />
                    Manage Scores
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Tournament Info */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t('tournament.dates')}
                    </div>
                    <div className="font-medium">
                      {new Date(tournament.startDate).toLocaleDateString(
                        locale
                      )}{' '}
                      -{' '}
                      {new Date(tournament.endDate).toLocaleDateString(locale)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t('tournament.venue')}
                    </div>
                    <div className="font-medium">{tournament.venue}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t('tournament.teams')}
                    </div>
                    <div className="font-medium">
                      {tournament.groups.reduce(
                        (total, group) => total + group.standings.length,
                        0
                      )}{' '}
                      {t('tournament.teams').toLowerCase()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t('tournament.groups')}
                    </div>
                    <div className="font-medium">
                      {tournament.groups.length}{' '}
                      {t('tournament.groups').toLowerCase()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venue Map */}
          {tournament.venues && tournament.venues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t('tournament.venue')}{' '}
                  {tournament.venues.length > 1 ? 's' : ''}
                </CardTitle>
                <CardDescription>
                  {t('tournament.venueLocation')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {tournament.venues.map((venue) => (
                    <PublicVenueMap key={venue.id} venue={venue} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="groups">
                {t('tournament.groupsTab')}
              </TabsTrigger>
              <TabsTrigger value="matches">
                {t('tournament.matchesTab')}
              </TabsTrigger>
              <TabsTrigger value="bracket">
                {t('tournament.bracketTab')}
              </TabsTrigger>
              <TabsTrigger value="info">{t('tournament.infoTab')}</TabsTrigger>
            </TabsList>

            {/* Groups Tab */}
            <TabsContent value="groups" className="space-y-6">
              <div className="grid gap-6">
                {tournament.groups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {group.name}
                      </CardTitle>
                      <CardDescription>
                        {t('tournament.groupStandings')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="p-2 text-left font-medium">
                                {t('tournament.position')}
                              </th>
                              <th className="p-2 text-left font-medium">
                                {t('tournament.team')}
                              </th>
                              <th className="p-2 text-center font-medium">
                                {t('tournament.played')}
                              </th>
                              <th className="p-2 text-center font-medium">
                                {t('tournament.won')}
                              </th>
                              <th className="p-2 text-center font-medium">
                                {t('tournament.drawn')}
                              </th>
                              <th className="p-2 text-center font-medium">
                                {t('tournament.lost')}
                              </th>
                              <th className="p-2 text-center font-medium">
                                {t('tournament.goalsFor')}
                              </th>
                              <th className="p-2 text-center font-medium">
                                {t('tournament.goalsAgainst')}
                              </th>
                              <th className="p-2 text-center font-medium">
                                {t('tournament.goalDifference')}
                              </th>
                              <th className="p-2 text-center font-medium">
                                {t('tournament.points')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.standings.map((standing) => (
                              <tr
                                key={standing.team.id}
                                className="border-b hover:bg-muted/50"
                              >
                                <td className="p-2">
                                  <div className="flex items-center">
                                    {getPositionIcon(standing.position)}
                                  </div>
                                </td>
                                <td className="p-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">
                                      {standing.team.name}
                                    </span>
                                    {standing.team.shortName && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {standing.team.shortName}
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2 text-center">
                                  {standing.played}
                                </td>
                                <td className="p-2 text-center">
                                  {standing.won}
                                </td>
                                <td className="p-2 text-center">
                                  {standing.drawn}
                                </td>
                                <td className="p-2 text-center">
                                  {standing.lost}
                                </td>
                                <td className="p-2 text-center">
                                  {standing.goalsFor}
                                </td>
                                <td className="p-2 text-center">
                                  {standing.goalsAgainst}
                                </td>
                                <td className="p-2 text-center">
                                  <span
                                    className={
                                      standing.goalDifference >= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }
                                  >
                                    {standing.goalDifference >= 0 ? '+' : ''}
                                    {standing.goalDifference}
                                  </span>
                                </td>
                                <td className="p-2 text-center font-bold">
                                  {standing.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Matches Tab */}
            <TabsContent value="matches" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    {t('tournament.matchSchedule')}
                  </CardTitle>
                  <CardDescription>
                    {t('tournament.allMatches')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tournament.matches.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center space-x-4">
                          <Badge className={getStatusColor(match.status)}>
                            {getStatusIcon(match.status)}
                            <span className="ml-1 capitalize">
                              {match.status}
                            </span>
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {new Date(match.startTime).toLocaleDateString(
                              locale
                            )}{' '}
                            at{' '}
                            {new Date(match.startTime).toLocaleTimeString(
                              locale,
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {match.field}
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="font-medium">
                              {match.homeTeam.name}
                            </div>
                            <div className="text-2xl font-bold">
                              {match.homeScore ?? '-'}
                            </div>
                          </div>
                          <div className="text-muted-foreground">
                            {t('tournament.vs')}
                          </div>
                          <div className="text-center">
                            <div className="font-medium">
                              {match.awayTeam.name}
                            </div>
                            <div className="text-2xl font-bold">
                              {match.awayScore ?? '-'}
                            </div>
                          </div>
                        </div>

                        {match.round && (
                          <div className="text-sm text-muted-foreground">
                            {match.round}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bracket Tab */}
            <TabsContent value="bracket" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    {t('tournament.knockoutBracket')}
                  </CardTitle>
                  <CardDescription>
                    {t('tournament.tournamentBracket')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {tournament.bracket.map((match) => (
                      <div key={match.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{match.round}</Badge>
                            <Badge className={getStatusColor(match.status)}>
                              {getStatusIcon(match.status)}
                              <span className="ml-1 capitalize">
                                {match.status}
                              </span>
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-center space-x-8">
                          <div className="text-center">
                            <div className="font-medium">
                              {match.homeTeam?.name || t('tournament.tbd')}
                            </div>
                            <div className="text-2xl font-bold">
                              {match.homeScore ?? '-'}
                            </div>
                          </div>
                          <div className="text-muted-foreground">
                            {t('tournament.vs')}
                          </div>
                          <div className="text-center">
                            <div className="font-medium">
                              {match.awayTeam?.name || t('tournament.tbd')}
                            </div>
                            <div className="text-2xl font-bold">
                              {match.awayScore ?? '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {t('tournament.tournamentDetails')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('tournament.dates')}
                      </div>
                      <div>
                        {new Date(tournament.startDate).toLocaleDateString(
                          locale
                        )}{' '}
                        -{' '}
                        {new Date(tournament.endDate).toLocaleDateString(
                          locale
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('tournament.venue')}
                      </div>
                      <div>{tournament.venue}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('tournament.format')}
                      </div>
                      <div>Groups → Knockout</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('tournament.teams')}
                      </div>
                      <div>
                        {tournament.groups.reduce(
                          (total, group) => total + group.standings.length,
                          0
                        )}{' '}
                        {t('tournament.teams').toLowerCase()} in{' '}
                        {tournament.groups.length}{' '}
                        {t('tournament.groups').toLowerCase()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {t('tournament.rulesDocuments')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('tournament.scoringSystem')}
                      </div>
                      <div>Win = 3 points, Draw = 1 point, Loss = 0 points</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {t('tournament.tiebreakers')}
                      </div>
                      <div>
                        1. Goal Difference 2. Goals For 3. Head-to-Head 4. Coin
                        Toss
                      </div>
                    </div>
                    {tournament.rulesUrl && (
                      <div>
                        <Button variant="outline" asChild>
                          <a
                            href={tournament.rulesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t('tournament.downloadRules')}
                          </a>
                        </Button>
                      </div>
                    )}

                    {/* Permission-based additional info */}
                    {canManage && (
                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <h4 className="mb-2 font-medium text-blue-900">
                          {t('tournament.managementInfo')}
                        </h4>
                        <div className="space-y-1 text-sm text-blue-700">
                          <div>
                            {t('tournament.tournamentId')}: {tournament.id}
                          </div>
                          <div>
                            {t('tournament.status')}:{' '}
                            {(tournament as any).isPublished
                              ? 'Published'
                              : 'Draft'}
                          </div>
                          <div>
                            {t('tournament.totalMatches')}:{' '}
                            {tournament.matches.length}
                          </div>
                          <div>
                            {t('tournament.groups')}: {tournament.groups.length}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
