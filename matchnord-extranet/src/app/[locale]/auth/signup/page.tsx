'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
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
import { ArrowLeft, Mail, Chrome, User, Lock } from 'lucide-react';

function SignUpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const t = useTranslations('auth');

  // Fetch invitation details if token is present
  useEffect(() => {
    const invitationToken = searchParams.get('invitationToken');
    if (invitationToken) {
      fetch(`/api/v1/invitations/${invitationToken}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.email) {
            setInvitationEmail(data.email);
            setFormData((prev) => ({ ...prev, email: data.email }));
          }
        })
        .catch((err) => {
          console.error('Failed to fetch invitation:', err);
        });
    }
  }, [searchParams]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    const invitationToken = searchParams.get('invitationToken');
    const callbackUrl = searchParams.get('callbackUrl');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          invitationToken: invitationToken || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Registration successful
      setSuccess(true);
      setError('');

      // Redirect based on whether invitation was accepted
      setTimeout(() => {
        if (data.invitationAccepted && callbackUrl) {
          // If invitation was accepted, redirect back to invitation page to sign in
          router.push(callbackUrl);
        } else {
          // Otherwise, go to verification request page
          router.push('/auth/verify-request');
        }
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      setError(t('googleSignUpError'));
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

        {/* Sign Up Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">
              {t('createAccount')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('signUpDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Invitation Notice */}
            {invitationEmail && (
              <div className="rounded-lg bg-blue-50 p-4 text-blue-800">
                <p className="text-sm">
                  You're registering to accept an invitation for{' '}
                  <strong>{invitationEmail}</strong>. After registration, you'll
                  be able to access the tournament.
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-lg bg-green-50 p-4 text-green-800">
                <p className="text-sm">
                  Registration successful! Please check your email to verify
                  your account.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-800">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Email Sign Up Form */}
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading || !!invitationEmail}
                  readOnly={!!invitationEmail}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                <User className="mr-2 h-4 w-4" />
                {isLoading ? 'Creating Account...' : 'Create Account'}
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

            {/* Google Sign Up */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              {isLoading ? t('creatingAccount') : t('signUpWithGoogle')}
            </Button>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Sign In Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t('haveAccount')} </span>
              <LocalizedLink
                href="/auth/signin"
                className="text-primary hover:underline"
              >
                {t('signIn')}
              </LocalizedLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div>Loading...</div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
