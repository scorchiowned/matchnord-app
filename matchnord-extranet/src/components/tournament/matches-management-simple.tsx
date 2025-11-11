'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Trophy,
  Settings,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { DivisionMatchSettings } from './division-match-settings';
import { calculateRoundRobinMatches } from '@/lib/tournament/match-generation/round-robin';

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
  division?: {
    id: string;
    name: string;
  };
  teams?: Team[];
}

interface Division {
  id: string;
  name: string;
  level?: string;
  matchDuration?: number;
  breakDuration?: number;
  assignmentType?: 'AUTO' | 'MANUAL';
}

interface MatchesManagementSimpleProps {
  tournamentId: string;
  divisionId?: string;
  groupId?: string;
  matches?: Match[];
  teams?: Team[];
  groups?: Group[];
  divisions?: Division[];
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
  divisions: propDivisions = [],
  division: propDivision = undefined,
  onMatchesChange,
}: MatchesManagementSimpleProps) {
  const [matches, setMatches] = useState<Match[]>(propMatches);
  const prevMatchesRef = useRef<string>('');

  const [teams, setTeams] = useState<Team[]>(propTeams);
  const prevTeamsRef = useRef<string>('');

  // Use propGroups directly to avoid infinite loops
  const [divisions, setDivisions] = useState<Division[]>(propDivisions);
  const [division, setDivision] = useState<Division | undefined>(propDivision);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>(
    divisionId || propDivisions[0]?.id || 'all'
  );
  const [selectedGroup, setSelectedGroup] = useState<string>(groupId || 'all');
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);
  const [matchPlaceholders, setMatchPlaceholders] = useState<
    Array<{
      id: string;
      homeTeamId: string | null;
      awayTeamId: string | null;
    }>
  >([]);

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

  // Sync props with state when they change - use stable comparison to prevent infinite loops
  useEffect(() => {
    // Create a stable key from matches array (using IDs and length)
    const matchesKey = JSON.stringify(propMatches.map((m) => m.id).sort());
    // Only update if the matches have actually changed
    if (prevMatchesRef.current !== matchesKey) {
      setMatches(propMatches);
      prevMatchesRef.current = matchesKey;
    }
  }, [propMatches]);

  useEffect(() => {
    // Create a stable key from teams array (using IDs and length)
    const teamsKey = JSON.stringify(propTeams.map((t) => t.id).sort());
    // Only update if the teams have actually changed
    if (prevTeamsRef.current !== teamsKey) {
      setTeams(propTeams);
      prevTeamsRef.current = teamsKey;
    }
  }, [propTeams]);

  // Use propGroups directly instead of syncing to state to avoid infinite loops
  const prevDivisionRef = useRef<string | null>(null);
  const prevDivisionsRef = useRef<string>('');

  // Sync divisions prop with state
  useEffect(() => {
    const divisionsKey = JSON.stringify(propDivisions.map((d) => d.id).sort());
    if (prevDivisionsRef.current !== divisionsKey) {
      setDivisions(propDivisions);
      prevDivisionsRef.current = divisionsKey;
    }
  }, [propDivisions]);

  useEffect(() => {
    // Only update if division ID actually changed
    const currentDivisionId = propDivision?.id || null;
    if (prevDivisionRef.current !== currentDivisionId) {
      setDivision(propDivision);
      prevDivisionRef.current = currentDivisionId;
    }
  }, [propDivision]);

  const handleGenerateMatches = async () => {
    if (selectedDivision === 'all') {
      toast.error('Please select a specific division for match generation');
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
            action: 'generate_all',
            divisionId: selectedDivision,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Generated matches result:', result);
        toast.success(
          `Generated matches for ${result.successfulGroups} groups`
        );

        // Fetch updated matches from the server
        const matchesResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/matches`,
          { credentials: 'include' }
        );

        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData);
          onMatchesChange?.(matchesData);
        }
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
    if (selectedDivision === 'all') {
      toast.error('Please select a specific division for bulk operations');
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
            divisionId: selectedDivision,
            // Only pass groupId for operations that should be scoped to a specific group
            ...(operation !== 'clear_all' &&
              operation !== 'regenerate_all' &&
              selectedGroup !== 'all' && { groupId: selectedGroup }),
          }),
        }
      );

      if (response.ok) {
        await response.json();
        toast.success(`${operation.replace('_', ' ')} completed successfully`);

        // Fetch updated matches from the server
        const matchesResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/matches`,
          { credentials: 'include' }
        );

        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData);
          onMatchesChange?.(matchesData);
        }
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
      const response = await fetch(
        `/api/v1/tournaments/${tournamentId}/matches`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            groupId: formData.groupId,
            homeTeamId: formData.homeTeamId,
            awayTeamId: formData.awayTeamId,
            referee: formData.referee || undefined,
            notes: formData.notes || undefined,
            startTime: new Date().toISOString(), // Default to current time, can be updated later
            status: 'SCHEDULED',
          }),
        }
      );

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

  // Get selected group teams
  const selectedGroupData = propGroups.find((g) => g.id === selectedGroup);
  // Get teams from the selected group, or fallback to teams from matches
  const selectedGroupTeams =
    selectedGroup !== 'all' && selectedGroupData?.teams
      ? selectedGroupData.teams
      : selectedGroup !== 'all'
        ? teams.filter((team) => {
            // Fallback: Check if team appears in any match for this group
            return matches.some(
              (match) =>
                match.group?.id === selectedGroup &&
                (match.homeTeam?.id === team.id ||
                  match.awayTeam?.id === team.id)
            );
          })
        : teams;

  // Calculate match placeholders for round-robin
  useEffect(() => {
    if (selectedGroup !== 'all' && selectedGroupTeams.length >= 2) {
      const numMatches = calculateRoundRobinMatches(selectedGroupTeams.length);
      const placeholders: Array<{
        id: string;
        homeTeamId: string | null;
        awayTeamId: string | null;
      }> = [];

      // Get existing matches for this group
      const groupMatches = matches.filter((m) => m.group?.id === selectedGroup);

      // Create placeholders - initialize with existing match data
      for (let i = 0; i < numMatches; i++) {
        const existingMatch = groupMatches[i];
        placeholders.push({
          id: existingMatch?.id || `placeholder-${selectedGroup}-${i}`,
          homeTeamId: existingMatch?.homeTeam?.id || null,
          awayTeamId: existingMatch?.awayTeam?.id || null,
        });
      }

      setMatchPlaceholders(placeholders);
    } else {
      setMatchPlaceholders([]);
    }
  }, [selectedGroup, selectedGroupTeams.length, matches]);

  // Calculate team match counts (includes both saved matches and placeholders)
  const getTeamMatchCount = (teamId: string): number => {
    if (selectedGroup === 'all') return 0;

    // Count saved matches
    const savedMatches = matches.filter(
      (match) =>
        match.group?.id === selectedGroup &&
        (match.homeTeam?.id === teamId || match.awayTeam?.id === teamId)
    ).length;

    // Count placeholders where team is assigned
    const placeholderMatches = matchPlaceholders.filter(
      (placeholder) =>
        (placeholder.homeTeamId === teamId ||
          placeholder.awayTeamId === teamId) &&
        // Only count if it's a placeholder (not yet saved) or if it's not in saved matches
        (placeholder.id.startsWith('placeholder-') ||
          !matches.some((m) => m.id === placeholder.id))
    ).length;

    return savedMatches + placeholderMatches;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, team: Team) => {
    setDraggedTeam(team);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (
    e: React.DragEvent,
    matchIndex: number,
    position: 'home' | 'away'
  ) => {
    e.preventDefault();
    if (!draggedTeam) return;

    const updatedPlaceholders = [...matchPlaceholders];
    const placeholder = updatedPlaceholders[matchIndex];

    if (!placeholder) return;

    // Don't allow dropping on the same team
    if (
      (position === 'home' && placeholder.homeTeamId === draggedTeam.id) ||
      (position === 'away' && placeholder.awayTeamId === draggedTeam.id)
    ) {
      return;
    }

    // Don't allow same team in both positions
    if (
      (position === 'home' && placeholder.awayTeamId === draggedTeam.id) ||
      (position === 'away' && placeholder.homeTeamId === draggedTeam.id)
    ) {
      return;
    }

    updatedPlaceholders[matchIndex] = {
      id: placeholder.id,
      homeTeamId: position === 'home' ? draggedTeam.id : placeholder.homeTeamId,
      awayTeamId: position === 'away' ? draggedTeam.id : placeholder.awayTeamId,
    };

    setMatchPlaceholders(updatedPlaceholders);
    setDraggedTeam(null);

    // Save match to database
    const updatedPlaceholder = updatedPlaceholders[matchIndex];
    if (updatedPlaceholder) {
      saveMatchPlaceholder(updatedPlaceholder, matchIndex);
    }
  };

  const handleRemoveTeam = (matchIndex: number, position: 'home' | 'away') => {
    const updatedPlaceholders = [...matchPlaceholders];
    const placeholder = updatedPlaceholders[matchIndex];
    if (!placeholder) return;

    updatedPlaceholders[matchIndex] = {
      id: placeholder.id,
      homeTeamId: position === 'home' ? null : placeholder.homeTeamId,
      awayTeamId: position === 'away' ? null : placeholder.awayTeamId,
    };
    setMatchPlaceholders(updatedPlaceholders);
    const updatedPlaceholder = updatedPlaceholders[matchIndex];
    if (updatedPlaceholder) {
      saveMatchPlaceholder(updatedPlaceholder, matchIndex);
    }
  };

  const saveMatchPlaceholder = async (
    placeholder: {
      id: string;
      homeTeamId: string | null;
      awayTeamId: string | null;
    },
    matchIndex: number
  ) => {
    if (selectedGroup === 'all' || !selectedGroupData) return;

    try {
      const division = divisions.find((d) => d.id === selectedDivision);
      if (!division) return;

      // Check if this is an existing match or new placeholder
      const isExisting = !placeholder.id.startsWith('placeholder-');

      if (isExisting) {
        // Update existing match - only if both teams are assigned
        if (placeholder.homeTeamId && placeholder.awayTeamId) {
          const response = await fetch(`/api/v1/matches/${placeholder.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              homeTeamId: placeholder.homeTeamId,
              awayTeamId: placeholder.awayTeamId,
              startTime: new Date().toISOString(), // Required by API, will be updated later
            }),
          });

          if (response.ok) {
            // Refresh matches to update counts
            const matchesResponse = await fetch(
              `/api/v1/tournaments/${tournamentId}/matches`,
              { credentials: 'include' }
            );
            if (matchesResponse.ok) {
              const matchesData = await matchesResponse.json();
              setMatches(matchesData);
              onMatchesChange?.(matchesData);
              toast.success('Match updated successfully');
            }
          } else {
            const error = await response.json();
            toast.error(error.error || 'Failed to update match');
          }
        } else {
          // If one or both teams are removed, delete the match
          const response = await fetch(`/api/v1/matches/${placeholder.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            // Refresh matches
            const matchesResponse = await fetch(
              `/api/v1/tournaments/${tournamentId}/matches`,
              { credentials: 'include' }
            );
            if (matchesResponse.ok) {
              const matchesData = await matchesResponse.json();
              setMatches(matchesData);
              onMatchesChange?.(matchesData);
            }
          }
        }
      } else {
        // Create new match if both teams are assigned
        if (placeholder.homeTeamId && placeholder.awayTeamId) {
          const response = await fetch(
            `/api/v1/tournaments/${tournamentId}/matches`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                divisionId: selectedDivision,
                groupId: selectedGroup,
                homeTeamId: placeholder.homeTeamId,
                awayTeamId: placeholder.awayTeamId,
              }),
            }
          );

          if (response.ok) {
            const newMatch = await response.json();
            const updatedPlaceholders = [...matchPlaceholders];
            updatedPlaceholders[matchIndex] = {
              id: newMatch.id,
              homeTeamId: newMatch.homeTeamId,
              awayTeamId: newMatch.awayTeamId,
            };
            setMatchPlaceholders(updatedPlaceholders);

            // Refresh matches
            const matchesResponse = await fetch(
              `/api/v1/tournaments/${tournamentId}/matches`,
              { credentials: 'include' }
            );
            if (matchesResponse.ok) {
              const matchesData = await matchesResponse.json();
              setMatches(matchesData);
              onMatchesChange?.(matchesData);
              toast.success('Match created successfully');
            }
          } else {
            const error = await response.json();
            toast.error(error.error || 'Failed to create match');
          }
        }
      }
    } catch (error) {
      console.error('Error saving match:', error);
      toast.error('Failed to save match');
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
      if (match.homeTeam?.id && !teamStats[match.homeTeam.id]) {
        teamStats[match.homeTeam.id] = {
          team: match.homeTeam,
          homeMatches: 0,
          awayMatches: 0,
          totalMatches: 0,
        };
      }
      if (match.homeTeam?.id) {
        const homeTeamStats = teamStats[match.homeTeam.id];
        if (homeTeamStats) {
          homeTeamStats.homeMatches++;
          homeTeamStats.totalMatches++;
        }
      }

      // Away team stats
      if (match.awayTeam?.id && !teamStats[match.awayTeam.id]) {
        teamStats[match.awayTeam.id] = {
          team: match.awayTeam,
          homeMatches: 0,
          awayMatches: 0,
          totalMatches: 0,
        };
      }
      if (match.awayTeam?.id) {
        const awayTeamStats = teamStats[match.awayTeam.id];
        if (awayTeamStats) {
          awayTeamStats.awayMatches++;
          awayTeamStats.totalMatches++;
        }
      }
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
          {/* Division Selector */}
          Divisions
          {divisions.length > 0 && (
            <div className="mb-4">
              <Tabs
                value={selectedDivision}
                onValueChange={(value) => {
                  setSelectedDivision(value);
                  // Reset group filter when division changes
                  setSelectedGroup('all');
                }}
              >
                <TabsList className="grid w-full grid-cols-1 gap-2 border-0 bg-transparent p-0 md:grid-cols-2 lg:grid-cols-3">
                  {divisions.map((division) => (
                    <TabsTrigger
                      key={division.id}
                      value={division.id}
                      className="border"
                    >
                      {division.name}{' '}
                      {division.level ? `| ${division.level}` : ''}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
          {/* Group Selector */}
          {propGroups.filter(
            (group) =>
              selectedDivision === 'all' ||
              group.division?.id === selectedDivision
          ).length > 0 && (
            <div className="mb-4">
              <Tabs value={selectedGroup} onValueChange={setSelectedGroup}>
                <TabsList className="flex flex-wrap gap-2 border-0 bg-transparent p-0">
                  <TabsTrigger value="all" className="border">
                    All Groups
                  </TabsTrigger>
                  {propGroups
                    .filter(
                      (group) =>
                        selectedDivision === 'all' ||
                        group.division?.id === selectedDivision
                    )
                    .map((group) => (
                      <TabsTrigger
                        key={group.id}
                        value={group.id}
                        className="border"
                      >
                        {group.name}
                      </TabsTrigger>
                    ))}
                </TabsList>
              </Tabs>
            </div>
          )}
          {/* Two Column Layout: Teams Table and Match Placeholders */}
          {selectedGroup !== 'all' && (
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Column: Teams Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Teams</CardTitle>
                  <CardDescription>
                    Drag teams to match placeholders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team</TableHead>
                          <TableHead className="text-right">Matches</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedGroupTeams.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              className="text-center text-muted-foreground"
                            >
                              No teams in this group. Add teams to the group
                              first.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedGroupTeams.map((team) => {
                            const matchCount = getTeamMatchCount(team.id);
                            return (
                              <TableRow
                                key={team.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, team)}
                                className="cursor-move"
                              >
                                <TableCell className="font-medium">
                                  {team.shortName || team.name}
                                </TableCell>
                                <TableCell className="text-right">
                                  {matchCount}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Match Placeholders */}
              <Card>
                <CardHeader>
                  <CardTitle>Matches</CardTitle>
                  <CardDescription>
                    Drop teams to create matches (Round-robin format)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedGroupTeams.length < 2 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        Add at least 2 teams to the group to generate matches
                      </div>
                    ) : matchPlaceholders.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        Calculating match placeholders...
                      </div>
                    ) : (
                      matchPlaceholders.map((placeholder, index) => {
                        const homeTeam = selectedGroupTeams.find(
                          (t) => t.id === placeholder.homeTeamId
                        );
                        const awayTeam = selectedGroupTeams.find(
                          (t) => t.id === placeholder.awayTeamId
                        );

                        return (
                          <div
                            key={placeholder.id}
                            className="flex items-center gap-2 rounded-lg border p-3"
                          >
                            {/* Home Team Drop Zone */}
                            <div
                              className="flex-1 rounded border-2 border-dashed p-3 text-center transition-colors"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, index, 'home')}
                              style={{
                                backgroundColor: placeholder.homeTeamId
                                  ? 'transparent'
                                  : 'rgba(0, 0, 0, 0.02)',
                                borderColor: placeholder.homeTeamId
                                  ? 'currentColor'
                                  : 'currentColor',
                              }}
                            >
                              {homeTeam ? (
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {homeTeam.shortName || homeTeam.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveTeam(index, 'home')
                                    }
                                  >
                                    ×
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  Drop home team
                                </span>
                              )}
                            </div>

                            <span className="font-medium">vs</span>

                            {/* Away Team Drop Zone */}
                            <div
                              className="flex-1 rounded border-2 border-dashed p-3 text-center transition-colors"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, index, 'away')}
                              style={{
                                backgroundColor: placeholder.awayTeamId
                                  ? 'transparent'
                                  : 'rgba(0, 0, 0, 0.02)',
                                borderColor: placeholder.awayTeamId
                                  ? 'currentColor'
                                  : 'currentColor',
                              }}
                            >
                              {awayTeam ? (
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {awayTeam.shortName || awayTeam.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveTeam(index, 'away')
                                    }
                                  >
                                    ×
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  Drop away team
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {selectedDivision === 'all' && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Please select a specific division to generate matches and
                  configure matches.
                </p>
              </div>
            </div>
          )}
          {selectedDivision !== 'all' && (
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
              {filteredMatches.length === 0 ? (
                <div className="py-12 text-center">
                  <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No matches found
                  </h3>
                  <p className="text-muted-foreground">
                    {matches.length === 0
                      ? 'No matches have been created yet.'
                      : 'No matches match the current filters.'}
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
                                  {match.homeTeam && match.awayTeam ? (
                                    <>
                                      {match.homeTeam.shortName ||
                                        match.homeTeam.name}{' '}
                                      vs{' '}
                                      {match.awayTeam.shortName ||
                                        match.awayTeam.name}
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      TBD
                                    </span>
                                  )}
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
            matchDuration: division.matchDuration ?? 90,
            breakDuration: division.breakDuration ?? 15,
            assignmentType: division.assignmentType ?? 'MANUAL',
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
                  {propGroups.map((group) => (
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
