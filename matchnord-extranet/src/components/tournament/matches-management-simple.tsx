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
import { DivisionFilter } from './division-filter';
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
  GripVertical,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { DivisionMatchSettings } from './division-match-settings';
import { calculateRoundRobinMatches } from '@/lib/tournament/match-generation/round-robin';
import {
  generatePlacementMatches,
  PlacementSystemConfiguration,
  PLACEMENT_SYSTEM_TEMPLATES,
  PlacementMatch,
} from '@/lib/tournament/placement-configuration';

interface Match {
  id: string;
  startTime: string;
  endTime?: string;
  status: string;
  homeScore: number;
  awayScore: number;
  matchNumber?: string | null;
  referee?: string;
  notes?: string;
  homeTeam: {
    id: string;
    name: string;
    shortName?: string;
    logo?: string;
    clubRef?: {
      id: string;
      name: string;
      logo?: string;
    };
  };
  awayTeam: {
    id: string;
    name: string;
    shortName?: string;
    logo?: string;
    clubRef?: {
      id: string;
      name: string;
      logo?: string;
    };
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
  logo?: string;
  clubRef?: {
    id: string;
    name: string;
    logo?: string;
  };
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

// Component for rendering a single group's matches interface
function GroupMatchesView({
  group,
  groupTeams,
  groupPlaceholders,
  draggedTeam,
  dragOverTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveTeam,
  getTeamMatchCount,
}: {
  group: Group;
  groupTeams: Team[];
  groupPlaceholders: Array<{
    id: string;
    homeTeamId: string | null;
    awayTeamId: string | null;
  }>;
  draggedTeam: Team | null;
  dragOverTarget: { matchIndex: number; position: 'home' | 'away' } | null;
  onDragStart: (e: React.DragEvent, team: Team) => void;
  onDragEnd: () => void;
  onDragOver: (
    e: React.DragEvent,
    matchIndex: number,
    position: 'home' | 'away'
  ) => void;
  onDragLeave: () => void;
  onDrop: (
    e: React.DragEvent,
    matchIndex: number,
    position: 'home' | 'away'
  ) => void;
  onRemoveTeam: (matchIndex: number, position: 'home' | 'away') => void;
  getTeamMatchCount: (teamId: string) => number;
}) {
  const [localPlaceholders, setLocalPlaceholders] = useState(groupPlaceholders);

  // Sync local placeholders when prop changes
  useEffect(() => {
    setLocalPlaceholders(groupPlaceholders);
  }, [groupPlaceholders]);

  const handleDrop = (
    e: React.DragEvent,
    matchIndex: number,
    position: 'home' | 'away'
  ) => {
    e.preventDefault();
    if (!draggedTeam) return;

    const updatedPlaceholders = [...localPlaceholders];
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

    setLocalPlaceholders(updatedPlaceholders);
    onDrop(e, matchIndex, position);
  };

  const handleRemoveTeam = (matchIndex: number, position: 'home' | 'away') => {
    const updatedPlaceholders = [...localPlaceholders];
    const placeholder = updatedPlaceholders[matchIndex];
    if (!placeholder) return;

    updatedPlaceholders[matchIndex] = {
      id: placeholder.id,
      homeTeamId: position === 'home' ? null : placeholder.homeTeamId,
      awayTeamId: position === 'away' ? null : placeholder.awayTeamId,
    };
    setLocalPlaceholders(updatedPlaceholders);
    onRemoveTeam(matchIndex, position);
  };

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Column: Teams Table */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-[#489a66] text-white">Team</TableHead>
              <TableHead className="bg-[#489a66] text-right text-white">
                Matches
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupTeams.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-muted-foreground"
                >
                  No teams in this group. Add teams to the group first.
                </TableCell>
              </TableRow>
            ) : (
              groupTeams.map((team) => {
                const matchCount = getTeamMatchCount(team.id);
                return (
                  <TableRow
                    key={team.id}
                    className="group transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="py-2 font-medium">
                      <div
                        draggable
                        onDragStart={(e) => onDragStart(e, team)}
                        onDragEnd={onDragEnd}
                        className="flex h-10 cursor-grab items-center gap-2 active:cursor-grabbing"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        {(team.logo || team.clubRef?.logo) && (
                          <img
                            src={team.logo || team.clubRef?.logo}
                            alt={`${team.name} logo`}
                            className="h-5 w-5 rounded object-cover"
                          />
                        )}
                        <span>{team.shortName || team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {matchCount}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Right Column: Match Placeholders */}
      <div>
        <div className="space-y-1">
          {groupTeams.length < 2 ? (
            <div className="py-8 text-center text-muted-foreground">
              Add at least 2 teams to the group to generate matches
            </div>
          ) : localPlaceholders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Calculating match placeholders...
            </div>
          ) : (
            localPlaceholders.map((placeholder, index) => {
              const homeTeam = groupTeams.find(
                (t) => t.id === placeholder.homeTeamId
              );
              const awayTeam = groupTeams.find(
                (t) => t.id === placeholder.awayTeamId
              );

              return (
                <div
                  key={placeholder.id}
                  className="flex items-center gap-2 rounded-lg p-2"
                >
                  {/* Home Team Drop Zone */}
                  <div
                    className={`flex-1 rounded border-2 border-dashed p-2 text-center transition-colors hover:border-primary/50 hover:bg-muted/30 ${
                      dragOverTarget?.matchIndex === index &&
                      dragOverTarget?.position === 'home'
                        ? 'border-green-500 bg-green-50'
                        : ''
                    }`}
                    onDragOver={(e) => onDragOver(e, index, 'home')}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => handleDrop(e, index, 'home')}
                    style={{
                      backgroundColor:
                        dragOverTarget?.matchIndex === index &&
                        dragOverTarget?.position === 'home'
                          ? undefined
                          : placeholder.homeTeamId
                            ? 'transparent'
                            : 'rgba(0, 0, 0, 0.02)',
                      minHeight: '2.5rem',
                    }}
                  >
                    {homeTeam ? (
                      <div className="flex items-center justify-between">
                        <div className="pointer-events-none flex items-center gap-2">
                          {(homeTeam.logo || homeTeam.clubRef?.logo) && (
                            <img
                              src={homeTeam.logo || homeTeam.clubRef?.logo}
                              alt={`${homeTeam.name} logo`}
                              className="h-5 w-5 rounded object-cover"
                            />
                          )}
                          <span className="font-medium">
                            {homeTeam.shortName || homeTeam.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTeam(index, 'home');
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="cursor-pointer"
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
                    className={`flex-1 rounded border-2 border-dashed p-2 text-center transition-colors hover:border-primary/50 hover:bg-muted/30 ${
                      dragOverTarget?.matchIndex === index &&
                      dragOverTarget?.position === 'away'
                        ? 'border-green-500 bg-green-50'
                        : ''
                    }`}
                    onDragOver={(e) => onDragOver(e, index, 'away')}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => handleDrop(e, index, 'away')}
                    style={{
                      backgroundColor:
                        dragOverTarget?.matchIndex === index &&
                        dragOverTarget?.position === 'away'
                          ? undefined
                          : placeholder.awayTeamId
                            ? 'transparent'
                            : 'rgba(0, 0, 0, 0.02)',
                      minHeight: '2.5rem',
                    }}
                  >
                    {awayTeam ? (
                      <div className="flex items-center justify-between">
                        <div className="pointer-events-none flex items-center gap-2">
                          {(awayTeam.logo || awayTeam.clubRef?.logo) && (
                            <img
                              src={awayTeam.logo || awayTeam.clubRef?.logo}
                              alt={`${awayTeam.name} logo`}
                              className="h-5 w-5 rounded object-cover"
                            />
                          )}
                          <span className="font-medium">
                            {awayTeam.shortName || awayTeam.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTeam(index, 'away');
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="cursor-pointer"
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
      </div>
    </div>
  );
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
  const [placementConfig, setPlacementConfig] =
    useState<PlacementSystemConfiguration | null>(
      PLACEMENT_SYSTEM_TEMPLATES[0] || null
    );
  const [hasSavedPlacementMatches, setHasSavedPlacementMatches] =
    useState(false);
  const [placementMatchesGroup, setPlacementMatchesGroup] =
    useState<Group | null>(null);
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    matchIndex: number;
    position: 'home' | 'away';
  } | null>(null);
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

  // Check for existing placement matches
  useEffect(() => {
    if (selectedDivision === 'all') {
      setHasSavedPlacementMatches(false);
      setPlacementMatchesGroup(null);
      return;
    }

    // Find placement bracket groups (non-group-stage groups)
    const bracketGroupNames = [
      'final',
      'semi-final',
      'quarter-final',
      'round of 16',
      'round of 8',
      'third place',
      'playoff',
      'knockout',
      'championship',
      'consolation',
      'placement',
    ];

    const groupStagePattern = /^group\s+[a-z]$/i;

    const placementGroups = propGroups.filter(
      (group) =>
        group.division?.id === selectedDivision &&
        !groupStagePattern.test(group.name) &&
        bracketGroupNames.some((name) =>
          group.name.toLowerCase().includes(name)
        )
    );

    // Check if any of these groups have matches
    const hasMatches = placementGroups.some((group) => {
      return matches.some((match) => match.group?.id === group.id);
    });

    if (hasMatches && placementGroups.length > 0) {
      setHasSavedPlacementMatches(true);
      setPlacementMatchesGroup(placementGroups[0] || null);
    } else {
      setHasSavedPlacementMatches(false);
      setPlacementMatchesGroup(null);
    }
  }, [selectedDivision, propGroups, matches]);

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

  // Delete placement matches
  const handleDeletePlacementMatches = async () => {
    if (
      !confirm(
        'Are you sure you want to delete all placement matches? This cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/v1/tournaments/${tournamentId}/brackets`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            divisionId:
              selectedDivision !== 'all' ? selectedDivision : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete placement matches');
      }

      toast.success('Placement matches deleted successfully');
      setHasSavedPlacementMatches(false);
      setPlacementMatchesGroup(null);

      // Refresh matches
      if (onMatchesChange) {
        const matchesResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/matches`,
          {
            credentials: 'include',
          }
        );
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData);
          onMatchesChange(matchesData);
        }
      }
    } catch (error: any) {
      console.error('Error deleting placement matches:', error);
      toast.error(error.message || 'Failed to delete placement matches');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save placement matches to database
  const handleSavePlacementMatches = async () => {
    if (!placementConfig || selectedDivision === 'all') {
      toast.error('Please select a division and placement strategy');
      return;
    }

    // Warn if placement matches already exist
    if (hasSavedPlacementMatches) {
      const shouldContinue = confirm(
        'Placement matches already exist. Saving again will update existing matches. Continue?'
      );
      if (!shouldContinue) {
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Calculate group standings
      const groupStandings = calculateGroupStandings();
      if (groupStandings.length === 0) {
        toast.error('No groups found. Add groups first.');
        return;
      }

      // Generate placement matches
      const placementMatchesData = generatePlacementMatches(
        groupStandings.map((gs) => ({
          groupId: gs.groupId,
          groupName: gs.groupName,
          teams: gs.teams.map((t) => ({
            id: t.id,
            name: t.name,
            position: (t as typeof t & { position: number }).position,
            points: t.points,
            goalDifference: t.goalDifference,
          })),
        })),
        placementConfig
      );

      if (placementMatchesData.length === 0) {
        toast.error(
          'No placement matches generated. Check your configuration.'
        );
        return;
      }

      // Flatten all matches from all brackets
      const allPlacementMatches: PlacementMatch[] = [];
      const bracketNames: string[] = [];

      for (const bracketData of placementMatchesData) {
        bracketNames.push(bracketData.bracketName);
        allPlacementMatches.push(...bracketData.matches);
      }

      // Call API to save matches
      const response = await fetch(
        `/api/v1/tournaments/${tournamentId}/placement-matches`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            divisionId: selectedDivision,
            placementMatches: allPlacementMatches,
            bracketName: bracketNames.join(', '),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save placement matches');
      }

      const result = await response.json();
      toast.success(
        `Successfully saved ${result.matchesCreated} placement matches!`
      );

      setHasSavedPlacementMatches(true);

      // Refresh matches
      if (onMatchesChange) {
        const matchesResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/matches`,
          {
            credentials: 'include',
          }
        );
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData);
          onMatchesChange(matchesData);
        }
      }
    } catch (error: any) {
      console.error('Error saving placement matches:', error);
      toast.error(error.message || 'Failed to save placement matches');
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

  // Helper function to get teams for a specific group
  const getGroupTeams = (groupId: string): Team[] => {
    const groupData = propGroups.find((g) => g.id === groupId);
    if (groupData?.teams) {
      return groupData.teams;
    }
    // Fallback: Check if team appears in any match for this group
    return teams.filter((team) => {
      return matches.some(
        (match) =>
          match.group?.id === groupId &&
          (match.homeTeam?.id === team.id || match.awayTeam?.id === team.id)
      );
    });
  };

  // Helper function to get match placeholders for a specific group
  const getGroupMatchPlaceholders = (groupId: string) => {
    const groupTeams = getGroupTeams(groupId);
    if (groupTeams.length < 2) return [];

    const numMatches = calculateRoundRobinMatches(groupTeams.length);
    const placeholders: Array<{
      id: string;
      homeTeamId: string | null;
      awayTeamId: string | null;
    }> = [];

    // Get existing matches for this group
    const groupMatches = matches.filter((m) => m.group?.id === groupId);

    // Create placeholders - initialize with existing match data
    for (let i = 0; i < numMatches; i++) {
      const existingMatch = groupMatches[i];
      placeholders.push({
        id: existingMatch?.id || `placeholder-${groupId}-${i}`,
        homeTeamId: existingMatch?.homeTeam?.id || null,
        awayTeamId: existingMatch?.awayTeam?.id || null,
      });
    }

    return placeholders;
  };

  // Helper function to get team match count for a specific group
  const getTeamMatchCountForGroup = (
    teamId: string,
    groupId: string
  ): number => {
    // Count saved matches
    const savedMatches = matches.filter(
      (match) =>
        match.group?.id === groupId &&
        (match.homeTeam?.id === teamId || match.awayTeam?.id === teamId)
    ).length;

    // Count placeholders where team is assigned
    const groupPlaceholders = getGroupMatchPlaceholders(groupId);
    const placeholderMatches = groupPlaceholders.filter(
      (placeholder) =>
        (placeholder.homeTeamId === teamId ||
          placeholder.awayTeamId === teamId) &&
        // Only count if it's a placeholder (not yet saved) or if it's not in saved matches
        (placeholder.id.startsWith('placeholder-') ||
          !matches.some((m) => m.id === placeholder.id))
    ).length;

    return savedMatches + placeholderMatches;
  };

  // Calculate team match counts (includes both saved matches and placeholders)
  const getTeamMatchCount = (teamId: string): number => {
    if (selectedGroup === 'all') return 0;
    return getTeamMatchCountForGroup(teamId, selectedGroup);
  };

  // Check if all group matches are finished
  const areGroupMatchesFinished = (groupId: string): boolean => {
    const groupMatches = matches.filter((match) => match.group?.id === groupId);
    if (groupMatches.length === 0) return false;
    return groupMatches.every((match) => match.status === 'FINISHED');
  };

  // Calculate group standings for placement matches
  const calculateGroupStandings = () => {
    if (selectedDivision === 'all') return [];

    const divisionGroups = propGroups.filter(
      (group) => group.division?.id === selectedDivision
    );

    return divisionGroups.map((group) => {
      const groupMatches = matches.filter(
        (match) => match.group?.id === group.id && match.status === 'FINISHED'
      );
      const groupTeams = getGroupTeams(group.id);
      const isFinished = areGroupMatchesFinished(group.id);

      // Calculate stats for each team
      const teamStats = groupTeams.map((team) => {
        const teamMatches = groupMatches.filter(
          (m) => m.homeTeam?.id === team.id || m.awayTeam?.id === team.id
        );

        let played = 0;
        let won = 0;
        let drawn = 0;
        let lost = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;

        teamMatches.forEach((match) => {
          const isHome = match.homeTeam?.id === team.id;
          const teamScore = isHome ? match.homeScore : match.awayScore;
          const opponentScore = isHome ? match.awayScore : match.homeScore;

          played++;
          goalsFor += teamScore;
          goalsAgainst += opponentScore;

          if (teamScore > opponentScore) won++;
          else if (teamScore < opponentScore) lost++;
          else drawn++;
        });

        const points = won * 3 + drawn;
        const goalDifference = goalsFor - goalsAgainst;

        return {
          id: team.id,
          name: team.name,
          shortName: team.shortName,
          played,
          won,
          drawn,
          lost,
          goalsFor,
          goalsAgainst,
          goalDifference,
          points,
        };
      });

      // Sort by points, then goal difference, then goals for
      teamStats.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference)
          return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      // Assign positions
      teamStats.forEach((stat, index) => {
        (stat as typeof stat & { position: number }).position = index + 1;
      });

      return {
        groupId: group.id,
        groupName: group.name,
        teams: teamStats,
        isFinished,
      };
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, team: Team) => {
    setDraggedTeam(team);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTeam(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (
    e: React.DragEvent,
    matchIndex: number,
    position: 'home' | 'away'
  ) => {
    e.preventDefault();
    if (!draggedTeam) return;

    const placeholder = matchPlaceholders[matchIndex];
    if (!placeholder) return;

    // Check if drop is valid
    const isValidDrop =
      (position === 'home' && placeholder.homeTeamId !== draggedTeam.id) ||
      (position === 'away' && placeholder.awayTeamId !== draggedTeam.id);

    // Don't allow same team in both positions
    const notSameTeamInBoth =
      (position === 'home' && placeholder.awayTeamId !== draggedTeam.id) ||
      (position === 'away' && placeholder.homeTeamId !== draggedTeam.id);

    if (isValidDrop && notSameTeamInBoth) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverTarget({ matchIndex, position });
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDragOverTarget(null);
    }
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
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
    setDragOverTarget(null);

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
    matchIndex: number,
    groupId?: string
  ) => {
    const targetGroupId = groupId || selectedGroup;
    if (targetGroupId === 'all') return;
    if (selectedDivision === 'all') {
      toast.error('Please select a specific division');
      return;
    }

    try {
      const division = divisions.find((d) => d.id === selectedDivision);
      if (!division) {
        toast.error('Division not found');
        return;
      }

      // Check if this is an existing match or new placeholder
      const isExisting = !placeholder.id.startsWith('placeholder-');

      if (isExisting) {
        // Get the existing match to preserve its data
        const existingMatch = matches.find((m) => m.id === placeholder.id);

        if (!existingMatch) {
          console.error('Existing match not found:', placeholder.id);
          return;
        }

        // Use placeholder values directly (they always contain the current state)
        const homeTeamId = placeholder.homeTeamId;
        const awayTeamId = placeholder.awayTeamId;

        // If both teams are removed, delete the match
        if (!homeTeamId && !awayTeamId) {
          const response = await fetch(`/api/v1/matches/${placeholder.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            const matchesResponse = await fetch(
              `/api/v1/tournaments/${tournamentId}/matches`,
              { credentials: 'include' }
            );
            if (matchesResponse.ok) {
              const matchesData = await matchesResponse.json();
              setMatches(matchesData);
              onMatchesChange?.(matchesData);
              toast.success('Match removed');
            }
          } else {
            const error = await response.json();
            toast.error(error.error || 'Failed to remove match');
          }
          return;
        }

        // Update existing match - allow null values for teams
        // Use placeholder values directly (null means team was removed)
        const response = await fetch(`/api/v1/matches/${placeholder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            homeTeamId: homeTeamId ?? null,
            awayTeamId: awayTeamId ?? null,
            startTime: existingMatch.startTime
              ? new Date(existingMatch.startTime).toISOString()
              : new Date().toISOString(), // Required by API
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
        // Create new match immediately when ANY team is dropped
        if (placeholder.homeTeamId || placeholder.awayTeamId) {
          const response = await fetch(
            `/api/v1/tournaments/${tournamentId}/matches`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                divisionId: selectedDivision,
                groupId: targetGroupId,
                homeTeamId: placeholder.homeTeamId || null,
                awayTeamId: placeholder.awayTeamId || null,
              }),
            }
          );

          if (response.ok) {
            const newMatch = await response.json();
            const updatedPlaceholders = [...matchPlaceholders];
            updatedPlaceholders[matchIndex] = {
              id: newMatch.id,
              homeTeamId: newMatch.homeTeam?.id || null,
              awayTeamId: newMatch.awayTeam?.id || null,
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
              toast.success('Match saved');
            }
          } else {
            const error = await response.json();
            toast.error(error.error || 'Failed to save match');
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
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={() => setShowSummary(!showSummary)}>
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

      {/* Division Selector */}
      {divisions.length > 0 && (
        <DivisionFilter
          divisions={divisions}
          selectedDivision={selectedDivision}
          onDivisionChange={(value) => {
            setSelectedDivision(value);
            // Reset group filter when division changes
            setSelectedGroup('all');
          }}
          showAllOption={false}
        />
      )}
      {/* Group Selector */}
      {propGroups.filter(
        (group) =>
          selectedDivision === 'all' || group.division?.id === selectedDivision
      ).length > 0 && (
        <div>
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
              {selectedDivision !== 'all' && (
                <TabsTrigger value="placements" className="border">
                  Placements
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      )}
      {/* Two Column Layout: Teams Table and Match Placeholders */}
      {selectedGroup !== 'all' && selectedGroup !== 'placements' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Teams Table */}
          <div>
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
                      No teams in this group. Add teams to the group first.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedGroupTeams.map((team) => {
                    const matchCount = getTeamMatchCount(team.id);
                    return (
                      <TableRow
                        key={team.id}
                        className="group transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="py-2 font-medium">
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, team)}
                            onDragEnd={handleDragEnd}
                            className="flex h-10 cursor-grab items-center gap-2 active:cursor-grabbing"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                            {(team.logo || team.clubRef?.logo) && (
                              <img
                                src={team.logo || team.clubRef?.logo}
                                alt={`${team.name} logo`}
                                className="h-5 w-5 rounded object-cover"
                              />
                            )}
                            <span>{team.shortName || team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          {matchCount}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Right Column: Match Placeholders */}
          <div>
            <div className="space-y-1">
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
                      className="flex items-center gap-2 rounded-lg p-2"
                    >
                      {/* Home Team Drop Zone */}
                      <div
                        className={`flex-1 rounded border-2 border-dashed p-2 text-center transition-colors hover:border-primary/50 hover:bg-muted/30 ${
                          dragOverTarget?.matchIndex === index &&
                          dragOverTarget?.position === 'home'
                            ? 'border-green-500 bg-green-50'
                            : ''
                        }`}
                        onDragOver={(e) => handleDragOver(e, index, 'home')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index, 'home')}
                        style={{
                          backgroundColor:
                            dragOverTarget?.matchIndex === index &&
                            dragOverTarget?.position === 'home'
                              ? undefined
                              : placeholder.homeTeamId
                                ? 'transparent'
                                : 'rgba(0, 0, 0, 0.02)',
                          minHeight: '2.5rem',
                        }}
                      >
                        {homeTeam ? (
                          <div className="flex items-center justify-between">
                            <div className="pointer-events-none flex items-center gap-2">
                              {(homeTeam.logo || homeTeam.clubRef?.logo) && (
                                <img
                                  src={homeTeam.logo || homeTeam.clubRef?.logo}
                                  alt={`${homeTeam.name} logo`}
                                  className="h-5 w-5 rounded object-cover"
                                />
                              )}
                              <span className="font-medium">
                                {homeTeam.shortName || homeTeam.name}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTeam(index, 'home');
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="cursor-pointer"
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
                        className={`flex-1 rounded border-2 border-dashed p-2 text-center transition-colors hover:border-primary/50 hover:bg-muted/30 ${
                          dragOverTarget?.matchIndex === index &&
                          dragOverTarget?.position === 'away'
                            ? 'border-green-500 bg-green-50'
                            : ''
                        }`}
                        onDragOver={(e) => handleDragOver(e, index, 'away')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index, 'away')}
                        style={{
                          backgroundColor:
                            dragOverTarget?.matchIndex === index &&
                            dragOverTarget?.position === 'away'
                              ? undefined
                              : placeholder.awayTeamId
                                ? 'transparent'
                                : 'rgba(0, 0, 0, 0.02)',
                          minHeight: '2.5rem',
                        }}
                      >
                        {awayTeam ? (
                          <div className="flex items-center justify-between">
                            <div className="pointer-events-none flex items-center gap-2">
                              {(awayTeam.logo || awayTeam.clubRef?.logo) && (
                                <img
                                  src={awayTeam.logo || awayTeam.clubRef?.logo}
                                  alt={`${awayTeam.name} logo`}
                                  className="h-5 w-5 rounded object-cover"
                                />
                              )}
                              <span className="font-medium">
                                {awayTeam.shortName || awayTeam.name}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTeam(index, 'away');
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="cursor-pointer"
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
          </div>
        </div>
      )}
      {/* All Groups View: Render each group stacked vertically with separators */}
      {selectedGroup === 'all' &&
        selectedDivision !== 'all' &&
        (() => {
          const divisionGroups = propGroups.filter(
            (group) => group.division?.id === selectedDivision
          );

          if (divisionGroups.length === 0) {
            return null;
          }

          const handleGroupDragOver = (
            e: React.DragEvent,
            matchIndex: number,
            position: 'home' | 'away'
          ) => {
            e.preventDefault();
            if (!draggedTeam) return;

            // The component manages its own placeholders, so we just set the drag target
            // The actual validation happens in the component's handleDrop
            e.dataTransfer.dropEffect = 'move';
            setDragOverTarget({ matchIndex, position });
          };

          const handleGroupDrop = (
            e: React.DragEvent,
            matchIndex: number,
            position: 'home' | 'away',
            groupId: string
          ) => {
            e.preventDefault();
            if (!draggedTeam) return;

            const groupPlaceholders = getGroupMatchPlaceholders(groupId);
            const placeholder = groupPlaceholders[matchIndex];

            if (!placeholder) return;

            // Don't allow dropping on the same team
            if (
              (position === 'home' &&
                placeholder.homeTeamId === draggedTeam.id) ||
              (position === 'away' && placeholder.awayTeamId === draggedTeam.id)
            ) {
              return;
            }

            // Don't allow same team in both positions
            if (
              (position === 'home' &&
                placeholder.awayTeamId === draggedTeam.id) ||
              (position === 'away' && placeholder.homeTeamId === draggedTeam.id)
            ) {
              return;
            }

            const updatedPlaceholder = {
              id: placeholder.id,
              homeTeamId:
                position === 'home' ? draggedTeam.id : placeholder.homeTeamId,
              awayTeamId:
                position === 'away' ? draggedTeam.id : placeholder.awayTeamId,
            };

            setDraggedTeam(null);
            setDragOverTarget(null);

            // Save match to database
            saveMatchPlaceholder(updatedPlaceholder, matchIndex, groupId);
          };

          const handleGroupRemoveTeam = (
            matchIndex: number,
            position: 'home' | 'away',
            groupId: string
          ) => {
            const groupPlaceholders = getGroupMatchPlaceholders(groupId);
            const placeholder = groupPlaceholders[matchIndex];
            if (!placeholder) return;

            const updatedPlaceholder = {
              id: placeholder.id,
              homeTeamId: position === 'home' ? null : placeholder.homeTeamId,
              awayTeamId: position === 'away' ? null : placeholder.awayTeamId,
            };

            saveMatchPlaceholder(updatedPlaceholder, matchIndex, groupId);
          };

          return (
            <div className="mb-6 space-y-8">
              {divisionGroups.map((group, groupIndex) => {
                const groupTeams = getGroupTeams(group.id);
                const groupPlaceholders = getGroupMatchPlaceholders(group.id);

                return (
                  <div key={group.id}>
                    {groupIndex > 0 && (
                      <div className="my-8 border-t border-gray-300"></div>
                    )}
                    <GroupMatchesView
                      group={group}
                      groupTeams={groupTeams}
                      groupPlaceholders={groupPlaceholders}
                      draggedTeam={draggedTeam}
                      dragOverTarget={dragOverTarget}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e, index, position) =>
                        handleGroupDragOver(e, index, position)
                      }
                      onDragLeave={handleDragLeave}
                      onDrop={(e, index, position) =>
                        handleGroupDrop(e, index, position, group.id)
                      }
                      onRemoveTeam={(index, position) =>
                        handleGroupRemoveTeam(index, position, group.id)
                      }
                      getTeamMatchCount={(teamId) =>
                        getTeamMatchCountForGroup(teamId, group.id)
                      }
                    />
                  </div>
                );
              })}
            </div>
          );
        })()}
      {/* Placements View: Bracket visualization */}
      {selectedGroup === 'placements' && selectedDivision !== 'all' && (
        <div className="mb-6 space-y-6">
          {/* Placement Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Placement Strategy
                    {hasSavedPlacementMatches && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Saved
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {hasSavedPlacementMatches
                      ? `Placement matches have been saved. ${placementMatchesGroup ? `Group: ${placementMatchesGroup.name}` : ''}`
                      : 'Configure how teams advance from groups to placement matches'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {hasSavedPlacementMatches && (
                    <Button
                      variant="destructive"
                      onClick={handleDeletePlacementMatches}
                      disabled={isSubmitting}
                      size="sm"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                  {placementConfig && (
                    <Button
                      onClick={handleSavePlacementMatches}
                      disabled={isSubmitting || !placementConfig}
                      variant={hasSavedPlacementMatches ? 'outline' : 'default'}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : hasSavedPlacementMatches ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Update Matches
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Save Matches
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="placement-strategy">Strategy</Label>
                <Select
                  value={placementConfig?.id || ''}
                  onValueChange={(value) => {
                    const config = PLACEMENT_SYSTEM_TEMPLATES.find(
                      (t) => t.id === value
                    );
                    if (config) {
                      setPlacementConfig(config);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select placement strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACEMENT_SYSTEM_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {placementConfig && (
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-medium">{placementConfig.name}</h4>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {placementConfig.description}
                  </p>
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Brackets:</h5>
                    {placementConfig.brackets.map((bracket) => (
                      <div
                        key={bracket.id}
                        className="text-sm text-muted-foreground"
                      >
                        • {bracket.name}: Positions{' '}
                        {bracket.positions.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bracket Visualization */}
          {placementConfig && (
            <Card>
              <CardHeader>
                <CardTitle>Placement Bracket</CardTitle>
                <CardDescription>
                  Visual representation of placement matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const groupStandings = calculateGroupStandings();
                  if (groupStandings.length === 0) {
                    return (
                      <div className="py-8 text-center text-muted-foreground">
                        No groups found or no finished matches yet. Complete
                        group stage matches to see placement bracket.
                      </div>
                    );
                  }

                  const placementMatches = generatePlacementMatches(
                    groupStandings.map((gs) => ({
                      groupId: gs.groupId,
                      groupName: gs.groupName,
                      teams: gs.teams.map((t) => ({
                        id: t.id,
                        name: t.name,
                        position: (t as typeof t & { position: number })
                          .position,
                        points: t.points,
                        goalDifference: t.goalDifference,
                      })),
                    })),
                    placementConfig
                  );

                  if (placementMatches.length === 0) {
                    return (
                      <div className="py-8 text-center text-muted-foreground">
                        No placement matches generated. Check your placement
                        configuration.
                      </div>
                    );
                  }

                  const allGroupsFinished = groupStandings.every(
                    (gs) => gs.isFinished
                  );

                  return (
                    <div className="space-y-8">
                      {!allGroupsFinished && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <div className="flex items-center space-x-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            <p className="text-sm text-blue-800">
                              Group matches are not finished yet. The bracket
                              shows placeholders (e.g., &quot;1st Group A&quot;)
                              until all group matches are completed.
                            </p>
                          </div>
                        </div>
                      )}
                      {placementMatches.map((bracketData) => (
                        <div key={bracketData.bracketId} className="space-y-6">
                          <h3 className="text-lg font-semibold">
                            {bracketData.bracketName}
                          </h3>
                          <div className="space-y-4">
                            {(() => {
                              // Group matches by round
                              const matchesByRound = bracketData.matches.reduce(
                                (acc, match) => {
                                  const round = match.round;
                                  if (!acc[round]) {
                                    acc[round] = [];
                                  }
                                  acc[round].push(match);
                                  return acc;
                                },
                                {} as Record<number, PlacementMatch[]>
                              );

                              const rounds = Object.keys(matchesByRound)
                                .map(Number)
                                .sort((a, b) => a - b);

                              const getTeamDisplay = (
                                team: PlacementMatch['homeTeam'],
                                showActualTeam: boolean
                              ) => {
                                if (team.source.type === 'group-position') {
                                  const source = team.source;
                                  const groupStanding = groupStandings.find(
                                    (gs) => gs.groupId === source.groupId
                                  );

                                  // Only show actual team name if group matches are finished
                                  if (
                                    showActualTeam &&
                                    groupStanding?.isFinished
                                  ) {
                                    const teamData = groupStanding?.teams.find(
                                      (t) =>
                                        (t as { position?: number })
                                          .position === source.position
                                    );
                                    if (teamData) {
                                      return (
                                        teamData.shortName || teamData.name
                                      );
                                    }
                                  }

                                  // Show placeholder
                                  const position = source.position;
                                  const suffix =
                                    position === 1
                                      ? 'st'
                                      : position === 2
                                        ? 'nd'
                                        : position === 3
                                          ? 'rd'
                                          : 'th';
                                  return `${position}${suffix} ${source.groupName}`;
                                }

                                // For match winners/losers, show placeholder until match is finished
                                if (
                                  team.source.type === 'match-winner' ||
                                  team.source.type === 'match-loser'
                                ) {
                                  return team.name; // This will be "Winner of Game X" or "Loser of Game X"
                                }

                                return team.name;
                              };

                              const getTeamPositionLabel = (
                                team:
                                  | PlacementMatch['homeTeam']
                                  | PlacementMatch['awayTeam']
                              ) => {
                                if (team.source.type === 'group-position') {
                                  const source = team.source;
                                  const groupStanding = groupStandings.find(
                                    (gs) => gs.groupId === source.groupId
                                  );

                                  if (groupStanding?.isFinished) {
                                    const teamData = groupStanding?.teams.find(
                                      (t) =>
                                        (t as { position?: number })
                                          .position === source.position
                                    );
                                    if (teamData) {
                                      const pos = (
                                        teamData as typeof teamData & {
                                          position: number;
                                        }
                                      ).position;
                                      const suffix =
                                        pos === 1
                                          ? 'st'
                                          : pos === 2
                                            ? 'nd'
                                            : pos === 3
                                              ? 'rd'
                                              : 'th';
                                      return `${source.groupName} (${pos}${suffix})`;
                                    }
                                  }

                                  const position = source.position;
                                  const suffix =
                                    position === 1
                                      ? 'st'
                                      : position === 2
                                        ? 'nd'
                                        : position === 3
                                          ? 'rd'
                                          : 'th';
                                  return `${position}${suffix} ${source.groupName}`;
                                }
                                return '';
                              };

                              // Check if we should show actual teams (all groups finished)
                              const showActualTeams = groupStandings.every(
                                (gs) => gs.isFinished
                              );

                              // Render bracket tree structure (horizontal layout - compact)
                              return (
                                <div className="space-y-6">
                                  <div className="relative overflow-x-auto py-4">
                                    <div className="flex min-w-max gap-6">
                                      {rounds.map((round, roundIndex) => {
                                        const roundMatches =
                                          matchesByRound[round] || [];
                                        const isLastRound =
                                          roundIndex === rounds.length - 1;

                                        // Find where winners/losers advance to
                                        const getAdvancementTarget = (
                                          matchId: string,
                                          isWinner: boolean
                                        ): PlacementMatch | null => {
                                          const nextRound = roundIndex + 1;
                                          if (nextRound >= rounds.length)
                                            return null;
                                          const nextRoundNumber =
                                            rounds[nextRound];
                                          if (nextRoundNumber === undefined)
                                            return null;
                                          const nextRoundMatches =
                                            matchesByRound[nextRoundNumber] ||
                                            [];
                                          // Find match that references this match's winner/loser
                                          const targetMatch =
                                            nextRoundMatches.find(
                                              (m: PlacementMatch) => {
                                                if (isWinner) {
                                                  return (
                                                    (m.homeTeam.source.type ===
                                                      'match-winner' &&
                                                      m.homeTeam.source
                                                        .matchId === matchId) ||
                                                    (m.awayTeam.source.type ===
                                                      'match-winner' &&
                                                      m.awayTeam.source
                                                        .matchId === matchId)
                                                  );
                                                } else {
                                                  return (
                                                    (m.homeTeam.source.type ===
                                                      'match-loser' &&
                                                      m.homeTeam.source
                                                        .matchId === matchId) ||
                                                    (m.awayTeam.source.type ===
                                                      'match-loser' &&
                                                      m.awayTeam.source
                                                        .matchId === matchId)
                                                  );
                                                }
                                              }
                                            );
                                          return targetMatch || null;
                                        };

                                        return (
                                          <div
                                            key={round}
                                            className="relative flex flex-col gap-3"
                                          >
                                            {/* Round label */}
                                            <div className="mb-2 text-center">
                                              <div className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                                {roundMatches[0]?.roundLabel ||
                                                  `Round ${round}`}
                                              </div>
                                            </div>

                                            {/* Matches in this round */}
                                            <div className="flex flex-col gap-3">
                                              {roundMatches.map(
                                                (match, matchIndex) => {
                                                  const homeDisplay =
                                                    getTeamDisplay(
                                                      match.homeTeam,
                                                      showActualTeams
                                                    );
                                                  const awayDisplay =
                                                    getTeamDisplay(
                                                      match.awayTeam,
                                                      showActualTeams
                                                    );

                                                  // Calculate positions for connection lines
                                                  const matchHeight = 70;
                                                  const gap = 12;
                                                  const matchTop =
                                                    matchIndex *
                                                    (matchHeight + gap);
                                                  const matchCenter =
                                                    matchTop + matchHeight / 2;

                                                  // Find where winner/loser advances
                                                  const winnerTarget =
                                                    !isLastRound
                                                      ? getAdvancementTarget(
                                                          match.id,
                                                          true
                                                        )
                                                      : null;
                                                  const loserTarget =
                                                    !isLastRound
                                                      ? getAdvancementTarget(
                                                          match.id,
                                                          false
                                                        )
                                                      : null;

                                                  return (
                                                    <div
                                                      key={match.id}
                                                      className="relative"
                                                    >
                                                      {/* Connection lines to next round */}
                                                      {!isLastRound && (
                                                        <>
                                                          {/* Horizontal line from match box */}
                                                          <div
                                                            className="absolute left-full top-1/2 z-0 h-[1.5px] w-6 bg-border"
                                                            style={{
                                                              transform:
                                                                'translateY(-50%)',
                                                            }}
                                                          />
                                                          {/* Vertical connector line connecting pairs */}
                                                          {roundMatches.length >
                                                            1 &&
                                                            matchIndex % 2 ===
                                                              0 &&
                                                            matchIndex + 1 <
                                                              roundMatches.length && (
                                                              <>
                                                                {/* Vertical line */}
                                                                <div
                                                                  className="absolute left-full z-0 w-[1.5px] bg-border"
                                                                  style={{
                                                                    left: 'calc(100% + 1.5rem)',
                                                                    top: `${matchCenter}px`,
                                                                    height: `${matchHeight + gap}px`,
                                                                    transform:
                                                                      'translateX(-50%)',
                                                                  }}
                                                                />
                                                                {/* Horizontal lines to next round matches */}
                                                                <div
                                                                  className="absolute left-full z-0 h-[1.5px] w-6 bg-border"
                                                                  style={{
                                                                    left: 'calc(100% + 1.5rem)',
                                                                    top: `${matchCenter}px`,
                                                                    transform:
                                                                      'translateX(-50%) translateY(-50%)',
                                                                  }}
                                                                />
                                                                <div
                                                                  className="absolute left-full z-0 h-[1.5px] w-6 bg-border"
                                                                  style={{
                                                                    left: 'calc(100% + 1.5rem)',
                                                                    top: `${matchCenter + matchHeight + gap}px`,
                                                                    transform:
                                                                      'translateX(-50%) translateY(-50%)',
                                                                  }}
                                                                />
                                                              </>
                                                            )}
                                                        </>
                                                      )}

                                                      {/* Match box */}
                                                      <div className="relative z-10 w-44 rounded-md border border-border bg-card p-2 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                                                        {/* Match label badge */}
                                                        <div className="mb-1.5 flex items-center justify-between">
                                                          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                                                            {match.matchLabel}
                                                          </span>
                                                          {/* Edge labels showing where winner/loser goes */}
                                                          {winnerTarget && (
                                                            <span className="text-[9px] text-muted-foreground">
                                                              W→
                                                              {
                                                                winnerTarget.matchLabel
                                                              }
                                                            </span>
                                                          )}
                                                          {loserTarget && (
                                                            <span className="text-[9px] text-muted-foreground">
                                                              L→
                                                              {
                                                                loserTarget.matchLabel
                                                              }
                                                            </span>
                                                          )}
                                                        </div>

                                                        <div className="space-y-1">
                                                          {/* Home team */}
                                                          <div className="rounded border border-border/50 bg-muted/30 px-2 py-1 text-xs">
                                                            <div className="truncate font-medium text-foreground">
                                                              {homeDisplay}
                                                            </div>
                                                            {getTeamPositionLabel(
                                                              match.homeTeam
                                                            ) && (
                                                              <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                                                {getTeamPositionLabel(
                                                                  match.homeTeam
                                                                )}
                                                              </div>
                                                            )}
                                                          </div>

                                                          {/* VS separator */}
                                                          <div className="text-center text-[10px] font-semibold text-muted-foreground">
                                                            vs
                                                          </div>

                                                          {/* Away team */}
                                                          <div className="rounded border border-border/50 bg-muted/30 px-2 py-1 text-xs">
                                                            <div className="truncate font-medium text-foreground">
                                                              {awayDisplay}
                                                            </div>
                                                            {getTeamPositionLabel(
                                                              match.awayTeam
                                                            ) && (
                                                              <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                                                {getTeamPositionLabel(
                                                                  match.awayTeam
                                                                )}
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                }
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Standings List - Show for all brackets */}
                                  {(() => {
                                    // Calculate standings from bracket structure
                                    // Get teams in this bracket
                                    const bracketConfig =
                                      placementConfig.brackets.find(
                                        (b) => b.id === bracketData.bracketId
                                      );
                                    if (!bracketConfig) return null;

                                    const bracketTeams = groupStandings.reduce(
                                      (acc, gs) => {
                                        const teams = gs.teams.filter((t) =>
                                          bracketConfig.positions.includes(
                                            (
                                              t as typeof t & {
                                                position: number;
                                              }
                                            ).position
                                          )
                                        );
                                        return acc + teams.length;
                                      },
                                      0
                                    );

                                    const positions: Array<{
                                      position: number;
                                      label: string;
                                    }> = [];

                                    // Find final match
                                    const finalMatch = bracketData.matches.find(
                                      (m) => m.roundLabel === 'Final'
                                    );
                                    const thirdPlaceMatch =
                                      bracketData.matches.find(
                                        (m) => m.roundLabel === 'Third Place'
                                      );

                                    // Add positions based on bracket structure
                                    if (finalMatch) {
                                      positions.push({
                                        position: 1,
                                        label: 'Winner of Final',
                                      });
                                      positions.push({
                                        position: 2,
                                        label: 'Runner-up of Final',
                                      });
                                    }
                                    if (thirdPlaceMatch) {
                                      positions.push({
                                        position: 3,
                                        label: 'Winner of Third Place',
                                      });
                                      positions.push({
                                        position: 4,
                                        label: 'Loser of Third Place',
                                      });
                                    }

                                    // Add remaining positions
                                    for (
                                      let i = positions.length + 1;
                                      i <= bracketTeams;
                                      i++
                                    ) {
                                      positions.push({
                                        position: i,
                                        label: `Position ${i}`,
                                      });
                                    }

                                    if (positions.length === 0) return null;

                                    return (
                                      <Card className="mt-6">
                                        <CardHeader>
                                          <CardTitle className="text-base">
                                            {bracketData.bracketName} Standings
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-1.5">
                                            {positions.map((pos) => (
                                              <div
                                                key={pos.position}
                                                className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/20 px-3 py-2"
                                              >
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                                  {pos.position}.
                                                </div>
                                                <div className="flex-1 text-sm font-medium">
                                                  {pos.label}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })()}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
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
        <div className="mb-6">
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
                <div className="text-2xl font-bold">{teamStats.length}</div>
                <div className="text-sm text-muted-foreground">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{maxMatches}</div>
                <div className="text-sm text-muted-foreground">Max Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{minMatches}</div>
                <div className="text-sm text-muted-foreground">Min Matches</div>
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
                              {stat.homeMatches} home, {stat.awayMatches} away
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
                    Match distribution varies: {minMatches}-{maxMatches} matches
                    per team
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {teams.length < 2 ? (
        <div className="py-12 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Need at least 2 teams</h3>
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
              <h3 className="mb-2 text-lg font-semibold">No matches found</h3>
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
                        {filteredMatches.some((m) => m.matchNumber) && (
                          <TableHead className="bg-[#489a66] text-white">
                            Match #
                          </TableHead>
                        )}
                        <TableHead className="bg-[#489a66] text-white">
                          Teams
                        </TableHead>
                        <TableHead className="bg-[#489a66] text-white">
                          Status
                        </TableHead>
                        <TableHead className="bg-[#489a66] text-white">
                          Score
                        </TableHead>
                        <TableHead className="bg-[#489a66] text-white">
                          Referee
                        </TableHead>
                        <TableHead className="bg-[#489a66] text-white">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMatches.map((match) => (
                        <TableRow key={match.id}>
                          {filteredMatches.some((m) => m.matchNumber) && (
                            <TableCell>
                              {match.matchNumber ? (
                                <div className="font-semibold text-muted-foreground">
                                  {match.matchNumber}
                                </div>
                              ) : (
                                <div className="text-muted-foreground">-</div>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="font-medium">
                              {match.homeTeam && match.awayTeam ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {(match.homeTeam.logo ||
                                      match.homeTeam.clubRef?.logo) && (
                                      <img
                                        src={
                                          match.homeTeam.logo ||
                                          match.homeTeam.clubRef?.logo
                                        }
                                        alt={`${match.homeTeam.name} logo`}
                                        className="h-6 w-6 rounded object-cover"
                                      />
                                    )}
                                    <span>
                                      {match.homeTeam.shortName ||
                                        match.homeTeam.name}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    vs
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {(match.awayTeam.logo ||
                                      match.awayTeam.clubRef?.logo) && (
                                      <img
                                        src={
                                          match.awayTeam.logo ||
                                          match.awayTeam.clubRef?.logo
                                        }
                                        alt={`${match.awayTeam.name} logo`}
                                        className="h-6 w-6 rounded object-cover"
                                      />
                                    )}
                                    <span>
                                      {match.awayTeam.shortName ||
                                        match.awayTeam.name}
                                    </span>
                                  </div>
                                </div>
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
                          <TableCell>{getStatusBadge(match.status)}</TableCell>
                          <TableCell>
                            {match.status === 'COMPLETED' ? (
                              <div className="font-mono">
                                {match.homeScore} - {match.awayScore}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {match.referee || (
                              <span className="text-muted-foreground">-</span>
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
                                    homeTeamId: match.homeTeam?.id || '',
                                    awayTeamId: match.awayTeam?.id || '',
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
                              {groupMatches.some((m) => m.matchNumber) && (
                                <TableHead>Match #</TableHead>
                              )}
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
                                {groupMatches.some((m) => m.matchNumber) && (
                                  <TableCell>
                                    {match.matchNumber ? (
                                      <div className="font-semibold text-muted-foreground">
                                        {match.matchNumber}
                                      </div>
                                    ) : (
                                      <div className="text-muted-foreground">-</div>
                                    )}
                                  </TableCell>
                                )}
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
                                        {match.homeTeam
                                          ? `${match.homeTeam.shortName || match.homeTeam.name} vs TBD`
                                          : match.awayTeam
                                            ? `TBD vs ${match.awayTeam.shortName || match.awayTeam.name}`
                                            : 'TBD vs TBD'}
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
                                <TableCell>{match.referee || '-'}</TableCell>
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
