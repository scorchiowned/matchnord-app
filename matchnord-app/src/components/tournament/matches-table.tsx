"use client";

import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link as I18nLink, useRouter } from "@/i18n/routing";
import Image from "next/image";

interface ClubRef {
  id: string;
  name: string;
  logo?: string;
}

interface Team {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  clubRef?: ClubRef | null;
}

interface Venue {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  divisionId?: string;
}

interface Division {
  id: string;
  name: string;
}

interface Match {
  id: string;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  homeScore: number;
  awayScore: number;
  startTime: string;
  venue?: Venue | null;
  status: string;
  tournamentId: string;
  groupId?: string;
  group?: Group | null;
  division?: Division | null;
  matchNumber?: string | null;
}

interface MatchesTableProps {
  matches: Match[];
  isLoading?: boolean;
  tournamentId: string;
}

export function MatchesTable({
  matches,
  isLoading = false,
  tournamentId,
}: MatchesTableProps) {
  const router = useRouter();
  
  if (isLoading) {
    return (
      <div className="bg-white overflow-hidden">
        <div className="py-8 text-center">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading matches...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white overflow-hidden">
        <div className="py-8 text-center text-gray-500">
          <p>No matches found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden w-full">
      <div className="overflow-x-auto w-full">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {matches.some((m) => m.matchNumber) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match #
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Home Team
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Away Team
              </th>
              {matches.some((m) => m.group || m.groupId) && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Group
                </th>
              )}
              {matches.some((m) => m.division) && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Division
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Venue
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matches.map((match) => (
              <tr
                key={match.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  router.push(`/tournaments/${tournamentId}?tab=matches&match=${match.id}`);
                }}
              >
                {matches.some((m) => m.matchNumber) && (
                  <td className="px-6 py-4">
                    {match.matchNumber ? (
                      <div className="text-sm font-semibold text-gray-700">
                        {match.matchNumber}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">-</div>
                    )}
                  </td>
                )}
                <td className="px-6 py-4">
                  {match.homeTeam?.id ? (
                    <I18nLink
                      href={`/tournaments/${tournamentId}?tab=teams&team=${match.homeTeam.id}`}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const logo = match.homeTeam.logo || 
                          (typeof match.homeTeam.clubRef === 'object' ? match.homeTeam.clubRef?.logo : null);
                        return logo ? (
                          <Image
                            src={logo}
                            alt={match.homeTeam.name}
                            width={24}
                            height={24}
                            className="rounded-full object-contain flex-shrink-0"
                          />
                        ) : null;
                      })()}
                      <span>{match.homeTeam.name}</span>
                    </I18nLink>
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      TBD
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {match.homeScore} - {match.awayScore}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {match.awayTeam?.id ? (
                    <I18nLink
                      href={`/tournaments/${tournamentId}?tab=teams&team=${match.awayTeam.id}`}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const logo = match.awayTeam.logo || 
                          (typeof match.awayTeam.clubRef === 'object' ? match.awayTeam.clubRef?.logo : null);
                        return logo ? (
                          <Image
                            src={logo}
                            alt={match.awayTeam.name}
                            width={24}
                            height={24}
                            className="rounded-full object-contain flex-shrink-0"
                          />
                        ) : null;
                      })()}
                      <span>{match.awayTeam.name}</span>
                    </I18nLink>
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      TBD
                    </div>
                  )}
                </td>
                {matches.some((m) => m.group || m.groupId) && (
                  <td className="px-4 py-4 w-24">
                    {match.group?.id ? (
                      <I18nLink
                        href={`/tournaments/${tournamentId}?tab=matches&group=${match.group.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {match.group.name}
                      </I18nLink>
                    ) : match.groupId ? (
                      <I18nLink
                        href={`/tournaments/${tournamentId}?tab=matches&group=${match.groupId}`}
                        className="text-sm text-gray-500 hover:text-blue-800 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Group
                      </I18nLink>
                    ) : (
                      <div className="text-sm text-gray-500">-</div>
                    )}
                  </td>
                )}
                {matches.some((m) => m.division) && (
                  <td className="px-4 py-4 w-32">
                    {match.division?.id ? (
                      <I18nLink
                        href={`/tournaments/${tournamentId}?tab=matches&division=${match.division.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {match.division.name}
                      </I18nLink>
                    ) : match.group?.divisionId ? (
                      <I18nLink
                        href={`/tournaments/${tournamentId}?tab=matches&division=${match.group.divisionId}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Division
                      </I18nLink>
                    ) : (
                      <div className="text-sm text-gray-500">-</div>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 w-40">
                  <div className="text-sm text-gray-900">
                    {format(new Date(match.startTime), "MMM d, yyyy")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(match.startTime), "HH:mm")}
                  </div>
                </td>
                <td className="px-6 py-4 w-48">
                  <div className="text-sm text-gray-900">
                    {match.venue?.name || "-"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

