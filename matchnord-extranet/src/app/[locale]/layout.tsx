import { Roboto } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AuthProvider } from '@/components/providers/session-provider';
import { locales } from '@/i18n/config';
import { Toaster } from 'sonner';
import type { Metadata } from 'next';
// @ts-ignore
import '../../styles/globals.css';
import { createThemeCss, matchnordExtranetTemplate } from '@matchnord/theme';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto',
});

const themeCss = createThemeCss(matchnordExtranetTemplate);

export const metadata: Metadata = {
  title: 'Tournament Management System',
  description: 'Modern tournament management platform',
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: LocaleLayoutProps) {
  // Provide all messages to the client
  // side. You can also provide a subset
  // of messages if you want to reduce
  // the bundle size.
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head>
        <style
          data-theme="matchnord-extranet"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      </head>
      <body className={`${roboto.variable} font-style`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
