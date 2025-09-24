'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { Trophy, Users, BarChart3, Globe, Smartphone, Zap } from 'lucide-react';

export function HeroSection() {
  const t = useTranslations('landing');

  return (
    <div className="relative flex min-h-screen items-center bg-gradient-to-br from-style-primary/5 via-style-background to-style-primary/10">
      {/* Background Pattern */}
      <div></div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight text-style-text-primary lg:text-6xl">
                  {t('title')}
                </h1>
                <p className="text-xl leading-relaxed text-style-text-secondary lg:text-2xl">
                  {t('subtitle')}
                </p>
                <p className="text-lg leading-relaxed text-style-text-secondary">
                  {t('description')}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-style-primary px-8 py-4 text-lg text-white hover:bg-style-primary-dark"
                >
                  <Link href="/auth/signup">{t('cta.signUp')}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-style-primary px-8 py-4 text-lg text-style-primary hover:bg-style-primary hover:text-white"
                >
                  <Link href="/auth/signin">{t('cta.signIn')}</Link>
                </Button>
              </div>

              {/* Feature Icons */}
              <div className="flex flex-wrap gap-6 pt-8">
                <div className="flex items-center gap-2 text-style-text-secondary">
                  <Trophy className="h-5 w-5 text-style-primary" />
                  <span className="text-sm font-medium">
                    Tournament Management
                  </span>
                </div>
                <div className="flex items-center gap-2 text-style-text-secondary">
                  <Users className="h-5 w-5 text-style-primary" />
                  <span className="text-sm font-medium">Team Management</span>
                </div>
                <div className="flex items-center gap-2 text-style-text-secondary">
                  <BarChart3 className="h-5 w-5 text-style-primary" />
                  <span className="text-sm font-medium">Live Scoring</span>
                </div>
                <div className="flex items-center gap-2 text-style-text-secondary">
                  <Globe className="h-5 w-5 text-style-primary" />
                  <span className="text-sm font-medium">Multi-language</span>
                </div>
                <div className="flex items-center gap-2 text-style-text-secondary">
                  <Smartphone className="h-5 w-5 text-style-primary" />
                  <span className="text-sm font-medium">Mobile-First</span>
                </div>
                <div className="flex items-center gap-2 text-style-text-secondary">
                  <Zap className="h-5 w-5 text-style-primary" />
                  <span className="text-sm font-medium">Real-time</span>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="rounded-2xl border border-style-border bg-gradient-to-br from-style-primary/10 to-style-primary/5 p-8">
                {/* Tournament Dashboard Mockup */}
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-style-primary">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-style-text-primary">
                          Tournament Dashboard
                        </h3>
                        <p className="text-sm text-style-text-secondary">
                          Live Management
                        </p>
                      </div>
                    </div>
                    <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-style-border bg-style-background p-4">
                      <div className="text-2xl font-bold text-style-text-primary">
                        24
                      </div>
                      <div className="text-sm text-style-text-secondary">
                        Active Tournaments
                      </div>
                    </div>
                    <div className="rounded-lg border border-style-border bg-style-background p-4">
                      <div className="text-2xl font-bold text-style-text-primary">
                        156
                      </div>
                      <div className="text-sm text-style-text-secondary">
                        Teams Registered
                      </div>
                    </div>
                    <div className="rounded-lg border border-style-border bg-style-background p-4">
                      <div className="text-2xl font-bold text-style-text-primary">
                        89
                      </div>
                      <div className="text-sm text-style-text-secondary">
                        Matches Today
                      </div>
                    </div>
                    <div className="rounded-lg border border-style-border bg-style-background p-4">
                      <div className="text-2xl font-bold text-style-text-primary">
                        12
                      </div>
                      <div className="text-sm text-style-text-secondary">
                        Live Matches
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-style-text-primary">
                      Recent Activity
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-style-text-secondary">
                          Match finished: Team A vs Team B (3-1)
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-style-text-secondary">
                          New team registered: Thunder FC
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        <span className="text-style-text-secondary">
                          Tournament created: Summer Cup 2024
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -right-4 -top-4 flex h-16 w-16 items-center justify-center rounded-full bg-style-accent/20">
                <Trophy className="h-8 w-8 text-style-accent" />
              </div>
              <div className="absolute -bottom-4 -left-4 flex h-12 w-12 items-center justify-center rounded-full bg-style-primary/20">
                <Users className="h-6 w-6 text-style-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
