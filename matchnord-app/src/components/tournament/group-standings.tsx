"use client";

import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface Team {
  id: string;
  name: string;
  shortName?: string;
}

interface Match {
  id: string;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  homeScore?: number;
  awayScore?: number;
  status: string;
  groupId?: string;
}

interface Group {
  id: string;
  name: string;
  teams?: Team[];
}

interface GroupStandingsProps {
  groups: Group[];
  matches: Match[];
}

interface TeamStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

export function GroupStandings({
  groups,
  matches,
}: GroupStandingsProps) {
  // Calculate standings for each group
  const calculateGroupStandings = (group: Group): TeamStanding[] => {
    const groupMatches = matches.filter(
      (match) => match.groupId === group.id && match.status === "FINISHED"
    );
    const groupTeams = group.teams || [];

    // Calculate stats for each team
    const teamStats = groupTeams.map((team) => {
      const teamMatches = groupMatches.filter(
        (m) => m.homeTeam?.id === team.id || m.awayTeam?.id === team.id
      );

      let played = 0;
      let won = 0;
      let drawn = 0;
      let lost = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      teamMatches.forEach((match) => {
        const isHome = match.homeTeam?.id === team.id;
        const teamScore = isHome ? match.homeScore || 0 : match.awayScore || 0;
        const opponentScore = isHome
          ? match.awayScore || 0
          : match.homeScore || 0;

        played++;
        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (teamScore > opponentScore) won++;
        else if (teamScore < opponentScore) lost++;
        else drawn++;
      });

      const points = won * 3 + drawn;
      const goalDifference = goalsFor - goalsAgainst;

      return {
        team,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference,
        points,
        position: 0, // Will be assigned after sorting
      };
    });

    // Sort by points, then goal difference, then goals for
    teamStats.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Assign positions
    teamStats.forEach((stat, index) => {
      stat.position = index + 1;
    });

    return teamStats;
  };

  // Filter to only show group stage groups (Group A, Group B, etc.)
  const groupStagePattern = /^group\s+[a-z]$/i;
  const groupStageGroups = groups.filter((group) =>
    groupStagePattern.test(group.name)
  );

  if (groupStageGroups.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>No group stage groups found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupStageGroups.map((group) => {
        const standings = calculateGroupStandings(group);
        const hasMatches = standings.some((s) => s.played > 0);

        return (
          <div key={group.id} className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">{group.name}</h4>
            {!hasMatches ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No matches played yet
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Pos
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Team
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          P
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          W
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          D
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          L
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          GF
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          GA
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          GD
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Pts
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {standings.map((standing) => (
                        <tr
                          key={standing.team.id}
                          className={
                            standing.position <= 2
                              ? "bg-green-50"
                              : standing.position === standings.length
                              ? "bg-red-50"
                              : ""
                          }
                        >
                          <td className="px-3 py-2 font-semibold text-gray-900">
                            {standing.position}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {standing.team.name}
                              </span>
                              {standing.team.shortName && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {standing.team.shortName}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-900">
                            {standing.played}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-900">
                            {standing.won}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-900">
                            {standing.drawn}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-900">
                            {standing.lost}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-900">
                            {standing.goalsFor}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-900">
                            {standing.goalsAgainst}
                          </td>
                          <td
                            className={`px-3 py-2 text-center font-medium ${
                              standing.goalDifference > 0
                                ? "text-green-600"
                                : standing.goalDifference < 0
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {standing.goalDifference > 0 ? "+" : ""}
                            {standing.goalDifference}
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-gray-900">
                            {standing.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

