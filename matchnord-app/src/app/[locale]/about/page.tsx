"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Globe, Zap, Smartphone, BarChart3 } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function AboutPage() {
  const t = useTranslations();

  const features = [
    {
      icon: Smartphone,
      title: t('pages.about.features.mobileFirst.title'),
      description: t('pages.about.features.mobileFirst.description'),
    },
    {
      icon: Zap,
      title: t('pages.about.features.realTime.title'),
      description: t('pages.about.features.realTime.description'),
    },
    {
      icon: Globe,
      title: t('pages.about.features.multiLanguage.title'),
      description: t('pages.about.features.multiLanguage.description'),
    },
    {
      icon: BarChart3,
      title: t('pages.about.features.liveStandings.title'),
      description: t('pages.about.features.liveStandings.description'),
    },
    {
      icon: Users,
      title: t('pages.about.features.teamInfo.title'),
      description: t('pages.about.features.teamInfo.description'),
    },
    {
      icon: Trophy,
      title: t('pages.about.features.tournamentDirectory.title'),
      description: t('pages.about.features.tournamentDirectory.description'),
    },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            {t('pages.about.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('pages.about.subtitle')}
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {t('pages.about.mission')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t('pages.about.missionText1')}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mt-4">
                {t('pages.about.missionText2')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('pages.about.whatWeOffer')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                {t('pages.about.ourImpact')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    500+
                  </div>
                  <div className="text-gray-600">{t('pages.about.stats.activeTournaments')}</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    10K+
                  </div>
                  <div className="text-gray-600">{t('pages.about.stats.liveMatches')}</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    50K+
                  </div>
                  <div className="text-gray-600">{t('pages.about.stats.activeUsers')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('pages.about.getInTouch')}
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {t('pages.about.getInTouchText')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:info@matchnord.com"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('pages.about.contactUs')}
                </a>
                <Link
                  href="/tournaments"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('pages.about.exploreTournaments')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
