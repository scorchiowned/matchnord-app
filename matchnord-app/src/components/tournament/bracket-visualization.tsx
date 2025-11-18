"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, Play, CheckCircle, Trophy } from "lucide-react";

interface Team {
  id: string;
  name: string;
  shortName?: string;
}

interface BracketMatch {
  id: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore?: number;
  awayScore?: number;
  round: string | number;
  roundLabel?: string;
  matchNumber?: number;
  matchLabel?: string;
  status: "upcoming" | "live" | "finished";
  matchDate?: string;
  field?: string;
}

interface BracketVisualizationProps {
  matches: BracketMatch[];
  bracketName?: string;
}

// Helper to get ordinal suffix
function getOrdinalSuffix(num: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
}

// Check if a team is a placeholder
function isPlaceholderTeam(team: Team | null): boolean {
  if (!team?.id) return false;
  return (
    team.id.startsWith("pos-") ||
    team.id.startsWith("winner-") ||
    team.id.startsWith("loser-")
  );
}

export function BracketVisualization({
  matches,
  bracketName,
}: BracketVisualizationProps) {
  if (matches.length === 0) {
    return (
      <div className="py-8 text-center">
        <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No Bracket Matches Yet</h3>
        <p className="text-muted-foreground">
          Bracket matches will be generated after group stage completion.
        </p>
      </div>
    );
  }

  // Group matches by round
  const matchesByRound = matches.reduce(
    (acc, match) => {
      const round = typeof match.round === "number" ? match.round : 1;
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push(match);
      return acc;
    },
    {} as Record<number, BracketMatch[]>
  );

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "live":
        return "bg-green-100 text-green-800 animate-pulse";
      case "finished":
        return "bg-gray-100 text-gray-800";
      case "upcoming":
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "live":
        return <Play className="h-3 w-3" />;
      case "finished":
        return <CheckCircle className="h-3 w-3" />;
      case "upcoming":
      case "scheduled":
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const formatMatchTime = (matchDate?: string) => {
    if (!matchDate) return null;
    const date = new Date(matchDate);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // Find where winner/loser advances to
  const getAdvancementTarget = (
    matchId: string,
    isWinner: boolean,
    currentRound: number
  ): BracketMatch | null => {
    const nextRound = currentRound + 1;
    const nextRoundMatches = matchesByRound[nextRound] || [];
    
    // Look for matches that reference this match's winner/loser
    const targetMatch = nextRoundMatches.find((m) => {
      if (isWinner) {
        return (
          (m.homeTeam?.id.startsWith("winner-") &&
            m.homeTeam.id.includes(matchId)) ||
          (m.awayTeam?.id.startsWith("winner-") &&
            m.awayTeam.id.includes(matchId))
        );
      } else {
        return (
          (m.homeTeam?.id.startsWith("loser-") &&
            m.homeTeam.id.includes(matchId)) ||
          (m.awayTeam?.id.startsWith("loser-") &&
            m.awayTeam.id.includes(matchId))
        );
      }
    });
    
    return targetMatch || null;
  };

  return (
    <div className="space-y-6">
      {bracketName && (
        <h3 className="text-lg font-semibold">{bracketName}</h3>
      )}
      
      <div className="relative overflow-x-auto py-4">
        <div className="flex min-w-max gap-6">
          {rounds.map((round, roundIndex) => {
            const roundMatches = matchesByRound[round] || [];
            const isLastRound = roundIndex === rounds.length - 1;
            const roundLabel =
              roundMatches[0]?.roundLabel ||
              (round === rounds[rounds.length - 1]
                ? "Final"
                : round === rounds[rounds.length - 2]
                ? "Semi-Final"
                : round === rounds[rounds.length - 3]
                ? "Quarter-Final"
                : `Round ${round}`);

            return (
              <div
                key={round}
                className="relative flex flex-col gap-3"
              >
                {/* Round label */}
                <div className="mb-2 text-center">
                  <div className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {roundLabel}
                  </div>
                </div>

                {/* Matches in this round */}
                <div className="flex flex-col gap-3">
                  {roundMatches.map((match, matchIndex) => {
                    const matchHeight = 70;
                    const gap = 12;
                    const matchTop = matchIndex * (matchHeight + gap);
                    const matchCenter = matchTop + matchHeight / 2;

                    // Find where winner/loser advances
                    const winnerTarget = !isLastRound
                      ? getAdvancementTarget(match.id, true, round)
                      : null;
                    const loserTarget = !isLastRound
                      ? getAdvancementTarget(match.id, false, round)
                      : null;

                    const homeDisplay = match.homeTeam?.name || "TBD";
                    const awayDisplay = match.awayTeam?.name || "TBD";

                    return (
                      <div key={match.id} className="relative">
                        {/* Connection lines to next round */}
                        {!isLastRound && (
                          <>
                            {/* Horizontal line from match box */}
                            <div
                              className="absolute left-full top-1/2 z-0 h-[1.5px] w-6 bg-border"
                              style={{
                                transform: "translateY(-50%)",
                              }}
                            />
                            {/* Vertical connector line connecting pairs */}
                            {roundMatches.length > 1 &&
                              matchIndex % 2 === 0 &&
                              matchIndex + 1 < roundMatches.length && (
                                <>
                                  {/* Vertical line */}
                                  <div
                                    className="absolute left-full z-0 w-[1.5px] bg-border"
                                    style={{
                                      left: "calc(100% + 1.5rem)",
                                      top: `${matchCenter}px`,
                                      height: `${matchHeight + gap}px`,
                                      transform: "translateX(-50%)",
                                    }}
                                  />
                                  {/* Horizontal lines to next round matches */}
                                  <div
                                    className="absolute left-full z-0 h-[1.5px] w-6 bg-border"
                                    style={{
                                      left: "calc(100% + 1.5rem)",
                                      top: `${matchCenter}px`,
                                      transform:
                                        "translateX(-50%) translateY(-50%)",
                                    }}
                                  />
                                  <div
                                    className="absolute left-full z-0 h-[1.5px] w-6 bg-border"
                                    style={{
                                      left: "calc(100% + 1.5rem)",
                                      top: `${matchCenter + matchHeight + gap}px`,
                                      transform:
                                        "translateX(-50%) translateY(-50%)",
                                    }}
                                  />
                                </>
                              )}
                          </>
                        )}

                        {/* Match box */}
                        <div className="relative z-10 w-44 rounded-md border border-border bg-card p-2 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                          {/* Match label badge */}
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                              {match.matchLabel || `Game ${matchIndex + 1}`}
                            </span>
                            {/* Edge labels showing where winner/loser goes */}
                            {winnerTarget && (
                              <span className="text-[9px] text-muted-foreground">
                                W→
                                {winnerTarget.matchLabel ||
                                  `Game ${roundMatches.indexOf(winnerTarget) + 1}`}
                              </span>
                            )}
                            {loserTarget && (
                              <span className="text-[9px] text-muted-foreground">
                                L→
                                {loserTarget.matchLabel ||
                                  `Game ${roundMatches.indexOf(loserTarget) + 1}`}
                              </span>
                            )}
                          </div>

                          {/* Status badge */}
                          <div className="mb-1.5">
                            <Badge className={getStatusColor(match.status)}>
                              {getStatusIcon(match.status)}
                              <span className="ml-1 text-[9px] capitalize">
                                {match.status}
                              </span>
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            {/* Home team */}
                            <div className="rounded border border-border/50 bg-muted/30 px-2 py-1 text-xs">
                              <div className="truncate font-medium text-foreground">
                                {homeDisplay}
                              </div>
                              {match.homeScore !== undefined && (
                                <div className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
                                  Score: {match.homeScore}
                                </div>
                              )}
                            </div>

                            {/* VS separator */}
                            <div className="text-center text-[10px] font-semibold text-muted-foreground">
                              vs
                            </div>

                            {/* Away team */}
                            <div className="rounded border border-border/50 bg-muted/30 px-2 py-1 text-xs">
                              <div className="truncate font-medium text-foreground">
                                {awayDisplay}
                              </div>
                              {match.awayScore !== undefined && (
                                <div className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
                                  Score: {match.awayScore}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Match details */}
                          {match.matchDate && (
                            <div className="mt-1.5 text-[9px] text-muted-foreground">
                              {formatMatchTime(match.matchDate)?.date}
                              {formatMatchTime(match.matchDate)?.time &&
                                ` at ${formatMatchTime(match.matchDate)?.time}`}
                              {match.field && ` • ${match.field}`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



