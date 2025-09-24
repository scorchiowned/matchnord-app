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
import { Mail, ArrowLeft } from 'lucide-react';

export default function VerifyRequestPage() {
  const t = useTranslations('auth');

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

        {/* Verify Request Card */}
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t('checkEmail')}
            </CardTitle>
            <CardDescription>{t('emailSent')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>{t('emailInstructions')}</p>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <strong>{t('noEmail')}</strong>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• {t('checkSpam')}</li>
                <li>• {t('checkEmailAddress')}</li>
                <li>• {t('tryAgain')}</li>
              </ul>
            </div>

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
