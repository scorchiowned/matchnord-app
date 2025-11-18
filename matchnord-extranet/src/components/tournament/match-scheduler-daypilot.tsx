'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DayPilotCalendar, DayPilot } from '@daypilot/daypilot-lite-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DivisionFilter } from './division-filter';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Save, Filter, X, MapPin, Calendar, List } from 'lucide-react';
import { toast } from 'sonner';
import {
  parseUTCTimeString,
  createUTCTimeString,
  calculateEndTimeUTC,
  extractLocalDate,
  extractLocalTime,
} from '@/lib/time/timezone';

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

interface Venue {
  id: string;
  name: string;
  pitches: {
    id: string;
    name: string;
    number?: string | number;
    surface?: string;
    size?: string;
    isAvailable: boolean;
  }[];
}

interface Division {
  id: string;
  name: string;
  level?: string;
  matchDuration?: number;
  breakDuration?: number;
  assignmentType?: 'AUTO' | 'MANUAL';
}

interface MatchSchedulerProps {
  tournamentId: string;
  divisionId: string;
  groupId: string;
  matches: Match[];
  venues: Venue[];
  divisions?: Division[];
  onScheduleChange?: (matches: Match[]) => void;
}

interface FilterState {
  selectedDivision: string;
  selectedGroup: string;
  selectedVenue: string;
  selectedTeam: string[]; // Array for multiple team selection
}

export function MatchSchedulerDayPilot({
  tournamentId,
  matches,
  venues,
  divisions = [],
  onScheduleChange,
}: MatchSchedulerProps) {
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>(matches);
  const [isSaving, setIsSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0] || '';
  const [selectedDateRange, setSelectedDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: today,
    end: today,
  });
  const calendarRef = useRef<any>(null);
  const [filters, setFilters] = useState<FilterState>({
    selectedDivision: 'all',
    selectedGroup: 'all',
    selectedVenue: 'all',
    selectedTeam: [], // Empty array means all teams selected
  });
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStartTime, setEditStartTime] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editMatchNumber, setEditMatchNumber] = useState('');
  const [viewMode, setViewMode] = useState<'scheduler' | 'list'>('scheduler');

  // Update scheduledMatches when matches prop changes
  useEffect(() => {
    setScheduledMatches(matches);
  }, [matches]);

  // Prepare resources (pitches) for DayPilot
  const resources = useMemo(() => {
    const allPitches: Array<{ id: string; name: string; venueName: string }> =
      [];

    venues.forEach((venue) => {
      venue.pitches.forEach((pitch) => {
        allPitches.push({
          id: pitch.id,
          name: pitch.name,
          venueName: venue.name,
        });
      });
    });

    return allPitches;
  }, [venues]);

  // Helper function to check if a date is within the selected range
  const isDateInRange = useCallback(
    (dateStr: string | undefined): boolean => {
      if (!dateStr) return false;
      return (
        dateStr >= selectedDateRange.start && dateStr <= selectedDateRange.end
      );
    },
    [selectedDateRange]
  );

  // Prepare events (matches) for DayPilot
  const events = useMemo(() => {
    return scheduledMatches
      .filter((match) => {
        // Apply date filter - show matches within the selected date range
        if (match.startTime) {
          const [matchDatePart = ''] = match.startTime.split('T');
          if (!isDateInRange(matchDatePart)) {
            return false;
          }
        } else {
          // Unscheduled matches are not shown in calendar
          return false;
        }

        // Apply filters
        if (
          filters.selectedDivision !== 'all' &&
          match.group?.division.id !== filters.selectedDivision
        ) {
          return false;
        }
        if (
          filters.selectedGroup !== 'all' &&
          match.group?.id !== filters.selectedGroup
        ) {
          return false;
        }
        if (
          filters.selectedVenue !== 'all' &&
          match.venue?.id !== filters.selectedVenue
        ) {
          return false;
        }
        // Apply team filter - show match if any selected team is involved
        if (
          filters.selectedTeam.length > 0 &&
          !filters.selectedTeam.includes(match.homeTeam.id) &&
          !filters.selectedTeam.includes(match.awayTeam.id)
        ) {
          return false;
        }
        return true;
      })
      .filter((match) => match.startTime && match.pitch) // Only scheduled matches
      .map((match) => {
        // Parse UTC time from server and convert to local timezone for display
        const localTime = parseUTCTimeString(match.startTime);
        if (!localTime) {
          // Skip invalid matches
          return null;
        }

        // Create DayPilot.Date from local time string
        const startStr = `${localTime.date} ${localTime.time}:00`;
        const start = new DayPilot.Date(startStr);
        // Get the match's actual division duration
        const matchDivision = divisions.find(
          (d) => d.id === match.group?.division.id
        );
        const matchDuration = matchDivision?.matchDuration || 90;

        // Always recalculate end time based on division duration to ensure correct display
        // This fixes the issue where matches saved with 15min duration show incorrectly after page refresh
        const end = start.addMinutes(matchDuration);

        const matchTitle = `${match.homeTeam.shortName || match.homeTeam.name} vs ${match.awayTeam.shortName || match.awayTeam.name}`;

        // Format time strings from local time
        const startTimeStr = localTime.time;
        const endHours = end.getHours();
        const endMinutes = end.getMinutes();
        const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

        return {
          id: match.id,
          text: matchTitle,
          start: start,
          end: end,
          resource: match.pitch!.id,
          backColor: '#3b82f6', // Blue color
          borderColor: '#2563eb',
          html: `
            <div style="padding: 4px; font-size: 10px; line-height: 1.3; display: flex; flex-direction: column; height: 100%; color: #fff;">
              ${match.matchNumber ? `<div style="font-size: 7px; font-weight: 800; margin-bottom: 1px; padding-bottom: 1px; border-bottom: 1px solid rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.9);">${match.matchNumber}</div>` : ''}
              ${match.group ? `<div style="font-size: 8px; font-weight: 700; margin-bottom: 2px; padding-bottom: 2px; border-bottom: 1px solid rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.3px;">${matchDivision?.level ? matchDivision.level + ' | ' : ''}${match.group.division.name} - ${match.group.name}</div>` : ''}
              <div style="display: flex; align-items: center; gap: 3px; margin-bottom: 1px;">
                ${match.homeTeam.logo ? `<img src="${match.homeTeam.logo}" alt="" style="width: 14px; height: 14px; object-fit: contain; flex-shrink: 0; background: white; border-radius: 2px; padding: 1px;" />` : ''}
                <span style="font-weight: 700; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${match.homeTeam.shortName || match.homeTeam.name}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 3px; margin-bottom: 2px;">
                ${match.awayTeam.logo ? `<img src="${match.awayTeam.logo}" alt="" style="width: 14px; height: 14px; object-fit: contain; flex-shrink: 0; background: white; border-radius: 2px; padding: 1px;" />` : ''}
                <span style="font-weight: 700; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${match.awayTeam.shortName || match.awayTeam.name}</span>
              </div>
              <div style="font-size: 9px; color: rgba(255,255,255,0.95); font-weight: 600; margin-top: auto; padding-top: 2px; border-top: 1px solid rgba(255,255,255,0.2);">
                ${startTimeStr} - ${endTimeStr}
              </div>
            </div>
          `,
          toolTip: `
            <div style="padding: 12px; min-width: 200px;">
              ${match.matchNumber ? `<div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #3b82f6;">Match ${match.matchNumber}</div>` : ''}
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                ${match.homeTeam.logo ? `<img src="${match.homeTeam.logo}" alt="" style="width: 24px; height: 24px; object-fit: contain;" />` : ''}
                <span style="font-weight: bold;">${match.homeTeam.name}</span>
              </div>
              <div style="text-align: center; margin: 4px 0; font-weight: bold; color: #666;">vs</div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                ${match.awayTeam.logo ? `<img src="${match.awayTeam.logo}" alt="" style="width: 24px; height: 24px; object-fit: contain;" />` : ''}
                <span style="font-weight: bold;">${match.awayTeam.name}</span>
              </div>
              <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 13px;">
                <div style="margin-bottom: 4px;"><strong>Time:</strong> ${startTimeStr} - ${endTimeStr}</div>
                <div style="margin-bottom: 4px;"><strong>Date:</strong> ${localTime.date}</div>
                <div style="margin-bottom: 4px;"><strong>Venue:</strong> ${match.venue?.name || 'TBD'}</div>
                <div style="margin-bottom: 4px;"><strong>Pitch:</strong> ${match.pitch?.name || 'TBD'}</div>
                ${matchDivision?.level ? `<div style="margin-bottom: 4px;"><strong>Level:</strong> ${matchDivision.level}</div>` : ''}
                ${match.group ? `<div style="margin-bottom: 4px;"><strong>Division:</strong> ${match.group.division.name}</div>` : ''}
                ${match.group ? `<div><strong>Group:</strong> ${match.group.name}</div>` : ''}
              </div>
            </div>
          `,
        };
      })
      .filter((event) => event !== null); // Remove null entries from failed parsing
  }, [scheduledMatches, filters, divisions, isDateInRange]);

  const handleEventMove = useCallback(
    async (args: any) => {
      const match = scheduledMatches.find((m) => m.id === args.e.id());
      if (!match) {
        args.preventDefault();
        return;
      }

      const newStart = args.newStart;
      const newResource = args.newResource;

      // Calculate the actual end time based on the match's division duration (not the 15min cell)
      const matchDivision = divisions.find(
        (d) => d.id === match.group?.division.id
      );
      const matchDuration = matchDivision?.matchDuration || 90;
      const calculatedEnd = newStart.addMinutes(matchDuration);

      // Convert DayPilot.Date to local date/time strings, then to UTC for comparison
      const newStartLocalStr = newStart.toString('yyyy-MM-ddTHH:mm:ss');
      const newEndLocalStr = calculatedEnd.toString('yyyy-MM-ddTHH:mm:ss');
      
      // Parse local strings and convert to UTC for conflict checking
      const [newStartDate, newStartTime] = newStartLocalStr.split('T');
      const [newEndDate, newEndTime] = newEndLocalStr.split('T');
      const newStartUTC = createUTCTimeString(newStartDate, newStartTime);
      const newEndUTC = calculateEndTimeUTC(newStartUTC, matchDuration);

      // Check for conflicts on the same pitch
      // All times are in UTC for comparison
      const conflictingMatch = scheduledMatches.find((m) => {
        if (m.id === match.id || !m.pitch || !m.startTime) return false;
        if (m.pitch.id !== newResource) return false;

        // Parse existing match time (already in UTC from server)
        const mStartUTC = m.startTime;
        const mEndUTC = m.endTime || calculateEndTimeUTC(mStartUTC, matchDuration);

        // Check if times overlap (compare UTC ISO strings)
        return mStartUTC < newEndUTC && mEndUTC > newStartUTC;
      });

      if (conflictingMatch) {
        // Extract local time for display
        const conflictLocalTime = parseUTCTimeString(conflictingMatch.startTime);
        const conflictTimeStr = conflictLocalTime ? conflictLocalTime.time : '';
        toast.error(
          `Time slot conflicts with ${conflictingMatch.homeTeam.shortName || conflictingMatch.homeTeam.name} vs ${conflictingMatch.awayTeam.shortName || conflictingMatch.awayTeam.name} at ${conflictTimeStr}`,
          { duration: 5000 }
        );
        args.preventDefault();
        return;
      }

      // Check for team double-booking
      // All times are in UTC for comparison
      const teamDoubleBooking = scheduledMatches.some((m) => {
        if (m.id === match.id || !m.startTime) return false;

        // Parse existing match time (already in UTC from server)
        const mStartUTC = m.startTime;
        const mDivision = divisions.find(
          (d) => d.id === m.group?.division.id
        );
        const mDuration = mDivision?.matchDuration || 90;
        const mEndUTC = m.endTime || calculateEndTimeUTC(mStartUTC, mDuration);

        // Check if times overlap (compare UTC ISO strings)
        const timeOverlap = mStartUTC < newEndUTC && mEndUTC > newStartUTC;

        // Check if teams overlap
        const teamOverlap =
          m.homeTeam.id === match.homeTeam.id ||
          m.homeTeam.id === match.awayTeam.id ||
          m.awayTeam.id === match.homeTeam.id ||
          m.awayTeam.id === match.awayTeam.id;

        return timeOverlap && teamOverlap;
      });

      if (teamDoubleBooking) {
        toast.error('One or both teams are already playing at this time');
        args.preventDefault();
        return;
      }

      // Update match
      const pitch = venues
        .flatMap((v) => v.pitches)
        .find((p) => p.id === newResource);
      const venue = venues.find((v) =>
        v.pitches.some((p) => p.id === newResource)
      );

      if (!pitch || !venue) {
        toast.error('Invalid pitch selected');
        args.preventDefault();
        return;
      }

      // Convert local time to UTC before storing
      // Use the calculated end time based on division duration, not the 15min cell duration
      const updatedMatch = {
        ...match,
        venue: { id: venue.id, name: venue.name },
        pitch: { id: pitch.id, name: pitch.name },
        startTime: newStartUTC, // Store as UTC
        endTime: newEndUTC, // Store as UTC
      };

      const updatedMatches = scheduledMatches.map((m) =>
        m.id === match.id ? updatedMatch : m
      );

      setScheduledMatches(updatedMatches);
      onScheduleChange?.(updatedMatches);
      toast.success('Match rescheduled');
    },
    [scheduledMatches, venues, divisions, onScheduleChange]
  );

  const handleEventResize = useCallback(
    async (args: any) => {
      const match = scheduledMatches.find((m) => m.id === args.e.id());
      if (!match) {
        args.preventDefault();
        return;
      }

      const newStart = args.newStart;
      const newEnd = args.newEnd;

      // Update match duration
      const updatedMatch = {
        ...match,
        startTime: newStart.toString('yyyy-MM-ddTHH:mm:ss'),
        endTime: newEnd.toString('yyyy-MM-ddTHH:mm:ss'),
      };

      const updatedMatches = scheduledMatches.map((m) =>
        m.id === match.id ? updatedMatch : m
      );

      setScheduledMatches(updatedMatches);
      onScheduleChange?.(updatedMatches);
      toast.success('Match duration updated');
    },
    [scheduledMatches, onScheduleChange]
  );

  const scheduleMatchAtTime = useCallback(
    async (
      match: Match,
      start: DayPilot.Date,
      end: DayPilot.Date,
      resourceId: string
    ) => {
      // Find the pitch and venue
      const pitch = venues
        .flatMap((v) => v.pitches)
        .find((p) => p.id === resourceId);
      const venue = venues.find((v) =>
        v.pitches.some((p) => p.id === resourceId)
      );

      if (!pitch || !venue) {
        toast.error('Invalid pitch selected');
        setSelectedMatch(null);
        return;
      }

      // Calculate the actual end time based on the match's division duration (not the 15min cell)
      const matchDivision = divisions.find(
        (d) => d.id === match.group?.division.id
      );
      const matchDuration = matchDivision?.matchDuration || 90;
      const calculatedEnd = start.addMinutes(matchDuration);

      // Convert DayPilot.Date to local date/time strings, then to UTC
      const newStartLocalStr = start.toString('yyyy-MM-ddTHH:mm:ss');
      const [newStartDate, newStartTime] = newStartLocalStr.split('T');
      const newStartUTC = createUTCTimeString(newStartDate, newStartTime);
      const newEndUTC = calculateEndTimeUTC(newStartUTC, matchDuration);

      // Check for conflicts - all times in UTC
      const conflictingMatch = scheduledMatches.find((m) => {
        // Exclude the match being scheduled from conflict check
        if (m.id === match.id) return false;
        if (!m.pitch || !m.startTime) return false;
        if (m.pitch.id !== resourceId) return false;

        // Parse existing match time (already in UTC from server)
        const mStartUTC = m.startTime;
        const mDivision = divisions.find(
          (d) => d.id === m.group?.division.id
        );
        const mDuration = mDivision?.matchDuration || 90;
        const mEndUTC = m.endTime || calculateEndTimeUTC(mStartUTC, mDuration);

        // Check if times overlap (compare UTC ISO strings)
        return mStartUTC < newEndUTC && mEndUTC > newStartUTC;
      });

      if (conflictingMatch) {
        // Extract local time for display
        const conflictLocalTime = parseUTCTimeString(conflictingMatch.startTime);
        const conflictTimeStr = conflictLocalTime ? conflictLocalTime.time : '';
        toast.error(
          `Time slot conflicts with ${conflictingMatch.homeTeam.shortName || conflictingMatch.homeTeam.name} vs ${conflictingMatch.awayTeam.shortName || conflictingMatch.awayTeam.name} at ${conflictTimeStr}`,
          { duration: 5000 }
        );
        setSelectedMatch(null);
        return;
      }

      // Check for team double-booking - all times in UTC
      const teamDoubleBooking = scheduledMatches.some((m) => {
        // Exclude the match being scheduled from conflict check
        if (m.id === match.id) return false;
        if (!m.startTime) return false;

        // Parse existing match time (already in UTC from server)
        const mStartUTC = m.startTime;
        const mDivision = divisions.find(
          (d) => d.id === m.group?.division.id
        );
        const mDuration = mDivision?.matchDuration || 90;
        const mEndUTC = m.endTime || calculateEndTimeUTC(mStartUTC, mDuration);

        // Check if times overlap (compare UTC ISO strings)
        const timeOverlap = mStartUTC < newEndUTC && mEndUTC > newStartUTC;
        const teamOverlap =
          m.homeTeam.id === match.homeTeam.id ||
          m.homeTeam.id === match.awayTeam.id ||
          m.awayTeam.id === match.homeTeam.id ||
          m.awayTeam.id === match.awayTeam.id;

        return timeOverlap && teamOverlap;
      });

      if (teamDoubleBooking) {
        toast.error('One or both teams are already playing at this time');
        setSelectedMatch(null);
        return;
      }

      // Convert local time to UTC before storing
      // Use the calculated end time based on division duration, not the 15min cell duration
      // Update the match
      const updatedMatch = {
        ...match,
        venue: { id: venue.id, name: venue.name },
        pitch: { id: pitch.id, name: pitch.name },
        startTime: newStartUTC, // Store as UTC
        endTime: newEndUTC, // Store as UTC
      };

      const updatedMatches = scheduledMatches.map((m) =>
        m.id === match.id ? updatedMatch : m
      );

      setScheduledMatches(updatedMatches);
      onScheduleChange?.(updatedMatches);
      setSelectedMatch(null);
      toast.success('Match scheduled successfully');
    },
    [scheduledMatches, venues, divisions, onScheduleChange]
  );

  const handleTimeRangeSelected = useCallback(
    async (args: any) => {
      // Handle clicking on a time slot when a match is selected
      if (!selectedMatch) {
        // No match selected, ignore
        return;
      }

      const selectedStart = args.start;
      const selectedEnd = args.end;
      const selectedResource = args.resource;

      if (!selectedResource) {
        toast.error('Please select a pitch column');
        setSelectedMatch(null);
        return;
      }

      // Use the scheduleMatchAtTime helper function
      try {
        await scheduleMatchAtTime(
          selectedMatch,
          selectedStart,
          selectedEnd,
          selectedResource
        );
      } catch (error) {
        console.error('Error scheduling match:', error);
        toast.error('Failed to schedule match');
        setSelectedMatch(null);
      }
    },
    [selectedMatch, scheduleMatchAtTime]
  );

  // Calendar configuration - using Calendar component for resource columns
  const calendarConfig = useMemo(() => {
    const startDate = new Date(selectedDateRange.start);
    const endDate = new Date(selectedDateRange.end);
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const days = Math.max(1, daysDiff + 1); // At least 1 day

    return {
      startDate: new DayPilot.Date(startDate),
      days: days,
      viewType: 'Resources' as const,
      resources: resources,
      events: events,
      // Time range configuration - show only 7:00 to 23:00
      businessBeginsHour: 7,
      businessEndsHour: 23,
      // Cell configuration - bigger cells for more info
      cellHeight: 40,
      cellDuration: 15, // 15-minute intervals
      // Height configuration - show only business hours without internal scroll
      heightSpec: 'BusinessHoursNoScroll' as const,
      // Configure columns (pitches) and rows (time)
      columns: resources.map((resource) => ({
        name: resource.name,
        id: resource.id,
      })),
      timeRangeSelectedHandling: 'Enabled' as const,
      eventMoveHandling: 'Update' as const,
      eventResizeHandling: 'Update' as const,
      eventDeleteHandling: 'Disabled' as const,
      // Event handlers
      onEventMove: handleEventMove,
      onEventResize: handleEventResize,
      onTimeRangeSelected: handleTimeRangeSelected,
      // Add cell highlighting when a match is selected
      onBeforeCellRender: (args: any) => {
        if (selectedMatch) {
          args.cell.backColor = '#e0f2fe'; // Light blue highlight when match is selected
          args.cell.cssClass = 'cursor-pointer';
        }
      },
      // Enable dropping from external sources
      allowEventOverlap: false,
      onEventClick: (args: any) => {
        // Double-click to edit
        if (args.originalEvent && args.originalEvent.detail === 2) {
          const match = scheduledMatches.find((m) => m.id === args.e.id());
          if (match && match.startTime) {
            setEditingMatch(match);
            // Parse UTC time and convert to local for display
            const localTime = parseUTCTimeString(match.startTime);
            if (localTime) {
              setEditStartDate(localTime.date);
              setEditStartTime(localTime.time);
            } else {
              // Fallback
              setEditStartDate('');
              setEditStartTime('09:00');
            }
            setEditMatchNumber(match.matchNumber || '');
            setIsEditModalOpen(true);
          }
        }
      },
    };
  }, [
    resources,
    events,
    scheduledMatches,
    handleEventMove,
    handleEventResize,
    handleTimeRangeSelected,
    selectedMatch,
    selectedDateRange,
  ]);

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
              matchNumber: match.matchNumber || null,
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
      setIsConfirmingClear(true);
      setTimeout(() => {
        setIsConfirmingClear(false);
      }, 3000);
      return;
    }

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

  const getUnscheduledMatches = () => {
    return scheduledMatches.filter((match) => {
      // Filter by scheduled status
      const isUnscheduled = !match.venue || !match.pitch || !match.startTime;
      if (!isUnscheduled) return false;

      // Apply division filter
      if (
        filters.selectedDivision !== 'all' &&
        match.group?.division.id !== filters.selectedDivision
      ) {
        return false;
      }

      // Apply group filter
      if (
        filters.selectedGroup !== 'all' &&
        match.group?.id !== filters.selectedGroup
      ) {
        return false;
      }

      // Apply team filter - show match if any selected team is involved
      if (
        filters.selectedTeam.length > 0 &&
        !filters.selectedTeam.includes(match.homeTeam.id) &&
        !filters.selectedTeam.includes(match.awayTeam.id)
      ) {
        return false;
      }

      return true;
    });
  };

  const getUniqueDivisions = () => {
    // Use divisions prop if available, otherwise extract from matches
    if (divisions && divisions.length > 0) {
      return divisions;
    }

    const matchDivisions = scheduledMatches
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
    return matchDivisions;
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
      selectedTeam: [], // Empty array means all teams
    });
  };

  return (
    <div className="space-y-4">
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
          {/* Division Filter */}
          {getUniqueDivisions().length > 0 && (
            <div className="mb-6">
              <Label className="mb-2 block text-sm">Division</Label>
              <DivisionFilter
                divisions={getUniqueDivisions()}
                selectedDivision={filters.selectedDivision}
                onDivisionChange={(value) => {
                  setFilters({
                    ...filters,
                    selectedDivision: value,
                    selectedGroup: 'all',
                  });
                }}
                showAllOption={true}
              />
            </div>
          )}

          {/* Date Range Filter */}
          <div className="mb-6">
            <Label>Date Range</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label
                  htmlFor="date-start"
                  className="text-xs text-muted-foreground"
                >
                  Start Date
                </Label>
                <input
                  id="date-start"
                  type="date"
                  value={selectedDateRange.start}
                  onChange={(e) =>
                    setSelectedDateRange({
                      ...selectedDateRange,
                      start: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="date-end"
                  className="text-xs text-muted-foreground"
                >
                  End Date
                </Label>
                <input
                  id="date-end"
                  type="date"
                  value={selectedDateRange.end}
                  onChange={(e) =>
                    setSelectedDateRange({
                      ...selectedDateRange,
                      end: e.target.value,
                    })
                  }
                  min={selectedDateRange.start}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Select a date range to view matches across multiple days
            </p>
          </div>

          {/* Other Filters */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          </div>

          {/* Team Filter with Logos */}
          <div className="mt-4 space-y-2">
            <Label>Team</Label>
            <div className="flex flex-wrap gap-2 rounded-md border p-2">
              <button
                onClick={() => setFilters({ ...filters, selectedTeam: [] })}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-sm transition-colors ${
                  filters.selectedTeam.length === 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted opacity-50 hover:bg-accent'
                }`}
              >
                All Teams
              </button>
              {getUniqueTeams().map((team) => {
                // Find team logo from any match where this team appears
                const matchWithTeam = scheduledMatches.find(
                  (m) => m.homeTeam.id === team.id || m.awayTeam.id === team.id
                );
                const teamLogo =
                  matchWithTeam?.homeTeam.id === team.id
                    ? matchWithTeam.homeTeam.logo ||
                      matchWithTeam.homeTeam.clubRef?.logo
                    : matchWithTeam?.awayTeam.logo ||
                      matchWithTeam?.awayTeam.clubRef?.logo;
                const isSelected = filters.selectedTeam.includes(team.id);
                return (
                  <button
                    key={team.id}
                    onClick={() => {
                      if (isSelected) {
                        // Unselect team
                        setFilters({
                          ...filters,
                          selectedTeam: filters.selectedTeam.filter(
                            (id) => id !== team.id
                          ),
                        });
                      } else {
                        // Select team
                        setFilters({
                          ...filters,
                          selectedTeam: [...filters.selectedTeam, team.id],
                        });
                      }
                    }}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted opacity-50 hover:bg-accent'
                    }`}
                  >
                    {teamLogo && (
                      <img
                        src={teamLogo}
                        alt=""
                        className="h-4 w-4 flex-shrink-0 object-contain"
                      />
                    )}
                    <span>{team.shortName || team.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={viewMode === 'scheduler' ? 'default' : 'outline'}
              onClick={() => setViewMode('scheduler')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Scheduler
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              List View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Scheduler or List View */}
      {viewMode === 'scheduler' ? (
        <div className="flex gap-4">
          {/* Games Sidebar */}
          <div className="w-80 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Games</CardTitle>
                <CardDescription>Unscheduled matches</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                {/* Unscheduled Matches - Grouped by Group */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Unscheduled ({getUnscheduledMatches().length})
                    </h4>
                  </div>
                  <div className="max-h-[calc(100vh-300px)] space-y-3 overflow-y-auto">
                    {(() => {
                      const unscheduledMatches = getUnscheduledMatches();
                      const groupedByGroup = unscheduledMatches.reduce(
                        (acc, match) => {
                          const groupKey = match.group?.id || 'no-group';
                          const groupName =
                            match.group?.name || 'No Group Assigned';
                          if (!acc[groupKey]) {
                            acc[groupKey] = {
                              name: groupName,
                              division:
                                match.group?.division?.name ||
                                'Unknown Division',
                              matches: [],
                            };
                          }
                          acc[groupKey].matches.push(match);
                          return acc;
                        },
                        {} as Record<
                          string,
                          {
                            name: string;
                            division: string;
                            matches: Match[];
                          }
                        >
                      );

                      return Object.entries(groupedByGroup).map(
                        ([groupKey, groupData]) => (
                          <div key={groupKey} className="space-y-1.5">
                            <div className="text-xs font-semibold text-muted-foreground">
                              {groupData.division} - {groupData.name} (
                              {groupData.matches.length})
                            </div>
                            <div className="space-y-1">
                              {groupData.matches.map((match) => {
                                const homeLogo =
                                  match.homeTeam.logo ||
                                  match.homeTeam.clubRef?.logo;
                                const awayLogo =
                                  match.awayTeam.logo ||
                                  match.awayTeam.clubRef?.logo;
                                return (
                                  <div
                                    key={match.id}
                                    onClick={() => {
                                      setSelectedMatch(match);
                                      toast.info(
                                        `Match selected: ${match.homeTeam.shortName || match.homeTeam.name} vs ${match.awayTeam.shortName || match.awayTeam.name}. Now click on a time slot to schedule it.`,
                                        {
                                          duration: 4000,
                                        }
                                      );
                                    }}
                                    className={`cursor-pointer rounded border p-1.5 text-xs shadow-sm transition-all hover:shadow-md ${
                                      selectedMatch?.id === match.id
                                        ? 'border-primary bg-primary/10 ring-2 ring-primary'
                                        : 'bg-card hover:border-primary/50 hover:bg-primary/5'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 font-medium">
                                      {homeLogo && (
                                        <img
                                          src={homeLogo}
                                          alt=""
                                          className="h-3 w-3 flex-shrink-0 object-contain"
                                        />
                                      )}
                                      <span className="truncate">
                                        {match.homeTeam.shortName ||
                                          match.homeTeam.name}
                                      </span>
                                      <span className="text-muted-foreground">
                                        vs
                                      </span>
                                      {awayLogo && (
                                        <img
                                          src={awayLogo}
                                          alt=""
                                          className="h-3 w-3 flex-shrink-0 object-contain"
                                        />
                                      )}
                                      <span className="truncate">
                                        {match.awayTeam.shortName ||
                                          match.awayTeam.name}
                                      </span>
                                    </div>
                                    {match.matchNumber && (
                                      <div className="text-[10px] font-semibold text-muted-foreground">
                                        {match.matchNumber}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      );
                    })()}
                    {getUnscheduledMatches().length === 0 && (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        All matches are scheduled
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DayPilot Calendar */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Schedule Grid</CardTitle>
                    <CardDescription>
                      Each column represents a different pitch. Drag matches to
                      schedule them.
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
                  <div
                    className="daypilot-container"
                    onClick={async (e) => {
                      // Handle clicks on the calendar when a match is selected
                      if (!selectedMatch) return;

                      // Get the click position and calculate which cell was clicked
                      const target = e.target as HTMLElement;
                      const cellDiv = target.closest(
                        '.calendar_default_cell, .calendar_default_cell_inner'
                      );

                      if (cellDiv && calendarRef.current) {
                        // Try to get time and resource from DayPilot
                        const calendar = calendarRef.current.control;
                        if (calendar && calendar.cells) {
                          // Find the cell that was clicked
                          const rect = (
                            cellDiv as HTMLElement
                          ).getBoundingClientRect();
                          const x = rect.left + rect.width / 2;
                          const y = rect.top + 10; // Near the top of the cell

                          try {
                            // Try to find the cell using DayPilot's methods
                            const coords =
                              calendar.getCellAt && calendar.getCellAt(x, y);

                            if (coords && coords.start && coords.resource) {
                              // Use the selected match's actual division duration
                              const matchDivision = divisions.find(
                                (d) => d.id === selectedMatch.group?.division.id
                              );
                              const matchDuration =
                                matchDivision?.matchDuration || 90;
                              const endTime =
                                coords.start.addMinutes(matchDuration);

                              await scheduleMatchAtTime(
                                selectedMatch,
                                coords.start,
                                endTime,
                                coords.resource
                              );
                            } else {
                              console.warn(
                                'Could not determine cell coordinates'
                              );
                            }
                          } catch (error) {
                            console.error('Error getting cell info:', error);
                          }
                        }
                      }
                    }}
                  >
                    <DayPilotCalendar ref={calendarRef} {...calendarConfig} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Matches List</CardTitle>
                <CardDescription>
                  View all matches in a table format. Click on a match to edit
                  its schedule.
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
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {scheduledMatches.some((m) => m.matchNumber) && (
                      <TableHead>Match #</TableHead>
                    )}
                    <TableHead>Teams</TableHead>
                    <TableHead>Division / Group</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Venue / Pitch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledMatches
                    .filter((match) => {
                      // Apply date filter - show matches within the selected date range
                      if (match.startTime) {
                        const [matchDatePart = ''] = match.startTime.split('T');
                        if (!isDateInRange(matchDatePart)) {
                          return false;
                        }
                      } else {
                        // Unscheduled matches are shown regardless of date
                      }

                      // Apply filters
                      if (
                        filters.selectedDivision !== 'all' &&
                        match.group?.division.id !== filters.selectedDivision
                      ) {
                        return false;
                      }
                      if (
                        filters.selectedGroup !== 'all' &&
                        match.group?.id !== filters.selectedGroup
                      ) {
                        return false;
                      }
                      if (
                        filters.selectedVenue !== 'all' &&
                        match.venue?.id !== filters.selectedVenue
                      ) {
                        return false;
                      }
                      if (
                        filters.selectedTeam.length > 0 &&
                        !filters.selectedTeam.includes(match.homeTeam.id) &&
                        !filters.selectedTeam.includes(match.awayTeam.id)
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((match) => {
                      const homeLogo =
                        match.homeTeam.logo || match.homeTeam.clubRef?.logo;
                      const awayLogo =
                        match.awayTeam.logo || match.awayTeam.clubRef?.logo;
                      const isScheduled =
                        match.venue && match.pitch && match.startTime;
                      return (
                        <TableRow
                          key={match.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            if (isScheduled) {
                              setEditingMatch(match);
                              // Parse UTC time and convert to local for display
                              if (match.startTime) {
                                const localTime = parseUTCTimeString(match.startTime);
                                if (localTime) {
                                  setEditStartDate(localTime.date);
                                  setEditStartTime(localTime.time);
                                } else {
                                  setEditStartDate('');
                                  setEditStartTime('09:00');
                                }
                              }
                              setEditMatchNumber(match.matchNumber || '');
                              setIsEditModalOpen(true);
                            }
                          }}
                        >
                          {scheduledMatches.some((m) => m.matchNumber) && (
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
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                {homeLogo && (
                                  <img
                                    src={homeLogo}
                                    alt=""
                                    className="h-5 w-5 object-contain"
                                  />
                                )}
                                <span className="font-medium">
                                  {match.homeTeam.shortName ||
                                    match.homeTeam.name}
                                </span>
                              </div>
                              <span className="text-muted-foreground">vs</span>
                              <div className="flex items-center gap-1.5">
                                {awayLogo && (
                                  <img
                                    src={awayLogo}
                                    alt=""
                                    className="h-5 w-5 object-contain"
                                  />
                                )}
                                <span className="font-medium">
                                  {match.awayTeam.shortName ||
                                    match.awayTeam.name}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {match.group ? (
                              <div>
                                <div className="text-sm">
                                  {match.group.division.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {match.group.name}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {match.startTime ? (
                              <div>
                                <div className="text-sm">
                                  {new Date(
                                    match.startTime
                                  ).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(match.startTime).toLocaleTimeString(
                                    [],
                                    {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )}
                                  {match.endTime &&
                                    ` - ${new Date(
                                      match.endTime
                                    ).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}`}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline">Unscheduled</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {match.venue && match.pitch ? (
                              <div>
                                <div className="text-sm">
                                  {match.venue.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {match.pitch.name}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                isScheduled
                                  ? 'default'
                                  : match.status === 'finished'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {isScheduled ? 'Scheduled' : match.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isScheduled) {
                                  setEditingMatch(match);
                                  // Parse UTC time and convert to local for display
                                  if (match.startTime) {
                                    const localTime = parseUTCTimeString(match.startTime);
                                    if (localTime) {
                                      setEditStartDate(localTime.date);
                                      setEditStartTime(localTime.time);
                                    } else {
                                      setEditStartDate('');
                                      setEditStartTime('09:00');
                                    }
                                  }
                                  setEditMatchNumber(match.matchNumber || '');
                                  setIsEditModalOpen(true);
                                } else {
                                  setSelectedMatch(match);
                                  toast.info(
                                    'Match selected. Click on a time slot in the scheduler to schedule it.',
                                    { duration: 4000 }
                                  );
                                }
                              }}
                            >
                              {isScheduled ? 'Edit' : 'Schedule'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {scheduledMatches.filter((match) => {
                    // Apply date filter - show matches within the selected date range
                    if (match.startTime) {
                      const [matchDatePart = ''] = match.startTime.split('T');
                      if (!isDateInRange(matchDatePart)) {
                        return false;
                      }
                    }

                    // Apply filters
                    if (
                      filters.selectedDivision !== 'all' &&
                      match.group?.division.id !== filters.selectedDivision
                    ) {
                      return false;
                    }
                    if (
                      filters.selectedGroup !== 'all' &&
                      match.group?.id !== filters.selectedGroup
                    ) {
                      return false;
                    }
                    if (
                      filters.selectedVenue !== 'all' &&
                      match.venue?.id !== filters.selectedVenue
                    ) {
                      return false;
                    }
                    if (
                      filters.selectedTeam.length > 0 &&
                      !filters.selectedTeam.includes(match.homeTeam.id) &&
                      !filters.selectedTeam.includes(match.awayTeam.id)
                    ) {
                      return false;
                    }
                    return true;
                  }).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={
                          7 +
                          (scheduledMatches.some((m) => m.matchNumber) ? 1 : 0)
                        }
                        className="text-center text-muted-foreground"
                      >
                        No matches found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Match Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Match Schedule</DialogTitle>
            <DialogDescription>
              {editingMatch && (
                <>
                  {editingMatch.homeTeam.name} vs {editingMatch.awayTeam.name}
                  <br />
                  {editingMatch.venue?.name} - {editingMatch.pitch?.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time">Start Time</Label>
              <Input
                id="edit-time"
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
              />
              {editStartTime && editingMatch && (
                <p className="text-sm text-muted-foreground">
                  Match duration:{' '}
                  {divisions.find(
                    (d) => d.id === editingMatch.group?.division.id
                  )?.matchDuration || 90}{' '}
                  minutes (ends at{' '}
                  {(() => {
                    const [h, m] = editStartTime.split(':').map(Number);
                    const matchDivision = divisions.find(
                      (d) => d.id === editingMatch.group?.division.id
                    );
                    const matchDurationMinutes =
                      matchDivision?.matchDuration || 90;
                    const totalMins =
                      (h || 0) * 60 + (m || 0) + matchDurationMinutes;
                    const endH = Math.floor(totalMins / 60) % 24;
                    const endM = totalMins % 60;
                    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                  })()}
                  )
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-match-number">Match Number (optional)</Label>
              <Input
                id="edit-match-number"
                type="text"
                placeholder="e.g., M1, Match 1, 1"
                value={editMatchNumber}
                onChange={(e) => setEditMatchNumber(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Optional match number for easier scheduling and identification
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                if (editingMatch) {
                  // Remove schedule (unschedule the match)
                  const updatedMatch: Match = {
                    ...editingMatch,
                    venue: undefined as any,
                    pitch: undefined as any,
                    startTime: '' as any,
                    endTime: undefined,
                  };
                  const updatedMatches = scheduledMatches.map((m) =>
                    m.id === editingMatch.id ? updatedMatch : m
                  );
                  setScheduledMatches(updatedMatches);
                  onScheduleChange?.(updatedMatches);
                  setIsEditModalOpen(false);
                  setEditingMatch(null);
                  toast.success('Match unscheduled');
                }
              }}
            >
              Remove Schedule
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingMatch(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (editingMatch && editStartDate && editStartTime) {
                  try {
                    // Convert local time to UTC before storing
                    const newStartUTC = createUTCTimeString(editStartDate, editStartTime);
                    // Get the match's actual division duration
                    const matchDivision = divisions.find(
                      (d) => d.id === editingMatch.group?.division.id
                    );
                    const matchDuration = matchDivision?.matchDuration || 90;
                    const newEndUTC = calculateEndTimeUTC(newStartUTC, matchDuration);

                    // Check for conflicts with other matches - all times in UTC
                    const conflictingMatch = scheduledMatches.find((m) => {
                      if (m.id === editingMatch.id) return false; // Don't check against itself
                      if (!m.pitch || !m.startTime) return false;
                      if (m.pitch.id !== editingMatch.pitch?.id) return false;

                      // Parse existing match time (already in UTC from server)
                      const mStartUTC = m.startTime;
                      const mDivision = divisions.find(
                        (d) => d.id === m.group?.division.id
                      );
                      const mDuration = mDivision?.matchDuration || 90;
                      const mEndUTC = m.endTime || calculateEndTimeUTC(mStartUTC, mDuration);

                      // Check if time ranges overlap (compare UTC ISO strings)
                      return mStartUTC < newEndUTC && mEndUTC > newStartUTC;
                    });

                    if (conflictingMatch) {
                      // Extract local time for display
                      const conflictLocalTime = parseUTCTimeString(conflictingMatch.startTime);
                      const conflictTimeStr = conflictLocalTime ? conflictLocalTime.time : '';
                      toast.error(
                        `Time slot conflicts with ${conflictingMatch.homeTeam.shortName || conflictingMatch.homeTeam.name} vs ${conflictingMatch.awayTeam.shortName || conflictingMatch.awayTeam.name} at ${conflictTimeStr}`
                      );
                      return;
                    }

                    // Check for team double-booking - all times in UTC
                    const teamDoubleBooking = scheduledMatches.some((m) => {
                      if (m.id === editingMatch.id) return false;
                      if (!m.startTime) return false;

                      // Parse existing match time (already in UTC from server)
                      const mStartUTC = m.startTime;
                      const mDivision = divisions.find(
                        (d) => d.id === m.group?.division.id
                      );
                      const mDuration = mDivision?.matchDuration || 90;
                      const mEndUTC = m.endTime || calculateEndTimeUTC(mStartUTC, mDuration);

                      // Check if time ranges overlap (compare UTC ISO strings)
                      const timeOverlap = mStartUTC < newEndUTC && mEndUTC > newStartUTC;
                      const teamOverlap =
                        m.homeTeam.id === editingMatch.homeTeam.id ||
                        m.homeTeam.id === editingMatch.awayTeam.id ||
                        m.awayTeam.id === editingMatch.homeTeam.id ||
                        m.awayTeam.id === editingMatch.awayTeam.id;

                      return timeOverlap && teamOverlap;
                    });

                    if (teamDoubleBooking) {
                      toast.error(
                        'One or both teams are already playing at this time'
                      );
                      return;
                    }

                    // Update the match with UTC times
                    const updatedMatch = {
                      ...editingMatch,
                      startTime: newStartUTC,
                      endTime: newEndUTC,
                      matchNumber: editMatchNumber || undefined,
                    };

                    const updatedMatches = scheduledMatches.map((m) =>
                      m.id === editingMatch.id ? updatedMatch : m
                    );

                    setScheduledMatches(updatedMatches);
                    onScheduleChange?.(updatedMatches);
                    setIsEditModalOpen(false);
                    setEditingMatch(null);
                    toast.success('Match time updated');
                  } catch (error) {
                    console.error('Error updating match time:', error);
                    toast.error('Failed to update match time');
                  }
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
