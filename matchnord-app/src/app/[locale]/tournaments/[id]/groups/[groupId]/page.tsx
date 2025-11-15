"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MatchesTable } from "@/components/tournament/matches-table";
import {
  usePublicTournament,
  useTournamentMatches,
  useTournamentGroups,
} from "@/hooks/use-tournaments";
import { Link as I18nLink } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function GroupMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const groupId = params.groupId as string;
  const t = useTranslations();

  const {
    data: tournament,
    isLoading: tournamentLoading,
    error: tournamentError,
  } = usePublicTournament(tournamentId);

  const { data: groups, isLoading: groupsLoading } =
    useTournamentGroups(tournamentId);

  const { data: allMatches, isLoading: matchesLoading } =
    useTournamentMatches(tournamentId);

  // Find the specific group
  const group = useMemo(() => {
    return groups?.find((g) => g.id === groupId);
  }, [groups, groupId]);

  // Filter matches for this group
  const matches = useMemo(() => {
    if (!allMatches) return [];
    return allMatches.filter(
      (match) =>
        match.groupId === groupId ||
        match.group?.id === groupId
    );
  }, [allMatches, groupId]);

  // Check if we came from another page
  const hasReferrer = typeof window !== "undefined" && document.referrer !== "";

  if (tournamentLoading || groupsLoading) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Tournament Not Found
          </h2>
          <I18nLink href={`/tournaments/${tournamentId}`}>
            <Button>{t("common.back")} {t("tournament.tabs.matches")}</Button>
          </I18nLink>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Group Not Found
          </h2>
          <I18nLink href={`/tournaments/${tournamentId}`}>
            <Button>{t("common.back")} {t("tournament.tabs.matches")}</Button>
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
            {group.name} - {t("tournament.tabs.matches")}
          </h1>
          <p className="text-gray-600">
            {tournament.name} • {tournament.season}
          </p>
        </div>

        {/* Matches Table */}
        <MatchesTable
          matches={matches}
          isLoading={matchesLoading}
          tournamentId={tournamentId}
        />
      </div>
    </div>
  );
}

