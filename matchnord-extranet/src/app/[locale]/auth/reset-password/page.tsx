'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('auth');

  const token = searchParams.get('token');

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError(t('invalidOrExpiredToken'));
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValid(true);
        } else {
          if (data.error.includes('already been used')) {
            setTokenError(t('tokenAlreadyUsed'));
          } else if (data.error.includes('expired')) {
            setTokenError(t('tokenExpired'));
          } else {
            setTokenError(t('invalidOrExpiredToken'));
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setTokenError(t('unexpectedError'));
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      } else {
        setError(data.error || t('unexpectedError'));
      }
    } catch (error) {
      console.error('Reset password error:', error);
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

        {/* Reset Password Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">
              {t('resetYourPassword')}
            </CardTitle>
            <CardDescription className="text-center">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isValidating ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !tokenValid ? (
              <>
                {/* Invalid Token Message */}
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-red-100 p-3">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Invalid Reset Link</h3>
                    <p className="text-sm text-muted-foreground">{tokenError}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/auth/forgot-password')}
                  >
                    Request New Reset Link
                  </Button>
                </div>
              </>
            ) : success ? (
              <>
                {/* Success Message */}
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Password Reset!</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('passwordResetSuccess')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Redirecting to sign in...
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Reset Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('newPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        data-testid="reset-password-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pr-10"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {t('confirmNewPassword')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        data-testid="reset-confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="reset-password-submit-button"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    {isLoading ? 'Resetting...' : t('resetPassword')}
                  </Button>
                </form>

                {/* Error Message */}
                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
