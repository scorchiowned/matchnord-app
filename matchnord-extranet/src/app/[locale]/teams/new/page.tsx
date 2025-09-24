'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { ArrowLeft, Save, Users } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

export default function NewTeamPage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    club: '',
    city: '',
    countryId: '',
    level: '',
    tournamentId: '',
  });

  // Fetch tournaments and countries on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournamentsData, countriesResponse] = await Promise.all([
          api.tournaments.getAll() as Promise<Tournament[]>,
          api.countries.getAll() as Promise<{
            success: boolean;
            countries: Country[];
            total: number;
          }>,
        ]);

        setTournaments(tournamentsData);
        setCountries(countriesResponse.countries);

        // Auto-select first tournament if available
        if (tournamentsData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            tournamentId: tournamentsData[0]?.id || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      alert('You must be logged in to create a team');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          tournamentId: formData.tournamentId || tournaments[0]?.id,
        }),
      });

      if (response.ok) {
        router.push('/teams');
      } else {
        const error = await response.json();
        alert(`Error creating team: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Error creating team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <main className="container mx-auto py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Please log in to create a team.
              </p>
              <Button asChild className="mt-4">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <main className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/teams">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('team.addTeam')}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t('team.teamInformation')}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>{t('team.teamInformation')}</span>
              </CardTitle>
              <CardDescription>{t('team.updateTeamDetails')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">{t('common.loading')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Team Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('team.teamName')} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange('name', e.target.value)
                        }
                        placeholder="Enter team name"
                        required
                      />
                    </div>

                    {/* Short Name */}
                    <div className="space-y-2">
                      <Label htmlFor="shortName">{t('team.shortName')}</Label>
                      <Input
                        id="shortName"
                        value={formData.shortName}
                        onChange={(e) =>
                          handleInputChange('shortName', e.target.value)
                        }
                        placeholder="Enter short name"
                      />
                    </div>

                    {/* Club */}
                    <div className="space-y-2">
                      <Label htmlFor="club">{t('team.club')}</Label>
                      <Input
                        id="club"
                        value={formData.club}
                        onChange={(e) =>
                          handleInputChange('club', e.target.value)
                        }
                        placeholder="Enter club name"
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('team.city')}</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange('city', e.target.value)
                        }
                        placeholder="Enter city"
                      />
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <Label htmlFor="countryId">{t('team.country')} *</Label>
                      <Select
                        value={formData.countryId}
                        onValueChange={(value) =>
                          handleInputChange('countryId', value)
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name} ({country.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Level */}
                    <div className="space-y-2">
                      <Label htmlFor="level">{t('team.level')}</Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) =>
                          handleInputChange('level', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BEGINNER">Beginner</SelectItem>
                          <SelectItem value="INTERMEDIATE">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="ADVANCED">Advanced</SelectItem>
                          <SelectItem value="PROFESSIONAL">
                            Professional
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tournament */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="tournamentId">
                        {t('team.tournament')} *
                      </Label>
                      <Select
                        value={formData.tournamentId}
                        onValueChange={(value) =>
                          handleInputChange('tournamentId', value)
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tournament" />
                        </SelectTrigger>
                        <SelectContent>
                          {tournaments.map((tournament) => (
                            <SelectItem
                              key={tournament.id}
                              value={tournament.id}
                            >
                              {tournament.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex items-center space-x-4 pt-6">
                    <Button type="submit" disabled={isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      {isLoading ? t('common.loading') : t('common.save')}
                    </Button>
                    <Button asChild variant="outline" type="button">
                      <Link href="/teams">{t('common.cancel')}</Link>
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
