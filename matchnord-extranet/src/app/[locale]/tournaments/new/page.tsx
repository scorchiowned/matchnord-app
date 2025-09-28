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
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { Trophy, Save } from 'lucide-react';

interface Country {
  id: string;
  name: string;
  code: string;
}

// interface Organization {
//   id: string;
//   name: string;
// }

export default function NewTournamentPage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  // const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    season: new Date().getFullYear().toString(),
    startDate: '',
    endDate: '',
    countryId: '',
    city: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    organizationId: '',
  });

  // Fetch countries and organizations on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countriesResponse] = await Promise.all([
          fetch('/api/countries').then((res) => res.json()) as Promise<{
            success: boolean;
            countries: Country[];
            count: number;
          }>,
        ]);

        setCountries(countriesResponse.countries);

        // Auto-select first country if available
        if (countriesResponse.countries.length > 0) {
          setFormData((prev) => ({
            ...prev,
            countryId: countriesResponse.countries[0]?.id || '',
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
      alert('You must be logged in to create a tournament');
      return;
    }

    // Basic validation
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const tournament = await response.json();
        router.push(`/tournaments/${tournament.id}`);
      } else {
        const error = await response.json();
        alert(`Error creating tournament: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Error creating tournament. Please try again.');
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
                Please log in to create a tournament.
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
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('tournament.create')}
              </h1>
              <p className="text-muted-foreground">
                {t('tournament.createDescription')}
              </p>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>{t('tournament.tournamentInformation')}</span>
              </CardTitle>
              <CardDescription>
                {t('tournament.updateTournamentDetails')}
              </CardDescription>
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
                    {/* Tournament Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('tournament.title')} *</Label>
                      <Input
                        id="name"
                        data-testid="tournament-name-input"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange('name', e.target.value)
                        }
                        placeholder="Enter tournament name"
                        required
                      />
                    </div>

                    {/* Season */}
                    <div className="space-y-2">
                      <Label htmlFor="season">{t('tournament.season')}</Label>
                      <Input
                        id="season"
                        data-testid="tournament-season-input"
                        type="number"
                        value={formData.season}
                        onChange={(e) =>
                          handleInputChange('season', e.target.value)
                        }
                        placeholder="2024"
                      />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                      <Label htmlFor="startDate">
                        {t('tournament.startDate')} *
                      </Label>
                      <Input
                        id="startDate"
                        data-testid="tournament-start-date-input"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          handleInputChange('startDate', e.target.value)
                        }
                        required
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <Label htmlFor="endDate">
                        {t('tournament.endDate')} *
                      </Label>
                      <Input
                        id="endDate"
                        data-testid="tournament-end-date-input"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          handleInputChange('endDate', e.target.value)
                        }
                        required
                      />
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <Label htmlFor="countryId">
                        {t('tournament.country')} *
                      </Label>
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

                    {/* City */}
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('tournament.city')}</Label>
                      <Input
                        id="city"
                        data-testid="tournament-city-input"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange('city', e.target.value)
                        }
                        placeholder="Enter city"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">{t('tournament.address')}</Label>
                      <Input
                        id="address"
                        data-testid="tournament-address-input"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange('address', e.target.value)
                        }
                        placeholder="Enter address"
                      />
                    </div>

                    {/* Contact Email */}
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">
                        {t('tournament.contactEmail')}
                      </Label>
                      <Input
                        id="contactEmail"
                        data-testid="tournament-contact-email-input"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) =>
                          handleInputChange('contactEmail', e.target.value)
                        }
                        placeholder="Enter contact email"
                      />
                    </div>

                    {/* Contact Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">
                        {t('tournament.contactPhone')}
                      </Label>
                      <Input
                        id="contactPhone"
                        data-testid="tournament-contact-phone-input"
                        value={formData.contactPhone}
                        onChange={(e) =>
                          handleInputChange('contactPhone', e.target.value)
                        }
                        placeholder="Enter contact phone"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">
                        {t('tournament.description')}
                      </Label>
                      <RichTextEditor
                        content={formData.description}
                        onChange={(content) =>
                          handleInputChange('description', content)
                        }
                        placeholder="Enter tournament description"
                        className="min-h-[120px]"
                      />
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex items-center space-x-4 pt-6">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      data-testid="tournament-save-button"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isLoading ? t('common.loading') : t('common.save')}
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      type="button"
                      data-test="tournament-cancel-button"
                    >
                      <Link href="/tournaments">{t('common.cancel')}</Link>
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
