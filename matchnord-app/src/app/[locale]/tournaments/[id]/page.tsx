"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  usePublicTournament,
  useTournamentDivisions,
  useTournamentMatches,
  useTournamentTeams,
} from "@/hooks/use-tournaments";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: tournament,
    isLoading: tournamentLoading,
    error: tournamentError,
  } = usePublicTournament(tournamentId);

  const { data: divisions, isLoading: divisionsLoading } =
    useTournamentDivisions(tournamentId);

  const { data: matches, isLoading: matchesLoading } =
    useTournamentMatches(tournamentId);

  const { data: teams, isLoading: teamsLoading } =
    useTournamentTeams(tournamentId);

  if (tournamentError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Tournament Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The tournament you&apos;re looking for doesn&apos;t exist or is not available.
          </p>
          <Link href="/fi/tournaments">
            <Button>Back to Tournaments</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Tournament Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The tournament you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/fi/tournaments">
            <Button>Back to Tournaments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "Published";
      case "DRAFT":
        return "Draft";
      case "CANCELLED":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tournament Header */}
        <div className="mb-8">
          {/* Hero Image */}
          {tournament.heroImage && (
            <div className="mb-6">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden relative">
                <Image
                  src={tournament.heroImage}
                  alt={`${tournament.name} hero image`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Tournament Logo */}
            <div className="lg:w-1/3">
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center p-8 relative">
                {tournament.logo ? (
                  <Image
                    src={tournament.logo}
                    alt={`${tournament.name} logo`}
                    width={200}
                    height={200}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Trophy className="w-24 h-24 text-blue-600" />
                )}
              </div>
            </div>

            {/* Tournament Info */}
            <div className="lg:w-2/3">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    {tournament.name || 'Tournament Name TBD'}
                  </h1>
                  <p className="text-lg text-gray-600 mb-4">
                    {tournament.season || 'Season TBD'} • {tournament.country?.name || 'Location TBD'}
                  </p>
                </div>
                <Badge className={getStatusColor(tournament.status)}>
                  {getStatusText(tournament.status)}
                </Badge>
              </div>

              {tournament.description && (
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {tournament.description}
                </p>
              )}

              {/* Tournament Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Tournament Dates</div>
                    <div className="text-sm">
                      {format(new Date(tournament.startDate), "MMM d, yyyy")} -{" "}
                      {format(new Date(tournament.endDate), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-sm">
                      {tournament.city || 'City TBD'}, {tournament.country?.name || 'Country TBD'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Teams</div>
                    <div className="text-sm">
                      {teams?.length || 0} registered
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Trophy className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">Divisions</div>
                    <div className="text-sm">
                      {divisions?.length || 0} divisions
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              {(tournament.contactEmail || tournament.contactPhone) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Contact Information
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {tournament.contactEmail && (
                      <a
                        href={`mailto:${tournament.contactEmail}`}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {tournament.contactEmail}
                      </a>
                    )}
                    {tournament.contactPhone && (
                      <a
                        href={`tel:${tournament.contactPhone}`}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {tournament.contactPhone}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tournament Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="divisions">Divisions</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Matches */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {matchesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : matches && matches.length > 0 ? (
                    <div className="space-y-3">
                      {matches.slice(0, 5).map((match) => (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-medium">
                              {match.homeTeam?.name || "TBD"}
                            </div>
                            <div className="text-gray-500">vs</div>
                            <div className="text-sm font-medium">
                              {match.awayTeam?.name || "TBD"}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(match.startTime), "MMM d, HH:mm")}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No matches scheduled yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Tournament Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Teams</span>
                      <span className="font-semibold">
                        {teams?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Divisions</span>
                      <span className="font-semibold">
                        {divisions?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Matches</span>
                      <span className="font-semibold">
                        {matches?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <Badge className={getStatusColor(tournament.status)}>
                        {getStatusText(tournament.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="divisions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Divisions</CardTitle>
              </CardHeader>
              <CardContent>
                {divisionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : divisions && divisions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {divisions.map((division) => (
                      <div
                        key={division.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <h3 className="font-semibold text-lg mb-2">
                          {division.name || 'Division Name TBD'}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {division.description}
                        </p>
                        <div className="space-y-1 text-sm text-gray-500">
                          <div>Level: {division.level}</div>
                          <div>
                            Teams: {division.currentTeams}/{division.maxTeams}
                          </div>
                          <div>Format: {division.format || "Standard"}</div>
                        </div>
                        <Link
                          href={`/fi/tournaments/${tournamentId}/divisions/${division.id}`}
                        >
                          <Button className="w-full mt-3" size="sm">
                            View Division
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No divisions available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {matchesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : matches && matches.length > 0 ? (
                  <div className="space-y-3">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="font-medium">
                                {match.homeTeam?.name || "TBD"}
                              </div>
                              <div className="text-sm text-gray-500">Home</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">
                                {match.homeScore} - {match.awayScore}
                              </div>
                              <div className="text-sm text-gray-500">
                                {format(
                                  new Date(match.startTime),
                                  "MMM d, HH:mm"
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">
                                {match.awayTeam?.name || "TBD"}
                              </div>
                              <div className="text-sm text-gray-500">Away</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={
                                match.status === "LIVE"
                                  ? "bg-red-100 text-red-800"
                                  : match.status === "FINISHED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {match.status}
                            </Badge>
                            {match.venue && (
                              <div className="text-sm text-gray-500 mt-1">
                                {match.venue.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No matches scheduled
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
              </CardHeader>
              <CardContent>
                {teamsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : teams && teams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <h3 className="font-semibold text-lg mb-2">
                          {team.name || 'Team Name TBD'}
                        </h3>
                        {team.shortName && (
                          <p className="text-gray-600 text-sm mb-2">
                            ({team.shortName})
                          </p>
                        )}
                        <div className="space-y-1 text-sm text-gray-500">
                          {team.club && <div>Club: {team.club}</div>}
                          {team.city && <div>City: {team.city}</div>}
                          <div>Country: {team.country?.name || 'Unknown'}</div>
                          {team.level && <div>Level: {team.level}</div>}
                        </div>
                        <Link
                          href={`/fi/tournaments/${tournamentId}/teams/${team.id}`}
                        >
                          <Button className="w-full mt-3" size="sm">
                            View Team
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No teams registered yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
