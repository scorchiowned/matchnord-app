'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X } from 'lucide-react';
import { api } from '@/lib/api';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface Venue {
  id: string;
  name: string;
  city: string;
  country: {
    name: string;
  };
}

interface AgeGroup {
  value: string;
  label: string;
  birthYear: number;
  age: number;
}

interface TournamentFiltersProps {
  onFiltersChange: (filters: TournamentFilters) => void;
  isLoading?: boolean;
}

export interface TournamentFilters {
  countryId?: string;
  tournamentName?: string;
  venueId?: string;
  birthYear?: string;
}

export function TournamentFilters({
  onFiltersChange,
  isLoading = false,
}: TournamentFiltersProps) {
  const t = useTranslations();
  const [filters, setFilters] = useState<TournamentFilters>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load filter options
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [countriesResponse, venuesResponse, ageGroupsResponse] =
          await Promise.all([
            api.countries.getAll(),
            api.venues.getAll(),
            api.ageGroups.getAll(),
          ]);

        setCountries((countriesResponse as any).countries || []);
        setVenues((venuesResponse as any).venues || []);
        setAgeGroups((ageGroupsResponse as any).ageGroups || []);
      } catch (error) {
        console.error('Error loading filter data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadFilterData();
  }, []);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof TournamentFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some((value) => value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t('tournament.filterTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Tournament Name */}
          <div className="space-y-2">
            <Label htmlFor="tournament-name">{t('tournament.name')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="tournament-name"
                placeholder={t('tournament.searchPlaceholder')}
                value={filters.tournamentName || ''}
                onChange={(e) =>
                  handleFilterChange('tournamentName', e.target.value)
                }
                className="pl-10"
              />
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">{t('tournament.country')}</Label>
            <Select
              value={filters.countryId || 'all'}
              onValueChange={(value) => handleFilterChange('countryId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('tournament.selectCountry')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('tournament.allCountries')}
                </SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <Label htmlFor="venue">{t('tournament.venues')}</Label>
            <Select
              value={filters.venueId || 'all'}
              onValueChange={(value) => handleFilterChange('venueId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('tournament.selectVenue')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('tournament.allVenues')}</SelectItem>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name} - {venue.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Birth Year / Age Group */}
          <div className="space-y-2">
            <Label htmlFor="birth-year">{t('registration.ageGroup')}</Label>
            <Select
              value={filters.birthYear || 'all'}
              onValueChange={(value) => handleFilterChange('birthYear', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('tournament.selectBirthYear')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('tournament.allAgeGroups')}
                </SelectItem>
                {ageGroups.map((ageGroup) => (
                  <SelectItem key={ageGroup.value} value={ageGroup.value}>
                    {ageGroup.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {isLoadingData ? (
              t('tournament.loadingFilters')
            ) : (
              <>
                {countries.length} {t('tournament.country')} • {venues.length}{' '}
                {t('tournament.venues')} • {ageGroups.length}{' '}
                {t('registration.ageGroup')}
              </>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              {t('tournament.clearFilters')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
