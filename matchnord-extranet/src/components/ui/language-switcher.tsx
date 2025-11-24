'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { useEffect, useState } from 'react';

// localStorage key for language preference
const LANGUAGE_STORAGE_KEY = 'preferred-language';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Locale;
    if (savedLanguage && locales.includes(savedLanguage)) {
      setCurrentLocale(savedLanguage);
      // If the saved language is different from current locale, redirect to it
      if (savedLanguage !== locale) {
        handleLocaleChange(savedLanguage);
      }
    }
  }, []);

  // Update currentLocale when locale changes
  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);

  const handleLocaleChange = (newLocale: Locale) => {
    // Save language preference to localStorage
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);

    // Get the pathname without the locale prefix
    const segments = pathname.split('/').filter(Boolean);
    const currentLocaleInPath = segments.length > 0 && locales.includes(segments[0] as Locale);
    
    // Remove locale from segments if present
    const pathWithoutLocale = currentLocaleInPath 
      ? '/' + segments.slice(1).join('/')
      : pathname;
    
    // Construct new path with new locale (always include locale prefix per routing config)
    const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;

    router.push(newPath);
    setCurrentLocale(newLocale);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {t('language')}:
      </span>
      <Select value={currentLocale} onValueChange={handleLocaleChange}>
        <SelectTrigger className="h-8 w-auto min-w-[120px]">
          <SelectValue>
            <div className="flex items-center space-x-2">
              <span>{localeFlags[currentLocale]}</span>
              <span className="hidden sm:inline">
                {localeNames[currentLocale]}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              <div className="flex items-center space-x-2">
                <span>{localeFlags[loc]}</span>
                <span>{localeNames[loc]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Compact version for mobile/small spaces
export function LanguageSwitcherCompact() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Locale;
    if (savedLanguage && locales.includes(savedLanguage)) {
      setCurrentLocale(savedLanguage);
      // If the saved language is different from current locale, redirect to it
      if (savedLanguage !== locale) {
        handleLocaleChange(savedLanguage);
      }
    }
  }, []);

  // Update currentLocale when locale changes
  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);

  const handleLocaleChange = (newLocale: Locale) => {
    // Save language preference to localStorage
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);

    // Get the pathname without the locale prefix
    const segments = pathname.split('/').filter(Boolean);
    const currentLocaleInPath = segments.length > 0 && locales.includes(segments[0] as Locale);
    
    // Remove locale from segments if present
    const pathWithoutLocale = currentLocaleInPath 
      ? '/' + segments.slice(1).join('/')
      : pathname;
    
    // Construct new path with new locale (always include locale prefix per routing config)
    const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;

    router.push(newPath);
    setCurrentLocale(newLocale);
  };

  return (
    <Select value={currentLocale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="h-8 w-16 p-1">
        <SelectValue>
          <span className="text-lg">{localeFlags[currentLocale]}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <div className="flex items-center space-x-2">
              <span>{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
