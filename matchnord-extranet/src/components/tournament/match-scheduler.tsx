'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  onScheduleChange?: (matches: Match[]) => void;
}

interface FilterState {
  selectedDivision: string;
  selectedGroup: string;
  selectedVenue: string;
  selectedTeam: string;
}

interface TimeSlot {
  time: string;
  date: string;
  matches: Match[];
}

export function MatchScheduler({
  tournamentId,
  divisionId,
  groupId,
  matches,
  venues,
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
  const dragRef = useRef<HTMLDivElement>(null);

  // Update scheduledMatches when matches prop changes
  useEffect(() => {
    setScheduledMatches(matches);
  }, [matches]);

  // Generate time slots for the selected date (7am to 12pm, 15-minute intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    const startHour = 7;
    const endHour = 12;
    const slotDuration = 15; // 15-minute slots

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const matchesInSlot = scheduledMatches.filter((match) => {
          if (!match.startTime) return false;
          const matchTime = new Date(match.startTime)
            .toTimeString()
            .slice(0, 5);
          return matchTime === time;
        });

        slots.push({
          time,
          date: selectedDate,
          matches: matchesInSlot,
        });
      }
    }

    return slots;
  }, [scheduledMatches, selectedDate]);

  const handleDragStart = (e: React.DragEvent, match: Match) => {
    setDraggedMatch(match);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (
    e: React.DragEvent,
    pitchId: string,
    timeSlot: string
  ) => {
    e.preventDefault();

    if (!draggedMatch) return;

    const venue = venues.find((v) => v.pitches.some((p) => p.id === pitchId));
    const pitch = venue?.pitches.find((p) => p.id === pitchId);

    if (!venue || !pitch) return;

    // Check for conflicts
    const hasConflict = scheduledMatches.some(
      (match) =>
        match.id !== draggedMatch.id &&
        match.pitch?.id === pitchId &&
        match.startTime === timeSlot
    );

    if (hasConflict) {
      toast.error('Time slot is already occupied');
      return;
    }

    // Check for team double-booking
    const teamDoubleBooking = scheduledMatches.some(
      (match) =>
        match.id !== draggedMatch.id &&
        match.startTime === timeSlot &&
        (match.homeTeam.id === draggedMatch.homeTeam.id ||
          match.homeTeam.id === draggedMatch.awayTeam.id ||
          match.awayTeam.id === draggedMatch.homeTeam.id ||
          match.awayTeam.id === draggedMatch.awayTeam.id)
    );

    if (teamDoubleBooking) {
      toast.error('One or both teams are already playing at this time');
      return;
    }

    // Update the match
    const updatedMatch = {
      ...draggedMatch,
      venue: { id: venue.id, name: venue.name },
      pitch: { id: pitch.id, name: pitch.name },
      startTime: `${selectedDate}T${timeSlot}:00`,
      endTime: `${selectedDate}T${timeSlot}:00`, // Will be calculated based on division settings
    };

    const updatedMatches = scheduledMatches.map((match) =>
      match.id === draggedMatch.id ? updatedMatch : match
    );

    setScheduledMatches(updatedMatches);
    onScheduleChange?.(updatedMatches);
    setDraggedMatch(null);
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
                      className="cursor-move rounded border bg-card p-2 text-xs shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="font-medium flex items-center gap-1">
                        <div className="flex items-center gap-1">
                          {(match.homeTeam.logo || match.homeTeam.clubRef?.logo) && (
                            <img
                              src={match.homeTeam.logo || match.homeTeam.clubRef?.logo}
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
                          {(match.awayTeam.logo || match.awayTeam.clubRef?.logo) && (
                            <img
                              src={match.awayTeam.logo || match.awayTeam.clubRef?.logo}
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
                      className="cursor-move rounded border bg-green-50 p-2 text-xs shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="font-medium flex items-center gap-1">
                        <div className="flex items-center gap-1">
                          {(match.homeTeam.logo || match.homeTeam.clubRef?.logo) && (
                            <img
                              src={match.homeTeam.logo || match.homeTeam.clubRef?.logo}
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
                          {(match.awayTeam.logo || match.awayTeam.clubRef?.logo) && (
                            <img
                              src={match.awayTeam.logo || match.awayTeam.clubRef?.logo}
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-1 text-left text-xs font-medium">
                        Time
                      </th>
                      {venues.map(
                        (venue) =>
                          venue.pitches?.map((pitch) => (
                            <th
                              key={pitch.id}
                              className="border p-1 text-left text-xs"
                            >
                              <div className="font-medium">{pitch.name}</div>
                              <div className="text-muted-foreground">
                                {venue.name}
                              </div>
                            </th>
                          )) || []
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot) => (
                      <tr key={slot.time}>
                        <td className="border p-1 font-mono text-xs">
                          {slot.time}
                        </td>
                        {venues.map((venue) =>
                          venue.pitches.map((pitch) => (
                            <td key={pitch.id} className="border p-1">
                              <div
                                className="min-h-[40px] rounded border-2 border-dashed border-muted-foreground/25 p-1 transition-colors hover:border-muted-foreground/50"
                                onDragOver={handleDragOver}
                                onDrop={(e) =>
                                  handleDrop(e, pitch.id, slot.time)
                                }
                              >
                                {slot.matches
                                  .filter(
                                    (match) => match.pitch?.id === pitch.id
                                  )
                                  .map((match) => (
                                    <div
                                      key={match.id}
                                      draggable
                                      onDragStart={(e) =>
                                        handleDragStart(e, match)
                                      }
                                      className="cursor-move rounded bg-primary/10 p-1 text-xs shadow-sm transition-shadow hover:shadow-md"
                                    >
                                      <div className="font-medium flex items-center gap-1">
                                        <div className="flex items-center gap-1">
                                          {(match.homeTeam.logo || match.homeTeam.clubRef?.logo) && (
                                            <img
                                              src={match.homeTeam.logo || match.homeTeam.clubRef?.logo}
                                              alt={`${match.homeTeam.name} logo`}
                                              className="h-4 w-4 rounded object-cover"
                                            />
                                          )}
                                          <span
                                            className={`inline-block rounded px-1 py-0.5 text-xs ${getTeamColor(match.homeTeam.id)}`}
                                          >
                                            {match.homeTeam.shortName ||
                                              match.homeTeam.name}
                                          </span>
                                        </div>
                                        <span className="text-muted-foreground">vs</span>
                                        <div className="flex items-center gap-1">
                                          {(match.awayTeam.logo || match.awayTeam.clubRef?.logo) && (
                                            <img
                                              src={match.awayTeam.logo || match.awayTeam.clubRef?.logo}
                                              alt={`${match.awayTeam.name} logo`}
                                              className="h-4 w-4 rounded object-cover"
                                            />
                                          )}
                                          <span
                                            className={`inline-block rounded px-1 py-0.5 text-xs ${getTeamColor(match.awayTeam.id)}`}
                                          >
                                            {match.awayTeam.shortName ||
                                              match.awayTeam.name}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-muted-foreground">
                                        {match.group?.name}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
