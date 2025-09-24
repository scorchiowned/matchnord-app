'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { Home, ArrowLeft, Search, Trophy, Users, MapPin } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <main className="container mx-auto py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Card>
            <CardContent className="py-12">
              {/* 404 Icon */}
              <div className="mb-6">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>

              {/* Error Message */}
              <div className="mb-8 space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  {t('error.pageNotFound')}
                </h1>
                <p className="text-xl text-muted-foreground">
                  {t('error.pageNotFoundDescription')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('error.pageNotFoundHelp')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    {t('error.goHome')}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="javascript:history.back()">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('error.goBack')}
                  </Link>
                </Button>
              </div>

              {/* Quick Links */}
              <div className="mt-12">
                <h3 className="mb-6 text-lg font-semibold">
                  {t('error.popularPages')}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Button
                    asChild
                    variant="ghost"
                    className="h-auto flex-col p-4"
                  >
                    <Link href="/tournaments">
                      <Trophy className="mb-2 h-6 w-6" />
                      <span className="text-sm">
                        {t('navigation.tournaments')}
                      </span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-auto flex-col p-4"
                  >
                    <Link href="/teams">
                      <Users className="mb-2 h-6 w-6" />
                      <span className="text-sm">{t('navigation.teams')}</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-auto flex-col p-4"
                  >
                    <Link href="/venues">
                      <MapPin className="mb-2 h-6 w-6" />
                      <span className="text-sm">{t('navigation.venues')}</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-auto flex-col p-4"
                  >
                    <Link href="/results">
                      <Search className="mb-2 h-6 w-6" />
                      <span className="text-sm">{t('navigation.results')}</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Contact Support */}
              <div className="mt-8 rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  {t('error.needHelp')}{' '}
                  <Link
                    href="/contact"
                    className="font-medium text-primary hover:underline"
                  >
                    {t('error.contactSupport')}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
