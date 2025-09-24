'use client';

import { LandingNavigation } from './landing-navigation';
import { HeroSection } from './hero-section';
import { FeaturesSection } from './features-section';
import { CTASection } from './cta-section';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-style-background">
      <LandingNavigation />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
