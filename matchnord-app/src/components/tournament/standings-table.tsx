"use client";

import Image from "next/image";
import type { Group, Match, Team } from "@/types/api";

interface StandingsTableProps {
  group: Group;
  matches: Match[];
  fullWidth?: boolean;
}

interface TeamStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
}

export function StandingsTable({
  group,
  matches,
  fullWidth = true,
}: StandingsTableProps) {
  // Calculate standings for the group
  const calculateStandings = (): TeamStanding[] => {
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

      return {
        team,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        points,
        position: 0, // Will be assigned after sorting
      };
    });

    // Sort by points, then goal difference, then goals for
    teamStats.sort((a, b) => {
      const goalDiffA = a.goalsFor - a.goalsAgainst;
      const goalDiffB = b.goalsFor - b.goalsAgainst;

      if (b.points !== a.points) return b.points - a.points;
      if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA;
      return b.goalsFor - a.goalsFor;
    });

    // Assign positions
    teamStats.forEach((stat, index) => {
      stat.position = index + 1;
    });

    return teamStats;
  };

  const standings = calculateStandings();

  // Get team logo
  const getTeamLogo = (team: Team): string | null => {
    if (team.logo) return team.logo;
    if (typeof team.club === "object" && team.club?.logo) return team.club.logo;
    return null;
  };

  // Get club name
  const getClubName = (team: Team): string => {
    if (typeof team.club === "string") return team.club;
    if (typeof team.club === "object" && team.club?.name) return team.club.name;
    return "";
  };

  return (
    <div
      className={`bg-white border border-gray-200 overflow-hidden ${
        fullWidth ? "-mx-4 sm:-mx-6 lg:-mx-8" : ""
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-green-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Joukkue
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                O
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                V
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                T
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                H
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                M
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                P
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {standings.length > 0 ? (
              standings.map((standing) => {
                const logo = getTeamLogo(standing.team);
                const clubName = getClubName(standing.team);

                return (
                  <tr key={standing.team.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {standing.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {logo ? (
                          <div className="flex-shrink-0">
                            <Image
                              src={logo}
                              alt={`${standing.team.name} logo`}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500">
                              {standing.team.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-blue-600">
                            {standing.team.name}
                          </div>
                          {clubName && (
                            <div className="text-xs text-gray-500">
                              {clubName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {standing.played}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {standing.won}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {standing.drawn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {standing.lost}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {standing.goalsFor}-{standing.goalsAgainst}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                      {standing.points}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No teams in this group
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

