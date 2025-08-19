'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { OnboardingWrapper } from '@/components/providers/onboarding-wrapper';
import { Toaster } from "@/components/ui/toaster";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="kalliky-theme">
      <LanguageProvider>
        <OnboardingWrapper>
          {children}
          <Toaster />
        </OnboardingWrapper>
      </LanguageProvider>
    </ThemeProvider>
  );
}