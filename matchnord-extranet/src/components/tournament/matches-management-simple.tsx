'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Edit,
  Trash2,
  Trophy,
  Clock,
  Settings,
  Calendar,
  Users,
  Filter,
  BarChart3,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { DivisionMatchSettings } from './division-match-settings';

interface Match {
  id: string;
  startTime: string;
  endTime?: string;
  status: string;
  homeScore: number;
  awayScore: number;
  referee?: string;
  notes?: string;
  homeTeam: {
    id: string;
    name: string;
    shortName?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName?: string;
  };
  venue?: {
    id: string;
    name: string;
  };
  pitch?: {
    id: string;
    name: string;
  };
  group?: {
    id: string;
    name: string;
    division: {
      id: string;
      name: string;
    };
  };
}

interface Team {
  id: string;
  name: string;
  shortName?: string;
}

interface Group {
  id: string;
  name: string;
  division: {
    id: string;
    name: string;
  };
}

interface Division {
  id: string;
  name: string;
  matchDuration: number;
  breakDuration: number;
  assignmentType: 'AUTO' | 'MANUAL';
}

interface MatchesManagementSimpleProps {
  tournamentId: string;
  divisionId?: string;
  groupId?: string;
  matches?: Match[];
  teams?: Team[];
  groups?: Group[];
  division?: Division;
  onMatchesChange?: (matches: Match[]) => void;
}

export function MatchesManagementSimple({
  tournamentId,
  divisionId,
  groupId,
  matches: propMatches = [],
  teams: propTeams = [],
  groups: propGroups = [],
  division: propDivision = null,
  onMatchesChange,
}: MatchesManagementSimpleProps) {
  const [matches, setMatches] = useState<Match[]>(propMatches);

  const [teams, setTeams] = useState<Team[]>(propTeams);
  const [groups, setGroups] = useState<Group[]>(propGroups);
  const [division, setDivision] = useState<Division | null>(propDivision);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Debug logging
  console.log('MatchesManagementSimple - matches state:', matches.length);
  console.log('MatchesManagementSimple - propMatches:', propMatches.length);
  console.log('MatchesManagementSimple - selectedDivision:', selectedDivision);
  console.log('MatchesManagementSimple - selectedGroup:', selectedGroup);

  // Form state
  const [formData, setFormData] = useState({
    homeTeamId: '',
    awayTeamId: '',
    groupId: '',
    referee: '',
    notes: '',
  });

  // Sync props with state when they change
  useEffect(() => {
    setMatches(propMatches);
  }, [propMatches]);

  useEffect(() => {
    setTeams(propTeams);
  }, [propTeams]);

  useEffect(() => {
    setGroups(propGroups);
  }, [propGroups]);

  useEffect(() => {
    setDivision(propDivision);
  }, [propDivision]);

  const handleGenerateMatches = async () => {
    if (!divisionId || !groupId) {
      toast.error('Division and group must be selected for match generation');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/v1/divisions/${divisionId}/matches/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            groupId,
            format: 'round-robin',
            autoAssign: false,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Generated matches result:', result);
        console.log('Matches count:', result.matches?.length);
        setMatches(result.matches);
        onMatchesChange?.(result.matches);
        toast.success(`Generated ${result.matches.length} matches`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate matches');
      }
    } catch (error) {
      console.error('Error generating matches:', error);
      toast.error('Failed to generate matches');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkOperation = async (operation: string) => {
    if (!divisionId || !groupId) {
      toast.error('Division and group must be selected for bulk operations');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/v1/tournaments/${tournamentId}/matches/bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: operation,
            divisionId,
            groupId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const updatedMatches = result.matches || [];
        setMatches(updatedMatches);
        onMatchesChange?.(updatedMatches);
        toast.success(result.message || 'Operation completed successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      toast.error('Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.homeTeamId || !formData.awayTeamId || !formData.groupId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/v1/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tournamentId,
          groupId: formData.groupId,
          homeTeamId: formData.homeTeamId,
          awayTeamId: formData.awayTeamId,
          referee: formData.referee || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (response.ok) {
        const newMatch = await response.json();
        const updatedMatches = [...matches, newMatch];
        setMatches(updatedMatches);
        onMatchesChange?.(updatedMatches);
        setIsDialogOpen(false);
        setFormData({
          homeTeamId: '',
          awayTeamId: '',
          groupId: '',
          referee: '',
          notes: '',
        });
        toast.success('Match created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create match');
      }
    } catch (error) {
      console.error('Error creating match:', error);
      toast.error('Failed to create match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;

    try {
      const response = await fetch(`/api/v1/matches/${matchId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const updatedMatches = matches.filter((match) => match.id !== matchId);
        setMatches(updatedMatches);
        onMatchesChange?.(updatedMatches);
        toast.success('Match deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete match');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error('Failed to delete match');
    }
  };

  // Filter and group matches
  const filteredMatches = matches.filter((match) => {
    if (
      selectedDivision !== 'all' &&
      match.group?.division?.id !== selectedDivision
    ) {
      return false;
    }
    if (selectedGroup !== 'all' && match.group?.id !== selectedGroup) {
      return false;
    }
    return true;
  });

  // Debug filtered matches
  console.log(
    'MatchesManagementSimple - filteredMatches:',
    filteredMatches.length
  );
  console.log(
    'MatchesManagementSimple - first match group:',
    filteredMatches[0]?.group
  );
  console.log('MatchesManagementSimple - all matches:', filteredMatches);

  // Group matches by division and group
  const groupedMatches = filteredMatches.reduce(
    (acc, match) => {
      if (!match.group) return acc;

      const divisionId = match.group.division?.id;
      const groupId = match.group.id;

      if (!acc[divisionId]) {
        acc[divisionId] = {
          division: match.group.division || null,
          groups: {},
        };
      }

      if (!acc[divisionId].groups[groupId]) {
        acc[divisionId].groups[groupId] = {
          group: match.group,
          matches: [],
        };
      }

      acc[divisionId].groups[groupId].matches.push(match);
      return acc;
    },
    {} as Record<
      string,
      {
        division: { id: string; name: string };
        groups: Record<string, { group: Group; matches: Match[] }>;
      }
    >
  );

  // Debug grouped matches
  console.log('MatchesManagementSimple - groupedMatches:', groupedMatches);
  console.log(
    'MatchesManagementSimple - groupedMatches keys:',
    Object.keys(groupedMatches)
  );

  // Calculate team match statistics
  const getTeamMatchStats = () => {
    const teamStats: Record<
      string,
      {
        team: Team;
        homeMatches: number;
        awayMatches: number;
        totalMatches: number;
      }
    > = {};

    filteredMatches.forEach((match) => {
      // Home team stats
      if (!teamStats[match.homeTeam.id]) {
        teamStats[match.homeTeam.id] = {
          team: match.homeTeam,
          homeMatches: 0,
          awayMatches: 0,
          totalMatches: 0,
        };
      }
      teamStats[match.homeTeam.id].homeMatches++;
      teamStats[match.homeTeam.id].totalMatches++;

      // Away team stats
      if (!teamStats[match.awayTeam.id]) {
        teamStats[match.awayTeam.id] = {
          team: match.awayTeam,
          homeMatches: 0,
          awayMatches: 0,
          totalMatches: 0,
        };
      }
      teamStats[match.awayTeam.id].awayMatches++;
      teamStats[match.awayTeam.id].totalMatches++;
    });

    return Object.values(teamStats);
  };

  const teamStats = getTeamMatchStats();
  const maxMatches = Math.max(...teamStats.map((stat) => stat.totalMatches), 0);
  const minMatches = Math.min(...teamStats.map((stat) => stat.totalMatches), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'LIVE':
        return <Badge variant="default">Live</Badge>;
      case 'FINISHED':
        return <Badge variant="secondary">Finished</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Matches ({matches.length})</span>
              </CardTitle>
              <CardDescription>
                Manage tournament matches and their configuration
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSummary(!showSummary)}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {showSummary ? 'Hide' : 'Show'} Summary
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="mr-2 h-4 w-4" />
                {showSettings ? 'Hide' : 'Show'} Settings
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Match
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {divisionId && (
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateMatches()}
                disabled={isSubmitting}
              >
                Generate All Matches
              </Button>
              {matches.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkOperation('regenerate_all')}
                    disabled={isSubmitting}
                  >
                    Regenerate All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkOperation('clear_all')}
                    disabled={isSubmitting}
                    className="text-destructive hover:text-destructive"
                  >
                    Clear All
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="division-filter">Division:</Label>
              <Select
                value={selectedDivision}
                onValueChange={setSelectedDivision}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {Object.values(groupedMatches).map(({ division }) => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="group-filter">Group:</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {Object.values(groupedMatches).flatMap(({ groups }) =>
                    Object.values(groups).map(({ group }) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.division?.name || 'Unknown Division'} -{' '}
                        {group.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Component */}
          {showSummary && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Match Distribution Summary</span>
                </CardTitle>
                <CardDescription>
                  Track team match counts to ensure fair distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Overall Stats */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {filteredMatches.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Matches
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {teamStats.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Teams</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{maxMatches}</div>
                      <div className="text-sm text-muted-foreground">
                        Max Matches
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{minMatches}</div>
                      <div className="text-sm text-muted-foreground">
                        Min Matches
                      </div>
                    </div>
                  </div>

                  {/* Team Match Counts */}
                  <div>
                    <h4 className="mb-3 font-medium">Team Match Counts</h4>
                    <div className="space-y-2">
                      {teamStats
                        .sort((a, b) => b.totalMatches - a.totalMatches)
                        .map((stat) => {
                          const isBalanced = stat.totalMatches === maxMatches;
                          const isUnderplayed = stat.totalMatches < maxMatches;

                          return (
                            <div
                              key={stat.team.id}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div className="flex items-center space-x-3">
                                {isBalanced ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : isUnderplayed ? (
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                                <div>
                                  <div className="font-medium">
                                    {stat.team.shortName || stat.team.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {stat.homeMatches} home, {stat.awayMatches}{' '}
                                    away
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  {stat.totalMatches}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  matches
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Balance Status */}
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-medium">Balance Status</h4>
                    {maxMatches === minMatches ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>All teams have equal matches ({maxMatches})</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          Match distribution varies: {minMatches}-{maxMatches}{' '}
                          matches per team
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {teams.length < 2 ? (
            <div className="py-12 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                Need at least 2 teams
              </h3>
              <p className="mb-4 text-muted-foreground">
                Add at least 2 teams to the tournament before creating matches.
              </p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No matches yet</h3>
              <p className="mb-4 text-muted-foreground">
                {divisionId
                  ? 'Generate matches for this division or add individual matches manually.'
                  : 'Get started by adding the first match to this tournament.'}
              </p>
              <div className="flex justify-center gap-2">
                {divisionId && (
                  <Button onClick={() => handleGenerateMatches()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Matches
                  </Button>
                )}
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Match
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                console.log(
                  'MatchesManagementSimple - checking groupedMatches length:',
                  Object.keys(groupedMatches).length
                );
                console.log(
                  'MatchesManagementSimple - groupedMatches object:',
                  groupedMatches
                );
                console.log(
                  'MatchesManagementSimple - filteredMatches length:',
                  filteredMatches.length
                );
                return (
                  Object.keys(groupedMatches).length === 0 &&
                  filteredMatches.length === 0
                );
              })() ? (
                <div className="py-12 text-center">
                  <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No matches found
                  </h3>
                  <p className="text-muted-foreground">
                    No matches match the current filters.
                  </p>
                </div>
              ) : Object.keys(groupedMatches).length === 0 &&
                filteredMatches.length > 0 ? (
                // Fallback: Show ungrouped matches if grouping failed
                ((() => {
                  console.log(
                    'MatchesManagementSimple - Showing fallback table for ungrouped matches'
                  );
                  return null;
                })(),
                (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-semibold">All Matches</h3>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Teams</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Referee</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMatches.map((match) => (
                            <TableRow key={match.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {match.homeTeam.shortName ||
                                    match.homeTeam.name}{' '}
                                  vs{' '}
                                  {match.awayTeam.shortName ||
                                    match.awayTeam.name}
                                </div>
                                {match.venue && match.pitch && (
                                  <div className="text-sm text-muted-foreground">
                                    {match.venue.name} - {match.pitch.name}
                                  </div>
                                )}
                                {match.startTime && (
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(match.startTime).toLocaleString()}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(match.status)}
                              </TableCell>
                              <TableCell>
                                {match.status === 'COMPLETED' ? (
                                  <div className="font-mono">
                                    {match.homeScore} - {match.awayScore}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {match.referee || (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingMatch(match);
                                      setFormData({
                                        homeTeamId: match.homeTeam.id,
                                        awayTeamId: match.awayTeam.id,
                                        groupId: match.group?.id || '',
                                        referee: match.referee || '',
                                        notes: match.notes || '',
                                      });
                                      setIsDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(match.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))
              ) : (
                Object.values(groupedMatches).map(({ division, groups }) => (
                  <div key={division.id} className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-semibold">{division.name}</h3>
                    </div>
                    {Object.values(groups).map(
                      ({ group, matches: groupMatches }) => (
                        <div key={group.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-muted-foreground">
                              {group.name} ({groupMatches.length} matches)
                            </h4>
                          </div>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Teams</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Score</TableHead>
                                  <TableHead>Referee</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {groupMatches.map((match) => (
                                  <TableRow key={match.id}>
                                    <TableCell>
                                      <div className="font-medium">
                                        {match.homeTeam.shortName ||
                                          match.homeTeam.name}{' '}
                                        vs{' '}
                                        {match.awayTeam.shortName ||
                                          match.awayTeam.name}
                                      </div>
                                      {match.venue && match.pitch && (
                                        <div className="text-sm text-muted-foreground">
                                          {match.venue.name} -{' '}
                                          {match.pitch.name}
                                        </div>
                                      )}
                                      {match.startTime && (
                                        <div className="text-sm text-muted-foreground">
                                          {new Date(
                                            match.startTime
                                          ).toLocaleString()}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {getStatusBadge(match.status)}
                                    </TableCell>
                                    <TableCell>
                                      {match.homeScore} - {match.awayScore}
                                    </TableCell>
                                    <TableCell>
                                      {match.referee || '-'}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex space-x-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setEditingMatch(match);
                                            setFormData({
                                              homeTeamId: match.homeTeam.id,
                                              awayTeamId: match.awayTeam.id,
                                              groupId: match.group?.id || '',
                                              referee: match.referee || '',
                                              notes: match.notes || '',
                                            });
                                            setIsDialogOpen(true);
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDelete(match.id)}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Division Settings */}
      {showSettings && division && (
        <DivisionMatchSettings
          divisionId={division.id}
          initialSettings={{
            matchDuration: division.matchDuration,
            breakDuration: division.breakDuration,
            assignmentType: division.assignmentType,
          }}
          onSettingsChange={(settings) => {
            setDivision({
              ...division,
              ...settings,
            });
          }}
        />
      )}

      {/* Add/Edit Match Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMatch ? 'Edit Match' : 'Add New Match'}
            </DialogTitle>
            <DialogDescription>
              {editingMatch
                ? 'Update the match details below.'
                : 'Create a new match by selecting the teams and group.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeTeamId">Home Team *</Label>
                <Select
                  value={formData.homeTeamId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, homeTeamId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select home team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.shortName || team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="awayTeamId">Away Team *</Label>
                <Select
                  value={formData.awayTeamId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, awayTeamId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select away team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.shortName || team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupId">Group *</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) =>
                  setFormData({ ...formData, groupId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.division?.name || 'Unknown Division'} -{' '}
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referee">Referee</Label>
              <Input
                id="referee"
                value={formData.referee}
                onChange={(e) =>
                  setFormData({ ...formData, referee: e.target.value })
                }
                placeholder="Referee name (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Match notes (optional)"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingMatch(null);
                  setFormData({
                    homeTeamId: '',
                    awayTeamId: '',
                    groupId: '',
                    referee: '',
                    notes: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : editingMatch
                    ? 'Update Match'
                    : 'Create Match'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
