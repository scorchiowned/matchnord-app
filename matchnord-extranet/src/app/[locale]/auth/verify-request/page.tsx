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
              Check Your Email
            </CardTitle>
            <CardDescription>
              We've sent you a verification email with a link to activate your
              account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Please check your email inbox and click the verification link to
                complete your registration. The link will expire in 48 hours.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <strong>Didn't receive the email?</strong>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Check your spam/junk folder</li>
                <li>• Verify the email address is correct</li>
                <li>• Wait a few minutes and try again</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <LocalizedLink href="/auth/signin">
                  Back to Sign In
                </LocalizedLink>
              </Button>
              <Button className="flex-1" asChild>
                <LocalizedLink href="/">Go Home</LocalizedLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
