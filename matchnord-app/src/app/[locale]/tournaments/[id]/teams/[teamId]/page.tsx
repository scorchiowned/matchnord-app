"use client";

import { useParams } from "next/navigation";
import {
  usePublicTournament,
  useTournamentTeams,
  useTournamentDivisions,
} from "@/hooks/use-tournaments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, ArrowLeft, MapPin, Award } from "lucide-react";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function TournamentTeamDetailsPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const teamId = params.teamId as string;
  const t = useTranslations();

  const {
    data: tournament,
    isLoading: tournamentLoading,
    error: tournamentError,
  } = usePublicTournament(tournamentId);
  const { data: teams, isLoading: teamsLoading } =
    useTournamentTeams(tournamentId);
  const { data: divisions, isLoading: divisionsLoading } =
    useTournamentDivisions(tournamentId);

  if (tournamentLoading || teamsLoading || divisionsLoading) {
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
            {t("tournament.details.teamNotFound")}
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

  // Find the specific team
  const team = teams?.find((t) => t.id === teamId);

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("tournament.details.teamNotFound")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("tournament.details.teamNotFoundDescription")}
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

  // Get the team's division (already included in team object)
  const teamDivision = team.division;

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

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {team.name || "Team Name TBD"}
            </h1>
            {team.shortName && (
              <p className="text-lg text-gray-600 mb-2">({team.shortName})</p>
            )}
            <p className="text-lg text-gray-600 mb-4">
              {tournament.name} • {tournament.season}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {team.club && (
                <div className="flex items-center">
                  {typeof team.club === "object" && team.club?.logo ? (
                    <img
                      src={team.club.logo}
                      alt={`${team.club.name} logo`}
                      className="w-4 h-4 mr-1 rounded-full object-cover"
                    />
                  ) : (
                    <Award className="w-4 h-4 mr-1" />
                  )}
                  <span>
                    {typeof team.club === "string"
                      ? team.club
                      : team.club?.name}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>
                  {team.city && `${team.city}, `}
                  {team.country?.name || "Unknown"}
                </span>
              </div>
              {team.level && (
                <div className="flex items-center">
                  <Trophy className="w-4 h-4 mr-1" />
                  <span>
                    {t("tournament.details.level")}: {team.level}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Information */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 mr-2 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("tournament.details.teamInformation")}
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t("tournament.details.teamName")}
              </h4>
              <p className="text-gray-600">{team.name || "Team Name TBD"}</p>
            </div>

            {team.shortName && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {t("tournament.details.shortName")}
                </h4>
                <p className="text-gray-600">{team.shortName}</p>
              </div>
            )}

            {team.club && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {t("tournament.details.club")}
                </h4>
                <div className="flex items-center gap-2">
                  {typeof team.club === "object" && team.club?.logo ? (
                    <img
                      src={team.club.logo}
                      alt={`${team.club.name} logo`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : null}
                  <p className="text-gray-600">
                    {typeof team.club === "string"
                      ? team.club
                      : team.club?.name}
                  </p>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t("tournament.details.location")}
              </h4>
              <p className="text-gray-600">
                {team.city && `${team.city}, `}
                {team.country?.name || "Unknown"}
              </p>
            </div>

            {team.level && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {t("tournament.details.level")}
                </h4>
                <p className="text-gray-600">{team.level}</p>
              </div>
            )}
            {teamDivision && (
              <I18nLink
                href={`/tournaments/${tournamentId}/divisions/${teamDivision.id}`}
              >
                {t("tournament.details.division")}
              </I18nLink>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
