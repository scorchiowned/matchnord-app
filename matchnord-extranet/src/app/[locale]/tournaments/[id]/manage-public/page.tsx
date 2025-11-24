'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trophy,
  Calendar,
  MapPin,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MatchManagementList } from '@/components/tournament/match-management-list';

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  divisions: Array<{
    id: string;
    name: string;
    groups: Array<{
      id: string;
      name: string;
    }>;
  }>;
  venues: Array<{
    id: string;
    name: string;
  }>;
}

export default function PublicTournamentManagementPage() {
  const params = useParams();
  const { data: session } = useSession();
  const t = useTranslations();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load tournament data
  useEffect(() => {
    const loadTournament = async () => {
      try {
        setIsLoading(true);
        const data = await api.tournaments.getManage(tournamentId);
        setTournament(data as Tournament);
      } catch (error) {
        console.error('Error loading tournament:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTournament();
  }, [tournamentId]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <div className="container mx-auto py-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <div className="container mx-auto py-6">
          <div className="text-center text-red-600">
            Tournament not found or access denied
          </div>
        </div>
      </div>
    );
  }

  // Get all divisions and venues for filters
  const allDivisions = tournament.divisions || [];
  const allVenues = tournament.venues || [];

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {tournament.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Match Management - Live Updates
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <RefreshCw className="w-3 h-3 mr-1" />
                Last updated: {lastUpdate.toLocaleTimeString()}
              </Badge>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Division
                  </label>
                  <Select
                    value={selectedDivision}
                    onValueChange={setSelectedDivision}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All divisions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Divisions</SelectItem>
                      {allDivisions.map((division) => (
                        <SelectItem key={division.id} value={division.id}>
                          {division.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Venue</label>
                  <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                    <SelectTrigger>
                      <SelectValue placeholder="All venues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Venues</SelectItem>
                      {allVenues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match List */}
          <MatchManagementList
            tournamentId={tournamentId}
            divisionFilter={
              selectedDivision === 'all' ? undefined : selectedDivision
            }
            venueFilter={selectedVenue === 'all' ? undefined : selectedVenue}
            lastUpdate={lastUpdate}
          />
        </div>
      </main>
    </div>
  );
}

