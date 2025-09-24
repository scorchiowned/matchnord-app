'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Mail, Chrome } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const t = useTranslations('auth');

  // const handleEmailSignIn = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);
  //   setError('');

  //   try {
  //     const result = await signIn('email', {
  //       email,
  //       redirect: false,
  //     });

  //     if (result?.error) {
  //       setError(t('signInError'));
  //     } else {
  //       // Email sent successfully
  //       router.push('/auth/verify-request');
  //     }
  //   } catch (error) {
  //     setError(t('unexpectedError'));
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
      } else if (result?.ok) {
        // Sign in successful
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      setError(t('googleSignInError'));
      setIsLoading(false);
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

        {/* Sign In Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">
              {t('signIn')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('signInDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Credentials Sign In Form */}
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  data-testid="signin-email-input"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  data-testid="signin-password-input"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="signin-submit-button"
              >
                <Mail className="mr-2 h-4 w-4" />
                {isLoading ? t('signingIn') : t('signIn')}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('orContinueWith')}
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              {isLoading ? t('signingIn') : t('signInWithGoogle')}
            </Button>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Sign Up Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t('noAccount')} </span>
              <LocalizedLink
                href="/auth/signup"
                className="text-primary hover:underline"
              >
                {t('signUp')}
              </LocalizedLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
