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
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  UserPlus,
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
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link as I18nLink } from "@/i18n/routing";

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  const t = useTranslations();
  const locale = useLocale();

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
            {t("tournament.tournamentNotFound")}
          </p>
          <I18nLink href="/tournaments">
            <Button>
              {t("common.back")} {t("navigation.tournaments")}
            </Button>
          </I18nLink>
        </div>
      </div>
    );
  }

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t("common.loading")}...</p>
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
            {t("tournament.tournamentNotFound")}
          </p>
          <I18nLink href="/tournaments">
            <Button>
              {t("common.back")} {t("navigation.tournaments")}
            </Button>
          </I18nLink>
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
              <div
                className="bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden relative"
                style={{ height: "300px" }}
              >
                <Image
                  src={tournament.heroImage}
                  alt={`${tournament.name} hero image`}
                  fill
                  className="object-cover w-full"
                  style={{ maxHeight: "300px", height: "100%" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tournament Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mb-8"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              {t("tournament.tabs.overview")}
            </TabsTrigger>
            <TabsTrigger value="divisions">
              {t("tournament.tabs.divisions")}
            </TabsTrigger>
            <TabsTrigger value="teams">
              {t("tournament.tabs.teams")}
            </TabsTrigger>
            <TabsTrigger value="matches">
              {t("tournament.tabs.matches")}
            </TabsTrigger>
            <TabsTrigger value="register">
              {t("tournament.tabs.register")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {/* Tournament Summary */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    {tournament.name || "Tournament Name TBD"}
                  </h1>
                  <p className="text-lg text-gray-600 mb-2">
                    {tournament.season || "Season TBD"} •{" "}
                    {tournament.country?.name || "Location TBD"}
                  </p>
                  <div className="flex items-center text-gray-600 mb-4">
                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                    <div className="text-sm">
                      {format(new Date(tournament.startDate), "MMM d, yyyy")} -{" "}
                      {format(new Date(tournament.endDate), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tournament Details with Logo */}
              <div className="flex gap-4 mb-6">
                {/* Tournament Description - 10/12 width */}
                <div className="flex-1 w-10/12">
                  {/* Tournament Description */}
                  {tournament.description && (
                    <div className="mb-6">
                      <div
                        className="text-gray-700 leading-relaxed prose prose-gray max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: tournament.description,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Tournament Logo - 2/12 width */}
                <div className="w-2/12 flex-shrink-0">
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center p-4 relative">
                    {tournament.logo ? (
                      <Image
                        src={tournament.logo}
                        alt={`${tournament.name} logo`}
                        width={150}
                        height={150}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Trophy className="w-16 h-16 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Venue Map */}
            {tournament.venues &&
              tournament.venues.length > 0 &&
              tournament.venues[0].xCoordinate &&
              tournament.venues[0].yCoordinate && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {t("tournament.details.venue")}{" "}
                    {t("tournament.details.location")}
                  </h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900">
                        {tournament.venues[0].name}
                      </h4>
                      {tournament.venues[0].streetName && (
                        <p className="text-sm text-gray-600 mt-1">
                          {tournament.venues[0].streetName}
                        </p>
                      )}
                    </div>
                    <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                          tournament.venues[0].xCoordinate - 0.01
                        },${tournament.venues[0].yCoordinate - 0.01},${
                          tournament.venues[0].xCoordinate + 0.01
                        },${
                          tournament.venues[0].yCoordinate + 0.01
                        }&layer=mapnik&marker=${
                          tournament.venues[0].yCoordinate
                        },${tournament.venues[0].xCoordinate}`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Map of ${tournament.venues[0].name}`}
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${tournament.venues[0].yCoordinate}&mlon=${tournament.venues[0].xCoordinate}&zoom=15`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        {t("tournament.details.viewLargerMap")}
                      </a>
                    </div>
                  </div>
                </div>
              )}

            {/* Contact Information */}
            {(tournament.contactEmail || tournament.contactPhone) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t("tournament.details.contactInformation")}
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
          </TabsContent>

          <TabsContent value="divisions" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("tournament.tabs.divisions")}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tournament.divisions")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teams
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Format
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {divisionsLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        </td>
                      </tr>
                    ) : divisions && divisions.length > 0 ? (
                      divisions.map((division) => (
                        <tr key={division.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {division.name || "Division Name TBD"}
                              </div>
                              {division.description && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {division.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {division.level}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {division.currentTeams}/{division.maxTeams}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {division.format || "Standard"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <I18nLink
                              href={`/tournaments/${tournamentId}/divisions/${division.id}`}
                            >
                              <Button size="sm">{t("common.view")}</Button>
                            </I18nLink>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          {t("tournament.details.noDivisionsAvailable")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matches" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("tournament.tabs.matches")}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Home Team
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Away Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Venue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matchesLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        </td>
                      </tr>
                    ) : matches && matches.length > 0 ? (
                      matches.map((match) => (
                        <tr key={match.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {match.homeTeam?.name || "TBD"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-lg font-bold text-gray-900">
                              {match.homeScore} - {match.awayScore}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {match.awayTeam?.name || "TBD"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {format(new Date(match.startTime), "MMM d, yyyy")}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(match.startTime), "HH:mm")}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {match.venue?.name || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
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
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          {t("tournament.details.noMatchesScheduled")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("tournament.tabs.teams")}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Club
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamsLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        </td>
                      </tr>
                    ) : teams && teams.length > 0 ? (
                      teams.map((team) => (
                        <tr key={team.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {team.name || "Team Name TBD"}
                              </div>
                              {team.shortName && (
                                <div className="text-sm text-gray-500">
                                  ({team.shortName})
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {team.club || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              {team.city && <div>{team.city}</div>}
                              <div className="text-gray-500">
                                {team.country?.name || "Unknown"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {team.level || "-"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <I18nLink
                              href={`/tournaments/${tournamentId}/teams/${team.id}`}
                            >
                              <Button size="sm">{t("common.view")}</Button>
                            </I18nLink>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          {t("tournament.details.noTeamsRegistered")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  {t("tournament.tabs.register")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tournament.isLocked ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t("registration.tournamentLocked")}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {t("registration.tournamentLockedDescription")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("registration.tournamentLockedReason")}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserPlus className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t("tournament.registration.title")}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {t("tournament.registration.description")}
                    </p>
                    <I18nLink href={`/tournaments/${tournamentId}/register`}>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        {t("tournament.registration.registerTeam")}
                      </Button>
                    </I18nLink>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
