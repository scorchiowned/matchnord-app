import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

export default function RootPage() {
  // This page should not be reached due to middleware handling
  // If it is reached, redirect to default locale
  redirect(`/${defaultLocale}`);
}
