'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Country {
  id: string;
  name: string;
  code: string;
  flag: string;
}

interface CountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

// Default countries for development/testing
const defaultCountries: Country[] = [
  { id: 'fi', name: 'Finland', code: 'FI', flag: '🇫🇮' },
  { id: 'se', name: 'Sweden', code: 'SE', flag: '🇸🇪' },
  { id: 'no', name: 'Norway', code: 'NO', flag: '🇳🇴' },
  { id: 'dk', name: 'Denmark', code: 'DK', flag: '🇩🇰' },
  { id: 'ee', name: 'Estonia', code: 'EE', flag: '🇪🇪' },
  { id: 'de', name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { id: 'nl', name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { id: 'be', name: 'Belgium', code: 'BE', flag: '🇧🇪' },
  { id: 'fr', name: 'France', code: 'FR', flag: '🇫🇷' },
  { id: 'es', name: 'Spain', code: 'ES', flag: '🇪🇸' },
  { id: 'it', name: 'Italy', code: 'IT', flag: '🇮🇹' },
  { id: 'gb', name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { id: 'us', name: 'United States', code: 'US', flag: '🇺🇸' },
  { id: 'ca', name: 'Canada', code: 'CA', flag: '🇨🇦' },
];

export function CountrySelect({
  value,
  onValueChange,
  label = 'Country',
  placeholder = 'Select a country',
  required = false,
  disabled = false,
}: CountrySelectProps) {
  const [countries, setCountries] = useState<Country[]>(defaultCountries);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch countries from the API
    const fetchCountries = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/countries');
        if (response.ok) {
          const data = await response.json();
          setCountries(data.countries);
        } else {
          // Fallback to default countries if API fails
          setCountries(defaultCountries);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        // Fallback to default countries if API fails
        setCountries(defaultCountries);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountries();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.id} value={country.id}>
              <div className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-muted-foreground">({country.code})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
