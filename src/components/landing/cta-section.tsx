'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { ArrowRight, CheckCircle } from 'lucide-react';

export function CTASection() {
  const t = useTranslations('landing');

  const benefits = [
    'Free to get started',
    'No setup fees',
    '24/7 support',
    'Unlimited tournaments',
  ];

  return (
    <div className="bg-gradient-to-r from-style-primary to-style-primary-dark py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white lg:text-4xl">
                Ready to streamline your tournaments?
              </h2>
              <p className="text-xl leading-relaxed text-white/90">
                Join thousands of tournament organizers who trust our platform
                to manage their events.
              </p>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-white/90"
                >
                  <CheckCircle className="h-5 w-5 text-white" />
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-white px-8 py-4 text-lg font-semibold text-style-primary hover:bg-white/90"
              >
                <Link href="/auth/signup">
                  {t('cta.signUp')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white px-8 py-4 text-lg font-semibold text-white hover:bg-white hover:text-style-primary"
              >
                <Link href="/auth/signin">{t('cta.signIn')}</Link>
              </Button>
            </div>

            {/* Additional Info */}
            <div className="border-t border-white/20 pt-8">
              <p className="text-sm text-white/80">
                {t('cta.signInDescription')} • {t('cta.signUpDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

