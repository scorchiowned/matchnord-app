'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { MainNavigation } from '@/components/navigation/main-navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Settings,
  Users,
  MapPin,
  Calendar,
  Edit,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { TeamsManagement } from '@/components/tournament/teams-management';
import { VenuesManagement } from '@/components/tournament/venues-management';
import { DivisionsManagement } from '@/components/tournament/divisions-management';
import { GroupsManagement } from '@/components/tournament/groups-management';
import { MatchesManagementSimple } from '@/components/tournament/matches-management-simple';
import { MatchScheduling } from '@/components/tournament/match-scheduling';
import { TournamentInfoEditor } from '@/components/tournament/tournament-info-editor';
import { LockManagement } from '@/components/tournament/lock-management';

interface Tournament {
  id: string;
  name: string;
  slug: string;
  description?: string;
  season: string;
  startDate: string;
  endDate: string;
  status: string;
  isPublished: boolean;
  teamsPublished: boolean;
  schedulePublished: boolean;
  city?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationDeadline?: string;
  autoAcceptTeams?: boolean;
  allowWaitlist?: boolean;
  maxTeams?: number;
  latitude?: number;
  longitude?: number;
  organization: {
    id: string;
    name: string;
  };
  country: {
    id: string;
    name: string;
    code: string;
  };
  // Lock management
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  // Divisions with groups and teams
  divisions: Array<{
    id: string;
    name: string;
    level?: string;
    isLocked: boolean;
    lockedAt?: string;
    lockedBy?: string;
    groups: Array<{
      id: string;
      name: string;
      teams: Array<{
        id: string;
        name: string;
        level?: string;
      }>;
    }>;
    teams: Array<{
      id: string;
      name: string;
      level?: string;
    }>;
  }>;
  _count: {
    teams: number;
    venues: number;
    divisions: number;
    matches: number;
  };
}

export default function TournamentManagePage() {
  const params = useParams();
  const { data: session } = useSession();
  const t = useTranslations();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic counts for tabs
  const [teamCount, setTeamCount] = useState(0);
  const [venueCount, setVenueCount] = useState(0);
  const [divisionCount, setDivisionCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  // Function to update tournament publication status
  const updatePublicationStatus = async (
    field: 'teamsPublished' | 'schedulePublished'
  ) => {
    if (!tournament) return;

    const currentValue = tournament[field];
    const newValue = !currentValue;

    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          [field]: newValue,
        }),
      });

      if (response.ok) {
        const updatedTournament = await response.json();
        setTournament(updatedTournament);
      } else {
        console.error('Failed to update publication status');
      }
    } catch (error) {
      console.error('Error updating publication status:', error);
    }
  };

  // Function to update tournament status
  const updateTournamentStatus = async (newStatus: string) => {
    if (!tournament) return;

    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        const updatedTournament = await response.json();
        setTournament(updatedTournament);
      } else {
        console.error('Failed to update tournament status');
      }
    } catch (error) {
      console.error('Error updating tournament status:', error);
    }
  };

  // Callback functions for management components to update counts
  const onTeamsChange = (newTeams: any[]) => {
    setTeams(newTeams);
    setTeamCount(newTeams.length);
  };

  const onVenuesChange = (newVenues: any[]) => {
    setVenues(newVenues);
    setVenueCount(newVenues.length);
  };

  const onDivisionsChange = (newDivisions: any[]) => {
    setDivisionCount(newDivisions.length);
  };

  const onGroupsChange = (newGroups: any[]) => {
    setGroupCount(newGroups.length);
  };

  const onMatchesChange = (newMatches: any[]) => {
    console.log('onMatchesChange called with:', newMatches.length, 'matches');
    setMatches(newMatches);
    setMatchCount(newMatches.length);
  };

  // Function to refresh all counts
  const refreshCounts = async () => {
    try {
      const tournamentResponse = await fetch(
        `/api/v1/tournaments/${tournamentId}`,
        {
          credentials: 'include',
        }
      );

      if (tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json();
        setTeamCount(tournamentData._count.teams);
        setVenueCount(tournamentData._count.venues);
        setDivisionCount(tournamentData._count.divisions);
        setGroupCount(tournamentData._count.groups);
        setMatchCount(tournamentData._count.matches);
      }
    } catch (error) {
      console.error('Error refreshing counts:', error);
    }
  };

  const user = session?.user;
  const tournamentId = params.id as string;

  // Fetch all tournament data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);

        // Fetch tournament data
        const tournamentResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}`,
          {
            credentials: 'include',
          }
        );

        if (tournamentResponse.ok) {
          const tournamentData = await tournamentResponse.json();
          console.log('Tournament data received:', tournamentData);
          setTournament(tournamentData);

          // Set initial counts
          setTeamCount(tournamentData._count.teams);
          setVenueCount(tournamentData._count.venues);
          setDivisionCount(tournamentData._count.divisions);
          setGroupCount(tournamentData._count.groups);
          setMatchCount(tournamentData._count.matches);

          // Fetch matches data
          const matchesResponse = await fetch(
            `/api/v1/tournaments/${tournamentId}/matches`,
            {
              credentials: 'include',
            }
          );

          if (matchesResponse.ok) {
            const matchesData = await matchesResponse.json();
            setMatches(matchesData);
          }

          // Fetch venues data
          const venuesResponse = await fetch(
            `/api/v1/tournaments/${tournamentId}/venues`,
            {
              credentials: 'include',
            }
          );

          if (venuesResponse.ok) {
            const venuesData = await venuesResponse.json();
            setVenues(venuesData);
          }

          // Fetch teams data
          const teamsResponse = await fetch(
            `/api/v1/tournaments/${tournamentId}/teams`,
            {
              credentials: 'include',
            }
          );

          if (teamsResponse.ok) {
            const teamsData = await teamsResponse.json();
            setTeams(teamsData);
          }
        } else {
          console.error(
            'Failed to fetch tournament, status:',
            tournamentResponse.status
          );
          const errorData = await tournamentResponse.json();
          console.error('Error data:', errorData);
        }
      } catch (error) {
        console.error('Error fetching tournament data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (tournamentId) {
      fetchAllData();
    }
  }, [tournamentId]);

  // Auto-refresh counts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshCounts();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [tournamentId]);

  // Check if user has permission to manage this tournament
  const canManage =
    user &&
    tournament &&
    (user.role === 'ADMIN' ||
      (user.role === 'TEAM_MANAGER' && tournament.organization.id) ||
      (user.role === 'TOURNAMENT_ADMIN' && tournament.organization.id));

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Please log in to manage tournaments.
              </p>
              <Button asChild className="mt-4">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Tournament not found.</p>
              <Button asChild className="mt-4">
                <Link href="/tournaments">Back to Tournaments</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                You don&apos;t have permission to manage this tournament.
              </p>
              <Button asChild className="mt-4">
                <Link href={`/tournaments/${tournamentId}`}>
                  View Tournament
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>;
      case 'PUBLISHED':
        return <Badge variant="default">Published</Badge>;
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Show global loading state until tournament data is loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-style-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-style-primary"></div>
              <h3 className="mb-2 text-lg font-semibold">Loading Tournament</h3>
              <p className="text-style-text-secondary">
                Please wait while we load the tournament data...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state if tournament not found
  if (!tournament) {
    return (
      <div className="min-h-screen bg-style-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-style-text-secondary" />
              <h3 className="mb-2 text-lg font-semibold">
                Tournament Not Found
              </h3>
              <p className="mb-4 text-style-text-secondary">
                Unable to load tournament data. Please check the URL and try
                again.
              </p>
              <Button asChild>
                <Link href="/tournaments">Back to Tournaments</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-style-background">
      <MainNavigation />
      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-style-primary/10">
                <Trophy className="h-6 w-6 text-style-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {tournament.name}
                </h1>
                <p className="text-style-text-secondary">
                  {tournament.season} • {tournament.organization.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(tournament.status)}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCounts}
                title="Refresh counts"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button asChild variant="outline">
                <Link href={`/tournaments/${tournamentId}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Public
                </Link>
              </Button>
            </div>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="teams">Teams ({teamCount})</TabsTrigger>
              <TabsTrigger value="venues">Venues ({venueCount})</TabsTrigger>
              <TabsTrigger value="divisions">
                Divisions ({divisionCount})
              </TabsTrigger>
              <TabsTrigger value="groups">Groups ({groupCount})</TabsTrigger>
              <TabsTrigger value="lock">Lock & Matches</TabsTrigger>
              <TabsTrigger value="matches">Matches ({matchCount})</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                {/* Tournament Information Editor - Full Width */}
                <div className="lg:col-span-3">
                  {tournament && (
                    <TournamentInfoEditor
                      tournament={tournament}
                      onUpdate={(updatedTournament) =>
                        setTournament(updatedTournament as Tournament)
                      }
                      tournamentId={tournamentId}
                    />
                  )}
                </div>

                {/* Right Column - Stats & Settings */}
                <div className="space-y-3">
                  {/* Quick Stats */}
                  <Card>
                    <CardHeader className="px-3 pb-2 pt-3">
                      <CardTitle className="text-sm">Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">Teams</span>
                          </div>
                          <span className="text-sm font-bold">
                            {tournament._count.teams}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">Venues</span>
                          </div>
                          <span className="text-sm font-bold">
                            {tournament._count.venues}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Trophy className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">Divisions</span>
                          </div>
                          <span className="text-sm font-bold">
                            {tournament._count.divisions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">Matches</span>
                          </div>
                          <span className="text-sm font-bold">
                            {tournament._count.matches}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tournament Settings */}
                  <Card>
                    <CardHeader className="px-3 pb-2 pt-3">
                      <CardTitle className="flex items-center space-x-1 text-sm">
                        <Settings className="h-3 w-3" />
                        <span>Settings</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium">
                              Tournament Status
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Current tournament status
                            </p>
                          </div>
                          <Select
                            value={tournament.status}
                            onValueChange={updateTournamentStatus}
                          >
                            <SelectTrigger className="h-7 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DRAFT">Draft</SelectItem>
                              <SelectItem value="PUBLISHED">
                                Published
                              </SelectItem>
                              <SelectItem value="CANCELLED">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium">
                              Info Published
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Show tournament details publicly
                            </p>
                          </div>
                          <Switch
                            checked={tournament.infoPublished}
                            onCheckedChange={() =>
                              updatePublicationStatus('infoPublished')
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium">
                              Teams Published
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Show teams publicly
                            </p>
                          </div>
                          <Switch
                            checked={tournament.teamsPublished}
                            onCheckedChange={() =>
                              updatePublicationStatus('teamsPublished')
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium">
                              Schedule Published
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Show schedule publicly
                            </p>
                          </div>
                          <Switch
                            checked={tournament.schedulePublished}
                            onCheckedChange={() =>
                              updatePublicationStatus('schedulePublished')
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium">Edit</p>
                            <p className="text-xs text-muted-foreground">
                              Modify details
                            </p>
                          </div>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                          >
                            <Link href={`/tournaments/${tournamentId}/edit`}>
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="teams">
              <TeamsManagement
                tournamentId={tournamentId}
                onTeamsChange={onTeamsChange}
              />
            </TabsContent>

            <TabsContent value="venues">
              <VenuesManagement
                tournamentId={tournamentId}
                onVenuesChange={onVenuesChange}
              />
            </TabsContent>

            <TabsContent value="divisions">
              <DivisionsManagement
                tournamentId={tournamentId}
                onDivisionsChange={onDivisionsChange}
              />
            </TabsContent>

            <TabsContent value="groups">
              <GroupsManagement
                tournamentId={tournamentId}
                onGroupsChange={onGroupsChange}
              />
            </TabsContent>

            <TabsContent value="lock">
              <LockManagement
                tournamentId={tournamentId}
                divisions={tournament?.divisions || []}
                onLockChange={() => {
                  // Refresh tournament data when lock status changes
                  window.location.reload();
                }}
              />
            </TabsContent>

            <TabsContent value="matches">
              <MatchesManagementSimple
                tournamentId={tournamentId}
                divisionId={tournament?.divisions?.[0]?.id}
                groupId={tournament?.divisions?.[0]?.groups?.[0]?.id}
                matches={matches}
                teams={teams}
                groups={tournament?.divisions?.[0]?.groups || []}
                division={tournament?.divisions?.[0] || undefined}
                onMatchesChange={onMatchesChange}
              />
            </TabsContent>

            <TabsContent value="schedule">
              {!tournament.divisions || tournament.divisions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No divisions found
                    </h3>
                    <p className="mb-4 text-muted-foreground">
                      Please create divisions and groups first to enable match
                      scheduling.
                    </p>
                    <Button asChild>
                      <a href="#divisions">Go to Divisions Tab</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <MatchScheduling
                  tournamentId={tournamentId}
                  divisionId={tournament.divisions[0]?.id}
                  groupId={tournament.divisions[0]?.groups?.[0]?.id}
                  matches={matches}
                  venues={venues}
                  division={tournament.divisions[0] || undefined}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
