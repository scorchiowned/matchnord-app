"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  usePublicTournament,
  useTournamentVenues,
  useTournamentMatches,
} from "@/hooks/use-tournaments";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Loader2 } from "lucide-react";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { MatchesTable } from "@/components/tournament/matches-table";

export default function TournamentVenueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const venueId = params.venueId as string;
  const t = useTranslations();

  const {
    data: tournament,
    isLoading: tournamentLoading,
    error: tournamentError,
  } = usePublicTournament(tournamentId);
  const { data: venues, isLoading: venuesLoading } =
    useTournamentVenues(tournamentId);
  const { data: allMatches, isLoading: matchesLoading } =
    useTournamentMatches(tournamentId);

  // Find the specific venue
  const venue = useMemo(() => {
    return venues?.find((v) => v.id === venueId);
  }, [venues, venueId]);

  // Filter matches for this venue
  const matches = useMemo(() => {
    if (!allMatches) return [];
    return allMatches.filter(
      (match) => match.venueId === venueId || match.venue?.id === venueId
    );
  }, [allMatches, venueId]);

  // Check if we came from another page
  const hasReferrer = typeof window !== "undefined" && document.referrer !== "";

  if (tournamentLoading || venuesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t("common.loading")}...</p>
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
            {t("tournament.details.venueNotFound")}
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


  if (!venue) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("tournament.details.venueNotFound")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("tournament.details.venueNotFoundDescription")}
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="mb-6">
          {hasReferrer ? (
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Button>
          ) : (
            <I18nLink href={`/tournaments/${tournamentId}`}>
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("common.back")} {t("tournament.title")}
              </Button>
            </I18nLink>
          )}
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {venue.name}
          </h1>
          <p className="text-gray-600">
            {tournament.name} • {tournament.season}
          </p>
        </div>

        {/* Venue Information and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Venue Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <MapPin className="w-5 h-5 mr-2 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t("tournament.details.venueInformation")}
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {t("tournament.details.venueName")}
                </h4>
                <p className="text-gray-600">{venue.name}</p>
              </div>

              {venue.streetName && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("tournament.details.address")}
                  </h4>
                  <p className="text-gray-600">{venue.streetName}</p>
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

              {venue.xCoordinate && venue.yCoordinate && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t("tournament.details.coordinates")}
                  </h4>
                  <p className="text-gray-600 font-mono text-sm">
                    {venue.yCoordinate.toFixed(6)}, {venue.xCoordinate.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          {venue.xCoordinate && venue.yCoordinate ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("tournament.details.locationMap")}
              </h2>
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    venue.xCoordinate - 0.01
                  },${venue.yCoordinate - 0.01},${venue.xCoordinate + 0.01},${
                    venue.yCoordinate + 0.01
                  }&layer=mapnik&marker=${venue.yCoordinate},${
                    venue.xCoordinate
                  }`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map of ${venue.name}`}
                />
              </div>
              <div className="mt-2 text-center">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${venue.yCoordinate}&mlon=${venue.xCoordinate}&zoom=15`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {t("tournament.details.viewLargerMap")}
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("tournament.details.locationMap")}
              </h2>
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2" />
                  <p>{t("tournament.details.noMapAvailable")}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Matches Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("tournament.tabs.matches")} - {venue.name}
            </h2>
          </div>
          <MatchesTable
            matches={matches}
            isLoading={matchesLoading}
            tournamentId={tournamentId}
          />
        </div>
      </div>
    </div>
  );
}
