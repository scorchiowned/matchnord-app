"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link as I18nLink } from "@/i18n/routing";

interface Team {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
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
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-8 text-center">
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-8 text-center text-gray-500">
          <p>No matches found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group
                </th>
              )}
              {matches.some((m) => m.division) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Division
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Venue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matches.map((match) => (
              <tr key={match.id} className="hover:bg-gray-50">
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
                      href={`/tournaments/${tournamentId}/teams/${match.homeTeam.id}/matches`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {match.homeTeam.name}
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
                      href={`/tournaments/${tournamentId}/teams/${match.awayTeam.id}/matches`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {match.awayTeam.name}
                    </I18nLink>
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      TBD
                    </div>
                  )}
                </td>
                {matches.some((m) => m.group || m.groupId) && (
                  <td className="px-6 py-4">
                    {match.group?.id ? (
                      <I18nLink
                        href={`/tournaments/${tournamentId}/groups/${match.group.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {match.group.name}
                      </I18nLink>
                    ) : match.groupId ? (
                      <I18nLink
                        href={`/tournaments/${tournamentId}/groups/${match.groupId}`}
                        className="text-sm text-gray-500 hover:text-blue-800 hover:underline"
                      >
                        View Group
                      </I18nLink>
                    ) : (
                      <div className="text-sm text-gray-500">-</div>
                    )}
                  </td>
                )}
                {matches.some((m) => m.division) && (
                  <td className="px-6 py-4">
                    {match.division?.id ? (
                      <I18nLink
                        href={`/tournaments/${tournamentId}/divisions/${match.division.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {match.division.name}
                      </I18nLink>
                    ) : match.group?.divisionId ? (
                      <I18nLink
                        href={`/tournaments/${tournamentId}/divisions/${match.group.divisionId}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Division
                      </I18nLink>
                    ) : (
                      <div className="text-sm text-gray-500">-</div>
                    )}
                  </td>
                )}
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
                <td className="px-6 py-4 text-right">
                  <I18nLink
                    href={`/tournaments/${tournamentId}/matches/${match.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </I18nLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

