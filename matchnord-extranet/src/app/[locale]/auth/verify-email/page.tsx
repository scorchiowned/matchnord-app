'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface VerificationResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setResult({
        success: false,
        message: 'No verification token provided',
      });
      setLoading(false);
      return;
    }

    // Verify the email
    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          user: data.user,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Verification failed',
        });
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      setResult({
        success: false,
        message: 'An error occurred during verification',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.push('/auth/signin');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Verifying your email...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {result?.success ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {result?.success ? 'Email Verified!' : 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {result?.success
              ? 'Your email has been successfully verified'
              : 'There was a problem verifying your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert
            className={
              result?.success
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }
          >
            <AlertDescription
              className={result?.success ? 'text-green-800' : 'text-red-800'}
            >
              {result?.message}
            </AlertDescription>
          </Alert>

          {result?.success && result.user && (
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-medium text-gray-900">
                Account Details:
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Name:</strong> {result.user.name || 'Not provided'}
                </p>
                <p>
                  <strong>Email:</strong> {result.user.email}
                </p>
                <p>
                  <strong>Role:</strong> {result.user.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}

          {result?.success ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-600">
                You can now sign in to your account and start using the
                tournament management system.
              </p>
              <Button onClick={handleContinue} className="w-full">
                Continue to Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-600">
                Please try again or contact support if the problem persists.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
