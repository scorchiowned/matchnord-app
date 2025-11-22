"use client";

import { useState } from "react";
import { Link as I18nLink, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Home, ChevronDown, Facebook, Instagram } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Division, Venue, Tournament } from "@/types/api";
import { format, eachDayOfInterval, parseISO } from "date-fns";

interface TournamentSecondaryNavProps {
  tournamentId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  divisions?: Division[];
  venues?: Venue[];
  activeDivisionId?: string;
  tournament?: Tournament;
}

export function TournamentSecondaryNav({
  tournamentId,
  activeTab,
  onTabChange,
  divisions = [],
  venues = [],
  activeDivisionId,
  tournament,
}: TournamentSecondaryNavProps) {
  const router = useRouter();
  const t = useTranslations();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Generate date range for the tournament
  const tournamentDates =
    tournament?.startDate && tournament?.endDate
      ? eachDayOfInterval({
          start: parseISO(tournament.startDate),
          end: parseISO(tournament.endDate),
        })
      : [];

  // Format division name for display (e.g., "P11 Elite (2014) 8v8")
  const formatDivisionName = (division: Division) => {
    const parts = [];
    if (division.name) parts.push(division.name);
    if (division.birthYear) parts.push(`(${division.birthYear})`);
    if (division.format) {
      // Extract player count from format if available
      const formatMatch = division.format.match(/(\d+)v(\d+)/i);
      if (formatMatch) {
        parts.push(formatMatch[0]);
      } else {
        parts.push(division.format);
      }
    }
    return parts.join(" ");
  };

  // Group divisions by age group for better organization
  const groupedDivisions = divisions.reduce((acc, division) => {
    const ageGroup = division.name?.match(/P(\d+)/)?.[1] || "Other";
    if (!acc[ageGroup]) {
      acc[ageGroup] = [];
    }
    acc[ageGroup].push(division);
    return acc;
  }, {} as Record<string, Division[]>);

  // Sort divisions within each group
  Object.keys(groupedDivisions).forEach((key) => {
    groupedDivisions[key].sort((a, b) => {
      // Sort by name first
      if (a.name && b.name) {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  });

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    tab: string
  ) => {
    e.preventDefault();
    // Let handleTabChange handle URL updates and query parameter clearing
    onTabChange(tab);
  };

  return (
    <nav className="bg-green-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left side navigation */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            <I18nLink
              href={`/tournaments/${tournamentId}`}
              className="flex items-center px-3 py-2 hover:bg-green-800 rounded transition-colors"
            >
              <Home className="w-5 h-5" />
            </I18nLink>

            {/* <I18nLink
              href={`/tournaments/${tournamentId}`}
              onClick={(e) => handleNavClick(e, "overview")}
              className="px-3 py-2 hover:bg-green-800 rounded transition-colors whitespace-nowrap text-sm font-medium"
            >
              {t("tournament.nav.tournamentSite") || "TURNAUSSIVUSTO"}
            </I18nLink> */}

            {/* <I18nLink
              href={`/tournaments/${tournamentId}?tab=bracket`}
              onClick={(e) => handleNavClick(e, "bracket")}
              className="px-3 py-2 hover:bg-green-800 rounded transition-colors whitespace-nowrap text-sm font-medium"
            >
              {t("tournament.nav.finals") || "FINAALIT"}
            </I18nLink> */}

            <I18nLink
              href={`/tournaments/${tournamentId}?tab=teams`}
              onClick={(e) => handleNavClick(e, "teams")}
              className="px-3 py-2 hover:bg-green-800 rounded transition-colors whitespace-nowrap text-sm font-medium"
            >
              {t("tournament.nav.registered") || "ILMOITTAUTUNEET"}
            </I18nLink>

            {venues.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center px-3 py-2 hover:bg-green-800 transition-colors whitespace-nowrap text-sm font-medium"
                    onMouseEnter={() => setHoveredItem("venues")}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <span>{t("tournament.nav.venues") || "PAIKAT"}</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-green-900 border-none text-white min-w-[200px] rounded-none"
                  align="start"
                >
                  {venues.map((venue) => (
                    <I18nLink
                      key={venue.id}
                      href={`/tournaments/${tournamentId}?tab=venues&venue=${venue.id}`}
                    >
                      <DropdownMenuItem className="cursor-pointer hover:bg-green-800 text-white focus:bg-green-800 rounded-none">
                        {venue.name}
                      </DropdownMenuItem>
                    </I18nLink>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <I18nLink
                href={`/tournaments/${tournamentId}?tab=venues`}
                onClick={(e) => handleNavClick(e, "venues")}
                className="px-3 py-2 hover:bg-green-800 transition-colors whitespace-nowrap text-sm font-medium"
              >
                {t("tournament.nav.venues") || "PAIKAT"}
              </I18nLink>
            )}

            {tournamentDates.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center px-3 py-2 hover:bg-green-800 transition-colors whitespace-nowrap text-sm font-medium"
                    onMouseEnter={() => setHoveredItem("days")}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <span>{t("tournament.nav.days") || "PÄIVÄT"}</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-green-900 border-none text-white min-w-[200px] max-h-[400px] overflow-y-auto rounded-none"
                  align="start"
                >
                  {tournamentDates.map((date) => {
                    const dateString = format(date, "yyyy-MM-dd");
                    // Format date as "Monday 1.1.2024" format
                    const displayDate = format(date, "EEEE d.M.yyyy");
                    return (
                      <I18nLink
                        key={dateString}
                        href={`/tournaments/${tournamentId}?tab=matches&date=${dateString}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onTabChange("matches");
                          // Navigate with date parameter, clearing other filters
                          const params = new URLSearchParams();
                          params.set("tab", "matches");
                          params.set("date", dateString);
                          // Use router from next-intl which handles locale prefixes
                          router.push(
                            `/tournaments/${tournamentId}?${params.toString()}`
                          );
                        }}
                      >
                        <DropdownMenuItem className="cursor-pointer hover:bg-green-800 text-white focus:bg-green-800 rounded-none">
                          {displayDate}
                        </DropdownMenuItem>
                      </I18nLink>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <I18nLink
                href={`/tournaments/${tournamentId}?tab=matches`}
                onClick={(e) => handleNavClick(e, "matches")}
                className="px-3 py-2 hover:bg-green-800 rounded transition-colors whitespace-nowrap text-sm font-medium"
              >
                {t("tournament.nav.days") || "PÄIVÄT"}
              </I18nLink>
            )}

            {divisions.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center px-3 py-2 hover:bg-green-800 transition-colors whitespace-nowrap text-sm font-medium",
                      activeTab === "divisions" && "bg-green-800"
                    )}
                    onMouseEnter={() => setHoveredItem("divisions")}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <span>{t("tournament.nav.divisions") || "SARJAT"}</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[600px] bg-green-900 border-none text-white p-4 rounded-none"
                  align="start"
                  onMouseEnter={() => setHoveredItem("divisions")}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(groupedDivisions)
                      .sort(([a], [b]) => {
                        // Sort age groups numerically
                        const numA = parseInt(a) || 999;
                        const numB = parseInt(b) || 999;
                        return numB - numA; // Descending order (older first)
                      })
                      .map(([, groupDivisions]) =>
                        groupDivisions.map((division) => (
                          <I18nLink
                            key={division.id}
                            href={`/tournaments/${tournamentId}?tab=matches&division=${division.id}`}
                          >
                            <DropdownMenuItem
                              className={cn(
                                "cursor-pointer hover:bg-green-800 text-white focus:bg-green-800 rounded-none",
                                activeDivisionId === division.id &&
                                  "bg-green-700 font-semibold"
                              )}
                            >
                              {formatDivisionName(division)}
                            </DropdownMenuItem>
                          </I18nLink>
                        ))
                      )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <I18nLink
                href={`/tournaments/${tournamentId}?tab=divisions`}
                onClick={(e) => handleNavClick(e, "divisions")}
                className="px-3 py-2 hover:bg-green-800 transition-colors whitespace-nowrap text-sm font-medium"
              >
                {t("tournament.nav.divisions") || "SARJAT"}
              </I18nLink>
            )}

            <I18nLink
              href={`/tournaments/${tournamentId}?tab=teams`}
              onClick={(e) => handleNavClick(e, "teams")}
              className="px-3 py-2 hover:bg-green-800 transition-colors whitespace-nowrap text-sm font-medium"
            >
              {t("tournament.nav.clubs") || "SEURAT"}
            </I18nLink>

            {/* <I18nLink
              href={`/tournaments/${tournamentId}`}
              onClick={(e) => handleNavClick(e, "overview")}
              className="px-3 py-2 hover:bg-green-800 rounded transition-colors whitespace-nowrap text-sm font-medium"
            >
              {t("tournament.nav.favorites") || "SUOSIKIT"}
            </I18nLink> */}

            {/* <I18nLink
              href={`/tournaments/${tournamentId}?tab=overview`}
              onClick={(e) => handleNavClick(e, "overview")}
              className="px-3 py-2 hover:bg-green-800 rounded transition-colors whitespace-nowrap text-sm font-medium"
            >
              {t("tournament.nav.rules") || "SÄÄNNÖT"}
            </I18nLink> */}
          </div>
        </div>
      </div>
    </nav>
  );
}
