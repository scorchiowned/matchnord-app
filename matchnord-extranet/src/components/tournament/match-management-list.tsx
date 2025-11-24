'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MapPin,
  Calendar,
  Edit,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { MatchScoreCard } from './match-score-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Match {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    shortName?: string;
  } | null;
  awayTeam: {
    id: string;
    name: string;
    shortName?: string;
  } | null;
  homeScore: number;
  awayScore: number;
  status: string;
  startTime: string | null;
  venue: {
    id: string;
    name: string;
  } | null;
  pitch: {
    id: string;
    name: string;
  } | null;
  group: {
    id: string;
    name: string;
    division: {
      id: string;
      name: string;
    };
  };
}

interface MatchManagementListProps {
  tournamentId: string;
  divisionFilter?: string;
  venueFilter?: string;
  lastUpdate?: Date;
}

export function MatchManagementList({
  tournamentId,
  divisionFilter,
  venueFilter,
  lastUpdate,
}: MatchManagementListProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch matches
  const fetchMatches = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      }
      const params: Record<string, string> = {
        tournamentId,
      };

      if (venueFilter) {
        params.venueId = venueFilter;
      }

      const matchesData = await api.matches.getAll(params);

      // Filter by division if needed (client-side since API doesn't support it directly)
      let filteredMatches = matchesData as Match[];
      if (divisionFilter) {
        filteredMatches = filteredMatches.filter(
          (match) => match.group.division.id === divisionFilter
        );
      }

      setMatches(filteredMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  };

  // Initial load and refresh on filter changes
  useEffect(() => {
    fetchMatches(true);
  }, [tournamentId, divisionFilter, venueFilter]);

  // Poll for updates without flicker
  useEffect(() => {
    if (!lastUpdate) return;
    
    const interval = setInterval(() => {
      fetchMatches(false); // Silent update, no loading state
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [lastUpdate, tournamentId, divisionFilter, venueFilter]);

  const handleMatchClick = async (match: Match) => {
    // Fetch full match data including events and score logs
    try {
      const fullMatch = await api.matches.getById(match.id);
      setSelectedMatch(fullMatch as Match);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching match details:', error);
      // Fallback to using the match from the list
      setSelectedMatch(match);
      setIsDialogOpen(true);
    }
  };

  const handleMatchUpdate = () => {
    // Refresh matches after update
    fetchMatches();
    // Refresh selected match if it's the one being updated
    if (selectedMatch) {
      api.matches.getById(selectedMatch.id).then((updatedMatch) => {
        setSelectedMatch(updatedMatch as Match);
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading matches...</div>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No matches found with the selected filters.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Division/Group</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.id} className="hover:bg-muted/50">
                    <TableCell>
                      {match.startTime ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(match.startTime), 'HH:mm')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          TBD
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {match.homeTeam?.name || 'TBD'}
                        </div>
                        <div className="text-sm text-muted-foreground">vs</div>
                        <div className="font-medium">
                          {match.awayTeam?.name || 'TBD'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-lg font-bold">
                        {match.homeScore} - {match.awayScore}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {match.group.division.name}
                        </div>
                        <div className="text-muted-foreground">
                          {match.group.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {match.venue ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{match.venue.name}</span>
                          {match.pitch && (
                            <span className="text-muted-foreground">
                              - {match.pitch.name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          TBD
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {match.status === 'FINISHED' ? (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Finished
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMatchClick(match)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Match Management Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Match</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <MatchScoreCard
              match={selectedMatch}
              onUpdate={handleMatchUpdate}
              onClose={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

