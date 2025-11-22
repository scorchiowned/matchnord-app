"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { TournamentSecondaryNav } from "@/components/tournament/tournament-secondary-nav";
import {
  usePublicTournament,
  useTournamentDivisions,
  useTournamentVenues,
} from "@/hooks/use-tournaments";
import type { Tournament } from "@/types/api";

interface TournamentLayoutProps {
  tournamentId: string;
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function TournamentLayout({
  tournamentId,
  children,
  activeTab = "overview",
  onTabChange,
}: TournamentLayoutProps) {
  const pathname = usePathname();

  const {
    data: tournament,
    isLoading: tournamentLoading,
  } = usePublicTournament(tournamentId);

  const { data: divisions } = useTournamentDivisions(tournamentId);
  const { data: venues } = useTournamentVenues(tournamentId);

  // Get active division ID from URL if viewing a division
  const activeDivisionId = useMemo(() => {
    const divisionMatch = pathname?.match(/\/divisions\/([^\/]+)/);
    return divisionMatch ? divisionMatch[1] : undefined;
  }, [pathname]);

  // Determine active tab from pathname if not provided
  const currentTab = useMemo(() => {
    if (activeTab) return activeTab;
    if (pathname?.includes("/divisions/")) return "divisions";
    if (pathname?.includes("/groups/")) return "matches";
    if (pathname?.includes("/teams/")) return "teams";
    if (pathname?.includes("/venues/")) return "venues";
    if (pathname?.includes("/matches/")) return "matches";
    if (pathname?.includes("/register")) return "register";
    return "overview";
  }, [pathname, activeTab]);

  // Default tab change handler if not provided
  const handleTabChange = onTabChange || ((tab: string) => {
    // Default implementation - could navigate to main tournament page with tab
    window.location.href = `/tournaments/${tournamentId}${tab !== "overview" ? `?tab=${tab}` : ""}`;
  });

  if (tournamentLoading || !tournament) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tournament Header */}
      <div>
        {/* Hero Image */}
        {tournament.heroImage && (
          <div>
            <div
              className="bg-gradient-to-br from-blue-100 to-green-100 overflow-hidden relative"
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

      {/* Tournament Secondary Navigation - Below the banner */}
      <TournamentSecondaryNav
        tournamentId={tournamentId}
        activeTab={currentTab}
        onTabChange={handleTabChange}
        divisions={divisions}
        venues={venues}
        activeDivisionId={activeDivisionId}
        tournament={tournament}
      />

      {/* Page Content */}
      {children}
    </div>
  );
}

