"use client";

import { useParams } from "next/navigation";
import {
  usePublicTournament,
  useTournamentDivisions,
  useTournamentTeams,
} from "@/hooks/use-tournaments";
import { Button } from "@/components/ui/button";
import { Users, Trophy, ArrowLeft, Target, MapPin } from "lucide-react";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function TournamentDivisionDetailsPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const divisionId = params.divisionId as string;
  const t = useTranslations();

  const {
    data: tournament,
    isLoading: tournamentLoading,
    error: tournamentError,
  } = usePublicTournament(tournamentId);
  const { data: divisions } = useTournamentDivisions(tournamentId);
  const { data: teams } = useTournamentTeams(tournamentId);

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
            {t("tournament.details.divisionNotFound")}
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

  // Find the specific division
  const division = divisions?.find((d) => d.id === divisionId);

  if (!division) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("tournament.details.divisionNotFound")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("tournament.details.divisionNotFoundDescription")}
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

  // Filter teams for this division
  const divisionTeams =
    teams?.filter((team) => team.divisionId === divisionId) || [];

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
              {division.name || "Division Name TBD"}
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              {tournament.name} • {tournament.season}
            </p>
            {division.description && (
              <p className="text-gray-600 mb-4">{division.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>
                  {division.currentTeams}/{division.maxTeams}{" "}
                  {t("tournament.details.teams")}
                </span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-4 h-4 mr-1" />
                <span>
                  {t("tournament.details.level")}: {division.level}
                </span>
              </div>
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-1" />
                <span>
                  {t("tournament.details.format")}:{" "}
                  {division.format || "Standard"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Division Information */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Trophy className="w-5 h-5 mr-2 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("tournament.details.divisionInformation")}
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t("tournament.details.divisionName")}
              </h4>
              <p className="text-gray-600">
                {division.name || "Division Name TBD"}
              </p>
            </div>

            {division.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {t("tournament.details.description")}
                </h4>
                <p className="text-gray-600">{division.description}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t("tournament.details.level")}
              </h4>
              <p className="text-gray-600">{division.level}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t("tournament.details.format")}
              </h4>
              <p className="text-gray-600">{division.format || "Standard"}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {t("tournament.details.teamCapacity")}
              </h4>
              <p className="text-gray-600">
                {division.currentTeams} / {division.maxTeams}{" "}
                {t("tournament.details.teams")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Teams in Division */}
      {divisionTeams.length > 0 && (
        <div className="mt-6">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t("tournament.tabs.teams")} ({divisionTeams.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("tournament.details.teamName")}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("tournament.details.club")}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("tournament.details.location")}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      {t("tournament.details.level")}
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {divisionTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {team.name || "Team Name TBD"}
                          </div>
                          {team.shortName && (
                            <div className="text-sm text-gray-500">
                              ({team.shortName})
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {team.club || "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>
                            {team.city && `${team.city}, `}
                            {team.country?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {team.level || "-"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <I18nLink
                          href={`/tournaments/${tournamentId}/teams/${team.id}`}
                        >
                          <Button size="sm">{t("common.view")}</Button>
                        </I18nLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
