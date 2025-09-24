export const locales = ['en', 'fi', 'sv', 'no', 'da'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fi';

export const localeNames = {
  en: 'English',
  fi: 'Suomi',
  sv: 'Svenska',
  no: 'Norsk',
  da: 'Dansk',
} as const;

export const localeFlags = {
  en: '🇬🇧',
  fi: '🇫🇮',
  sv: '🇸🇪',
  no: '🇳🇴',
  da: '🇩🇰',
} as const;

export function getLocaleFromUrl(pathname: string): Locale {
  const segments = pathname.split('/');
  const locale = segments[1] as Locale;
  return locales.includes(locale) ? locale : defaultLocale;
}

export function removeLocaleFromUrl(pathname: string): string {
  const segments = pathname.split('/');
  if (locales.includes(segments[1] as Locale)) {
    return '/' + segments.slice(2).join('/');
  }
  return pathname;
}

export function addLocaleToUrl(pathname: string, locale: Locale): string {
  const cleanPath = removeLocaleFromUrl(pathname);
  return `/${locale}${cleanPath}`;
}

