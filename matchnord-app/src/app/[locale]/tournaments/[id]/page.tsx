"use client";

import {
  useParams,
  useSearchParams,
  useRouter,
  usePathname,
} from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Trophy,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { BracketVisualization } from "@/components/tournament/bracket-visualization";
import { FinalStandings } from "@/components/tournament/final-standings";
import { MatchesTable } from "@/components/tournament/matches-table";
import { TournamentSecondaryNav } from "@/components/tournament/tournament-secondary-nav";
import {
  usePublicTournament,
  useTournamentDivisions,
  useTournamentMatches,
  useTournamentTeams,
  useTournamentGroups,
  useTournamentVenues,
} from "@/hooks/use-tournaments";
import Image from "next/image";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Link as I18nLink } from "@/i18n/routing";
import type { Match, Team } from "@/types/api";

export default function TournamentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tournamentId = params.id as string;
  const t = useTranslations();

  // Valid tabs list (memoized to avoid recreating on every render)
  const validTabs = useMemo(
    () => [
      "overview",
      "divisions",
      "teams",
      "matches",
      "bracket",
      "venues",
      "register",
    ],
    []
  );

  // Get initial tab from URL or default to "overview"
  const tabFromUrl = searchParams.get("tab");
  const initialTab =
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab state with URL
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (
      currentTab &&
      validTabs.includes(currentTab) &&
      currentTab !== activeTab
    ) {
      setActiveTab(currentTab);
    }
  }, [searchParams, activeTab, validTabs]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const queryString = params.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  };

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

  const { data: groups, isLoading: groupsLoading } =
    useTournamentGroups(tournamentId);

  const { data: venues, isLoading: venuesLoading } =
    useTournamentVenues(tournamentId);

  // Get active division ID from URL if viewing a division
  const activeDivisionId = useMemo(() => {
    const divisionMatch = pathname?.match(/\/divisions\/([^\/]+)/);
    return divisionMatch ? divisionMatch[1] : undefined;
  }, [pathname]);

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
        activeTab={activeTab}
        onTabChange={handleTabChange}
        divisions={divisions}
        venues={venues}
        activeDivisionId={activeDivisionId}
        tournament={tournament}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tournament Content */}
        <div className="bg-white min-h-[600px]">
          {activeTab === "overview" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                        {format(new Date(tournament.startDate), "MMM d, yyyy")}{" "}
                        - {format(new Date(tournament.endDate), "MMM d, yyyy")}
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
            </div>
          )}

          {activeTab === "divisions" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                                <I18nLink
                                  href={`/tournaments/${tournamentId}/divisions/${division.id}`}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {division.name || "Division Name TBD"}
                                </I18nLink>
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
            </div>
          )}

          {activeTab === "teams" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                          {t("tournament.divisions")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("tournament.groups")}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("common.actions")}
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
                        teams
                          .filter((team) => {
                            // Filter out placeholder teams using the isPlaceholder flag from API
                            return !team.isPlaceholder;
                          })
                          .map((team) => {
                            // Find groups that contain this team
                            const teamGroups =
                              groups?.filter((group) =>
                                group.teams?.some(
                                  (t: { id: string }) => t.id === team.id
                                )
                              ) || [];

                            return (
                              <tr key={team.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <I18nLink
                                    href={`/tournaments/${tournamentId}/teams/${team.id}/matches`}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {team.name || "Team Name TBD"}
                                  </I18nLink>
                                  {team.shortName && (
                                    <div className="text-sm text-gray-500">
                                      ({team.shortName})
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    {typeof team.club === "object" &&
                                    team.club?.logo ? (
                                      <Image
                                        src={team.club.logo}
                                        alt={`${team.club.name} logo`}
                                        width={24}
                                        height={24}
                                        className="w-6 h-6 rounded-full object-cover"
                                      />
                                    ) : null}
                                    <span>
                                      {typeof team.club === "string"
                                        ? team.club
                                        : team.club?.name || "-"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {team.division?.id ? (
                                    <I18nLink
                                      href={`/tournaments/${tournamentId}/divisions/${team.division.id}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {team.division.name}
                                    </I18nLink>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {teamGroups.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {teamGroups.map((group) => (
                                        <I18nLink
                                          key={group.id}
                                          href={`/tournaments/${tournamentId}/groups/${group.id}`}
                                          className="text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                          {group.name}
                                        </I18nLink>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <I18nLink
                                    href={`/tournaments/${tournamentId}/teams/${team.id}/matches`}
                                  >
                                    <Button size="sm">
                                      {t("common.view")}
                                    </Button>
                                  </I18nLink>
                                </td>
                              </tr>
                            );
                          })
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
            </div>
          )}

          {activeTab === "matches" && (
            <MatchesTable
              matches={matches || []}
              isLoading={matchesLoading}
              tournamentId={tournamentId}
            />
          )}

          {activeTab === "bracket" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("tournament.tabs.bracket") || "Knockout Bracket"}
                  </h3>
                </div>
                <div className="p-6">
                  {matchesLoading || groupsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : matches && matches.length > 0 ? (
                    (() => {
                      // Filter bracket matches - matches in groups with bracket-related names
                      // or matches without a groupId (indicating knockout stage)
                      // Also include matches with placeholder teams (pos-, winner-, loser-)
                      const bracketRoundNames = [
                        "final",
                        "semi-final",
                        "quarter-final",
                        "round of 16",
                        "round of 8",
                        "third place",
                        "playoff",
                        "knockout",
                        "championship",
                        "consolation",
                        "placement",
                      ];

                      // Exclude group stage matches (groups named "Group A", "Group B", etc.)
                      const groupStagePattern = /^group\s+[a-z]$/i;

                      // Check if a team is a placeholder (has placeholder ID or notes)
                      const isPlaceholderTeam = (
                        team: Team | null | undefined
                      ) => {
                        if (!team?.id) return false;
                        // Check isPlaceholder flag first
                        if (team.isPlaceholder) {
                          return true;
                        }
                        // Check by ID pattern
                        if (
                          team.id.startsWith("pos-") ||
                          team.id.startsWith("winner-") ||
                          team.id.startsWith("loser-")
                        ) {
                          return true;
                        }
                        // Check by notes (for saved placeholder teams) - notes may exist at runtime
                        if ("notes" in team && team.notes) {
                          try {
                            const notes = JSON.parse(team.notes as string);
                            return notes.type === "placeholder";
                          } catch {
                            // Not JSON, ignore
                          }
                        }
                        return false;
                      };

                      // Group bracket matches by bracket group
                      const bracketGroups = new Map<string, typeof matches>();

                      matches.forEach((match) => {
                        // Include matches with placeholder teams
                        if (
                          isPlaceholderTeam(match.homeTeam) ||
                          isPlaceholderTeam(match.awayTeam)
                        ) {
                          const groupName = match.group?.name || "Bracket";
                          if (!bracketGroups.has(groupName)) {
                            bracketGroups.set(groupName, []);
                          }
                          bracketGroups.get(groupName)?.push(match);
                          return;
                        }

                        // Exclude group stage matches
                        const groupName =
                          match.group?.name?.toLowerCase() || "";
                        if (groupStagePattern.test(groupName)) {
                          return;
                        }

                        // Check if match is in a bracket group
                        const isBracketGroup = bracketRoundNames.some((name) =>
                          groupName.includes(name)
                        );

                        if (isBracketGroup || !match.groupId) {
                          const bracketName = match.group?.name || "Bracket";
                          if (!bracketGroups.has(bracketName)) {
                            bracketGroups.set(bracketName, []);
                          }
                          bracketGroups.get(bracketName)?.push(match);
                        }
                      });

                      // Transform matches for BracketVisualization
                      const transformMatchForVisualization = (
                        match: Match,
                        matchNumber: number,
                        roundNumber: number
                      ) => {
                        // Determine round label from group name or match notes
                        let roundLabel = match.group?.name || "Bracket";
                        const groupName =
                          match.group?.name?.toLowerCase() || "";

                        // Try to parse round from match notes
                        if (match.notes) {
                          try {
                            const notes = JSON.parse(match.notes);
                            if (notes.roundLabel) {
                              roundLabel = notes.roundLabel;
                            } else if (notes.round) {
                              // Map round number to label
                              const totalRounds = Math.max(
                                ...Array.from(bracketGroups.values())
                                  .flat()
                                  .map((m: Match) => {
                                    try {
                                      const n = JSON.parse(m.notes || "{}");
                                      return n.round || 1;
                                    } catch {
                                      return 1;
                                    }
                                  })
                              );
                              if (notes.round === totalRounds)
                                roundLabel = "Final";
                              else if (notes.round === totalRounds - 1)
                                roundLabel = "Semi-Final";
                              else if (notes.round === totalRounds - 2)
                                roundLabel = "Quarter-Final";
                              else roundLabel = `Round ${notes.round}`;
                            }
                          } catch {
                            // Not JSON, use group name
                          }
                        }

                        // Infer round from group name if not in notes
                        if (
                          groupName.includes("final") &&
                          !groupName.includes("semi") &&
                          !groupName.includes("quarter")
                        ) {
                          roundLabel = "Final";
                        } else if (groupName.includes("semi")) {
                          roundLabel = "Semi-Final";
                        } else if (groupName.includes("quarter")) {
                          roundLabel = "Quarter-Final";
                        }

                        const status =
                          match.status === "LIVE"
                            ? "live"
                            : match.status === "FINISHED"
                            ? "finished"
                            : "upcoming";

                        const getTeamDisplay = (
                          team: Team | null | undefined
                        ) => {
                          if (!team) return null;
                          return {
                            id: team.id,
                            name: team.name || "TBD",
                            shortName: team.shortName,
                          };
                        };

                        return {
                          id: match.id,
                          homeTeam: getTeamDisplay(match.homeTeam),
                          awayTeam: getTeamDisplay(match.awayTeam),
                          homeScore: match.homeScore,
                          awayScore: match.awayScore,
                          round: roundNumber,
                          roundLabel: roundLabel,
                          matchNumber: matchNumber,
                          matchLabel: match.notes
                            ? (() => {
                                try {
                                  const notes = JSON.parse(match.notes);
                                  return (
                                    notes.matchLabel || `Game ${matchNumber}`
                                  );
                                } catch {
                                  return `Game ${matchNumber}`;
                                }
                              })()
                            : `Game ${matchNumber}`,
                          status: status as "upcoming" | "live" | "finished",
                          matchDate: match.startTime,
                          field:
                            match.pitch?.name || match.venue?.name || undefined,
                        };
                      };

                      return (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                          {/* Left Column: Bracket Visualization */}
                          <div className="lg:col-span-3 space-y-6">
                            {bracketGroups.size === 0 ? (
                              <div className="text-center py-8">
                                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">
                                  {t("tournament.details.noBracketMatches") ||
                                    "No bracket matches available yet."}
                                </p>
                              </div>
                            ) : (
                              Array.from(bracketGroups.entries()).map(
                                ([bracketName, bracketMatches]) => {
                                  // Group matches by round (from notes or infer from position)
                                  const matchesByRound = new Map<
                                    number,
                                    typeof bracketMatches
                                  >();

                                  bracketMatches.forEach((match, index) => {
                                    let round = 1;
                                    if (match.notes) {
                                      try {
                                        const notes = JSON.parse(match.notes);
                                        round = notes.round || 1;
                                      } catch {
                                        // Infer round from position
                                        round = Math.floor(index / 2) + 1;
                                      }
                                    }

                                    if (!matchesByRound.has(round)) {
                                      matchesByRound.set(round, []);
                                    }
                                    matchesByRound.get(round)?.push(match);
                                  });

                                  const rounds = Array.from(
                                    matchesByRound.keys()
                                  ).sort((a, b) => a - b);

                                  // Transform all matches
                                  const transformedMatches = rounds.flatMap(
                                    (round) => {
                                      const roundMatches =
                                        matchesByRound.get(round) || [];
                                      return roundMatches.map((match, index) =>
                                        transformMatchForVisualization(
                                          match,
                                          index + 1,
                                          round
                                        )
                                      );
                                    }
                                  );

                                  return (
                                    <BracketVisualization
                                      key={bracketName}
                                      matches={transformedMatches}
                                      bracketName={bracketName}
                                    />
                                  );
                                }
                              )
                            )}
                          </div>

                          {/* Right Column: Final Standings */}
                          <div className="lg:col-span-2 space-y-6">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                Final Standings
                              </h4>
                              {teams && teams.length > 0 ? (
                                <FinalStandings
                                  teams={teams}
                                  matches={matches}
                                />
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                  <p>No teams found.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {t("tournament.details.noBracketMatches") ||
                          "No bracket matches available yet."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "venues" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("tournament.tabs.venues")}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("tournament.tabs.venues")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("tournament.details.address")}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("tournament.details.location")}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("common.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {venuesLoading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center">
                            <div className="flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                          </td>
                        </tr>
                      ) : venues && venues.length > 0 ? (
                        venues.map((venue) => (
                          <tr key={venue.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <I18nLink
                                href={`/tournaments/${tournamentId}/venues/${venue.id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {venue.name || "Venue Name TBD"}
                              </I18nLink>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {venue.streetName || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {tournament.city || "City TBD"},{" "}
                              {tournament.country?.name || "Country TBD"}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <I18nLink
                                href={`/tournaments/${tournamentId}/venues/${venue.id}`}
                              >
                                <Button size="sm">{t("common.view")}</Button>
                              </I18nLink>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            {t("tournament.details.noVenuesAvailable")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "register" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
