'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  shortName?: string;
  club?: string;
  city?: string;
  level?: string;
}

interface GroupWithTeams {
  id: string;
  name: string;
  stage: {
    id: string;
    name: string;
    type: string;
    division: {
      id: string;
      name: string;
      level: string;
    };
  };
  teams: Team[];
  _count: {
    teams: number;
    matches: number;
  };
}

interface StandingsTableProps {
  group: GroupWithTeams;
  showDivisionInfo?: boolean;
  onRemoveTeam?: (groupId: string, teamId: string) => void;
}

export function StandingsTable({
  group,
  showDivisionInfo = true,
  onRemoveTeam,
}: StandingsTableProps) {
  // Mock standings data - in a real implementation, this would come from match results
  // For now, we'll show teams in alphabetical order with placeholder stats
  const standings = group.teams
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((team, index) => ({
      position: index + 1,
      team,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    }));

  return (
    <div className="space-y-4">
      {showDivisionInfo && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{group.name}</h3>
            <p className="text-sm text-muted-foreground">
              {group.stage.division.name} • {group.stage.division.level}
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {group._count.teams} teams
          </Badge>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-600 text-white">
              <TableHead className="w-12 text-center text-white">#</TableHead>
              <TableHead className="text-white">Joukkue</TableHead>
              <TableHead className="w-12 text-center text-white">O</TableHead>
              <TableHead className="w-12 text-center text-white">V</TableHead>
              <TableHead className="w-12 text-center text-white">T</TableHead>
              <TableHead className="w-12 text-center text-white">H</TableHead>
              <TableHead className="w-16 text-center text-white">M</TableHead>
              <TableHead className="w-12 text-center text-white">P</TableHead>
              {onRemoveTeam && (
                <TableHead className="w-12 text-center text-white">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((standing) => (
              <TableRow key={standing.team.id} className="hover:bg-muted/50">
                <TableCell className="text-center font-medium">
                  {standing.position}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white">
                      {standing.team.shortName?.charAt(0) ||
                        standing.team.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-blue-600">
                        {standing.team.name}
                      </div>
                      {standing.team.club && (
                        <div className="text-xs text-muted-foreground">
                          {standing.team.club}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {standing.gamesPlayed}
                </TableCell>
                <TableCell className="text-center">{standing.wins}</TableCell>
                <TableCell className="text-center">{standing.draws}</TableCell>
                <TableCell className="text-center">{standing.losses}</TableCell>
                <TableCell className="text-center">
                  {standing.goalsFor}-{standing.goalsAgainst}
                </TableCell>
                <TableCell className="text-center font-bold">
                  {standing.points}
                </TableCell>
                {onRemoveTeam && (
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={() => onRemoveTeam(group.id, standing.team.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {standings.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No teams assigned to this group yet
        </div>
      )}
    </div>
  );
}
