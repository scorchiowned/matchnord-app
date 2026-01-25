'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Link as LocalizedLink } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const t = useTranslations('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setEmail(''); // Clear email field
      } else {
        setError(data.error || t('unexpectedError'));
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild>
            <LocalizedLink href="/auth/signin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToSignIn')}
            </LocalizedLink>
          </Button>
        </div>

        {/* Forgot Password Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">
              {t('forgotPasswordTitle')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('forgotPasswordDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!success ? (
              <>
                {/* Forgot Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                      id="email"
                      data-testid="forgot-password-email-input"
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="forgot-password-submit-button"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isLoading ? t('sending') : t('sendResetLink')}
                  </Button>
                </form>

                {/* Error Message */}
                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Success Message */}
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      {t('checkYourEmail')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('resetLinkSent')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/auth/signin')}
                  >
                    {t('backToSignIn')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
