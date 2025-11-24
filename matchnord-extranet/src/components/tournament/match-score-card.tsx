'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus, CheckCircle, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Match {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    shortName?: string;
  } | null;
  awayTeam: {
    id: string;
    name: string;
    shortName?: string;
  } | null;
  homeScore: number;
  awayScore: number;
  status: string;
  startTime: string | null;
  venue: {
    id: string;
    name: string;
  } | null;
  pitch: {
    id: string;
    name: string;
  } | null;
  group: {
    id: string;
    name: string;
    division: {
      id: string;
      name: string;
    };
  };
  scoreLogs?: Array<{
    id: string;
    homeScore: number;
    awayScore: number;
    updatedBy: {
      id: string;
      name: string | null;
      email: string | null;
    };
    createdAt: string;
  }>;
}

interface MatchScoreCardProps {
  match: Match;
  onUpdate: () => void;
  onClose: () => void;
}

export function MatchScoreCard({
  match: initialMatch,
  onUpdate,
  onClose,
}: MatchScoreCardProps) {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [homeScore, setHomeScore] = useState(match.homeScore);
  const [awayScore, setAwayScore] = useState(match.awayScore);
  const [isUpdating, setIsUpdating] = useState(false);

  // Refresh match data periodically (silently, without flicker)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const updatedMatch = await api.matches.getById(match.id);
        setMatch(updatedMatch as Match);
        // Only update local scores if they haven't been manually changed
        setHomeScore((prev) => {
          const newScore = (updatedMatch as Match).homeScore;
          // Only update if user hasn't changed it locally
          return prev === match.homeScore ? newScore : prev;
        });
        setAwayScore((prev) => {
          const newScore = (updatedMatch as Match).awayScore;
          return prev === match.awayScore ? newScore : prev;
        });
      } catch (error) {
        console.error('Error refreshing match:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [match.id, match.homeScore, match.awayScore]);

  const handleScoreUpdate = async () => {
    try {
      setIsUpdating(true);
      const updatedMatch = await api.matches.updateScore(
        match.id,
        homeScore,
        awayScore
      );
      setMatch(updatedMatch as Match);
      toast.success('Score updated', {
        description: 'Match score has been updated successfully.',
      });
      onUpdate();
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to update score',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickScoreChange = (
    team: 'home' | 'away',
    delta: number
  ) => {
    if (team === 'home') {
      const newScore = Math.max(0, homeScore + delta);
      setHomeScore(newScore);
    } else {
      const newScore = Math.max(0, awayScore + delta);
      setAwayScore(newScore);
    }
  };

  const handleFinishMatch = async () => {
    if (!confirm('Are you sure you want to mark this match as finished?')) {
      return;
    }

    try {
      setIsUpdating(true);
      const updatedMatch = await api.matches.updateStatus(match.id, 'FINISHED');
      setMatch(updatedMatch as Match);
      toast.success('Match finished', {
        description: 'Match has been marked as finished.',
      });
      onUpdate();
      // Close the modal after finishing
      onClose();
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to finish match',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReopenMatch = async () => {
    if (!confirm('Are you sure you want to reopen this match for editing?')) {
      return;
    }

    try {
      setIsUpdating(true);
      await api.matches.updateStatus(match.id, 'SCHEDULED');
      // Fetch full match data including events and score logs
      const updatedMatch = await api.matches.getById(match.id);
      setMatch(updatedMatch as Match);
      // Reset local scores to match the actual scores
      setHomeScore(updatedMatch.homeScore);
      setAwayScore(updatedMatch.awayScore);
      toast.success('Match reopened', {
        description: 'Match has been reopened and can now be edited.',
      });
      onUpdate();
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to reopen match',
      });
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Match Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">
            {match.homeTeam?.name || 'TBD'} vs {match.awayTeam?.name || 'TBD'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {match.group.division.name} - {match.group.name}
          </p>
        </div>
      </div>

      {/* Score Display and Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-6 items-center mb-6">
            {/* Home Team */}
            <div className="text-center space-y-4">
              <div className="font-semibold text-lg">
                {match.homeTeam?.name || 'TBD'}
              </div>
              {match.status !== 'FINISHED' ? (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickScoreChange('home', -1)}
                    disabled={isUpdating || homeScore === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) =>
                      setHomeScore(parseInt(e.target.value) || 0)
                    }
                    className="w-20 text-center text-2xl font-bold"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickScoreChange('home', 1)}
                    disabled={isUpdating}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-3xl font-bold text-muted-foreground">
                  {match.homeScore}
                </div>
              )}
            </div>

            {/* VS / Score Display */}
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold">
                {match.status === 'FINISHED' ? match.homeScore : homeScore} -{' '}
                {match.status === 'FINISHED' ? match.awayScore : awayScore}
              </div>
            </div>

            {/* Away Team */}
            <div className="text-center space-y-4">
              <div className="font-semibold text-lg">
                {match.awayTeam?.name || 'TBD'}
              </div>
              {match.status !== 'FINISHED' ? (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickScoreChange('away', -1)}
                    disabled={isUpdating || awayScore === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) =>
                      setAwayScore(parseInt(e.target.value) || 0)
                    }
                    className="w-20 text-center text-2xl font-bold"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickScoreChange('away', 1)}
                    disabled={isUpdating}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-3xl font-bold text-muted-foreground">
                  {match.awayScore}
                </div>
              )}
            </div>
          </div>
          {match.status !== 'FINISHED' && (
            <Button
              onClick={handleScoreUpdate}
              disabled={isUpdating}
              size="lg"
              variant="outline"
              className="w-full"
            >
              Update Score
            </Button>
          )}
          {match.status === 'FINISHED' && (
            <div className="text-center text-sm text-muted-foreground py-2">
              Match is finished. Score cannot be updated.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Finish Match Button */}
      {match.status !== 'FINISHED' && (
        <Card>
          <CardContent className="p-4">
            <Button
              onClick={handleFinishMatch}
              disabled={isUpdating}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finish Match
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reopen Match Button */}
      {match.status === 'FINISHED' && (
        <Card>
          <CardContent className="p-4">
            <Button
              onClick={handleReopenMatch}
              disabled={isUpdating}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reopen Match for Editing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Score Update Logs */}
      {match.scoreLogs && match.scoreLogs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4">Score Update History</h4>
            <div className="space-y-3">
              {match.scoreLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-1 border-b pb-3 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-base">
                      {log.homeScore} - {log.awayScore}
                    </span>
                    {log.createdAt && (
                      <span className="text-sm text-muted-foreground font-medium">
                        {(() => {
                          try {
                            const date = new Date(log.createdAt);
                            if (isNaN(date.getTime())) {
                              return 'Unknown date';
                            }
                            return date.toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            });
                          } catch {
                            return 'Unknown date';
                          }
                        })()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Updated by {log.updatedBy.name || log.updatedBy.email}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

