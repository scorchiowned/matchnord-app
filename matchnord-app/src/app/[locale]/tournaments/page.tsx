"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Trophy, Search, Loader2 } from "lucide-react";
import { useTournaments } from "@/hooks/use-tournaments";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link as I18nLink } from "@/i18n/routing";

export default function TournamentsPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const {
    data: tournaments,
    isLoading,
    error,
  } = useTournaments({
    search: search || undefined,
    country: locationFilter || undefined,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t("pages.tournaments.errorLoading")}
          </h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
          <Button onClick={() => window.location.reload()}>
            {t("pages.tournaments.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t("pages.tournaments.title")}
          </h1>
          <p className="text-lg text-gray-600">
            {t("pages.tournaments.subtitle")}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t("pages.tournaments.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("pages.tournaments.allLocations")}</option>
                <option value="finland">Finland</option>
                <option value="sweden">Sweden</option>
                <option value="norway">Norway</option>
                <option value="denmark">Denmark</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">
              {t("pages.tournaments.loadingTournaments")}
            </span>
          </div>
        )}

        {/* Tournaments Table */}
        {!isLoading && tournaments && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                      Tournament
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Dates
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tournaments.map((tournament) => (
                    <tr key={tournament.id} className="hover:bg-gray-50">
                      {/* Tournament Info with Logo */}
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden relative flex items-center justify-center">
                              {tournament.heroImage ? (
                                <Image
                                  src={tournament.heroImage}
                                  alt={`${tournament.name} hero image`}
                                  fill
                                  className="object-cover"
                                />
                              ) : null}

                              {/* Logo overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                                {tournament.logo ? (
                                  <Image
                                    src={tournament.logo}
                                    alt={`${tournament.name} logo`}
                                    width={36}
                                    height={36}
                                    className="max-w-full max-h-full object-contain drop-shadow-lg"
                                    onError={(e) => {
                                      // Hide the logo on error and show trophy fallback
                                      e.currentTarget.style.display = "none";
                                      const fallback = e.currentTarget
                                        .nextElementSibling as HTMLElement;
                                      if (fallback)
                                        fallback.style.display = "block";
                                    }}
                                  />
                                ) : null}
                                <Trophy
                                  className="w-6 h-6 text-white drop-shadow-lg"
                                  style={{
                                    display: tournament.logo ? "none" : "block",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="ml-3 min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {tournament.name}
                            </div>
                            {tournament.description && (
                              <div
                                className="text-xs text-gray-500 line-clamp-1 mt-1"
                                dangerouslySetInnerHTML={{
                                  __html: tournament.description.replace(
                                    /&amp;/g,
                                    "&"
                                  ),
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                          <span className="truncate">
                            {tournament.city}, {tournament.country.name}
                          </span>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                          <span className="truncate">
                            {new Date(
                              tournament.startDate
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(tournament.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <I18nLink href={`/tournaments/${tournament.id}`}>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                          >
                            {t("pages.tournaments.viewTournament")}
                          </Button>
                        </I18nLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tournaments && tournaments.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("pages.tournaments.noTournamentsFound")}
            </h3>
            <p className="text-gray-600">
              {t("pages.tournaments.noTournamentsDescription")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
