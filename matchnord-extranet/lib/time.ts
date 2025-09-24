import {
  format,
  parseISO,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
} from 'date-fns';
import { fi, enUS } from 'date-fns/locale';

export type Locale = 'fi' | 'en';

const locales = {
  fi,
  en: enUS,
};

export function formatDateTime(
  date: Date | string,
  locale: Locale = 'fi'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd.MM.yyyy HH:mm', { locale: locales[locale] });
}

export function formatDate(date: Date | string, locale: Locale = 'fi'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd.MM.yyyy', { locale: locales[locale] });
}

export function formatTime(date: Date | string, locale: Locale = 'fi'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm', { locale: locales[locale] });
}

export function formatRelativeTime(
  date: Date | string,
  locale: Locale = 'fi'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(dateObj)) {
    return locale === 'fi' ? 'Tänään' : 'Today';
  }

  if (isTomorrow(dateObj)) {
    return locale === 'fi' ? 'Huomenna' : 'Tomorrow';
  }

  if (isYesterday(dateObj)) {
    return locale === 'fi' ? 'Eilen' : 'Yesterday';
  }

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: locales[locale],
  });
}

export function formatMatchTime(
  startTime: Date | string,
  locale: Locale = 'fi'
): string {
  const dateObj =
    typeof startTime === 'string' ? parseISO(startTime) : startTime;
  const dateStr = formatRelativeTime(dateObj, locale);
  const timeStr = formatTime(dateObj, locale);

  if (dateStr.includes('Today') || dateStr.includes('Tänään')) {
    return timeStr;
  }

  return `${dateStr} ${timeStr}`;
}
