"use client";

import { useParams } from "next/navigation";
import {
  usePublicTournament,
  useTournamentVenues,
} from "@/hooks/use-tournaments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function TournamentVenueDetailsPage() {
  const params = useParams();
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

  if (tournamentLoading || venuesLoading) {
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

  // Find the specific venue
  const venue = venues?.find((v) => v.id === venueId);

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
              {venue.name}
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              {tournament.name} • {tournament.season}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {venue.streetName && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{venue.streetName}</span>
                </div>
              )}
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>
                  {tournament.city || "City TBD"},{" "}
                  {tournament.country?.name || "Country TBD"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venue Information */}
        <div className="bg-white rounded-lg p-6">
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
          <div className="bg-white rounded-lg p-6">
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
          <div className="bg-white rounded-lg p-6">
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
    </div>
  );
}
