'use client';

import { Navigation } from '@/components/landing/Navigation';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { InteractiveExamples } from '@/components/landing/InteractiveExamples';
import { VideoSection } from '@/components/landing/VideoSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FooterSection } from '@/components/landing/FooterSection';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <HeroSection />
        
        {/* Video Section - Moved after Hero */}
        <VideoSection />
        
        {/* Features Section */}
        <section id="features">
          <FeaturesSection />
        </section>
        
        {/* Interactive Examples Section */}
        <section id="examples">
          <InteractiveExamples />
        </section>
        
        {/* Pricing */}
        <section id="pricing">
          <PricingSection />
        </section>
      </main>
      
      {/* Footer */}
      <FooterSection />
    </div>
  );
}