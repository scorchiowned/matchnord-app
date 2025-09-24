'use client';
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
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
import { Trophy } from 'lucide-react';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

interface Tournament {
  id: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  organization: {
    name: string;
  };
  _count: {
    teams: number;
    venues: number;
    divisions: number;
    matches: number;
  };
}

export default function TournamentsPage() {
  const t = useTranslations('tournament');
  const { data: session } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const user = session?.user;
  const canCreateTournaments =
    user?.role === 'ADMIN' || user?.role === 'TEAM_MANAGER';

  // Fetch tournaments from the API
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setIsLoading(true);
        const data = (await api.tournaments.getAll()) as Tournament[];
        setTournaments(data);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        setTournaments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  // Determine tournament status based on dates
  const getTournamentStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now >= start && now <= end) return 'live';
    if (now < start) return 'upcoming';
    return 'finished';
  };

  // Get actual matches count from the API
  const getMatchesCount = (tournament: Tournament) => {
    return tournament._count.matches;
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <main className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('tournaments')}
              </h1>
              <p className="text-muted-foreground">{t('discoverSubtitle')}</p>
            </div>
            {canCreateTournaments && (
              <Button asChild data-testid="create-tournament-button">
                <Link href="/tournaments/new">{t('create')}</Link>
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="tournament-title-header">
                    {t('title')}
                  </TableHead>
                  <TableHead data-testid="tournament-organization-header">
                    {t('organization')}
                  </TableHead>
                  <TableHead data-testid="tournament-dates-header">
                    {t('dates')}
                  </TableHead>
                  <TableHead data-testid="tournament-teams-header">
                    {t('teams')}
                  </TableHead>
                  <TableHead data-testid="tournament-venues-header">
                    {t('venues')}
                  </TableHead>
                  <TableHead data-testid="tournament-status-header">
                    {t('status')}
                  </TableHead>
                  <TableHead
                    className="text-right"
                    data-testid="tournament-actions-header"
                  >
                    Toiminnot
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center"
                      data-test="tournaments-loading"
                    >
                      Loading tournaments...
                    </TableCell>
                  </TableRow>
                ) : (
                  tournaments.map((tournament) => {
                    const status = getTournamentStatus(
                      tournament.startDate,
                      tournament.endDate
                    );
                    const matchesCount = getMatchesCount(tournament);

                    return (
                      <TableRow
                        key={tournament.id}
                        data-test={`tournament-row-${tournament.id}`}
                      >
                        <TableCell
                          className="font-medium"
                          data-test="tournament-name-cell"
                        >
                          <Link
                            href={`/tournaments/${tournament.id}`}
                            className="hover:underline"
                          >
                            {tournament.name}
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            {tournament.season}
                          </div>
                        </TableCell>
                        <TableCell>{tournament.organization.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(tournament.startDate).toLocaleDateString(
                              'fi-FI'
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            to{' '}
                            {new Date(tournament.endDate).toLocaleDateString(
                              'fi-FI'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {tournament._count.teams} teams
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {matchesCount} matches
                          </div>
                        </TableCell>
                        <TableCell>{tournament._count.venues}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === 'live'
                                ? 'live'
                                : status === 'finished'
                                  ? 'finished'
                                  : 'secondary'
                            }
                          >
                            {status === 'live'
                              ? t('live')
                              : status === 'finished'
                                ? t('completed')
                                : t('upcoming')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/tournaments/${tournament.id}`}>
                                {t('viewDetails')}
                              </Link>
                            </Button>
                            {status === 'live' && (
                              <Button size="sm" asChild>
                                <Link
                                  href={`/tournaments/${tournament.id}/public`}
                                >
                                  {t('view')}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && tournaments.length === 0 && (
            <div className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                {t('noTournamentsFound')}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {t('noTournamentsDescription')}
              </p>
              <Button className="mt-4" asChild>
                <Link href="/admin/tournaments/new">{t('create')}</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
