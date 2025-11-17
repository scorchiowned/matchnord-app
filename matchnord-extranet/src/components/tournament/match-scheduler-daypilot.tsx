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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Save, Filter, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';

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
  selectedTeam: string;
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const calendarRef = useRef<any>(null);
  const [filters, setFilters] = useState<FilterState>({
    selectedDivision: 'all',
    selectedGroup: 'all',
    selectedVenue: 'all',
    selectedTeam: 'all',
  });
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStartTime, setEditStartTime] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editMatchNumber, setEditMatchNumber] = useState('');

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

  // Prepare events (matches) for DayPilot
  const events = useMemo(() => {
    return scheduledMatches
      .filter((match) => {
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
          filters.selectedTeam !== 'all' &&
          match.homeTeam.id !== filters.selectedTeam &&
          match.awayTeam.id !== filters.selectedTeam
        ) {
          return false;
        }
        return true;
      })
      .filter((match) => match.startTime && match.pitch) // Only scheduled matches
      .map((match) => {
        // Parse time without timezone conversion by reconstructing as local time string
        const [datePart = '', timePart = ''] = match.startTime.split('T');
        const timeParts = timePart.split(':');
        const hours = Number(timeParts[0]) || 0;
        const minutes = Number(timeParts[1]) || 0;
        const seconds = Number(timeParts[2]) || 0;

        // Create DayPilot.Date using string format that doesn't trigger timezone conversion
        // Format: "YYYY-MM-DD HH:mm:ss"
        const startStr = `${datePart} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

        // Format time strings directly from parsed values
        const startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
                <div style="margin-bottom: 4px;"><strong>Date:</strong> ${datePart}</div>
                <div style="margin-bottom: 4px;"><strong>Venue:</strong> ${match.venue?.name || 'TBD'}</div>
                <div style="margin-bottom: 4px;"><strong>Pitch:</strong> ${match.pitch?.name || 'TBD'}</div>
                ${matchDivision?.level ? `<div style="margin-bottom: 4px;"><strong>Level:</strong> ${matchDivision.level}</div>` : ''}
                ${match.group ? `<div style="margin-bottom: 4px;"><strong>Division:</strong> ${match.group.division.name}</div>` : ''}
                ${match.group ? `<div><strong>Group:</strong> ${match.group.name}</div>` : ''}
              </div>
            </div>
          `,
        };
      });
  }, [scheduledMatches, filters, divisions]);

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

      // Convert DayPilot.Date to string format for comparison (avoid timezone issues)
      const newStartStr = newStart.toString('yyyy-MM-ddTHH:mm:ss');
      const newEndStr = calculatedEnd.toString('yyyy-MM-ddTHH:mm:ss');

      // Check for conflicts on the same pitch
      const conflictingMatch = scheduledMatches.find((m) => {
        if (m.id === match.id || !m.pitch || !m.startTime) return false;
        if (m.pitch.id !== newResource) return false;

        // Parse existing match time without timezone conversion
        const [mDatePart = '', mTimePart = ''] = m.startTime.split('T');
        const mTimeParts = mTimePart.split(':');
        const mHours = Number(mTimeParts[0]) || 0;
        const mMinutes = Number(mTimeParts[1]) || 0;
        const mStartStr = `${mDatePart}T${String(mHours).padStart(2, '0')}:${String(mMinutes).padStart(2, '0')}:00`;

        // Calculate end time for existing match
        let mEndStr: string;
        if (m.endTime) {
          const [mEndDatePart = '', mEndTimePart = ''] = m.endTime.split('T');
          const mEndTimeParts = mEndTimePart.split(':');
          const mEndHours = Number(mEndTimeParts[0]) || 0;
          const mEndMinutes = Number(mEndTimeParts[1]) || 0;
          mEndStr = `${mEndDatePart}T${String(mEndHours).padStart(2, '0')}:${String(mEndMinutes).padStart(2, '0')}:00`;
        } else {
          // Use the conflicting match's actual division duration
          const mDivision = divisions.find(
            (d) => d.id === m.group?.division.id
          );
          const mDuration = mDivision?.matchDuration || 90;
          // Calculate end time manually
          const totalMinutes = mHours * 60 + mMinutes + mDuration;
          const endHours = Math.floor(totalMinutes / 60) % 24;
          const endMinutes = totalMinutes % 60;
          mEndStr = `${mDatePart}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
        }

        // Check if times overlap (string comparison works for ISO format)
        return mStartStr < newEndStr && mEndStr > newStartStr;
      });

      if (conflictingMatch) {
        // Extract time directly from ISO string to avoid timezone issues
        const [, timePartWithZ] = conflictingMatch.startTime.split('T');
        const conflictTimeStr = timePartWithZ ? timePartWithZ.slice(0, 5) : '';
        toast.error(
          `Time slot conflicts with ${conflictingMatch.homeTeam.shortName || conflictingMatch.homeTeam.name} vs ${conflictingMatch.awayTeam.shortName || conflictingMatch.awayTeam.name} at ${conflictTimeStr}`,
          { duration: 5000 }
        );
        args.preventDefault();
        return;
      }

      // Check for team double-booking
      const teamDoubleBooking = scheduledMatches.some((m) => {
        if (m.id === match.id || !m.startTime) return false;

        // Parse existing match time without timezone conversion
        const [mDatePart = '', mTimePart = ''] = m.startTime.split('T');
        const mTimeParts = mTimePart.split(':');
        const mHours = Number(mTimeParts[0]) || 0;
        const mMinutes = Number(mTimeParts[1]) || 0;
        const mStartStr = `${mDatePart}T${String(mHours).padStart(2, '0')}:${String(mMinutes).padStart(2, '0')}:00`;

        // Calculate end time for existing match
        let mEndStr: string;
        if (m.endTime) {
          const [mEndDatePart = '', mEndTimePart = ''] = m.endTime.split('T');
          const mEndTimeParts = mEndTimePart.split(':');
          const mEndHours = Number(mEndTimeParts[0]) || 0;
          const mEndMinutes = Number(mEndTimeParts[1]) || 0;
          mEndStr = `${mEndDatePart}T${String(mEndHours).padStart(2, '0')}:${String(mEndMinutes).padStart(2, '0')}:00`;
        } else {
          // Use each match's actual division duration
          const mDivision = divisions.find(
            (d) => d.id === m.group?.division.id
          );
          const mDuration = mDivision?.matchDuration || 90;
          // Calculate end time manually
          const totalMinutes = mHours * 60 + mMinutes + mDuration;
          const endHours = Math.floor(totalMinutes / 60) % 24;
          const endMinutes = totalMinutes % 60;
          mEndStr = `${mDatePart}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
        }

        // Check if times overlap (string comparison works for ISO format)
        const timeOverlap = mStartStr < newEndStr && mEndStr > newStartStr;

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

      // Use the calculated end time based on division duration, not the 15min cell duration
      const updatedMatch = {
        ...match,
        venue: { id: venue.id, name: venue.name },
        pitch: { id: pitch.id, name: pitch.name },
        startTime: newStart.toString('yyyy-MM-ddTHH:mm:ss'),
        endTime: calculatedEnd.toString('yyyy-MM-ddTHH:mm:ss'),
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

      // Convert DayPilot.Date to string format for comparison (avoid timezone issues)
      const newStartStr = start.toString('yyyy-MM-ddTHH:mm:ss');
      const newEndStr = calculatedEnd.toString('yyyy-MM-ddTHH:mm:ss');

      const conflictingMatch = scheduledMatches.find((m) => {
        // Exclude the match being scheduled from conflict check
        if (m.id === match.id) return false;
        if (!m.pitch || !m.startTime) return false;
        if (m.pitch.id !== resourceId) return false;

        // Parse existing match time without timezone conversion
        const [mDatePart = '', mTimePart = ''] = m.startTime.split('T');
        const mTimeParts = mTimePart.split(':');
        const mHours = Number(mTimeParts[0]) || 0;
        const mMinutes = Number(mTimeParts[1]) || 0;
        const mStartStr = `${mDatePart}T${String(mHours).padStart(2, '0')}:${String(mMinutes).padStart(2, '0')}:00`;

        // Calculate end time for existing match
        let mEndStr: string;
        if (m.endTime) {
          const [mEndDatePart = '', mEndTimePart = ''] = m.endTime.split('T');
          const mEndTimeParts = mEndTimePart.split(':');
          const mEndHours = Number(mEndTimeParts[0]) || 0;
          const mEndMinutes = Number(mEndTimeParts[1]) || 0;
          mEndStr = `${mEndDatePart}T${String(mEndHours).padStart(2, '0')}:${String(mEndMinutes).padStart(2, '0')}:00`;
        } else {
          // Use the conflicting match's actual division duration
          const mDivision = divisions.find(
            (d) => d.id === m.group?.division.id
          );
          const mDuration = mDivision?.matchDuration || 90;
          // Calculate end time manually
          const totalMinutes = mHours * 60 + mMinutes + mDuration;
          const endHours = Math.floor(totalMinutes / 60) % 24;
          const endMinutes = totalMinutes % 60;
          mEndStr = `${mDatePart}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
        }

        // Check if times overlap (string comparison works for ISO format)
        return mStartStr < newEndStr && mEndStr > newStartStr;
      });

      if (conflictingMatch) {
        // Extract time directly from ISO string to avoid timezone issues
        const [, timePartWithZ] = conflictingMatch.startTime.split('T');
        const conflictTimeStr = timePartWithZ ? timePartWithZ.slice(0, 5) : '';
        toast.error(
          `Time slot conflicts with ${conflictingMatch.homeTeam.shortName || conflictingMatch.homeTeam.name} vs ${conflictingMatch.awayTeam.shortName || conflictingMatch.awayTeam.name} at ${conflictTimeStr}`,
          { duration: 5000 }
        );
        setSelectedMatch(null);
        return;
      }

      // Check for team double-booking
      const teamDoubleBooking = scheduledMatches.some((m) => {
        // Exclude the match being scheduled from conflict check
        if (m.id === match.id) return false;
        if (!m.startTime) return false;

        // Parse existing match time without timezone conversion
        const [mDatePart = '', mTimePart = ''] = m.startTime.split('T');
        const mTimeParts = mTimePart.split(':');
        const mHours = Number(mTimeParts[0]) || 0;
        const mMinutes = Number(mTimeParts[1]) || 0;
        const mStartStr = `${mDatePart}T${String(mHours).padStart(2, '0')}:${String(mMinutes).padStart(2, '0')}:00`;

        // Calculate end time for existing match
        let mEndStr: string;
        if (m.endTime) {
          const [mEndDatePart = '', mEndTimePart = ''] = m.endTime.split('T');
          const mEndTimeParts = mEndTimePart.split(':');
          const mEndHours = Number(mEndTimeParts[0]) || 0;
          const mEndMinutes = Number(mEndTimeParts[1]) || 0;
          mEndStr = `${mEndDatePart}T${String(mEndHours).padStart(2, '0')}:${String(mEndMinutes).padStart(2, '0')}:00`;
        } else {
          // Use each match's actual division duration
          const mDivision = divisions.find(
            (d) => d.id === m.group?.division.id
          );
          const mDuration = mDivision?.matchDuration || 90;
          // Calculate end time manually
          const totalMinutes = mHours * 60 + mMinutes + mDuration;
          const endHours = Math.floor(totalMinutes / 60) % 24;
          const endMinutes = totalMinutes % 60;
          mEndStr = `${mDatePart}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
        }

        // Check if times overlap (string comparison works for ISO format)
        const timeOverlap = mStartStr < newEndStr && mEndStr > newStartStr;
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

      // Use the calculated end time based on division duration, not the 15min cell duration
      // Update the match
      const updatedMatch = {
        ...match,
        venue: { id: venue.id, name: venue.name },
        pitch: { id: pitch.id, name: pitch.name },
        startTime: start.toString('yyyy-MM-ddTHH:mm:ss'),
        endTime: calculatedEnd.toString('yyyy-MM-ddTHH:mm:ss'),
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
    return {
      startDate: new DayPilot.Date(selectedDate),
      days: 1,
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
            // Parse ISO string directly to avoid timezone conversion
            const isoString = match.startTime;
            const [datePart, timePart] = isoString.split('T');
            const timeOnly = timePart ? timePart.slice(0, 5) : '09:00';
            setEditStartDate(datePart || '');
            setEditStartTime(timeOnly);
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
    selectedDate,
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

      // Apply team filter
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

  const getScheduledMatches = () => {
    return scheduledMatches.filter((match) => {
      // Filter by scheduled status
      const isScheduled = match.venue && match.pitch && match.startTime;
      if (!isScheduled) return false;

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

      // Apply venue filter (only for scheduled matches)
      if (
        filters.selectedVenue !== 'all' &&
        match.venue?.id !== filters.selectedVenue
      ) {
        return false;
      }

      // Apply team filter
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
      selectedTeam: 'all',
    });
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

          {/* Other Filters */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <CardDescription>Unscheduled matches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Selector */}
              <div className="space-y-2">
                <Label htmlFor="date-selector">Date</Label>
                <input
                  id="date-selector"
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
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
                <div className="max-h-96 min-h-[100px] space-y-2 overflow-y-auto rounded border-2 border-dashed border-muted-foreground/25 p-2">
                  {getUnscheduledMatches().map((match) => (
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
                      className={`cursor-pointer rounded border p-2 text-xs shadow-sm transition-all hover:shadow-md ${
                        selectedMatch?.id === match.id
                          ? 'border-primary bg-primary/10 ring-2 ring-primary'
                          : 'bg-card hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-medium">
                        <span>
                          {match.homeTeam.shortName || match.homeTeam.name}
                        </span>
                        <span className="text-muted-foreground">vs</span>
                        <span>
                          {match.awayTeam.shortName || match.awayTeam.name}
                        </span>
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
                      All matches are scheduled
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduled Matches Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Scheduled ({getScheduledMatches().length})
                  </h4>
                </div>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {getScheduledMatches()
                    .slice(0, 5)
                    .map((match) => (
                      <div
                        key={match.id}
                        className="rounded border bg-green-50 p-2 text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-1 font-medium">
                          <span>
                            {match.homeTeam.shortName || match.homeTeam.name}
                          </span>
                          <span className="text-muted-foreground">vs</span>
                          <span>
                            {match.awayTeam.shortName || match.awayTeam.name}
                          </span>
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

        {/* DayPilot Calendar */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Grid</CardTitle>
              <CardDescription>
                Each column represents a different pitch. Drag matches to
                schedule them.
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
                    // Create ISO string directly without timezone conversion
                    const newStartTimeString = `${editStartDate}T${editStartTime}:00`;
                    // Get the match's actual division duration, not the filter state
                    const matchDivision = divisions.find(
                      (d) => d.id === editingMatch.group?.division.id
                    );
                    const matchDuration = matchDivision?.matchDuration || 90;

                    // Calculate end time manually to avoid timezone issues
                    const timeParts = editStartTime.split(':').map(Number);
                    const hours = timeParts[0] || 0;
                    const minutes = timeParts[1] || 0;
                    const totalMinutes = hours * 60 + minutes + matchDuration;
                    const endHours = Math.floor(totalMinutes / 60) % 24;
                    const endMinutes = totalMinutes % 60;
                    const newEndTimeString = `${editStartDate}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;

                    // Helper function to compare times without timezone issues
                    const timeToMinutes = (timeStr: string) => {
                      const [, timePart] = timeStr.split('T');
                      if (!timePart) return 0;
                      const timeParts = timePart.split(':').map(Number);
                      const h = timeParts[0] || 0;
                      const m = timeParts[1] || 0;
                      return h * 60 + m;
                    };

                    // Check for conflicts with other matches
                    const conflictingMatch = scheduledMatches.find((m) => {
                      if (m.id === editingMatch.id) return false; // Don't check against itself
                      if (!m.pitch || !m.startTime) return false;
                      if (m.pitch.id !== editingMatch.pitch?.id) return false;

                      // Check if they're on the same date
                      const [mDate] = m.startTime.split('T');
                      if (mDate !== editStartDate) return false;

                      // Compare times as minutes since midnight
                      const mStartMinutes = timeToMinutes(m.startTime);
                      const mEndMinutes = m.endTime
                        ? timeToMinutes(m.endTime)
                        : mStartMinutes + matchDuration;

                      const newStartMinutes = hours * 60 + minutes;
                      const newEndMinutes = newStartMinutes + matchDuration;

                      // Check if time ranges overlap
                      return (
                        mStartMinutes < newEndMinutes &&
                        mEndMinutes > newStartMinutes
                      );
                    });

                    if (conflictingMatch) {
                      // Extract time directly from ISO string to avoid timezone issues
                      const [, timePartWithZ] =
                        conflictingMatch.startTime.split('T');
                      const conflictTimeStr = timePartWithZ
                        ? timePartWithZ.slice(0, 5)
                        : '';
                      toast.error(
                        `Time slot conflicts with ${conflictingMatch.homeTeam.shortName || conflictingMatch.homeTeam.name} vs ${conflictingMatch.awayTeam.shortName || conflictingMatch.awayTeam.name} at ${conflictTimeStr}`
                      );
                      return;
                    }

                    // Check for team double-booking
                    const teamDoubleBooking = scheduledMatches.some((m) => {
                      if (m.id === editingMatch.id) return false;
                      if (!m.startTime) return false;

                      // Check if they're on the same date
                      const [mDate] = m.startTime.split('T');
                      if (mDate !== editStartDate) return false;

                      // Compare times as minutes since midnight
                      const mStartMinutes = timeToMinutes(m.startTime);
                      const mEndMinutes = m.endTime
                        ? timeToMinutes(m.endTime)
                        : mStartMinutes + matchDuration;

                      const newStartMinutes = hours * 60 + minutes;
                      const newEndMinutes = newStartMinutes + matchDuration;

                      const timeOverlap =
                        mStartMinutes < newEndMinutes &&
                        mEndMinutes > newStartMinutes;
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

                    // Update the match
                    const updatedMatch = {
                      ...editingMatch,
                      startTime: newStartTimeString,
                      endTime: newEndTimeString,
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
