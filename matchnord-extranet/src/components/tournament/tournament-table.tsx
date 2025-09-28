'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SafeHtml } from '@/components/ui/safe-html';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Eye,
  ExternalLink,
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  isPublished: boolean;
  country: {
    id: string;
    name: string;
    code: string;
  };
  city?: string;
  organization: {
    name: string;
  };
  venues: Array<{
    id: string;
    name: string;
    streetName?: string;
    postalCode?: string;
    city?: string;
    xCoordinate?: number;
    yCoordinate?: number;
  }>;
  divisions: Array<{
    id: string;
    name: string;
    birthYear?: number;
    format?: string;
  }>;
  _count: {
    teams: number;
    venues: number;
    divisions: number;
  };
}

interface TournamentTableProps {
  tournaments: Tournament[];
  isLoading?: boolean;
}

export function TournamentTable({
  tournaments,
  isLoading = false,
}: TournamentTableProps) {
  const locale = useLocale();
  const t = useTranslations();

  const getStatusBadge = (status: string, isPublished: boolean) => {
    if (!isPublished) {
      return <Badge variant="outline">{t('tournament.status.draft')}</Badge>;
    }

    const now = new Date();
    const startDate = new Date(tournaments[0]?.startDate || '');
    const endDate = new Date(tournaments[0]?.endDate || '');

    if (now < startDate) {
      return (
        <Badge variant="secondary">{t('tournament.status.upcoming')}</Badge>
      );
    } else if (now >= startDate && now <= endDate) {
      return <Badge variant="default">{t('tournament.status.active')}</Badge>;
    } else {
      return <Badge variant="outline">{t('tournament.status.finished')}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('tournament.tournaments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded bg-style-card-bg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tournaments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('tournament.tournaments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-style-text-secondary" />
            <h3 className="mb-2 text-lg font-medium text-style-text-secondary">
              {t('tournament.noTournamentsFound')}
            </h3>
            <p className="text-sm text-style-text-secondary">
              {t('tournament.noTournamentsDescription')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {t('tournament.tournaments')} ({tournaments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tournament.title')}</TableHead>
                <TableHead>{t('tournament.organization')}</TableHead>
                <TableHead>{t('tournament.location')}</TableHead>
                <TableHead>{t('common.dates')}</TableHead>
                <TableHead>{t('tournament.divisions')}</TableHead>
                <TableHead>{t('tournament.teams')}</TableHead>
                <TableHead>{t('tournament.status')}</TableHead>
                <TableHead className="text-right">
                  {t('common.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((tournament) => (
                <TableRow key={tournament.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tournament.name}</div>
                      {tournament.description && (
                        <div className="line-clamp-2 text-sm text-muted-foreground">
                          <SafeHtml content={tournament.description} />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {tournament.organization.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {tournament.city && `${tournament.city}, `}
                        {tournament.country.name}
                      </span>
                    </div>
                    {tournament.venues.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {tournament.venues.length} {t('tournament.venueCount')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDateRange(
                          tournament.startDate,
                          tournament.endDate
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {tournament.divisions.slice(0, 2).map((division) => (
                        <div key={division.id} className="text-sm">
                          <div className="font-medium">{division.name}</div>
                          {division.birthYear && (
                            <div className="text-xs text-muted-foreground">
                              {t('tournament.born')} {division.birthYear}
                              {division.format && ` • ${division.format}`}
                            </div>
                          )}
                        </div>
                      ))}
                      {tournament.divisions.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{tournament.divisions.length - 2}{' '}
                          {t('tournament.more')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-3 w-3" />
                      <span>{tournament._count.teams}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(tournament.status, tournament.isPublished)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/tournaments/${tournament.id}/public`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {tournament.isPublished && (
                        <Button asChild size="sm">
                          <Link href={`/tournaments/${tournament.id}/public`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
