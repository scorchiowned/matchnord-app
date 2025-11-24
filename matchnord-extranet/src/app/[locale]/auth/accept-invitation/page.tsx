'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Settings, Target, UserCheck, Mail } from 'lucide-react';
import { MainNavigation } from '@/components/navigation/main-navigation';
import { Link } from '@/i18n/routing';

interface InvitationDetails {
  id: string;
  email: string;
  tournamentId: string | null;
  tournamentName: string | null;
  canConfigure: boolean;
  canManageScores: boolean;
  isReferee: boolean;
  status: string;
  expires: string;
  inviterName: string | null;
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }

    // Fetch invitation details
    fetchInvitationDetails(token);
  }, [searchParams]);

  const fetchInvitationDetails = async (token: string) => {
    try {
      const response = await fetch(`/api/v1/invitations/${token}`);
      const data = await response.json();

      if (response.ok) {
        setInvitation(data);
      } else {
        setError(data.error || 'Failed to load invitation');
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('An error occurred while loading the invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    const token = searchParams.get('token');
    if (!token) return;

    // Check if user is logged in
    if (sessionStatus === 'loading') {
      return; // Still loading session
    }

    if (!session?.user) {
      // Redirect to sign in with return URL
      const currentUrl = window.location.href;
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to tournament or dashboard after a short delay
        setTimeout(() => {
          if (data.tournament?.id) {
            router.push(`/tournaments/${data.tournament.id}`);
          } else {
            router.push('/dashboard');
          }
        }, 2000);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('An error occurred while accepting the invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading invitation...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <span>Invitation Error</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button asChild className="mt-4 w-full">
                <Link href="/">Go to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <MainNavigation />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Invitation Accepted!</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  You have successfully accepted the invitation. Redirecting...
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  // Check if invitation is expired or already used
  const isExpired = new Date(invitation.expires) < new Date();
  const isUsed = invitation.status !== 'PENDING';

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">You're Invited! 🎯</CardTitle>
            <CardDescription>
              {invitation.tournamentName
                ? `Help manage ${invitation.tournamentName}`
                : 'Join our tournament system'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isExpired && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  This invitation has expired. Please contact the tournament organizer for a new invitation.
                </AlertDescription>
              </Alert>
            )}

            {isUsed && (
              <Alert>
                <AlertDescription>
                  This invitation has already been {invitation.status.toLowerCase()}.
                </AlertDescription>
              </Alert>
            )}

            {!isExpired && !isUsed && (
              <>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Invitation Details</h3>
                    <div className="space-y-2 text-sm">
                      {invitation.tournamentName && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Tournament:</span>
                          <span>{invitation.tournamentName}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{invitation.email}</span>
                      </div>
                      {invitation.inviterName && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Invited by:</span>
                          <span>{invitation.inviterName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Permissions</h3>
                    <div className="flex flex-wrap gap-2">
                      {invitation.canConfigure && (
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <Settings className="h-3 w-3" />
                          <span>Configure Tournament</span>
                        </Badge>
                      )}
                      {invitation.canManageScores && (
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <Target className="h-3 w-3" />
                          <span>Manage Scores</span>
                        </Badge>
                      )}
                      {invitation.isReferee && (
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <UserCheck className="h-3 w-3" />
                          <span>Referee</span>
                        </Badge>
                      )}
                      {!invitation.canConfigure &&
                        !invitation.canManageScores &&
                        !invitation.isReferee && (
                          <Badge variant="outline">View Tournament</Badge>
                        )}
                    </div>
                  </div>

                  <div className="pt-4">
                    {sessionStatus === 'loading' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Checking authentication...</span>
                      </div>
                    ) : !session?.user ? (
                      <div className="space-y-4">
                        <Alert>
                          <AlertDescription>
                            You need to sign in or create an account to accept this invitation. The invitation is for{' '}
                            <strong>{invitation.email}</strong>.
                          </AlertDescription>
                        </Alert>
                        <div className="flex flex-col gap-2">
                          <Button
                            asChild
                            className="w-full"
                          >
                            <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`}>
                              Sign In to Accept
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="w-full"
                          >
                            <Link href={`/auth/signup?invitationToken=${searchParams.get('token')}&callbackUrl=${encodeURIComponent(window.location.href)}`}>
                              Create Account to Accept
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ) : session.user.email !== invitation.email ? (
                      <Alert variant="destructive">
                        <AlertDescription>
                          This invitation was sent to <strong>{invitation.email}</strong>, but you
                          are signed in as <strong>{session.user.email}</strong>. Please sign in with
                          the correct account.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Button
                        onClick={handleAcceptInvitation}
                        disabled={accepting}
                        className="w-full"
                        size="lg"
                      >
                        {accepting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          'Accept Invitation'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <MainNavigation />
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}

