'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MainNavigation } from '@/components/navigation/main-navigation';
import {
  Users,
  Trophy,
  MapPin,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  X,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  shortName?: string;
  club?: string;
  city?: string;
  level?: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
  tournament: {
    id: string;
    name: string;
  };
  _count: {
    homeMatches: number;
    awayMatches: number;
    players: number;
  };
}

// Get unique tournaments from teams data
const getUniqueTournaments = (teams: Team[]) => {
  const tournamentMap = new Map();
  teams.forEach((team) => {
    if (!tournamentMap.has(team.tournament.id)) {
      tournamentMap.set(team.tournament.id, team.tournament);
    }
  });
  return Array.from(tournamentMap.values());
};

export default function TeamsPage() {
  const t = useTranslations();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch teams from the API
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const data = (await api.teams.getAll()) as Team[];
        setTeams(data);
      } catch (error) {
        console.error('Error fetching teams:', error);
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Filter teams based on search and filters
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.city &&
        team.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (team.club &&
        team.club.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (team.shortName &&
        team.shortName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTournament =
      tournamentFilter === 'all' || team.tournament.id === tournamentFilter;
    const matchesCity =
      cityFilter === 'all' ||
      (team.city && team.city.toLowerCase() === cityFilter.toLowerCase());

    return matchesSearch && matchesTournament && matchesCity;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setTournamentFilter('all');
    setCityFilter('all');
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('team.teams')}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t('team.manageViewTeams')}
              </p>
            </div>
            <Button asChild>
              <Link href="/teams/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('team.addTeam')}
              </Link>
            </Button>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center space-x-2">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('team.searchTeamsPlaceholder')}
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select
                    value={tournamentFilter}
                    onValueChange={setTournamentFilter}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={t('team.allTournaments')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('team.allTournaments')}
                      </SelectItem>
                      {getUniqueTournaments(teams).map((tournament) => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {t('team.moreFilters')}
                  </Button>
                  {(searchTerm ||
                    tournamentFilter !== 'all' ||
                    cityFilter !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="mr-2 h-4 w-4" />
                      {t('team.clear')}
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {filteredTeams.length} {t('team.teamsCount')}
                  </Badge>
                </div>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className="mt-4 border-t pt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t('team.city')}
                      </Label>
                      <Select value={cityFilter} onValueChange={setCityFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('team.allCities')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('team.allCities')}
                          </SelectItem>
                          <SelectItem value="helsinki">Helsinki</SelectItem>
                          <SelectItem value="espoo">Espoo</SelectItem>
                          <SelectItem value="oulu">Oulu</SelectItem>
                          <SelectItem value="vantaa">Vantaa</SelectItem>
                          <SelectItem value="tampere">Tampere</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t('team.foundedYear')}
                      </Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder={t('team.allYears')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('team.allYears')}
                          </SelectItem>
                          <SelectItem value="1990s">1990s</SelectItem>
                          <SelectItem value="2000s">2000s</SelectItem>
                          <SelectItem value="2010s">2010s</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t('team.teamStatus')}
                      </Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder={t('team.allStatuses')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('team.allStatuses')}
                          </SelectItem>
                          <SelectItem value="active">
                            {t('team.active')}
                          </SelectItem>
                          <SelectItem value="inactive">
                            {t('team.inactive')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-muted-foreground">{t('team.loading')}</p>
              </CardContent>
            </Card>
          )}

          {/* Teams Table */}
          {!isLoading && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('team.name')}</TableHead>
                      <TableHead>{t('team.country')}</TableHead>
                      <TableHead>{t('team.city')}</TableHead>
                      <TableHead>{t('team.club')}</TableHead>
                      <TableHead>{t('team.level')}</TableHead>
                      <TableHead>{t('team.players')}</TableHead>
                      <TableHead>{t('team.matches')}</TableHead>
                      <TableHead>{t('team.tournament')}</TableHead>
                      <TableHead className="text-right">
                        {t('team.actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map((team) => (
                      <TableRow key={team.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div>{team.name}</div>
                            {team.shortName && (
                              <div className="text-sm text-muted-foreground">
                                ({team.shortName})
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{team.country.code}</span>
                            <span>{team.country.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{team.city || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{team.club || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{team.level || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{team._count.players}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>
                            {team._count.homeMatches + team._count.awayMatches}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {team.tournament.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/teams/${team.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/teams/${team.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && filteredTeams.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  {searchTerm ||
                  tournamentFilter !== 'all' ||
                  cityFilter !== 'all'
                    ? t('team.noTeamsFound')
                    : t('team.noTeamsFound')}
                </h3>
                <p className="mb-4 text-muted-foreground">
                  {searchTerm ||
                  tournamentFilter !== 'all' ||
                  cityFilter !== 'all'
                    ? t('team.noTeamsFoundDescription')
                    : t('team.noTeamsInSystem')}
                </p>
                {searchTerm ||
                tournamentFilter !== 'all' ||
                cityFilter !== 'all' ? (
                  <Button onClick={clearFilters}>
                    {t('team.clearFilters')}
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/teams/new">{t('team.addFirstTeam')}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
