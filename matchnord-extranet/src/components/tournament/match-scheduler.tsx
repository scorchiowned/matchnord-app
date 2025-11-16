'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, MapPin, Trophy, Calendar, Save, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

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

interface Venue {
  id: string;
  name: string;
  pitches: {
    id: string;
    name: string;
    number?: string;
    surface?: string;
    size?: string;
    isAvailable: boolean;
  }[];
}

interface MatchSchedulerProps {
  tournamentId: string;
  divisionId: string;
  groupId: string;
  matches: Match[];
  venues: Venue[];
  division?: {
    id: string;
    matchDuration?: number;
    breakDuration?: number;
  };
  onScheduleChange?: (matches: Match[]) => void;
}

interface FilterState {
  selectedDivision: string;
  selectedGroup: string;
  selectedVenue: string;
  selectedTeam: string;
}

export function MatchScheduler({
  tournamentId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  divisionId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  groupId,
  matches,
  venues,
  division,
  onScheduleChange,
}: MatchSchedulerProps) {
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>(matches);
  const [draggedMatch, setDraggedMatch] = useState<Match | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [filters, setFilters] = useState<FilterState>({
    selectedDivision: 'all',
    selectedGroup: 'all',
    selectedVenue: 'all',
    selectedTeam: 'all',
  });
  const [isDraggingOverUnscheduled, setIsDraggingOverUnscheduled] =
    useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{
    match: Match;
    pitchId: string;
    hour: number;
  } | null>(null);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isMatchDetailsOpen, setIsMatchDetailsOpen] = useState(false);

  // Update scheduledMatches when matches prop changes
  useEffect(() => {
    setScheduledMatches(matches);
  }, [matches]);

  // Generate hourly time slots for the selected date (7:00 to 24:00)
  // Each hour row can contain matches that start or overlap with this hour
  const timeSlots = useMemo(() => {
    const slots = [];
    const startHour = 7;
    const endHour = 24; // 24:00 (midnight)

    for (let hour = startHour; hour <= endHour; hour++) {
      const slotTime = `${hour.toString().padStart(2, '0')}:00`;
      const slotStart = new Date(`${selectedDate}T${slotTime}:00`);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // +1 hour

      // Find all matches that overlap with this hour slot
      const matchesInSlot = scheduledMatches.filter((match) => {
        if (!match.startTime) return false;
        const matchStart = new Date(match.startTime);

        // Check if match is on the selected date
        const matchDateStr = matchStart.toISOString().split('T')[0];
        if (matchDateStr !== selectedDate) return false;

        // Calculate match end time
        // Always use division's matchDuration if available for consistency
        const matchDuration = division?.matchDuration || 90;
        const matchEnd = new Date(
          matchStart.getTime() + matchDuration * 60 * 1000
        );

        // Check if match overlaps with this hour slot
        // Match overlaps if: matchStart < slotEnd AND matchEnd > slotStart
        return matchStart < slotEnd && matchEnd > slotStart;
      });

      slots.push({
        time: slotTime,
        date: selectedDate,
        matches: matchesInSlot,
      });
    }

    return slots;
  }, [scheduledMatches, selectedDate, division]);

  const handleDragStart = (e: React.DragEvent, match: Match) => {
    setDraggedMatch(match);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMatchDoubleClick = (match: Match) => {
    setSelectedMatch(match);
    setIsMatchDetailsOpen(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, pitchId: string, hour: number) => {
    e.preventDefault();

    if (!draggedMatch) return;

    const venue = venues.find((v) => v.pitches.some((p) => p.id === pitchId));
    const pitch = venue?.pitches.find((p) => p.id === pitchId);

    if (!venue || !pitch) return;

    // Store the drop info and open time picker modal
    setPendingDrop({ match: draggedMatch, pitchId, hour });
    setSelectedTime(`${hour.toString().padStart(2, '0')}:00`);
    setIsTimePickerOpen(true);
    setDraggedMatch(null);
  };

  const handleConfirmTime = () => {
    if (!pendingDrop) return;

    const { match, pitchId } = pendingDrop;
    const venue = venues.find((v) => v.pitches.some((p) => p.id === pitchId));
    const pitch = venue?.pitches.find((p) => p.id === pitchId);

    if (!venue || !pitch) {
      setIsTimePickerOpen(false);
      setPendingDrop(null);
      return;
    }

    // Parse the selected time
    const [selectedHourStr, selectedMinuteStr] = selectedTime.split(':');
    const selectedHour = parseInt(selectedHourStr || '9', 10);
    const selectedMinute = parseInt(selectedMinuteStr || '0', 10);

    // Use the selected hour (can be different from drop hour)
    const exactTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    const exactStartTime = `${selectedDate}T${exactTime}:00`;

    // Calculate endTime based on division's matchDuration (default 90 minutes)
    const matchDuration = division?.matchDuration || 90;
    const startDate = new Date(exactStartTime);
    const endDate = new Date(startDate.getTime() + matchDuration * 60 * 1000);
    const exactEndTime = endDate.toISOString();

    // Check for conflicts at the exact time
    const hasConflict = scheduledMatches.some(
      (m) =>
        m.id !== match.id &&
        m.pitch?.id === pitchId &&
        m.startTime === exactStartTime
    );

    if (hasConflict) {
      toast.error('Time slot is already occupied');
      return;
    }

    // Check for team double-booking at the exact time
    const teamDoubleBooking = scheduledMatches.some(
      (m) =>
        m.id !== match.id &&
        m.startTime === exactStartTime &&
        (m.homeTeam.id === match.homeTeam.id ||
          m.homeTeam.id === match.awayTeam.id ||
          m.awayTeam.id === match.homeTeam.id ||
          m.awayTeam.id === match.awayTeam.id)
    );

    if (teamDoubleBooking) {
      toast.error('One or both teams are already playing at this time');
      return;
    }

    // Update the match
    const updatedMatch = {
      ...match,
      venue: { id: venue.id, name: venue.name },
      pitch: { id: pitch.id, name: pitch.name },
      startTime: exactStartTime,
      endTime: exactEndTime, // Calculated based on division's matchDuration
    };

    const updatedMatches = scheduledMatches.map((m) =>
      m.id === match.id ? updatedMatch : m
    );

    setScheduledMatches(updatedMatches);
    onScheduleChange?.(updatedMatches);
    setIsTimePickerOpen(false);
    setPendingDrop(null);
    toast.success(`Match scheduled for ${exactTime}`);
  };

  const handleUnscheduledDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOverUnscheduled(true);
  };

  const handleUnscheduledDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverUnscheduled(false);
  };

  const handleUnscheduledDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverUnscheduled(false);

    if (!draggedMatch) return;

    // Remove venue, pitch, and startTime to make it unscheduled
    const updatedMatch = {
      ...draggedMatch,
      venue: undefined,
      pitch: undefined,
      startTime: '',
      endTime: undefined,
    };

    const updatedMatches = scheduledMatches.map((match) =>
      match.id === draggedMatch.id ? updatedMatch : match
    );

    setScheduledMatches(updatedMatches);
    onScheduleChange?.(updatedMatches);
    setDraggedMatch(null);
  };

  const handleSaveSchedule = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(
        `/api/v1/tournaments/${tournamentId}/matches/schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            matches: scheduledMatches.map((match) => ({
              id: match.id,
              venueId: match.venue?.id,
              pitchId: match.pitch?.id,
              startTime: match.startTime,
              endTime: match.endTime,
            })),
          }),
        }
      );

      if (response.ok) {
        toast.success('Schedule saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSchedule = () => {
    if (!isConfirmingClear) {
      // First click - show confirmation
      setIsConfirmingClear(true);
      // Reset confirmation after 3 seconds
      setTimeout(() => {
        setIsConfirmingClear(false);
      }, 3000);
      return;
    }

    // Second click - clear the schedule
    const clearedMatches = scheduledMatches.map((match) => ({
      ...match,
      venue: undefined,
      pitch: undefined,
      startTime: '',
      endTime: undefined,
    }));

    setScheduledMatches(clearedMatches);
    onScheduleChange?.(clearedMatches);
    setIsConfirmingClear(false);
    toast.success('Schedule cleared successfully');
  };

  // Filter matches based on current filters
  const getFilteredMatches = () => {
    return scheduledMatches.filter((match) => {
      // Division filter
      if (
        filters.selectedDivision !== 'all' &&
        match.group?.division.id !== filters.selectedDivision
      ) {
        return false;
      }

      // Group filter
      if (
        filters.selectedGroup !== 'all' &&
        match.group?.id !== filters.selectedGroup
      ) {
        return false;
      }

      // Venue filter
      if (
        filters.selectedVenue !== 'all' &&
        match.venue?.id !== filters.selectedVenue
      ) {
        return false;
      }

      // Team filter
      if (
        filters.selectedTeam !== 'all' &&
        match.homeTeam.id !== filters.selectedTeam &&
        match.awayTeam.id !== filters.selectedTeam
      ) {
        return false;
      }

      return true;
    });
  };

  const getUnscheduledMatches = () => {
    return getFilteredMatches().filter(
      (match) => !match.venue || !match.pitch || !match.startTime
    );
  };

  const getScheduledMatches = () => {
    return getFilteredMatches().filter(
      (match) => match.venue && match.pitch && match.startTime
    );
  };

  // Get unique values for filter dropdowns
  const getUniqueDivisions = () => {
    const divisions = scheduledMatches
      .map((match) => match.group?.division)
      .filter(Boolean)
      .reduce(
        (acc, division) => {
          if (division && !acc.find((d) => d.id === division.id)) {
            acc.push(division);
          }
          return acc;
        },
        [] as Array<{ id: string; name: string }>
      );
    return divisions;
  };

  const getUniqueGroups = () => {
    const groups = scheduledMatches
      .map((match) => match.group)
      .filter(Boolean)
      .reduce(
        (acc, group) => {
          if (group && !acc.find((g) => g.id === group.id)) {
            acc.push(group);
          }
          return acc;
        },
        [] as Array<{ id: string; name: string }>
      );
    return groups;
  };

  const getUniqueTeams = () => {
    const teams = scheduledMatches
      .flatMap((match) => [match.homeTeam, match.awayTeam])
      .reduce(
        (acc, team) => {
          if (!acc.find((t) => t.id === team.id)) {
            acc.push(team);
          }
          return acc;
        },
        [] as Array<{ id: string; name: string; shortName?: string }>
      );
    return teams;
  };

  const clearFilters = () => {
    setFilters({
      selectedDivision: 'all',
      selectedGroup: 'all',
      selectedVenue: 'all',
      selectedTeam: 'all',
    });
  };

  // Generate consistent colors for teams
  const getTeamColor = (teamId: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-red-100 text-red-800 border-red-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200',
      'bg-lime-100 text-lime-800 border-lime-200',
      'bg-amber-100 text-amber-800 border-amber-200',
    ];

    // Simple hash function to get consistent color for team
    let hash = 0;
    for (let i = 0; i < teamId.length; i++) {
      const char = teamId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return colors[Math.abs(hash) % colors.length];
  };

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
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Match Scheduler</span>
              </CardTitle>
              <CardDescription>
                Drag and drop matches to schedule them on specific pitches and
                times.
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={isConfirmingClear ? 'destructive' : 'outline'}
                onClick={handleClearSchedule}
                className={`flex items-center space-x-2 transition-colors ${
                  isConfirmingClear ? 'animate-pulse' : ''
                }`}
              >
                <X className="h-4 w-4" />
                <span>
                  {isConfirmingClear ? 'Are you sure?' : 'Clear Schedule'}
                </span>
              </Button>
              <Button
                onClick={handleSaveSchedule}
                disabled={isSaving}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Schedule'}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center space-x-1"
            >
              <X className="h-3 w-3" />
              <span>Clear All</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="division-filter">Division</Label>
              <Select
                value={filters.selectedDivision}
                onValueChange={(value) =>
                  setFilters({ ...filters, selectedDivision: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {getUniqueDivisions().map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-filter">Group</Label>
              <Select
                value={filters.selectedGroup}
                onValueChange={(value) =>
                  setFilters({ ...filters, selectedGroup: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {getUniqueGroups().map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue-filter">Venue</Label>
              <Select
                value={filters.selectedVenue}
                onValueChange={(value) =>
                  setFilters({ ...filters, selectedVenue: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Venues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Venues</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-filter">Team</Label>
              <Select
                value={filters.selectedTeam}
                onValueChange={(value) =>
                  setFilters({ ...filters, selectedTeam: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {getUniqueTeams().map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.shortName || team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Scheduler Layout */}
      <div className="flex gap-4">
        {/* Games Sidebar */}
        <div className="w-80 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Games</CardTitle>
              <CardDescription>Drag matches to schedule them</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Selector */}
              <div className="space-y-2">
                <Label htmlFor="date-selector">Date</Label>
                <input
                  id="date-selector"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded border px-2 py-1"
                />
              </div>

              {/* Unscheduled Matches */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Unscheduled ({getUnscheduledMatches().length})
                  </h4>
                </div>
                <div
                  className={`max-h-96 min-h-[100px] space-y-2 overflow-y-auto rounded border-2 border-dashed p-2 transition-colors ${
                    isDraggingOverUnscheduled
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25'
                  }`}
                  onDragOver={handleUnscheduledDragOver}
                  onDragLeave={handleUnscheduledDragLeave}
                  onDrop={handleUnscheduledDrop}
                >
                  {getUnscheduledMatches().map((match) => (
                    <div
                      key={match.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, match)}
                      onDoubleClick={() => handleMatchDoubleClick(match)}
                      className="cursor-move rounded border bg-card p-2 text-xs shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center gap-1 font-medium">
                        <div className="flex items-center gap-1">
                          {(match.homeTeam.logo ||
                            match.homeTeam.clubRef?.logo) && (
                            <img
                              src={
                                match.homeTeam.logo ||
                                match.homeTeam.clubRef?.logo
                              }
                              alt={`${match.homeTeam.name} logo`}
                              className="h-4 w-4 rounded object-cover"
                            />
                          )}
                          <span
                            className={`inline-block rounded px-1 py-0.5 text-xs ${getTeamColor(match.homeTeam.id)}`}
                          >
                            {match.homeTeam.shortName || match.homeTeam.name}
                          </span>
                        </div>
                        <span className="text-muted-foreground">vs</span>
                        <div className="flex items-center gap-1">
                          {(match.awayTeam.logo ||
                            match.awayTeam.clubRef?.logo) && (
                            <img
                              src={
                                match.awayTeam.logo ||
                                match.awayTeam.clubRef?.logo
                              }
                              alt={`${match.awayTeam.name} logo`}
                              className="h-4 w-4 rounded object-cover"
                            />
                          )}
                          <span
                            className={`inline-block rounded px-1 py-0.5 text-xs ${getTeamColor(match.awayTeam.id)}`}
                          >
                            {match.awayTeam.shortName || match.awayTeam.name}
                          </span>
                        </div>
                      </div>
                      {match.group && match.group.division && (
                        <div className="text-muted-foreground">
                          {match.group.division.name} - {match.group.name}
                        </div>
                      )}
                    </div>
                  ))}
                  {getUnscheduledMatches().length === 0 && (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      {isDraggingOverUnscheduled
                        ? 'Drop here to unschedule'
                        : 'Drop matches here to unschedule them'}
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduled Matches */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Scheduled ({getScheduledMatches().length})
                  </h4>
                </div>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {getScheduledMatches().map((match) => (
                    <div
                      key={match.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, match)}
                      onDoubleClick={() => handleMatchDoubleClick(match)}
                      className="cursor-move rounded border bg-green-50 p-2 text-xs shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center gap-1 font-medium">
                        <div className="flex items-center gap-1">
                          {(match.homeTeam.logo ||
                            match.homeTeam.clubRef?.logo) && (
                            <img
                              src={
                                match.homeTeam.logo ||
                                match.homeTeam.clubRef?.logo
                              }
                              alt={`${match.homeTeam.name} logo`}
                              className="h-4 w-4 rounded object-cover"
                            />
                          )}
                          <span
                            className={`inline-block rounded px-1 py-0.5 text-xs ${getTeamColor(match.homeTeam.id)}`}
                          >
                            {match.homeTeam.shortName || match.homeTeam.name}
                          </span>
                        </div>
                        <span className="text-muted-foreground">vs</span>
                        <div className="flex items-center gap-1">
                          {(match.awayTeam.logo ||
                            match.awayTeam.clubRef?.logo) && (
                            <img
                              src={
                                match.awayTeam.logo ||
                                match.awayTeam.clubRef?.logo
                              }
                              alt={`${match.awayTeam.name} logo`}
                              className="h-4 w-4 rounded object-cover"
                            />
                          )}
                          <span
                            className={`inline-block rounded px-1 py-0.5 text-xs ${getTeamColor(match.awayTeam.id)}`}
                          >
                            {match.awayTeam.shortName || match.awayTeam.name}
                          </span>
                        </div>
                      </div>
                      {match.venue && match.pitch && (
                        <div className="text-muted-foreground">
                          {match.venue.name} - {match.pitch.name}
                        </div>
                      )}
                      {match.startTime && (
                        <div className="text-muted-foreground">
                          {new Date(match.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Grid */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Grid</CardTitle>
              <CardDescription>
                Each column represents a different pitch. Drag matches from the
                sidebar to schedule them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {venues.length === 0 ||
              venues.every((v) => !v.pitches || v.pitches.length === 0) ? (
                <div className="py-12 text-center">
                  <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No Venues or Pitches Available
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    Please add venues and pitches to the tournament before
                    scheduling matches.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full border-collapse">
                    {/* Header */}
                    <div className="flex border-b-2 border-gray-300 bg-gray-50">
                      <div className="w-20 flex-shrink-0 border-r p-2 text-xs font-medium">
                        Time
                      </div>
                      {venues.map(
                        (venue) =>
                          venue.pitches?.map((pitch) => (
                            <div
                              key={pitch.id}
                              className="min-w-[200px] flex-1 border-r p-2 text-xs last:border-r-0"
                            >
                              <div className="font-medium">{pitch.name}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {venue.name}
                              </div>
                            </div>
                          )) || []
                      )}
                    </div>
                    {/* Rows */}
                    <div className="divide-y divide-gray-200">
                      {timeSlots.map((slot) => (
                        <div key={slot.time} className="flex border-b">
                          <div className="w-20 flex-shrink-0 border-r p-2 font-mono text-xs">
                            {slot.time}
                          </div>
                          {venues.map((venue) =>
                            venue.pitches.map((pitch) => {
                              const [hoursStr] = slot.time.split(':');
                              const hours = parseInt(hoursStr || '7', 10);

                              // Find all matches for this pitch in this hour
                              const matchesAtPitch = slot.matches.filter(
                                (match) => match.pitch?.id === pitch.id
                              );

                              return (
                                <div
                                  key={pitch.id}
                                  className="relative min-w-[200px] flex-1 border-r p-0 last:border-r-0"
                                  style={{ height: '140px' }}
                                >
                                  {/* Single drop zone for the entire hour */}
                                  <div
                                    className="absolute inset-0 cursor-pointer rounded border border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50 hover:bg-primary/5"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) =>
                                      handleDrop(e, pitch.id, hours)
                                    }
                                    title={`Drop match here to schedule at ${slot.time}`}
                                  />

                                  {/* Position matches at their exact times - full width */}
                                  {matchesAtPitch.map((match) => {
                                    if (!match.startTime) return null;

                                    const matchStart = new Date(
                                      match.startTime
                                    );
                                    const matchHour = matchStart.getHours();
                                    const matchMinutes =
                                      matchStart.getMinutes();
                                    const matchSeconds =
                                      matchStart.getSeconds();

                                    // Calculate match duration in minutes
                                    // Always use division's matchDuration if available, as it's the current setting
                                    // Only use match.endTime if division duration is not available
                                    let matchDuration: number;
                                    if (
                                      division?.matchDuration !== undefined &&
                                      division.matchDuration !== null
                                    ) {
                                      matchDuration = division.matchDuration;
                                    } else if (match.endTime) {
                                      matchDuration =
                                        (new Date(match.endTime).getTime() -
                                          matchStart.getTime()) /
                                        (1000 * 60);
                                    } else {
                                      matchDuration = 90; // Default fallback
                                    }

                                    // Only render if match starts in this hour slot
                                    if (matchHour !== hours) return null;

                                    // Calculate vertical position as percentage of hour (0-100%)
                                    // Position based on minutes and seconds within the hour
                                    const positionPercent =
                                      ((matchMinutes * 60 + matchSeconds) /
                                        3600) *
                                      100;

                                    // Calculate height as percentage of hour
                                    // Height is proportionate to duration: 30min = 50%, 45min = 75%, 60min = 100%, 90min = 150%
                                    const heightPercent =
                                      (matchDuration / 60) * 100;

                                    // Calculate the actual height - don't limit to remaining space if match fits
                                    // Only limit if match would extend beyond the hour boundary
                                    const endPosition =
                                      positionPercent + heightPercent;
                                    const actualHeight =
                                      endPosition > 100
                                        ? 100 - positionPercent
                                        : heightPercent;
                                    const minHeightValue =
                                      actualHeight < 10 ? '10px' : undefined;

                                    return (
                                      <div
                                        key={match.id}
                                        draggable
                                        onDragStart={(e) =>
                                          handleDragStart(e, match)
                                        }
                                        onDoubleClick={() =>
                                          handleMatchDoubleClick(match)
                                        }
                                        className="absolute z-10 w-full cursor-move rounded border-2 border-primary/30 bg-primary/15 p-1.5 text-xs shadow-md transition-all hover:border-primary/50 hover:bg-primary/20 hover:shadow-lg"
                                        style={{
                                          left: '2px',
                                          top: `${positionPercent}%`,
                                          width: 'calc(100% - 4px)',
                                          height: `${actualHeight}%`,
                                          minHeight: minHeightValue,
                                        }}
                                        title={`Double-click for details - ${matchStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${match.homeTeam.shortName || match.homeTeam.name} vs ${match.awayTeam.shortName || match.awayTeam.name}`}
                                      >
                                        <div className="flex h-full flex-col justify-center gap-0.5 overflow-hidden">
                                          <div className="flex items-center gap-1 font-medium">
                                            {(match.homeTeam.logo ||
                                              match.homeTeam.clubRef?.logo) && (
                                              <img
                                                src={
                                                  match.homeTeam.logo ||
                                                  match.homeTeam.clubRef?.logo
                                                }
                                                alt={`${match.homeTeam.name} logo`}
                                                className="h-3 w-3 rounded object-cover"
                                              />
                                            )}
                                            <span
                                              className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${getTeamColor(match.homeTeam.id)}`}
                                              title={
                                                match.homeTeam.shortName ||
                                                match.homeTeam.name
                                              }
                                            >
                                              {match.homeTeam.shortName ||
                                                match.homeTeam.name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            {(match.awayTeam.logo ||
                                              match.awayTeam.clubRef?.logo) && (
                                              <img
                                                src={
                                                  match.awayTeam.logo ||
                                                  match.awayTeam.clubRef?.logo
                                                }
                                                alt={`${match.awayTeam.name} logo`}
                                                className="h-3 w-3 rounded object-cover"
                                              />
                                            )}
                                            <span
                                              className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${getTeamColor(match.awayTeam.id)}`}
                                              title={
                                                match.awayTeam.shortName ||
                                                match.awayTeam.name
                                              }
                                            >
                                              {match.awayTeam.shortName ||
                                                match.awayTeam.name}
                                            </span>
                                            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                                              {matchStart.toLocaleTimeString(
                                                [],
                                                {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                }
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Time Picker Modal */}
      <Dialog open={isTimePickerOpen} onOpenChange={setIsTimePickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Match</DialogTitle>
            <DialogDescription>
              Select the exact start time for this match
            </DialogDescription>
          </DialogHeader>
          {pendingDrop && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="match-time">Start Time</Label>
                <Input
                  id="match-time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  step="300"
                  min="07:00"
                  max="24:00"
                />
                <p className="text-sm text-muted-foreground">
                  Match:{' '}
                  {pendingDrop.match.homeTeam.shortName ||
                    pendingDrop.match.homeTeam.name}{' '}
                  vs{' '}
                  {pendingDrop.match.awayTeam.shortName ||
                    pendingDrop.match.awayTeam.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Pitch:{' '}
                  {
                    venues
                      .find((v) =>
                        v.pitches.some((p) => p.id === pendingDrop.pitchId)
                      )
                      ?.pitches.find((p) => p.id === pendingDrop.pitchId)?.name
                  }
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTimePickerOpen(false);
                setPendingDrop(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmTime}>Schedule Match</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Match Details Modal */}
      <Dialog open={isMatchDetailsOpen} onOpenChange={setIsMatchDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
            <DialogDescription>
              View and manage match information
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-6 py-4">
              {/* Teams */}
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    {(selectedMatch.homeTeam.logo ||
                      selectedMatch.homeTeam.clubRef?.logo) && (
                      <img
                        src={
                          selectedMatch.homeTeam.logo ||
                          selectedMatch.homeTeam.clubRef?.logo
                        }
                        alt={`${selectedMatch.homeTeam.name} logo`}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="font-semibold">
                        {selectedMatch.homeTeam.name}
                      </div>
                      {selectedMatch.homeTeam.clubRef && (
                        <div className="text-sm text-muted-foreground">
                          {selectedMatch.homeTeam.clubRef.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {selectedMatch.homeScore} - {selectedMatch.awayScore}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">
                        {selectedMatch.awayTeam.name}
                      </div>
                      {selectedMatch.awayTeam.clubRef && (
                        <div className="text-sm text-muted-foreground">
                          {selectedMatch.awayTeam.clubRef.name}
                        </div>
                      )}
                    </div>
                    {(selectedMatch.awayTeam.logo ||
                      selectedMatch.awayTeam.clubRef?.logo) && (
                      <img
                        src={
                          selectedMatch.awayTeam.logo ||
                          selectedMatch.awayTeam.clubRef?.logo
                        }
                        alt={`${selectedMatch.awayTeam.name} logo`}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Match Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date & Time</span>
                  </div>
                  {selectedMatch.startTime ? (
                    <div className="pl-6 text-sm">
                      {new Date(selectedMatch.startTime).toLocaleDateString(
                        [],
                        {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                      <br />
                      {(() => {
                        const startTime = new Date(selectedMatch.startTime);
                        // Use division's matchDuration if available, otherwise calculate from stored endTime
                        const matchDuration =
                          division?.matchDuration ||
                          (selectedMatch.endTime
                            ? (new Date(selectedMatch.endTime).getTime() -
                                startTime.getTime()) /
                              (1000 * 60)
                            : 90);
                        // Recalculate endTime based on current division duration
                        const calculatedEndTime = new Date(
                          startTime.getTime() + matchDuration * 60 * 1000
                        );
                        return (
                          <>
                            {startTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {' - '}
                            {calculatedEndTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="pl-6 text-sm text-muted-foreground">
                      Not scheduled
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Venue & Pitch</span>
                  </div>
                  {selectedMatch.venue && selectedMatch.pitch ? (
                    <div className="pl-6 text-sm">
                      {selectedMatch.venue.name}
                      <br />
                      {selectedMatch.pitch.name}
                    </div>
                  ) : (
                    <div className="pl-6 text-sm text-muted-foreground">
                      Not assigned
                    </div>
                  )}
                </div>

                {selectedMatch.group && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Division & Group</span>
                    </div>
                    <div className="pl-6 text-sm">
                      {selectedMatch.group.division.name}
                      <br />
                      {selectedMatch.group.name}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Status</span>
                  </div>
                  <div className="pl-6">
                    {getStatusBadge(selectedMatch.status)}
                  </div>
                </div>

                {selectedMatch.referee && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Referee</span>
                    </div>
                    <div className="pl-6 text-sm">{selectedMatch.referee}</div>
                  </div>
                )}

                {selectedMatch.notes && (
                  <div className="col-span-2 space-y-2">
                    <div className="text-sm font-medium">Notes</div>
                    <div className="rounded border p-3 text-sm">
                      {selectedMatch.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMatchDetailsOpen(false);
                setSelectedMatch(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
