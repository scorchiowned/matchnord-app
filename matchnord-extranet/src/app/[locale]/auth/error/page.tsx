'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link as LocalizedLink } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const t = useTranslations('auth');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return t('errorConfiguration');
      case 'AccessDenied':
        return t('errorAccessDenied');
      case 'Verification':
        return t('errorVerification');
      case 'Default':
      default:
        return t('errorDefault');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild>
            <LocalizedLink href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToHome')}
            </LocalizedLink>
          </Button>
        </div>

        {/* Error Card */}
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              {t('authError')}
            </CardTitle>
            <CardDescription>{getErrorMessage(error)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <LocalizedLink href="/auth/signin">
                  {t('tryAgain')}
                </LocalizedLink>
              </Button>
              <Button className="flex-1" asChild>
                <LocalizedLink href="/">{t('goHome')}</LocalizedLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
