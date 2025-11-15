"use client";

import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";

interface Team {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
}

interface Match {
  id: string;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  homeScore?: number;
  awayScore?: number;
  status: string;
}

interface FinalStandingsProps {
  teams: Team[];
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

export function FinalStandings({
  teams,
  matches,
}: FinalStandingsProps) {
  // Calculate final standings from all matches
  const calculateFinalStandings = (): TeamStanding[] => {
    // Only count finished matches
    const finishedMatches = matches.filter(
      (match) => match.status === "FINISHED"
    );

    // Initialize team stats
    const teamStatsMap = new Map<string, TeamStanding>();

    teams.forEach((team) => {
      teamStatsMap.set(team.id, {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        position: 0,
      });
    });

    // Process each finished match
    finishedMatches.forEach((match) => {
      if (!match.homeTeam || !match.awayTeam) return;

      const homeTeamId = match.homeTeam.id;
      const awayTeamId = match.awayTeam.id;
      const homeScore = match.homeScore || 0;
      const awayScore = match.awayScore || 0;

      // Get or create team stats
      const homeStats = teamStatsMap.get(homeTeamId);
      const awayStats = teamStatsMap.get(awayTeamId);

      if (homeStats && awayStats) {
        // Update home team stats
        homeStats.played++;
        homeStats.goalsFor += homeScore;
        homeStats.goalsAgainst += awayScore;
        homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;

        // Update away team stats
        awayStats.played++;
        awayStats.goalsFor += awayScore;
        awayStats.goalsAgainst += homeScore;
        awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;

        // Determine result
        if (homeScore > awayScore) {
          homeStats.won++;
          homeStats.points += 3;
          awayStats.lost++;
        } else if (homeScore < awayScore) {
          awayStats.won++;
          awayStats.points += 3;
          homeStats.lost++;
        } else {
          homeStats.drawn++;
          homeStats.points += 1;
          awayStats.drawn++;
          awayStats.points += 1;
        }
      }
    });

    // Convert to array and sort
    const standings = Array.from(teamStatsMap.values());

    // Sort by points, then goal difference, then goals for
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Assign positions
    standings.forEach((stat, index) => {
      stat.position = index + 1;
    });

    return standings;
  };

  const standings = calculateFinalStandings();
  const hasMatches = standings.some((s) => s.played > 0);

  const getPositionIcon = (position: number) => {
    if (position === 1) {
      return <Trophy className="h-4 w-4 text-yellow-600" />;
    } else if (position === 2) {
      return <Medal className="h-4 w-4 text-gray-400" />;
    } else if (position === 3) {
      return <Medal className="h-4 w-4 text-amber-600" />;
    }
    return null;
  };

  if (!hasMatches) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>No matches played yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                    standing.position === 1
                      ? "bg-yellow-50"
                      : standing.position === 2
                      ? "bg-gray-50"
                      : standing.position === 3
                      ? "bg-amber-50"
                      : standing.position <= 8
                      ? "bg-green-50"
                      : ""
                  }
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {getPositionIcon(standing.position)}
                      <span className="font-semibold text-gray-900">
                        {standing.position}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-2">
                      {standing.team.logo && (
                        <img
                          src={standing.team.logo}
                          alt={standing.team.name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      )}
                      <span className="font-medium text-gray-900">
                        {standing.team.name}
                      </span>
                      {standing.team.shortName && (
                        <Badge variant="outline" className="text-xs">
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
    </div>
  );
}

