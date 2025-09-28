import { type Locale, locales, defaultLocale } from './config';

/**
 * Parse Accept-Language header and return the best matching locale
 * @param acceptLanguageHeader - The Accept-Language header value
 * @returns The best matching locale or default locale
 */
export function detectBrowserLanguage(
  acceptLanguageHeader: string | null
): Locale {
  if (!acceptLanguageHeader) {
    return defaultLocale;
  }

  // Parse Accept-Language header (e.g., "fi-FI,fi;q=0.9,en;q=0.8,sv;q=0.7")
  const languages = acceptLanguageHeader
    .split(',')
    .map((lang) => {
      const [locale, qValue] = lang.trim().split(';q=');
      const quality = qValue ? parseFloat(qValue) : 1.0;
      return { locale: locale?.trim() || '', quality };
    })
    .sort((a, b) => b.quality - a.quality); // Sort by quality (highest first)

  // Try to match each language with our supported locales
  for (const { locale } of languages) {
    // Direct match (e.g., "fi" matches "fi")
    if (locales.includes(locale as Locale)) {
      return locale as Locale;
    }

    // Match language code (e.g., "fi-FI" matches "fi")
    const languageCode = locale.split('-')[0];
    if (locales.includes(languageCode as Locale)) {
      return languageCode as Locale;
    }

    // Match language code (e.g., "fi_FI" matches "fi")
    const languageCodeUnderscore = locale.split('_')[0];
    if (locales.includes(languageCodeUnderscore as Locale)) {
      return languageCodeUnderscore as Locale;
    }
  }

  // No match found, return default locale
  return defaultLocale;
}

/**
 * Language mapping for common browser language codes
 */
const languageMapping: Record<string, Locale> = {
  // Finnish variants
  fi: 'fi',
  'fi-FI': 'fi',
  fi_FI: 'fi',

  // English variants
  en: 'en',
  'en-US': 'en',
  'en-GB': 'en',
  en_US: 'en',
  en_GB: 'en',

  // Swedish variants
  sv: 'sv',
  'sv-SE': 'sv',
  sv_FI: 'sv', // Finland Swedish
  sv_SE: 'sv',

  // Norwegian variants
  no: 'no',
  nb: 'no', // Norwegian Bokmål
  nn: 'no', // Norwegian Nynorsk
  'no-NO': 'no',
  'nb-NO': 'no',
  'nn-NO': 'no',
  no_NO: 'no',
  nb_NO: 'no',
  nn_NO: 'no',

  // Danish variants
  da: 'da',
  'da-DK': 'da',
  da_DK: 'da',
};

/**
 * Enhanced browser language detection with mapping
 * @param acceptLanguageHeader - The Accept-Language header value
 * @returns The best matching locale or default locale
 */
export function detectBrowserLanguageEnhanced(
  acceptLanguageHeader: string | null
): Locale {
  if (!acceptLanguageHeader) {
    return defaultLocale;
  }

  // Parse Accept-Language header
  const languages = acceptLanguageHeader
    .split(',')
    .map((lang) => {
      const [locale, qValue] = lang.trim().split(';q=');
      const quality = qValue ? parseFloat(qValue) : 1.0;
      return { locale: locale?.trim() || '', quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Try to match each language
  for (const { locale } of languages) {
    // Direct mapping
    if (languageMapping[locale]) {
      return languageMapping[locale];
    }

    // Try language code only
    const languageCode = locale?.split('-')[0]?.split('_')[0];
    if (languageCode && languageMapping[languageCode]) {
      return languageMapping[languageCode];
    }
  }

  return defaultLocale;
}

/**
 * Get locale from URL pathname
 * @param pathname - The URL pathname
 * @returns The locale from URL or null if not found
 */
export function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/');
  const locale = segments[1] as Locale;
  return locales.includes(locale) ? locale : null;
}

/**
 * Check if pathname already has a locale prefix
 * @param pathname - The URL pathname
 * @returns True if pathname has locale prefix
 */
export function hasLocalePrefix(pathname: string): boolean {
  return getLocaleFromPathname(pathname) !== null;
}
