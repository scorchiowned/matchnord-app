'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/routing';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AdminNavigation } from '@/components/navigation/admin-navigation';
import { FormatManagement } from '@/components/tournament/format-management';
import {
  Users,
  Settings,
  Calendar,
  MapPin,
  Trophy,
  Play,
  Save,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Target,
  Zap,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  status: 'registered' | 'confirmed';
}

interface Field {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  teams: Team[];
}

interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  field: Field;
  startTime: string;
  status: 'scheduled' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  matchLength: number; // minutes
  bufferMinutes: number;
  format: 'groups-knockout' | 'round-robin';
  isPublished: boolean;
  teams: Team[];
  fields: Field[];
  groups: Group[];
  matches: Match[];
}

export default function TournamentManagePage({
  params,
}: {
  params: { id: string };
}) {
  const locale = useLocale();
  const t = useTranslations();
  const { data: session } = useSession();
  const user = session?.user;
  const currentRole = user?.role;
  const isAdmin = user?.role === 'ADMIN';
  const isTeamManager = user?.role === 'TEAM_MANAGER';
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('teams');
  const [isLoading, setIsLoading] = useState(true);

  // Load tournament data from API
  useEffect(() => {
    const loadTournament = async () => {
      try {
        setIsLoading(true);
        const data = (await api.tournaments.getManage(params.id)) as any;

        // Transform the API data to match our interface
        const transformedTournament: Tournament = {
          id: data.id,
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          matchLength: 60, // Default value, would come from settings
          bufferMinutes: 15, // Default value, would come from settings
          format: 'groups-knockout', // Default value, would come from settings
          isPublished: data.isPublished,
          teams:
            data.teams?.map((team: any) => ({
              id: team.id,
              name: team.name,
              contactName: team.contactName || 'N/A',
              contactEmail: team.contactEmail || 'N/A',
              status: team.status || 'registered',
            })) || [],
          fields:
            data.venues?.flatMap(
              (venue: any) =>
                venue.pitches?.map((pitch: any) => ({
                  id: pitch.id,
                  name: pitch.name,
                })) || []
            ) || [],
          groups:
            data.divisions?.flatMap(
              (division: any) =>
                division.stages?.flatMap(
                  (stage: any) =>
                    stage.groups?.map((group: any) => ({
                      id: group.id,
                      name: group.name,
                      teams: group.teams || [],
                    })) || []
                ) || []
            ) || [],
          matches:
            data.divisions?.flatMap(
              (division: any) =>
                division.stages?.flatMap(
                  (stage: any) =>
                    stage.groups?.flatMap(
                      (group: any) =>
                        group.matches?.map((match: any) => ({
                          id: match.id,
                          homeTeam: match.homeTeam,
                          awayTeam: match.awayTeam,
                          field: match.pitch || { id: '1', name: 'Field A' },
                          startTime: match.startTime,
                          status: match.status?.toLowerCase() || 'scheduled',
                          homeScore: match.homeScore,
                          awayScore: match.awayScore,
                        })) || []
                    ) || []
                ) || []
            ) || [],
        };

        setTournament(transformedTournament);
        setDivisions(data.divisions || []);
      } catch (error) {
        console.error('Error loading tournament:', error);
        setTournament(null);
        setDivisions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTournament();
  }, [params.id]);

  const handleFormatChange = (format: 'groups-knockout' | 'round-robin') => {
    if (tournament) {
      setTournament({ ...tournament, format });
    }
  };

  const handleDivisionFormatChange = (divisionId: string, config: any) => {
    // Update the division format configuration
    setDivisions((prev) =>
      prev.map((div) =>
        div.id === divisionId ? { ...div, metadata: config } : div
      )
    );
  };

  const handleGenerateMatches = (phaseId: string) => {
    // TODO: Implement match generation
    console.log('Generate matches for phase:', phaseId);
  };

  const handlePublishToggle = () => {
    if (tournament) {
      setTournament({ ...tournament, isPublished: !tournament.isPublished });
    }
  };

  const handleAddField = () => {
    if (tournament) {
      const newField: Field = {
        id: `field-${Date.now()}`,
        name: `Field ${tournament.fields.length + 1}`,
      };
      setTournament({
        ...tournament,
        fields: [...tournament.fields, newField],
      });
    }
  };

  const handleRemoveField = (fieldId: string) => {
    if (tournament) {
      setTournament({
        ...tournament,
        fields: tournament.fields.filter((f) => f.id !== fieldId),
      });
    }
  };

  const handleAssignToGroup = (teamId: string, groupId: string) => {
    if (tournament) {
      const team = tournament.teams.find((t) => t.id === teamId);
      if (!team) return;

      const updatedGroups = tournament.groups.map((group) => {
        if (group.id === groupId) {
          return { ...group, teams: [...group.teams, team] };
        }
        return { ...group, teams: group.teams.filter((t) => t.id !== teamId) };
      });

      setTournament({ ...tournament, groups: updatedGroups });
    }
  };

  const handleRemoveFromGroup = (teamId: string, groupId: string) => {
    if (tournament) {
      const updatedGroups = tournament.groups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            teams: group.teams.filter((t) => t.id !== teamId),
          };
        }
        return group;
      });

      setTournament({ ...tournament, groups: updatedGroups });
    }
  };

  const generateGroupFixtures = () => {
    if (!tournament) return;

    // Simple round-robin fixture generation
    const newMatches: Match[] = [];

    tournament.groups.forEach((group) => {
      const teams = group.teams;
      if (teams.length < 2) return;

      // Generate all possible match combinations
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const match: Match = {
            id: `match-${Date.now()}-${Math.random()}`,
            homeTeam: teams[i]!,
            awayTeam: teams[j]!,
            field: tournament.fields[0] || { id: '1', name: 'Field A' },
            startTime: '2024-07-15T10:00:00',
            status: 'scheduled',
          };
          newMatches.push(match);
        }
      }
    });

    setTournament({ ...tournament, matches: newMatches });
  };

  // Role-based access control
  if (!isAdmin && !isTeamManager) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <main className="container mx-auto py-6">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-red-600">
              {t('tournament.accessDenied')}
            </h1>
            <p className="text-muted-foreground">
              {t('tournament.needAdminRole')}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('tournament.currentRole')}: {currentRole}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
        <main className="container mx-auto py-6">
          <div className="text-center">{t('tournament.loading')}</div>
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation />
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
      <AdminNavigation />

      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href={`/${locale}/admin/tournaments`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('tournament.backToTournaments')}
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {tournament.name}
                </h1>
                <p className="text-muted-foreground">
                  {t('tournament.tournamentManagement')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="publish-toggle">
                  {t('tournament.published')}
                </Label>
                <Switch
                  id="publish-toggle"
                  checked={tournament.isPublished}
                  onCheckedChange={handlePublishToggle}
                  disabled={!isAdmin} // Only admins can publish
                />
              </div>
              <Button disabled={!isAdmin && !isTeamManager}>
                <Save className="mr-2 h-4 w-4" />
                {t('tournament.saveChanges')}
              </Button>
              {!isAdmin && (
                <Badge
                  variant="outline"
                  className="border-orange-300 text-orange-600"
                >
                  {t('tournament.limitedAccess')}
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {tournament.teams.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('tournament.teams')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {tournament.fields.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('tournament.fields')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {tournament.groups.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('tournament.groups')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {tournament.matches.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('tournament.matches')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="teams">{t('tournament.teams')}</TabsTrigger>
              <TabsTrigger value="format">{t('tournament.format')}</TabsTrigger>
              <TabsTrigger value="groups">{t('tournament.groups')}</TabsTrigger>
              <TabsTrigger value="fields">
                {t('tournament.fieldsMatchTimes')}
              </TabsTrigger>
              <TabsTrigger value="schedule">
                {t('tournament.matchSchedule')}
              </TabsTrigger>
            </TabsList>

            {/* Teams Tab */}
            <TabsContent value="teams" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('tournament.registeredTeams')}
                  </CardTitle>
                  <CardDescription>
                    {t('tournament.manageRegistrations')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tournament.teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{team.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {team.contactName} • {team.contactEmail}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              team.status === 'confirmed'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {team.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Format Tab */}
            <TabsContent value="format" className="space-y-6">
              {divisions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="mb-4 text-gray-600">
                      No divisions found for this tournament.
                    </p>
                    <p className="text-sm text-gray-500">
                      Create divisions first to configure tournament formats.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {divisions.map((division) => {
                    const teamCount =
                      division.groups?.reduce(
                        (total: number, group: any) =>
                          total + (group.teams?.length || 0),
                        0
                      ) || 0;

                    return (
                      <FormatManagement
                        key={division.id}
                        divisionId={division.id}
                        divisionName={division.name}
                        teamCount={teamCount}
                        onFormatChange={(config) =>
                          handleDivisionFormatChange(division.id, config)
                        }
                        onGenerateMatches={handleGenerateMatches}
                        disabled={isLoading}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {t('tournament.groupAssignment')}
                  </CardTitle>
                  <CardDescription>
                    {t('tournament.assignTeams')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {tournament.groups.map((group) => (
                      <Card key={group.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {group.name}
                          </CardTitle>
                          <CardDescription>
                            {group.teams.length} {t('tournament.teamsAssigned')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            {group.teams.map((team) => (
                              <div
                                key={team.id}
                                className="flex items-center justify-between rounded border p-2"
                              >
                                <span className="text-sm">{team.name}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveFromGroup(team.id, group.id)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <Label>
                              {t('tournament.addTeamTo')} {group.name}
                            </Label>
                            <Select
                              onValueChange={(teamId) =>
                                handleAssignToGroup(teamId, group.id)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t('tournament.selectTeam')}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {tournament.teams
                                  .filter(
                                    (team) =>
                                      !group.teams.some(
                                        (gt) => gt.id === team.id
                                      )
                                  )
                                  .map((team) => (
                                    <SelectItem key={team.id} value={team.id}>
                                      {team.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Button onClick={generateGroupFixtures}>
                      <Zap className="mr-2 h-4 w-4" />
                      {t('tournament.autoGenerateFixtures')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fields & Times Tab */}
            <TabsContent value="fields" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {t('tournament.fieldsMatchTimes')}
                  </CardTitle>
                  <CardDescription>
                    {t('tournament.configureFields')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>{t('tournament.availableFields')}</Label>
                      <Button onClick={handleAddField} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('tournament.addField')}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {tournament.fields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between rounded border p-3"
                        >
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{field.name}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('tournament.tournamentStartDate')}</Label>
                      <Input
                        type="date"
                        value={tournament.startDate}
                        onChange={(e) =>
                          setTournament({
                            ...tournament,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('tournament.tournamentEndDate')}</Label>
                      <Input
                        type="date"
                        value={tournament.endDate}
                        onChange={(e) =>
                          setTournament({
                            ...tournament,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t('tournament.matchSchedule')}
                  </CardTitle>
                  <CardDescription>
                    {t('tournament.viewManageSchedule')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tournament.matches.length === 0 ? (
                    <div className="py-8 text-center">
                      <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold">
                        {t('tournament.noMatchesGenerated')}
                      </h3>
                      <p className="mb-4 text-muted-foreground">
                        {t('tournament.generateFixtures')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tournament.matches.map((match) => (
                        <div
                          key={match.id}
                          className="flex items-center justify-between rounded border p-4"
                        >
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline">{match.status}</Badge>
                            <div className="text-sm">
                              {new Date(match.startTime).toLocaleDateString(
                                locale
                              )}{' '}
                              at{' '}
                              {new Date(match.startTime).toLocaleTimeString(
                                locale
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
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

                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-muted-foreground">
                              {match.field.name}
                            </div>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
