"use client";

import { useParams } from "next/navigation";
import {
  usePublicTournament,
  useTournamentMatch,
} from "@/hooks/use-tournaments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Image from "next/image";

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
  
  const {
    data: match,
    isLoading: matchLoading,
    error: matchError,
  } = useTournamentMatch(tournamentId, matchId);

  if (tournamentLoading || matchLoading) {
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

  if (tournamentError || !tournament || matchError || !match) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {matchError ? t("tournament.details.matchNotFound") : t("common.error")}
          </h1>
          <p className="text-gray-600 mb-6">
            {matchError 
              ? t("tournament.details.matchNotFoundDescription")
              : t("common.error")
            }
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Button */}
      <I18nLink href={`/tournaments/${tournamentId}`}>
        <Button variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("common.back")}
        </Button>
      </I18nLink>

      {/* Match Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {match.matchNumber && (
            <span className="text-gray-500 mr-2">#{match.matchNumber}</span>
          )}
          {match.homeTeam?.name || "TBD"} vs {match.awayTeam?.name || "TBD"}
        </h1>
        <p className="text-gray-600">
          {tournament.name} • {tournament.season}
        </p>
      </div>

      {/* Score Display */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-8 mb-6">
            {/* Home Team Logo & Name */}
            <div className="flex flex-col items-center">
              {(() => {
                // Check for logo in team, then fallback to club logo
                const logo = match.homeTeam?.logo || 
                  (typeof match.homeTeam?.clubRef === 'object' ? match.homeTeam.clubRef?.logo : null);
                
                return logo ? (
                  <Image
                    src={logo}
                    alt={match.homeTeam?.name || "Home Team"}
                    width={80}
                    height={80}
                    className="mb-3 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                );
              })()}
              <h3 className="font-semibold text-lg">
                {match.homeTeam?.name || "TBD"}
              </h3>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center">
              <div className="text-6xl font-bold text-gray-900 mb-2">
                {match.homeScore} - {match.awayScore}
              </div>
              <div className="text-sm text-gray-500">vs</div>
            </div>

            {/* Away Team Logo & Name */}
            <div className="flex flex-col items-center">
              {(() => {
                // Check for logo in team, then fallback to club logo
                const logo = match.awayTeam?.logo || 
                  (typeof match.awayTeam?.clubRef === 'object' ? match.awayTeam.clubRef?.logo : null);
                
                return logo ? (
                  <Image
                    src={logo}
                    alt={match.awayTeam?.name || "Away Team"}
                    width={80}
                    height={80}
                    className="mb-3 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                );
              })()}
              <h3 className="font-semibold text-lg">
                {match.awayTeam?.name || "TBD"}
              </h3>
            </div>
          </div>

          <Badge
            className={
              match.status === "FINISHED"
                ? "bg-gray-800 text-white uppercase"
                : match.status === "LIVE"
                ? "bg-red-600 text-white uppercase"
                : "bg-gray-200 text-gray-800 uppercase"
            }
          >
            {match.status === "SCHEDULED" ? "Scheduled" : match.status}
          </Badge>
        </div>
      </div>

      {/* Match Details Table */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] gap-4 py-2 border-b">
              <div className="font-medium text-gray-700">
                {t("tournament.details.gameFormat")}
              </div>
              <div className="text-gray-900">
                {match.division?.matchDuration || 90} min
                {match.division?.format && ` • ${match.division.format}`}
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-4 py-2 border-b">
              <div className="font-medium text-gray-700">
                {t("tournament.details.matchDate")}
              </div>
              <div className="text-gray-900 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                {format(new Date(match.startTime), "MMMM d, yyyy")}
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-4 py-2 border-b">
              <div className="font-medium text-gray-700">
                {t("tournament.details.matchTime")}
              </div>
              <div className="text-gray-900 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                {format(new Date(match.startTime), "HH:mm")}
                {match.endTime &&
                  ` - ${format(new Date(match.endTime), "HH:mm")}`}
              </div>
            </div>

            {match.venue && (
              <div className="grid grid-cols-[120px_1fr] gap-4 py-2 border-b">
                <div className="font-medium text-gray-700">
                  {t("tournament.details.venue")}
                </div>
                <div className="text-gray-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  <I18nLink
                    href={`/tournaments/${tournamentId}/venues/${match.venue.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {match.venue.name}
                    {match.pitch && ` • ${match.pitch.name}`}
                  </I18nLink>
                </div>
              </div>
            )}

            {match.spectators !== undefined && match.spectators !== null && (
              <div className="grid grid-cols-[120px_1fr] gap-4 py-2">
                <div className="font-medium text-gray-700">
                  {t("tournament.details.spectators")}
                </div>
                <div className="text-gray-900">{match.spectators}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teams Section */}
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
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    {t("tournament.details.teamName")}
                  </div>
                  <div className="text-gray-900">{match.homeTeam.name}</div>
                </div>

                {match.homeTeam.club && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      {t("tournament.details.club")}
                    </div>
                    <div className="text-gray-900">{match.homeTeam.club}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    {t("tournament.details.location")}
                  </div>
                  <div className="text-gray-900">
                    {match.homeTeam.country?.name || "Unknown"}
                  </div>
                </div>

                <I18nLink
                  href={`/tournaments/${tournamentId}/teams/${match.homeTeam.id}`}
                  className="block mt-4"
                >
                  <Button variant="outline" className="w-full">
                    {t("common.view")} {t("tournament.details.teamDetails")}
                  </Button>
                </I18nLink>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">{t("tournament.details.teamTBD")}</p>
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
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    {t("tournament.details.teamName")}
                  </div>
                  <div className="text-gray-900">{match.awayTeam.name}</div>
                </div>

                {match.awayTeam.club && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      {t("tournament.details.club")}
                    </div>
                    <div className="text-gray-900">{match.awayTeam.club}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    {t("tournament.details.location")}
                  </div>
                  <div className="text-gray-900">
                    {match.awayTeam.country?.name || "Unknown"}
                  </div>
                </div>

                <I18nLink
                  href={`/tournaments/${tournamentId}/teams/${match.awayTeam.id}`}
                  className="block mt-4"
                >
                  <Button variant="outline" className="w-full">
                    {t("common.view")} {t("tournament.details.teamDetails")}
                  </Button>
                </I18nLink>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">{t("tournament.details.teamTBD")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
