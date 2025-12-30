'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { api } from '@/lib/api';
import { TeamManagement } from '@/components/tournament/team-management';
import { VenuesManagement } from '@/components/tournament/venues-management';
import { DivisionsManagement } from '@/components/tournament/divisions-management';
import { GroupsManagement } from '@/components/tournament/groups-management';
import { MatchesManagementSimple } from '@/components/tournament/matches-management-simple';
import { MatchScheduling } from '@/components/tournament/match-scheduling';
import { TournamentInfoEditor } from '@/components/tournament/tournament-info-editor';
import { UserInvitations } from '@/components/tournament/user-invitations';

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
  infoPublished: boolean;
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
    matchDuration: number;
    breakDuration: number;
    assignmentType: 'AUTO' | 'MANUAL';
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const t = useTranslations();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = session?.user;
  const tournamentId = params.id as string;

  // Valid tabs list (memoized to avoid recreating on every render)
  const validTabs = useMemo(
    () => [
      'overview',
      'users',
      'teams',
      'venues',
      'divisions',
      'groups',
      'matches',
      'schedule',
    ],
    []
  );

  // Get initial tab from URL or default to "overview"
  const tabFromUrl = searchParams.get('tab');
  const initialTab =
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab state with URL
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (
      currentTab &&
      validTabs.includes(currentTab) &&
      currentTab !== activeTab
    ) {
      setActiveTab(currentTab);
    }
  }, [searchParams, activeTab, validTabs]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const urlParams = new URLSearchParams(searchParams.toString());
    if (value === 'overview') {
      urlParams.delete('tab');
    } else {
      urlParams.set('tab', value);
    }
    const queryString = urlParams.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  };

  // Function to update tournament publication status
  const updatePublicationStatus = async (
    field: 'infoPublished' | 'teamsPublished' | 'schedulePublished'
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

  // Function to update tournament lock status
  const updateLockStatus = async () => {
    if (!tournament) return;

    const newLockStatus = !tournament.isLocked;

    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          isLocked: newLockStatus,
        }),
      });

      if (response.ok) {
        const updatedTournament = await response.json();
        setTournament(updatedTournament);
      } else {
        console.error('Failed to update lock status');
      }
    } catch (error) {
      console.error('Error updating lock status:', error);
    }
  };

  // Callback functions for management components
  const onVenuesChange = (newVenues: any[]) => {
    setVenues(newVenues);
  };

  const onDivisionsChange = useCallback(async () => {
    // Refetch tournament data to get updated division settings
    try {
      const tournamentResponse = await fetch(
        `/api/v1/tournaments/${tournamentId}`,
        {
          credentials: 'include',
        }
      );

      if (tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json();
        setTournament(tournamentData);
      }
    } catch (error) {
      console.error(
        'Error refetching tournament after division change:',
        error
      );
    }
  }, [tournamentId]);

  const onGroupsChange = () => {
    // Trigger tournament data refetch when groups change
    onDivisionsChange();
  };

  const onMatchesChange = useCallback((newMatches: any[]) => {
    console.log('onMatchesChange called with:', newMatches.length, 'matches');
    setMatches(newMatches);
  }, []);

  // Function to refresh all counts
  const refreshCounts = useCallback(async () => {
    try {
      const tournamentResponse = await fetch(
        `/api/v1/tournaments/${tournamentId}`,
        {
          credentials: 'include',
        }
      );

      if (tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json();
        // Counts no longer needed
      }
    } catch (error) {
      console.error('Error refreshing counts:', error);
    }
  }, [tournamentId]);

  // Memoize the onUpdate callback to prevent infinite loops
  const handleTournamentUpdate = useCallback(
    (updatedTournament: Tournament) => {
      setTournament(updatedTournament);
    },
    []
  );

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

          // Counts no longer needed

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
  }, [tournamentId, refreshCounts]);

  // Check if user has permission to manage this tournament
  const [canManage, setCanManage] = useState<boolean>(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      // Wait for session to finish loading
      if (sessionStatus === 'loading') {
        return;
      }

      // If no session after loading, user is not authenticated
      if (!session || !user || !tournamentId) {
        setCanManage(false);
        setPermissionsLoading(false);
        return;
      }

      try {
        setPermissionsLoading(true);
        const permissions = (await api.tournaments.getPermissions(
          tournamentId
        )) as { canConfigure?: boolean; isOwner?: boolean };
        setCanManage(permissions.canConfigure || permissions.isOwner || false);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setCanManage(false);
      } finally {
        setPermissionsLoading(false);
      }
    };

    checkPermissions();
  }, [session, user, tournamentId, sessionStatus]);

  // Consolidated loading state - show single spinner for all loading states
  // Only show loading if we're actively loading, not if data failed to load
  const isInitialLoading =
    sessionStatus === 'loading' || permissionsLoading || isLoading;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-style-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-style-primary"></div>
              <h3 className="mb-2 text-lg font-semibold">
                {t('tournament.loading')}
              </h3>
              <p className="text-style-text-secondary">
                {t('tournament.loadingDescription')}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show login prompt only after session is confirmed to be unauthenticated
  if (sessionStatus === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {t('tournament.pleaseLogIn')}
              </p>
              <Button asChild className="mt-4">
                <Link href="/auth/signin">{t('auth.signIn')}</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Show error state if tournament not found (after loading is complete)
  if (!tournament) {
    return (
      <div className="min-h-screen bg-style-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-style-text-secondary" />
              <h3 className="mb-2 text-lg font-semibold">
                {t('tournament.tournamentNotFound')}
              </h3>
              <p className="mb-4 text-style-text-secondary">
                {t('tournament.unableToLoad')}
              </p>
              <Button asChild>
                <Link href="/tournaments">
                  {t('tournament.backToTournaments')}
                </Link>
              </Button>
            </div>
          </div>
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
                {t('tournament.noPermission')}
              </p>
              <Button asChild className="mt-4">
                <Link href={`/tournaments/${tournamentId}`}>
                  {t('tournament.viewTournament')}
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

  return (
    <div className="min-h-screen bg-style-background">
      <MainNavigation />
      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-style-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
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
                {t('common.refresh')}
              </Button>
              <Button asChild variant="outline">
                <Link href={`/tournaments/${tournamentId}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('tournament.viewPublic')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Management Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <TabsList>
              <TabsTrigger value="overview">
                {t('tournament.tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="teams">{t('tournament.teams')}</TabsTrigger>
              <TabsTrigger value="venues">{t('tournament.venues')}</TabsTrigger>
              <TabsTrigger value="divisions">
                {t('tournament.divisions')}
              </TabsTrigger>
              <TabsTrigger value="groups">{t('tournament.groups')}</TabsTrigger>
              <TabsTrigger value="matches">
                {t('tournament.matches')}
              </TabsTrigger>
              <TabsTrigger value="schedule">
                {t('tournament.schedule')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                {/* Tournament Information Editor - Full Width */}
                <div className="lg:col-span-3">
                  {tournament && (
                    <TournamentInfoEditor
                      tournament={tournament as any}
                      onUpdate={(updated) =>
                        handleTournamentUpdate(updated as any)
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
                      <CardTitle className="text-sm">
                        {t('tournament.stats.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">
                              {t('tournament.teams')}
                            </span>
                          </div>
                          <span className="text-sm font-bold">
                            {tournament._count.teams}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">
                              {t('tournament.venues')}
                            </span>
                          </div>
                          <span className="text-sm font-bold">
                            {tournament._count.venues}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Trophy className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">
                              {t('tournament.divisions')}
                            </span>
                          </div>
                          <span className="text-sm font-bold">
                            {tournament._count.divisions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">
                              {t('tournament.matches')}
                            </span>
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
                        <span>{t('common.settings')}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium">
                              {t('tournament.settings.tournamentStatus')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('tournament.settings.currentStatus')}
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
                              <SelectItem value="DRAFT">
                                {t('tournament.status.draft')}
                              </SelectItem>
                              <SelectItem value="PUBLISHED">
                                {t('tournament.status.published')}
                              </SelectItem>
                              <SelectItem value="CANCELLED">
                                {t('tournament.status.cancelled')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium">
                              {t('tournament.settings.infoPublished')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('tournament.settings.showInfoPublicly')}
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
                              {t('tournament.settings.teamsPublished')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('tournament.settings.showTeamsPublicly')}
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
                              {t('tournament.settings.schedulePublished')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('tournament.settings.showSchedulePublicly')}
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
                            <p className="text-xs font-medium">
                              {t('tournament.settings.tournamentLocked')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('tournament.settings.preventRegistrations')}
                            </p>
                          </div>
                          <Switch
                            checked={tournament.isLocked}
                            onCheckedChange={updateLockStatus}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <UserInvitations tournamentId={tournamentId} />
            </TabsContent>

            <TabsContent value="teams">
              <TeamManagement
                tournamentId={tournamentId}
                onTeamsChange={(teams) => {
                  // Teams updated
                }}
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
                onMatchesChange={onMatchesChange}
              />
            </TabsContent>

            <TabsContent value="matches">
              <MatchesManagementSimple
                tournamentId={tournamentId}
                divisionId={tournament?.divisions?.[0]?.id}
                groupId={tournament?.divisions?.[0]?.groups?.[0]?.id}
                matches={matches}
                teams={teams}
                groups={
                  // Flatten all groups from all divisions with division info
                  tournament?.divisions?.flatMap((division) =>
                    (division.groups || []).map((group) => ({
                      ...group,
                      division: {
                        id: division.id,
                        name: division.name,
                      },
                    }))
                  ) || []
                }
                divisions={tournament?.divisions || []}
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
                      {t('tournament.noDivisionsFound')}
                    </h3>
                    <p className="mb-4 text-muted-foreground">
                      {t('tournament.createDivisionsFirst')}
                    </p>
                    <Button asChild>
                      <a href="#divisions">
                        {t('tournament.goToDivisionsTab')}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <MatchScheduling
                  tournamentId={tournamentId}
                  matches={matches}
                  venues={venues}
                  divisions={tournament.divisions.map((d) => ({
                    id: d.id,
                    name: d.name,
                    level: d.level,
                    matchDuration: d.matchDuration,
                    breakDuration: d.breakDuration,
                    assignmentType: d.assignmentType,
                    groups: d.groups?.map((g) => ({
                      id: g.id,
                      name: g.name,
                    })),
                  }))}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
