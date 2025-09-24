'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Calendar, MapPin, Plus } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { MainNavigation } from '@/components/navigation/main-navigation';
interface Tournament {
  id: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  status: string;
  organization?: {
    name: string;
  };
  country?: {
    name: string;
  };
  venues?: Array<{
    id: string;
    name: string;
    city: string;
  }>;
  teams?: Array<{
    id: string;
    name: string;
  }>;
  _count?: {
    teams: number;
    venues: number;
    divisions: number;
    matches: number;
  };
}

interface UserDashboardProps {
  userRole: string;
}

export function UserDashboard({ userRole }: UserDashboardProps) {
  const { data: session } = useSession();
  const t = useTranslations();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserTournaments = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/tournaments');

        if (!response.ok) {
          throw new Error('Failed to fetch tournaments');
        }

        const data = await response.json();
        // The API returns an array of tournaments directly
        setTournaments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTournaments();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      DRAFT: { variant: 'secondary' as const, label: 'Draft' },
      PUBLISHED: { variant: 'default' as const, label: 'Published' },
      ONGOING: { variant: 'destructive' as const, label: 'Ongoing' },
      COMPLETED: { variant: 'outline' as const, label: 'Completed' },
      CANCELLED: { variant: 'secondary' as const, label: 'Cancelled' },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      variant: 'secondary' as const,
      label: status,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-style-background">
        <MainNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-lg bg-gray-200"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-style-background">
        <MainNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-red-600">Error</h1>
            <p className="mb-4 text-gray-600">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-style-background">
      <MainNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {session?.user?.name || 'User'}!
              </h1>
              <p className="mt-1 text-gray-600">
                Manage your tournaments and teams
              </p>
            </div>
            <Button asChild>
              <Link href="/tournaments/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Tournament
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tournaments
                </CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tournaments.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Tournaments
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tournaments.filter((t) => t.status === 'ONGOING').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Teams
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tournaments.reduce(
                    (sum, t) => sum + (t._count?.teams || 0),
                    0
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tournaments List */}
          <div>
            <h2 className="mb-4 text-2xl font-bold">Your Tournaments</h2>
            {tournaments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    No tournaments yet
                  </h3>
                  <p className="mb-4 text-gray-600">
                    Get started by creating your first tournament
                  </p>
                  <Button asChild>
                    <Link href="/tournaments/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Tournament
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tournaments.map((tournament) => (
                  <Card
                    key={tournament.id}
                    className="transition-shadow hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {tournament.name}
                          </CardTitle>
                          <CardDescription>
                            {tournament.season} •{' '}
                            {tournament.organization?.name || 'No organization'}
                          </CardDescription>
                        </div>
                        {getStatusBadge(tournament.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="mr-2 h-4 w-4" />
                        {formatDate(tournament.startDate)} -{' '}
                        {formatDate(tournament.endDate)}
                      </div>
                      {tournament.country && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="mr-2 h-4 w-4" />
                          {tournament.country.name}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="mr-2 h-4 w-4" />
                        {tournament._count?.teams || 0} teams
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1"
                        >
                          <Link href={`/tournaments/${tournament.id}`}>
                            View Details
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1"
                        >
                          <Link href={`/tournaments/${tournament.id}/manage`}>
                            Manage
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
