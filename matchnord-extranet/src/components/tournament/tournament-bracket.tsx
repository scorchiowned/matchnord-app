'use client';

import { Badge } from '@/components/ui/badge';
import { Clock, Play, CheckCircle, Trophy } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  shortName?: string;
}

interface BracketMatch {
  id: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore?: number;
  awayScore?: number;
  round: string;
  status: 'upcoming' | 'live' | 'finished';
  matchDate?: string;
  field?: string;
}

interface TournamentBracketProps {
  matches: BracketMatch[];
  showDetails?: boolean;
}

export function TournamentBracket({
  matches,
  showDetails = true,
}: TournamentBracketProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800 animate-pulse';
      case 'finished':
        return 'bg-gray-100 text-gray-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="h-3 w-3" />;
      case 'finished':
        return <CheckCircle className="h-3 w-3" />;
      case 'upcoming':
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getRoundIcon = (round: string) => {
    if (round.toLowerCase().includes('final')) {
      return <Trophy className="h-4 w-4 text-yellow-600" />;
    }
    return null;
  };

  const formatMatchTime = (matchDate?: string) => {
    if (!matchDate) return null;
    const date = new Date(matchDate);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Group matches by round for better organization
  const matchesByRound = matches.reduce(
    (acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round]?.push(match);
      return acc;
    },
    {} as Record<string, BracketMatch[]>
  );

  // Sort rounds by typical tournament progression
  const roundOrder = ['Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'];
  const sortedRounds = Object.keys(matchesByRound).sort((a, b) => {
    const aIndex = roundOrder.findIndex((round) => a.includes(round));
    const bIndex = roundOrder.findIndex((round) => b.includes(round));
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="space-y-8">
      {sortedRounds.map((round) => (
        <div key={round} className="space-y-4">
          <div className="flex items-center space-x-2">
            {getRoundIcon(round)}
            <h3 className="text-lg font-semibold">{round}</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matchesByRound[round]?.map((match) => (
              <div key={match.id} className="rounded-lg border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(match.status)}>
                      {getStatusIcon(match.status)}
                      <span className="ml-1 capitalize">{match.status}</span>
                    </Badge>
                  </div>
                </div>

                {showDetails && match.matchDate && (
                  <div className="mb-4 text-sm text-muted-foreground">
                    {formatMatchTime(match.matchDate)?.date} at{' '}
                    {formatMatchTime(match.matchDate)?.time}
                    {match.field && ` • ${match.field}`}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {match.homeTeam?.name || 'TBD'}
                      </span>
                      {match.homeTeam?.shortName && (
                        <Badge variant="outline" className="text-xs">
                          {match.homeTeam.shortName}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xl font-bold">
                      {match.homeScore ?? '-'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {match.awayTeam?.name || 'TBD'}
                      </span>
                      {match.awayTeam?.shortName && (
                        <Badge variant="outline" className="text-xs">
                          {match.awayTeam.shortName}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xl font-bold">
                      {match.awayScore ?? '-'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {matches.length === 0 && (
        <div className="py-8 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Bracket Matches Yet</h3>
          <p className="text-muted-foreground">
            Bracket matches will be generated after group stage completion.
          </p>
        </div>
      )}
    </div>
  );
}
