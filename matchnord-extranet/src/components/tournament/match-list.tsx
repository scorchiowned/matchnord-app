'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { Clock, Play, CheckCircle, Eye } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  shortName?: string;
}

interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  field?: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
  round?: string;
  matchNumber?: string | null;
}

interface MatchListProps {
  matches: Match[];
  showField?: boolean;
  showRound?: boolean;
  showViewButton?: boolean;
  groupByRound?: boolean;
}

export function MatchList({
  matches,
  showField = true,
  showRound = true,
  showViewButton = true,
  groupByRound = false,
}: MatchListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800 animate-pulse';
      case 'finished':
        return 'bg-gray-100 text-gray-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
      case 'cancelled':
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const formatMatchTime = (startTime: string) => {
    const date = new Date(startTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderMatch = (match: Match) => (
    <div
      key={match.id}
      className="flex items-center justify-between rounded-lg border p-4"
    >
      <div className="flex items-center space-x-4">
        {match.matchNumber && (
          <div className="text-sm font-semibold text-muted-foreground">
            {match.matchNumber}
          </div>
        )}
        <Badge className={getStatusColor(match.status)}>
          {getStatusIcon(match.status)}
          <span className="ml-1 capitalize">{match.status}</span>
        </Badge>
        <div className="text-sm text-muted-foreground">
          {formatMatchTime(match.startTime).date} at{' '}
          {formatMatchTime(match.startTime).time}
        </div>
        {showField && match.field && (
          <div className="text-sm text-muted-foreground">{match.field}</div>
        )}
        {showRound && match.round && (
          <div className="text-sm text-muted-foreground">{match.round}</div>
        )}
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-center">
          <div className="font-medium">{match.homeTeam.name}</div>
          <div className="text-2xl font-bold">{match.homeScore ?? '-'}</div>
        </div>
        <div className="text-muted-foreground">vs</div>
        <div className="text-center">
          <div className="font-medium">{match.awayTeam.name}</div>
          <div className="text-2xl font-bold">{match.awayScore ?? '-'}</div>
        </div>
      </div>

      {showViewButton && (
        <Button asChild size="sm" variant="outline">
          <Link href={`/matches/${match.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
      )}
    </div>
  );

  if (groupByRound) {
    const matchesByRound = matches.reduce(
      (acc, match) => {
        const round = match.round || 'Other';
        if (!acc[round]) {
          acc[round] = [];
        }
        acc[round].push(match);
        return acc;
      },
      {} as Record<string, Match[]>
    );

    return (
      <div className="space-y-6">
        {Object.entries(matchesByRound).map(([round, roundMatches]) => (
          <div key={round}>
            <h3 className="mb-4 text-lg font-semibold">{round}</h3>
            <div className="space-y-4">{roundMatches.map(renderMatch)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="space-y-4">{matches.map(renderMatch)}</div>;
}
