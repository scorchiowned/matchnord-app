'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, MapPin, Clock, Users, Play } from 'lucide-react';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { api } from '@/lib/api';

export default function MatchDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const matchData = await api.matches.getById(params.id);
        setMatch(matchData);
        if (!matchData) {
          notFound();
        }
      } catch (error) {
        console.error('Error fetching match:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatch();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <div className="container mx-auto py-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!match) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-100 text-red-800 animate-pulse';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'FINISHED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'LIVE';
      case 'SCHEDULED':
        return 'Upcoming';
      case 'FINISHED':
        return 'Finished';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'GOAL':
        return '⚽';
      case 'CARD_YELLOW':
        return '🟨';
      case 'CARD_RED':
        return '🟥';
      case 'SUBSTITUTION':
        return '🔄';
      default:
        return '•';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Back Navigation */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/results">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Results
              </Link>
            </Button>
          </div>

          {/* Match Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  {match.homeTeam.name} vs {match.awayTeam.name}
                </h1>
                <p className="text-xl text-muted-foreground">
                  {match.group.stage.division.tournament.name}
                </p>
              </div>
              <Badge
                className={`px-3 py-1 text-sm ${getStatusColor(match.status)}`}
              >
                {getStatusText(match.status)}
              </Badge>
            </div>
          </div>

          {/* Score Display */}
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8">
              <div className="grid grid-cols-3 items-center gap-8">
                <div className="text-center">
                  <div className="mb-2 text-2xl font-bold">
                    {match.homeTeam.name}
                  </div>
                  <div className="text-6xl font-bold text-primary">
                    {match.homeScore}
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <div className="text-sm text-muted-foreground">
                    Current Score
                  </div>
                  {match.status === 'LIVE' && (
                    <div className="text-lg font-semibold text-red-600">
                      Live
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <div className="mb-2 text-2xl font-bold">
                    {match.awayTeam.name}
                  </div>
                  <div className="text-6xl font-bold text-primary">
                    {match.awayScore}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Info Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Venue</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {match.venue?.name || 'TBD'}
                </div>
                <p className="text-xs text-muted-foreground">Stadium</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kickoff</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {match.startTime
                    ? new Date(match.startTime).toLocaleTimeString('fi-FI', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'TBD'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {match.startTime
                    ? new Date(match.startTime).toLocaleDateString('fi-FI', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'TBD'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Group</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{match.group.name}</div>
                <p className="text-xs text-muted-foreground">
                  Stage: {match.group.stage.name}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Division</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {match.group.stage.division.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tournament Division
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Match Events Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Match Events</CardTitle>
              <CardDescription>
                Timeline of all match events and key moments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {match.events && match.events.length > 0 ? (
                <div className="space-y-3">
                  {match.events.map((event: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 rounded-lg border p-3"
                    >
                      <div className="min-w-[60px] text-center">
                        <div className="text-lg font-bold">
                          {event.minute}&apos;
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">
                            {getEventIcon(event.type)}
                          </span>
                          <div>
                            <div className="font-medium">
                              {event.type === 'GOAL' &&
                                `${event.player?.firstName} ${event.player?.lastName} (Goal)`}
                              {event.type === 'CARD_YELLOW' &&
                                `${event.player?.firstName} ${event.player?.lastName} (Yellow Card)`}
                              {event.type === 'CARD_RED' &&
                                `${event.player?.firstName} ${event.player?.lastName} (Red Card)`}
                              {event.type === 'SUBSTITUTION' &&
                                `${event.player?.firstName} ${event.player?.lastName} (Substitution)`}
                            </div>
                            {event.team && (
                              <div className="text-sm text-muted-foreground">
                                Team: {event.team.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {event.team?.name || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No events recorded for this match yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {match.status === 'LIVE' && (
              <Button asChild>
                <Link href={`/matches/${match.id}`}>
                  <Play className="mr-2 h-4 w-4" />
                  Live Updates
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link
                href={`/tournaments/${match.group.stage.division.tournament.id}`}
              >
                <Trophy className="mr-2 h-4 w-4" />
                Tournament Details
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
