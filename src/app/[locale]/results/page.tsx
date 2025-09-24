'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
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
import { MainNavigation } from '@/components/navigation/main-navigation';
import {
  Trophy,
  Calendar,
  MapPin,
  Search,
  Filter,
  X,
  Eye,
  Play,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';

// Mock data - in a real app, this would fetch from the API
const mockResults = [
  {
    id: '1',
    tournament: 'Youth Championship 2024',
    homeTeam: 'Helsinki United',
    awayTeam: 'Espoo Eagles',
    homeScore: 3,
    awayScore: 1,
    status: 'finished',
    date: '2024-06-10',
    time: '19:00',
    venue: 'Olympic Stadium',
    round: 'Quarter Finals',
    highlights: [
      "Goal by Mika Hakkinen (15')",
      "Goal by Jari Litmanen (32')",
      "Goal by Mika Hakkinen (67')",
      "Goal by Teemu Pukki (89')",
    ],
  },
  {
    id: '2',
    tournament: 'Youth Championship 2024',
    homeTeam: 'Oulu Owls',
    awayTeam: 'Local Heroes',
    homeScore: 2,
    awayScore: 2,
    status: 'finished',
    date: '2024-06-12',
    time: '17:00',
    venue: 'Espoo Sports Center',
    round: 'Quarter Finals',
    highlights: ["Goal by Local Player (12')", "Goal by Visitor Player (45')"],
  },
  {
    id: '3',
    tournament: 'Summer Cup 2024',
    homeTeam: 'Local Heroes',
    awayTeam: 'Visiting Stars',
    homeScore: 1,
    awayScore: 1,
    status: 'live',
    date: '2024-06-21',
    time: '19:00',
    venue: 'Summer Arena',
    round: 'Group Stage',
    highlights: ["Goal by Local Player (12')", "Goal by Visitor Player (45')"],
  },
  {
    id: '4',
    tournament: 'Spring League 2024',
    homeTeam: 'Tampere Titans',
    awayTeam: 'Vantaa Vipers',
    homeScore: 1,
    awayScore: 0,
    status: 'finished',
    date: '2024-06-14',
    time: '19:00',
    venue: 'Central Stadium',
    round: 'League Match',
    highlights: ["Goal by Tampere Player (67')"],
  },
  {
    id: '5',
    tournament: 'Youth Championship 2024',
    homeTeam: 'Helsinki United',
    awayTeam: 'Oulu Owls',
    homeScore: 2,
    awayScore: 1,
    status: 'finished',
    date: '2024-06-20',
    time: '19:00',
    venue: 'Olympic Stadium',
    round: 'Semi Finals',
    highlights: [
      "Goal by Helsinki Player (23')",
      "Goal by Oulu Player (45')",
      "Goal by Helsinki Player (78')",
    ],
  },
  {
    id: '6',
    tournament: 'Summer Cup 2024',
    homeTeam: 'Visiting Stars',
    awayTeam: 'Helsinki United',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    date: '2024-06-30',
    time: '20:00',
    venue: 'Summer Arena',
    round: 'Final',
    highlights: [],
  },
];

const mockTournaments = [
  'All Tournaments',
  'Youth Championship 2024',
  'Summer Cup 2024',
  'Spring League 2024',
];

const mockVenues = [
  'All Venues',
  'Olympic Stadium',
  'Espoo Sports Center',
  'Summer Arena',
  'Central Stadium',
];

export default function ResultsPage() {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('All Tournaments');
  const [venueFilter, setVenueFilter] = useState('All Venues');
  const [showFilters, setShowFilters] = useState(false);

  // Filter results based on search and filters
  const filteredResults = mockResults.filter((result) => {
    const matchesSearch =
      result.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.tournament.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTournament =
      tournamentFilter === 'All Tournaments' ||
      result.tournament === tournamentFilter;
    const matchesVenue =
      venueFilter === 'All Venues' || result.venue === venueFilter;

    return matchesSearch && matchesTournament && matchesVenue;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setTournamentFilter('All Tournaments');
    setVenueFilter('All Venues');
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'live':
        return 'bg-green-100 text-green-800 animate-pulse';
      case 'finished':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return t('results.status.scheduled');
      case 'live':
        return 'Live';
      case 'finished':
        return t('results.status.finished');
      case 'cancelled':
        return t('results.status.cancelled');
      default:
        return status;
    }
  };

  const getMatchStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'live':
        return <Play className="h-4 w-4" />;
      case 'finished':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              {t('results.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('results.description')}
            </p>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center space-x-2">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('results.searchPlaceholder')}
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
                      <SelectValue placeholder={t('results.allTournaments')} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTournaments.map((tournament) => (
                        <SelectItem key={tournament} value={tournament}>
                          {tournament}
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
                    {t('results.moreFilters')}
                  </Button>
                  {(searchTerm ||
                    tournamentFilter !== 'All Tournaments' ||
                    venueFilter !== 'All Venues') && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="mr-2 h-4 w-4" />
                      {t('common.clear')}
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {filteredResults.length} {t('results.results')}
                  </Badge>
                </div>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className="mt-4 border-t pt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t('venue.title')}
                      </label>
                      <Select
                        value={venueFilter}
                        onValueChange={setVenueFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('results.allVenues')} />
                        </SelectTrigger>
                        <SelectContent>
                          {mockVenues.map((venue) => (
                            <SelectItem key={venue} value={venue}>
                              {venue}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results List */}
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <Card
                key={result.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Match Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{result.tournament}</Badge>
                        <Badge variant="secondary">{result.round}</Badge>
                        <Badge className={getMatchStatusColor(result.status)}>
                          {getMatchStatusIcon(result.status)}
                          <span className="ml-1">
                            {getMatchStatusLabel(result.status)}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.date} at {result.time}
                      </div>
                    </div>

                    {/* Teams and Score */}
                    <div className="grid grid-cols-3 items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {result.homeTeam}
                        </div>
                      </div>

                      <div className="space-y-2 text-center">
                        <div className="text-3xl font-bold">
                          {result.status === 'scheduled'
                            ? t('results.vs')
                            : `${result.homeScore} - ${result.awayScore}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.status === 'scheduled'
                            ? t('results.upcomingMatch')
                            : t('results.finalScore')}
                        </div>
                      </div>

                      <div className="text-left">
                        <div className="text-lg font-semibold">
                          {result.awayTeam}
                        </div>
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{result.venue}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{result.date}</span>
                      </div>
                    </div>

                    {/* Highlights for finished matches */}
                    {result.status === 'finished' &&
                      result.highlights.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="mb-2 flex items-center space-x-2 font-medium">
                            <TrendingUp className="h-4 w-4" />
                            <span>{t('results.matchHighlights')}</span>
                          </h4>
                          <div className="space-y-1">
                            {result.highlights.map((highlight, index) => (
                              <div
                                key={index}
                                className="text-sm text-muted-foreground"
                              >
                                • {highlight}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/matches/${result.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('common.viewDetails')}
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/tournaments/${result.tournament.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Trophy className="mr-2 h-4 w-4" />
                          {t('tournament.title')}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredResults.length === 0 && (
            <div className="py-8 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                {searchTerm ||
                tournamentFilter !== 'All Tournaments' ||
                venueFilter !== 'All Venues'
                  ? t('results.noResultsFound')
                  : t('results.noResultsYet')}
              </h3>
              <p className="mb-4 text-muted-foreground">
                {searchTerm ||
                tournamentFilter !== 'All Tournaments' ||
                venueFilter !== 'All Venues'
                  ? t('results.tryAdjustingFilters')
                  : t('results.checkBackLater')}
              </p>
              {searchTerm ||
              tournamentFilter !== 'All Tournaments' ||
              venueFilter !== 'All Venues' ? (
                <Button onClick={clearFilters}>
                  {t('common.clearFilters')}
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/tournaments">
                    {t('results.browseTournaments')}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
