// ============================================================================
// ONBOARDING PROVIDER - Système d'onboarding interactif guidé
// ============================================================================

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;           // Sélecteur CSS de l'élément à mettre en évidence
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;       // Action à exécuter quand l'étape est visitée
  condition?: () => boolean; // Condition pour afficher l'étape
  skippable?: boolean;       // L'étape peut-elle être ignorée
  category: string;          // Catégorie de l'onboarding
}

export interface OnboardingFlow {
  id: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
  autoStart?: boolean;       // Démarrer automatiquement
  resetOnComplete?: boolean; // Reset après completion
}

interface OnboardingContextType {
  // État général
  isActive: boolean;
  currentFlow: OnboardingFlow | null;
  currentStepIndex: number;
  isComplete: boolean;
  completedFlows: string[];
  
  // Actions
  startFlow: (flowId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  skipFlow: () => void;
  completeFlow: () => void;
  resetFlow: (flowId: string) => void;
  
  // Gestionnaires
  registerFlow: (flow: OnboardingFlow) => void;
  isFlowCompleted: (flowId: string) => boolean;
  shouldShowStep: (stepId: string) => boolean;
  
  // État des étapes
  getCurrentStep: () => OnboardingStep | null;
  getStepProgress: () => { current: number; total: number };
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [flows, setFlows] = useState<Map<string, OnboardingFlow>>(new Map());
  const [isActive, setIsActive] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<OnboardingFlow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedFlows, setCompletedFlows] = useState<string[]>([]);

  // Charger l'état depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kalliky-onboarding-state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setCompletedFlows(state.completedFlows || []);
      } catch (error) {
        console.error('Erreur chargement état onboarding:', error);
      }
    }
  }, []);

  // Sauvegarder l'état dans localStorage
  const saveState = (newCompletedFlows: string[]) => {
    localStorage.setItem('kalliky-onboarding-state', JSON.stringify({
      completedFlows: newCompletedFlows,
      lastUpdated: new Date().toISOString()
    }));
  };

  // Enregistrer un flux d'onboarding
  const registerFlow = (flow: OnboardingFlow) => {
    setFlows(prev => new Map(prev.set(flow.id, flow)));
    
    // Démarrer automatiquement si configuré et pas encore complété
    if (flow.autoStart && !completedFlows.includes(flow.id)) {
      setTimeout(() => startFlow(flow.id), 1000);
    }
  };

  // Démarrer un flux d'onboarding
  const startFlow = (flowId: string) => {
    const flow = flows.get(flowId);
    if (!flow) {
      console.warn(`Flux d'onboarding "${flowId}" introuvable`);
      return;
    }

    setCurrentFlow(flow);
    setCurrentStepIndex(0);
    setIsActive(true);

    // Exécuter l'action de la première étape
    const firstStep = flow.steps[0];
    if (firstStep?.action) {
      firstStep.action();
    }
  };

  // Étape suivante
  const nextStep = () => {
    if (!currentFlow) return;

    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex >= currentFlow.steps.length) {
      completeFlow();
      return;
    }

    setCurrentStepIndex(nextIndex);
    
    // Exécuter l'action de la nouvelle étape
    const step = currentFlow.steps[nextIndex];
    if (step?.action) {
      step.action();
    }
  };

  // Étape précédente
  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Ignorer l'étape courante
  const skipStep = () => {
    const currentStep = getCurrentStep();
    if (currentStep?.skippable !== false) {
      nextStep();
    }
  };

  // Ignorer tout le flux
  const skipFlow = () => {
    if (currentFlow) {
      completeFlow();
    }
  };

  // Compléter le flux courant
  const completeFlow = () => {
    if (!currentFlow) return;

    const newCompletedFlows = [...completedFlows, currentFlow.id];
    setCompletedFlows(newCompletedFlows);
    saveState(newCompletedFlows);

    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStepIndex(0);

    // Reset si configuré
    if (currentFlow.resetOnComplete) {
      setTimeout(() => {
        resetFlow(currentFlow.id);
      }, 100);
    }
  };

  // Reset un flux d'onboarding
  const resetFlow = (flowId: string) => {
    const newCompletedFlows = completedFlows.filter(id => id !== flowId);
    setCompletedFlows(newCompletedFlows);
    saveState(newCompletedFlows);
  };

  // Vérifier si un flux est complété
  const isFlowCompleted = (flowId: string) => {
    return completedFlows.includes(flowId);
  };

  // Vérifier si une étape doit être affichée
  const shouldShowStep = (stepId: string) => {
    if (!currentFlow) return false;
    
    const step = currentFlow.steps.find(s => s.id === stepId);
    if (!step) return false;

    return step.condition ? step.condition() : true;
  };

  // Obtenir l'étape courante
  const getCurrentStep = () => {
    if (!currentFlow || currentStepIndex >= currentFlow.steps.length) {
      return null;
    }
    return currentFlow.steps[currentStepIndex];
  };

  // Obtenir le progrès
  const getStepProgress = () => {
    if (!currentFlow) {
      return { current: 0, total: 0 };
    }
    return {
      current: currentStepIndex + 1,
      total: currentFlow.steps.length
    };
  };

  const isComplete = currentFlow ? currentStepIndex >= currentFlow.steps.length : false;

  const contextValue = {
    isActive,
    currentFlow,
    currentStepIndex,
    isComplete,
    completedFlows,
    
    startFlow,
    nextStep,
    previousStep,
    skipStep,
    skipFlow,
    completeFlow,
    resetFlow,
    
    registerFlow,
    isFlowCompleted,
    shouldShowStep,
    
    getCurrentStep,
    getStepProgress
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}