'use client';

import { useTranslations } from 'next-intl';
import {
  Trophy,
  Users,
  BarChart3,
  Globe,
  Smartphone,
  Zap,
  Calendar,
  Target,
  Award,
  Clock,
} from 'lucide-react';

export function FeaturesSection() {
  const t = useTranslations('landing');

  const features = [
    {
      icon: Trophy,
      key: 'tournamentManagement',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Zap,
      key: 'liveScoring',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Users,
      key: 'teamManagement',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: BarChart3,
      key: 'standings',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: Globe,
      key: 'multiLanguage',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      icon: Smartphone,
      key: 'mobileFriendly',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  return (
    <div className="bg-style-background py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-style-text-primary lg:text-4xl">
            {t('features.title')}
          </h2>
          <p className="text-lg leading-relaxed text-style-text-secondary">
            Our comprehensive platform provides everything you need to organize,
            manage, and track tournaments efficiently.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="group rounded-xl border border-style-border bg-style-card-bg p-8 transition-all duration-300 hover:-translate-y-1 hover:border-style-primary/50 hover:shadow-lg"
              >
                <div
                  className={`h-16 w-16 ${feature.bgColor} mb-6 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="mb-4 text-xl font-semibold text-style-text-primary">
                  {t(`features.${feature.key}.title`)}
                </h3>
                <p className="leading-relaxed text-style-text-secondary">
                  {t(`features.${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-style-primary/10">
              <Calendar className="h-8 w-8 text-style-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-style-text-primary">
              Easy Scheduling
            </h3>
            <p className="text-style-text-secondary">
              Automated match scheduling and venue management
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-style-primary/10">
              <Target className="h-8 w-8 text-style-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-style-text-primary">
              Real-time Updates
            </h3>
            <p className="text-style-text-secondary">
              Live score updates and instant notifications
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-style-primary/10">
              <Award className="h-8 w-8 text-style-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-style-text-primary">
              Professional Results
            </h3>
            <p className="text-style-text-secondary">
              Generate professional standings and tournament reports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

