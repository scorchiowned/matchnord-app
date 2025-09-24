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
import { Calendar, Clock, MapPin, Trophy, Save } from 'lucide-react';
import { MatchScheduler } from './match-scheduler';
import { DivisionMatchSettings } from './division-match-settings';
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
}

interface MatchSchedulingProps {
  tournamentId: string;
  divisionId?: string;
  groupId?: string;
  matches?: Match[];
  venues?: Venue[];
  division?: Division;
}

export function MatchScheduling({
  tournamentId,
  divisionId,
  groupId,
  matches: propMatches = [],
  venues: propVenues = [],
  division: propDivision = null,
}: MatchSchedulingProps) {
  const [matches, setMatches] = useState<Match[]>(propMatches);
  const [venues, setVenues] = useState<Venue[]>(propVenues);
  const [division, setDivision] = useState<Division | null>(propDivision);
  const [showSettings, setShowSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync props with state when they change
  useEffect(() => {
    setMatches(propMatches);
  }, [propMatches]);

  useEffect(() => {
    setVenues(propVenues);
  }, [propVenues]);

  useEffect(() => {
    setDivision(propDivision);
  }, [propDivision]);

  const handleScheduleChange = (updatedMatches: Match[]) => {
    setMatches(updatedMatches);
  };

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
        setMatches(result.matches);
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Match Scheduling</span>
              </CardTitle>
              <CardDescription>
                Schedule matches on specific pitches and times. Drag and drop
                matches to assign them to venues and time slots.
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Clock className="mr-2 h-4 w-4" />
                {showSettings ? 'Hide' : 'Show'} Settings
              </Button>
            </div>
          </div>
        </CardHeader>
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
      {divisionId && groupId && (
        <MatchScheduler
          tournamentId={tournamentId}
          divisionId={divisionId}
          groupId={groupId}
          matches={matches}
          venues={venues}
          onScheduleChange={handleScheduleChange}
        />
      )}

      {/* No Matches Message */}
      {matches.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              No matches to schedule
            </h3>
            <p className="mb-4 text-muted-foreground">
              Generate matches first before scheduling them.
            </p>
            <div className="flex justify-center space-x-2">
              <Button
                onClick={handleGenerateMatches}
                disabled={!divisionId || !groupId || isSubmitting}
              >
                <Trophy className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Generating...' : 'Generate Matches'}
              </Button>
              <Button asChild variant="outline">
                <a href="#matches">Go to Matches Tab</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
