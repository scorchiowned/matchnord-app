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
  MapPin,
  Trophy,
  Clock,
  Settings,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { DivisionMatchSettings } from './division-match-settings';
import { MatchScheduler } from './match-scheduler';

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

interface Venue {
  id: string;
  name: string;
  streetName?: string;
  postalCode?: string;
  city?: string;
  pitches: {
    id: string;
    name: string;
    number?: string;
    surface?: string;
    size?: string;
    isAvailable: boolean;
  }[];
}

interface MatchesManagementProps {
  tournamentId: string;
  divisionId?: string;
  groupId?: string;
}

export function MatchesManagement({
  tournamentId,
  divisionId,
  groupId,
}: MatchesManagementProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [formData, setFormData] = useState({
    homeTeamId: '',
    awayTeamId: '',
    startTime: '',
    endTime: '',
    venueId: '',
    pitchId: '',
    referee: '',
    notes: '',
    status: 'SCHEDULED',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

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
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tournamentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.homeTeamId || !formData.awayTeamId || !formData.startTime) {
      toast.error('Home team, away team, and start time are required');
      return;
    }

    if (formData.homeTeamId === formData.awayTeamId) {
      toast.error('Home team and away team must be different');
      return;
    }

    try {
      setIsSubmitting(true);

      const url = editingMatch
        ? `/api/v1/matches/${editingMatch.id}`
        : `/api/v1/tournaments/${tournamentId}/matches`;

      const method = editingMatch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newMatch = await response.json();

        if (editingMatch) {
          setMatches(
            matches.map((match) =>
              match.id === editingMatch.id ? newMatch : match
            )
          );
          toast.success('Match updated successfully');
        } else {
          setMatches([...matches, newMatch]);
          toast.success('Match added successfully');
        }

        resetForm();
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save match');
      }
    } catch (error) {
      console.error('Error saving match:', error);
      toast.error('Failed to save match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setFormData({
      homeTeamId: match.homeTeam.id,
      awayTeamId: match.awayTeam.id,
      startTime: new Date(match.startTime).toISOString().slice(0, 16),
      endTime: match.endTime
        ? new Date(match.endTime).toISOString().slice(0, 16)
        : '',
      venueId: match.venue?.id || '',
      pitchId: match.pitch?.id || '',
      referee: match.referee || '',
      notes: match.notes || '',
      status: match.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;

    try {
      const response = await fetch(`/api/v1/matches/${matchId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setMatches(matches.filter((match) => match.id !== matchId));
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

  const resetForm = () => {
    setFormData({
      homeTeamId: '',
      awayTeamId: '',
      startTime: '',
      endTime: '',
      venueId: '',
      pitchId: '',
      referee: '',
      notes: '',
      status: 'SCHEDULED',
    });
    setEditingMatch(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleGenerateMatches = async () => {
    if (!divisionId || !groupId) {
      toast.error('Division and group are required to generate matches');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/v1/divisions/${divisionId}/matches/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        toast.success(result.message);
        const matchesResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/matches`
        );
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData);
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

  const handleBulkOperation = async (action: string) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/v1/tournaments/${tournamentId}/matches/bulk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action, divisionId, groupId }),
        }
      );

      if (response.ok) {
        await response.json();
        toast.success(`${action.replace('_', ' ')} completed successfully`);
        const matchesResponse = await fetch(
          `/api/v1/tournaments/${tournamentId}/matches`
        );
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action.replace('_', ' ')}`);
      }
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      toast.error(`Failed to ${action.replace('_', ' ')}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'LIVE':
        return <Badge variant="default">Live</Badge>;
      case 'FINISHED':
        return <Badge variant="secondary">Finished</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'POSTPONED':
        return <Badge variant="outline">Postponed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDateTime = (dateTime: string) =>
    new Date(dateTime).toLocaleString();

  const getAvailablePitches = () => {
    const selectedVenue = venues.find((v) => v.id === formData.venueId);
    return selectedVenue?.pitches?.filter((pitch) => pitch.isAvailable) || [];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading matches...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {divisionId && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Division Settings</h3>
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>{showSettings ? 'Hide' : 'Show'} Settings</span>
          </Button>
        </div>
      )}

      {showSettings && divisionId && (
        <DivisionMatchSettings divisionId={divisionId} />
      )}

      {showScheduler && divisionId && groupId && (
        <MatchScheduler
          tournamentId={tournamentId}
          divisionId={divisionId}
          groupId={groupId}
          matches={matches}
          venues={venues}
          onScheduleChange={setMatches}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Matches ({matches.length})</span>
            </div>
            <div className="flex space-x-2">
              {divisionId && groupId && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleGenerateMatches}
                    disabled={isSubmitting || teams.length < 2}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Matches
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowScheduler(!showScheduler)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {showScheduler ? 'Hide' : 'Show'} Scheduler
                  </Button>
                </>
              )}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} disabled={teams.length < 2}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Match
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingMatch ? 'Edit Match' : 'Add New Match'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingMatch
                        ? 'Update the match information below.'
                        : 'Add a new match to this tournament.'}
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
                                {team.name}
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
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time *</Label>
                        <Input
                          id="startTime"
                          type="datetime-local"
                          value={formData.startTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startTime: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="datetime-local"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="venueId">Venue</Label>
                        <Select
                          value={formData.venueId}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              venueId: value,
                              pitchId: '',
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select venue" />
                          </SelectTrigger>
                          <SelectContent>
                            {venues.map((venue) => (
                              <SelectItem key={venue.id} value={venue.id}>
                                {venue.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pitchId">Pitch</Label>
                        <Select
                          value={formData.pitchId}
                          onValueChange={(value) =>
                            setFormData({ ...formData, pitchId: value })
                          }
                          disabled={!formData.venueId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select pitch" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailablePitches().map((pitch) => (
                              <SelectItem key={pitch.id} value={pitch.id}>
                                {pitch.name}
                                {pitch.number && ` (${pitch.number})`}
                                {pitch.surface && ` - ${pitch.surface}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="referee">Referee</Label>
                        <Input
                          id="referee"
                          value={formData.referee}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              referee: e.target.value,
                            })
                          }
                          placeholder="Enter referee name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            setFormData({ ...formData, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                            <SelectItem value="LIVE">Live</SelectItem>
                            <SelectItem value="FINISHED">Finished</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            <SelectItem value="POSTPONED">Postponed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Enter match notes"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDialogClose}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? 'Saving...'
                          : editingMatch
                            ? 'Update Match'
                            : 'Add Match'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
          <CardDescription>
            Manage tournament matches and scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          {divisionId && (
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkOperation('generate_all')}
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
          ) : matches.length === 0 ? (
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {match.homeTeam.name} vs {match.awayTeam.name}
                          </div>
                          {match.group && (
                            <div className="text-sm text-muted-foreground">
                              {match.group.division.name} - {match.group.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDateTime(match.startTime)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {match.venue ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {match.venue.name}
                              {match.pitch && ` - ${match.pitch.name}`}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(match.status)}</TableCell>
                      <TableCell>
                        {match.status === 'FINISHED' ? (
                          <div className="font-medium">
                            {match.homeScore} - {match.awayScore}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(match)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
