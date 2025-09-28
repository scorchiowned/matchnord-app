'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
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

    // Remove current locale from pathname if it exists
    const segments = pathname.split('/');
    const currentLocaleInPath = locales.includes(segments[1] as Locale);

    let newPath: string;
    if (currentLocaleInPath) {
      // Replace current locale with new one
      if (newLocale === 'fi') {
        // For Finnish (default), remove the locale prefix
        newPath = '/' + segments.slice(2).join('/');
      } else {
        // Replace with new locale
        segments[1] = newLocale;
        newPath = segments.join('/');
      }
    } else {
      // No locale in path, add new locale (unless it's Finnish)
      if (newLocale === 'fi') {
        newPath = pathname;
      } else {
        newPath = `/${newLocale}${pathname}`;
      }
    }

    // Clean up double slashes
    newPath = newPath.replace(/\/+/g, '/');
    if (newPath === '') newPath = '/';

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

    // Remove current locale from pathname if it exists
    const segments = pathname.split('/');
    const currentLocaleInPath = locales.includes(segments[1] as Locale);

    let newPath: string;
    if (currentLocaleInPath) {
      // Replace current locale with new one
      if (newLocale === 'fi') {
        // For Finnish (default), remove the locale prefix
        newPath = '/' + segments.slice(2).join('/');
      } else {
        // Replace with new locale
        segments[1] = newLocale;
        newPath = segments.join('/');
      }
    } else {
      // No locale in path, add new locale (unless it's Finnish)
      if (newLocale === 'fi') {
        newPath = pathname;
      } else {
        newPath = `/${newLocale}${pathname}`;
      }
    }

    // Clean up double slashes
    newPath = newPath.replace(/\/+/g, '/');
    if (newPath === '') newPath = '/';

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
