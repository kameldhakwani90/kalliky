// ============================================================================
// ONBOARDING WRAPPER - Wrapper principal pour l'onboarding
// ============================================================================

'use client';

import { ReactNode } from 'react';
import { OnboardingProvider } from '../onboarding/onboarding-provider';
import { OnboardingOverlay } from '../onboarding/onboarding-overlay';

interface OnboardingWrapperProps {
  children: ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  return (
    <OnboardingProvider>
      {children}
      <OnboardingOverlay />
    </OnboardingProvider>
  );
}