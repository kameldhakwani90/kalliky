'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Navigation } from '@/components/landing/Navigation';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { ROICalculator } from '@/components/landing/ROICalculator';
import { PricingSection } from '@/components/landing/PricingSection';
import { FooterSection } from '@/components/landing/FooterSection';

export default function Home() {
  useEffect(() => {
    // Initialize i18n on component mount
    i18n.init();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <div className="min-h-screen">
        <Navigation />
        
        <main>
          {/* Hero Section */}
          <HeroSection />
          
          {/* Features Section */}
          <section id="features">
            <FeaturesSection />
          </section>
          
          {/* ROI Calculator */}
          <section id="calculator">
            <ROICalculator />
          </section>
          
          {/* Pricing */}
          <section id="pricing">
            <PricingSection />
          </section>
        </main>
        
        {/* Footer */}
        <FooterSection />
      </div>
    </I18nextProvider>
  );
}