'use client';

import { Link } from '@/i18n/routing';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MainNavigation } from '@/components/navigation/main-navigation';
import {
  CheckCircle,
  Mail,
  Calendar,
  Users,
  Trophy,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

import { useEffect, useState } from 'react';

export default function RegistrationConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get registration data from session storage
    const registrationData = sessionStorage.getItem('registrationData');
    if (registrationData) {
      setRegistration(JSON.parse(registrationData));
      // Clear from session storage
      sessionStorage.removeItem('registrationData');
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Registration Not Found</h1>
          <p className="mb-4 text-muted-foreground">
            Unable to find registration details. Please try registering again.
          </p>
          <Button asChild>
            <Link href={`/tournaments/${params.id}/register`}>
              Register Again
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />

      <main className="container mx-auto py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Success Header */}
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Registration Submitted!
              </h1>
              <p className="text-muted-foreground">
                Thank you for registering your team for{' '}
                {registration.tournament}
              </p>
            </div>
          </div>

          {/* Registration Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Registration Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Registration ID:</span>
                  <div className="font-mono">{registration.id}</div>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <div>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      Pending Approval
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Team:</span>
                  <div>{registration.teamName}</div>
                </div>
                <div>
                  <span className="font-medium">Division:</span>
                  <div>{registration.division}</div>
                </div>
                <div>
                  <span className="font-medium">Manager:</span>
                  <div>{registration.managerName}</div>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <div>{registration.managerEmail}</div>
                </div>
                <div>
                  <span className="font-medium">Amount:</span>
                  <div className="font-medium">€{registration.amount}</div>
                </div>
                <div>
                  <span className="font-medium">Payment Method:</span>
                  <div className="capitalize">
                    {registration.paymentMethod.toLowerCase()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
              <CardDescription>
                Here&apos;s what you can expect in the coming days
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <div className="font-medium">Confirmation Email</div>
                    <div className="text-sm text-muted-foreground">
                      You&apos;ll receive a confirmation email within the next
                      few minutes with all the details.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <div className="font-medium">Tournament Review</div>
                    <div className="text-sm text-muted-foreground">
                      The tournament organizers will review your registration
                      within 24-48 hours.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <div className="font-medium">Payment Processing</div>
                    <div className="text-sm text-muted-foreground">
                      Your payment will be processed and you&apos;ll receive a
                      receipt via email.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-xs font-medium text-blue-600">4</span>
                  </div>
                  <div>
                    <div className="font-medium">Final Confirmation</div>
                    <div className="text-sm text-muted-foreground">
                      Once approved, you&apos;ll receive final confirmation and
                      tournament details.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-blue-800">
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="text-sm">
                  <strong>Check your email:</strong> Make sure to check your
                  spam folder if you don&apos;t receive the confirmation email.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="text-sm">
                  <strong>Tournament dates:</strong> July 15-17, 2024. Make sure
                  your team is available for the entire duration.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="text-sm">
                  <strong>Team roster:</strong> You&apos;ll be able to add your
                  complete team roster once your registration is approved.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href={`/tournaments/${params.id}`}>
                <Trophy className="mr-2 h-4 w-4" />
                View Tournament
              </Link>
            </Button>

            <Button variant="outline" asChild className="flex-1">
              <Link href="/dashboard">
                <Users className="mr-2 h-4 w-4" />
                My Registrations
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href="/tournaments">
                <ArrowRight className="mr-2 h-4 w-4" />
                Browse Other Tournaments
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href="/help">
                <ExternalLink className="mr-2 h-4 w-4" />
                Get Help
              </Link>
            </Button>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                If you have any questions about your registration, please
                contact us:
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Email</div>
                  <a
                    href="mailto:info@pingviinicup.fi"
                    className="text-primary hover:underline"
                  >
                    info@pingviinicup.fi
                  </a>
                </div>
                <div>
                  <div className="font-medium">Phone</div>
                  <a
                    href="tel:+358401234567"
                    className="text-primary hover:underline"
                  >
                    +358 40 123 4567
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
