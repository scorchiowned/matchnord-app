"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  Users,
  Trophy,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useLiveMatches } from "@/hooks/use-matches";
import Link from "next/link";
import { format } from "date-fns";
import { useState, useEffect } from "react";

export default function LiveMatchesPage() {
  const { data: liveMatches, isLoading, error, isFetching } = useLiveMatches();
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected"
  >("connected");

  // Simulate connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(Math.random() > 0.1 ? "connected" : "disconnected");
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Live Matches
          </h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Live Matches
              </h1>
              <p className="text-lg text-gray-600">
                Follow matches happening right now across all tournaments
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {connectionStatus === "connected" ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    connectionStatus === "connected"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {connectionStatus === "connected" ? "Live" : "Offline"}
                </span>
              </div>

              {/* Refresh Indicator */}
              {isFetching && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading live matches...</span>
          </div>
        )}

        {/* Live Matches */}
        {!isLoading && liveMatches && (
          <>
            {liveMatches.length > 0 ? (
              <div className="space-y-6">
                {liveMatches.map((match) => (
                  <Card
                    key={match.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                          Live Match
                        </CardTitle>
                        <Badge className="bg-red-100 text-red-800 animate-pulse">
                          LIVE
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Match Score */}
                        <div className="lg:col-span-2">
                          <div className="flex items-center justify-between">
                            <div className="text-center flex-1">
                              <div className="text-2xl font-bold mb-2">
                                {match.homeTeam?.name || "TBD"}
                              </div>
                              <div className="text-sm text-gray-500">Home</div>
                            </div>

                            <div className="text-center mx-8">
                              <div className="text-4xl font-bold text-blue-600 mb-2">
                                {match.homeScore} - {match.awayScore}
                              </div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(match.startTime), "HH:mm")}
                              </div>
                            </div>

                            <div className="text-center flex-1">
                              <div className="text-2xl font-bold mb-2">
                                {match.awayTeam?.name || "TBD"}
                              </div>
                              <div className="text-sm text-gray-500">Away</div>
                            </div>
                          </div>
                        </div>

                        {/* Match Info */}
                        <div className="space-y-4">
                          {match.venue && (
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span className="text-sm">
                                {match.venue.name}
                              </span>
                            </div>
                          )}

                          {match.group && (
                            <div className="flex items-center text-gray-600">
                              <Trophy className="w-4 h-4 mr-2" />
                              <span className="text-sm">
                                {match.group.name}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                              Started{" "}
                              {format(
                                new Date(match.startTime),
                                "MMM d, HH:mm"
                              )}
                            </span>
                          </div>

                          {match.referee && (
                            <div className="flex items-center text-gray-600">
                              <Users className="w-4 h-4 mr-2" />
                              <span className="text-sm">
                                Ref: {match.referee}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Match Actions */}
                      <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Last updated: {format(new Date(), "HH:mm:ss")}
                          </div>
                          <div className="space-x-2">
                            <Link href={`/fi/matches/${match.id}`}>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </Link>
                            <Link
                              href={`/fi/tournaments/${match.tournamentId}`}
                            >
                              <Button size="sm">Tournament</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Live Matches
                </h3>
                <p className="text-gray-600 mb-6">
                  There are currently no matches being played live.
                </p>
                <div className="space-x-4">
                  <Link href="/fi/tournaments">
                    <Button>Browse Tournaments</Button>
                  </Link>
                  <Link href="/fi/results">
                    <Button variant="outline">View Results</Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {/* Auto-refresh notice */}
        {liveMatches && liveMatches.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              This page automatically refreshes every 30 seconds to show live
              updates
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
