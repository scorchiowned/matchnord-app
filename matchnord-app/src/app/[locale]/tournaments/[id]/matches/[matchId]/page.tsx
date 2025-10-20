"use client";

import { useParams } from "next/navigation";
import {
  usePublicTournament,
  useTournamentMatches,
} from "@/hooks/use-tournaments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Trophy,
  Users,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function TournamentMatchDetailsPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const matchId = params.matchId as string;
  const t = useTranslations();

  const {
    data: tournament,
    isLoading: tournamentLoading,
    error: tournamentError,
  } = usePublicTournament(tournamentId);
  const { data: matches, isLoading: matchesLoading } =
    useTournamentMatches(tournamentId);

  if (tournamentLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (tournamentError || !tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("common.error")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("tournament.details.matchNotFound")}
          </p>
          <I18nLink href={`/tournaments/${tournamentId}`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")} {t("tournament.details.tournament")}
            </Button>
          </I18nLink>
        </div>
      </div>
    );
  }

  // Find the specific match
  const match = matches?.find((m) => m.id === matchId);

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("tournament.details.matchNotFound")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("tournament.details.matchNotFoundDescription")}
          </p>
          <I18nLink href={`/tournaments/${tournamentId}`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")} {t("tournament.details.tournament")}
            </Button>
          </I18nLink>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <I18nLink href={`/tournaments/${tournamentId}`}>
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back")} {t("tournament.details.tournament")}
          </Button>
        </I18nLink>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {match.homeTeam?.name || "TBD"} vs {match.awayTeam?.name || "TBD"}
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            {tournament.name} • {tournament.season}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{format(new Date(match.startTime), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{format(new Date(match.startTime), "HH:mm")}</span>
            </div>
            {match.venue?.name && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{match.venue.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Match Score */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-gray-900 mb-2">
                {match.homeScore} - {match.awayScore}
              </div>
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {match.homeTeam?.name || "TBD"}
                  </div>
                  {match.homeTeam?.shortName && (
                    <div className="text-sm text-gray-600">
                      ({match.homeTeam.shortName})
                    </div>
                  )}
                </div>
                <div className="text-gray-400">vs</div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {match.awayTeam?.name || "TBD"}
                  </div>
                  {match.awayTeam?.shortName && (
                    <div className="text-sm text-gray-600">
                      ({match.awayTeam.shortName})
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match Details */}

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Match Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {t("tournament.details.matchInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("tournament.details.matchDate")}
                  </h4>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {format(new Date(match.startTime), "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("tournament.details.matchTime")}
                  </h4>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{format(new Date(match.startTime), "HH:mm")}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("tournament.details.status")}
                  </h4>
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
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("tournament.details.score")}
                  </h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {match.homeScore} - {match.awayScore}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  {t("tournament.details.tournamentInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("tournament.details.tournamentName")}
                  </h4>
                  <p className="text-gray-600">{tournament.name}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("tournament.details.season")}
                  </h4>
                  <p className="text-gray-600">{tournament.season || "TBD"}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("tournament.details.dates")}
                  </h4>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {format(new Date(tournament.startDate), "MMM d, yyyy")} -{" "}
                      {format(new Date(tournament.endDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("tournament.details.status")}
                  </h4>
                  <Badge
                    className={
                      tournament.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : tournament.status === "UPCOMING"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {tournament.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Home Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {t("tournament.details.homeTeam")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {match.homeTeam ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {t("tournament.details.teamName")}
                      </h4>
                      <p className="text-gray-600">{match.homeTeam.name}</p>
                    </div>

                    {match.homeTeam.shortName && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          {t("tournament.details.shortName")}
                        </h4>
                        <p className="text-gray-600">
                          {match.homeTeam.shortName}
                        </p>
                      </div>
                    )}

                    {match.homeTeam.club && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          {t("tournament.details.club")}
                        </h4>
                        <p className="text-gray-600">{match.homeTeam.club}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {t("tournament.details.location")}
                      </h4>
                      <p className="text-gray-600">
                        {match.homeTeam.city && `${match.homeTeam.city}, `}
                        {match.homeTeam.country?.name || "Unknown"}
                      </p>
                    </div>

                    <I18nLink
                      href={`/tournaments/${tournamentId}/teams/${match.homeTeam.id}`}
                    >
                      <Button className="w-full">
                        {t("common.view")} {t("tournament.details.team")}
                      </Button>
                    </I18nLink>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">
                      {t("tournament.details.teamTBD")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Away Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {t("tournament.details.awayTeam")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {match.awayTeam ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {t("tournament.details.teamName")}
                      </h4>
                      <p className="text-gray-600">{match.awayTeam.name}</p>
                    </div>

                    {match.awayTeam.shortName && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          {t("tournament.details.shortName")}
                        </h4>
                        <p className="text-gray-600">
                          {match.awayTeam.shortName}
                        </p>
                      </div>
                    )}

                    {match.awayTeam.club && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          {t("tournament.details.club")}
                        </h4>
                        <p className="text-gray-600">{match.awayTeam.club}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {t("tournament.details.location")}
                      </h4>
                      <p className="text-gray-600">
                        {match.awayTeam.city && `${match.awayTeam.city}, `}
                        {match.awayTeam.country?.name || "Unknown"}
                      </p>
                    </div>

                    <I18nLink
                      href={`/tournaments/${tournamentId}/teams/${match.awayTeam.id}`}
                    >
                      <Button className="w-full">
                        {t("common.view")} {t("tournament.details.team")}
                      </Button>
                    </I18nLink>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">
                      {t("tournament.details.teamTBD")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="venue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {t("tournament.details.venue")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {match.venue ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {t("tournament.details.venueName")}
                    </h4>
                    <p className="text-gray-600">{match.venue.name}</p>
                  </div>

                  {match.venue.streetName && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {t("tournament.details.address")}
                      </h4>
                      <p className="text-gray-600">{match.venue.streetName}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {t("tournament.details.location")}
                    </h4>
                    <p className="text-gray-600">
                      {tournament.city || "City TBD"},{" "}
                      {tournament.country?.name || "Country TBD"}
                    </p>
                  </div>

                  {match.venue.xCoordinate && match.venue.yCoordinate && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {t("tournament.details.coordinates")}
                      </h4>
                      <p className="text-gray-600 font-mono text-sm">
                        {match.venue.yCoordinate.toFixed(6)},{" "}
                        {match.venue.xCoordinate.toFixed(6)}
                      </p>
                    </div>
                  )}

                  <I18nLink
                    href={`/tournaments/${tournamentId}/venues/${match.venue.id}`}
                  >
                    <Button className="w-full">
                      {t("common.view")} {t("tournament.details.venue")}
                    </Button>
                  </I18nLink>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {t("tournament.details.venueTBD")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
