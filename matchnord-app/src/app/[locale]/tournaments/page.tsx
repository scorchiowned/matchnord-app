"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Search,
  Loader2,
} from "lucide-react";
import { useTournaments } from "@/hooks/use-tournaments";
import Link from "next/link";
import Image from "next/image";


export default function TournamentsPage() {
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
            Error Loading Tournaments
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Tournaments
          </h1>
          <p className="text-lg text-gray-600">
            Discover and follow tournaments across the Nordic region
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tournaments..."
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
                <option value="">All Locations</option>
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
            <span className="ml-2 text-gray-600">Loading tournaments...</span>
          </div>
        )}

        {/* Tournaments Grid */}
        {!isLoading && tournaments && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 rounded-t-lg overflow-hidden relative">
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
                          width={120}
                          height={120}
                          className="max-w-full max-h-full object-contain drop-shadow-lg"
                        />
                      ) : (
                        <Trophy className="w-16 h-16 text-white drop-shadow-lg" />
                      )}
                    </div>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {tournament.name}
                  </CardTitle>
                  {tournament.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {tournament.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {tournament.city}, {tournament.country.name}
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                    {new Date(tournament.endDate).toLocaleDateString()}
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {tournament.teams?.length || 0} teams
                    {tournament.divisions &&
                      ` • ${tournament.divisions.length} divisions`}
                  </div>

                  <Link href={`/fi/tournaments/${tournament.id}`}>
                    <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                      View Tournament
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tournaments && tournaments.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tournaments found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
