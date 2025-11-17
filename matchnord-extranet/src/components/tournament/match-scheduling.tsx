'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Trophy } from 'lucide-react';
import { MatchSchedulerDayPilot as MatchScheduler } from './match-scheduler-daypilot';

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

interface Venue {
  id: string;
  name: string;
  pitches: Array<{
    id: string;
    name: string;
    number?: number;
    surface?: string;
    size?: string;
    isAvailable: boolean;
  }>;
}

interface Division {
  id: string;
  name: string;
  matchDuration: number;
  breakDuration: number;
  assignmentType: 'AUTO' | 'MANUAL';
  groups?: Array<{
    id: string;
    name: string;
  }>;
}

interface MatchSchedulingProps {
  tournamentId: string;
  divisionId?: string;
  groupId?: string;
  matches?: Match[];
  venues?: Venue[];
  division?: Division;
  divisions?: Division[];
}

export function MatchScheduling({
  tournamentId,
  divisionId: initialDivisionId,
  groupId: initialGroupId,
  matches: propMatches = [],
  venues: propVenues = [],
  division: propDivision = undefined,
  divisions: propDivisions = [],
}: MatchSchedulingProps) {
  const [matches, setMatches] = useState<Match[]>(propMatches);
  const [venues, setVenues] = useState<Venue[]>(propVenues);
  const selectedDivisionId = initialDivisionId || propDivisions[0]?.id || '';
  const selectedGroupId =
    initialGroupId || propDivisions[0]?.groups?.[0]?.id || '';
  const [division, setDivision] = useState<Division | undefined>(
    propDivision ||
      propDivisions.find((d) => d.id === selectedDivisionId) ||
      propDivisions[0] ||
      undefined
  );

  // Sync props with state when they change
  useEffect(() => {
    setMatches(propMatches);
  }, [propMatches]);

  useEffect(() => {
    setVenues(propVenues);
  }, [propVenues]);

  useEffect(() => {
    if (propDivision) {
      setDivision(propDivision);
    } else if (propDivisions.length > 0) {
      // When propDivisions changes, update to match the selected division or first one
      const updatedDivision =
        propDivisions.find((d) => d.id === division?.id) || propDivisions[0];
      setDivision(updatedDivision);
    }
  }, [propDivision, propDivisions, division?.id]);

  const fetchMatches = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/v1/tournaments/${tournamentId}/matches`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const matchesData = await response.json();
        setMatches(matchesData);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  }, [tournamentId]);

  // Fetch matches when division/group changes
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleScheduleChange = (updatedMatches: Match[]) => {
    setMatches(updatedMatches);
  };

  const getScheduledMatches = () => {
    return matches.filter(
      (match) => match.venue && match.pitch && match.startTime
    );
  };

  const getUnscheduledMatches = () => {
    return matches.filter(
      (match) => !match.venue || !match.pitch || !match.startTime
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Match Scheduling</span>
              </CardTitle>
              <CardDescription>
                Schedule matches on specific pitches and times. Use the division
                filter to view matches by division. Match duration and break
                settings are configured in the Divisions tab.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card> */}

      {/* Schedule Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{matches.length}</div>
                <div className="text-sm text-muted-foreground">
                  Total Matches
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {getScheduledMatches().length}
                </div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {getUnscheduledMatches().length}
                </div>
                <div className="text-sm text-muted-foreground">Unscheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduler */}
      {matches.length > 0 ? (
        <MatchScheduler
          tournamentId={tournamentId}
          divisionId={selectedDivisionId}
          groupId={selectedGroupId}
          matches={matches}
          venues={venues}
          divisions={propDivisions}
          onScheduleChange={handleScheduleChange}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              No matches to schedule
            </h3>
            <p className="mb-4 text-muted-foreground">
              Go to the Matches tab to generate matches first.
            </p>
            <div className="flex justify-center">
              <Button asChild>
                <a href="#matches">Go to Matches Tab</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
