// ============================================================================
// ONBOARDING OVERLAY - Interface utilisateur pour l'onboarding interactif
// ============================================================================

'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding } from './onboarding-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Check,
  Lightbulb,
  ArrowRight,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HighlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingOverlay() {
  const {
    isActive,
    currentFlow,
    getCurrentStep,
    getStepProgress,
    nextStep,
    previousStep,
    skipStep,
    skipFlow,
    completeFlow
  } = useOnboarding();

  const [highlightPosition, setHighlightPosition] = useState<HighlightPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStep = getCurrentStep();
  const progress = getStepProgress();

  // Calculer la position de l'élément ciblé et du tooltip
  useEffect(() => {
    if (!isActive || !currentStep?.target) {
      setHighlightPosition(null);
      setTooltipPosition(null);
      return;
    }

    const updatePositions = () => {
      const targetElement = document.querySelector(currentStep.target!);
      if (!targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      // Position de l'highlight
      setHighlightPosition({
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: rect.height
      });

      // Position du tooltip selon la configuration
      const tooltipOffset = 20;
      let tooltipTop = rect.top + scrollTop;
      let tooltipLeft = rect.left + scrollLeft;

      switch (currentStep.position) {
        case 'top':
          tooltipTop = rect.top + scrollTop - tooltipOffset - 200; // Estimation hauteur tooltip
          tooltipLeft = rect.left + scrollLeft + (rect.width / 2) - 150; // Centrer
          break;
        case 'bottom':
          tooltipTop = rect.bottom + scrollTop + tooltipOffset;
          tooltipLeft = rect.left + scrollLeft + (rect.width / 2) - 150; // Centrer
          break;
        case 'left':
          tooltipTop = rect.top + scrollTop + (rect.height / 2) - 100; // Centrer verticalement
          tooltipLeft = rect.left + scrollLeft - tooltipOffset - 300; // Estimation largeur tooltip
          break;
        case 'right':
          tooltipTop = rect.top + scrollTop + (rect.height / 2) - 100; // Centrer verticalement
          tooltipLeft = rect.right + scrollLeft + tooltipOffset;
          break;
        default:
          tooltipTop = rect.bottom + scrollTop + tooltipOffset;
          tooltipLeft = rect.left + scrollLeft;
      }

      // S'assurer que le tooltip reste dans la fenêtre
      const maxLeft = window.innerWidth - 320; // Largeur estimée du tooltip
      const maxTop = window.innerHeight - 250; // Hauteur estimée du tooltip
      
      tooltipLeft = Math.max(20, Math.min(tooltipLeft, maxLeft));
      tooltipTop = Math.max(20, Math.min(tooltipTop, maxTop));

      setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
    };

    updatePositions();
    
    // Recalculer lors du scroll ou resize
    const handleResize = () => setTimeout(updatePositions, 100);
    window.addEventListener('scroll', updatePositions);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, currentStep]);

  // Scroll automatique vers l'élément ciblé
  useEffect(() => {
    if (!isActive || !currentStep?.target) return;

    const targetElement = document.querySelector(currentStep.target);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, [isActive, currentStep]);

  if (!isActive || !currentFlow || !currentStep) {
    return null;
  }

  const handleNext = () => {
    if (progress.current >= progress.total) {
      completeFlow();
    } else {
      nextStep();
    }
  };

  const overlay = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={skipFlow}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Spotlight highlight */}
      {highlightPosition && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: highlightPosition.top - 8,
            left: highlightPosition.left - 8,
            width: highlightPosition.width + 16,
            height: highlightPosition.height + 16,
            background: 'transparent',
            border: '3px solid #3b82f6',
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.5)',
            animation: 'pulse 2s infinite'
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPosition && (
        <div
          className="absolute pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            maxWidth: '320px'
          }}
        >
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-lg">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {progress.current} / {progress.total}
                  </Badge>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipFlow}
                  className="h-6 w-6 -mt-1 -mr-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <Progress 
                  value={(progress.current / progress.total) * 100}
                  className="h-2"
                />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentStep.title}
                </h3>
                
                <p className="text-sm text-gray-600 leading-relaxed">
                  {currentStep.description}
                </p>

                {/* Flow title if different from step */}
                {currentFlow.title !== currentStep.title && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Partie de: <span className="font-medium">{currentFlow.title}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  {progress.current > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={previousStep}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      Précédent
                    </Button>
                  )}
                  
                  {currentStep.skippable !== false && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipStep}
                      className="gap-1 text-gray-500"
                    >
                      <SkipForward className="h-3 w-3" />
                      Ignorer
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleNext}
                  size="sm"
                  className="gap-1"
                >
                  {progress.current >= progress.total ? (
                    <>
                      <Check className="h-3 w-3" />
                      Terminer
                    </>
                  ) : (
                    <>
                      Suivant
                      <ChevronRight className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : null;
}

// Styles CSS pour l'animation pulse
const pulseStyles = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.02);
    }
  }
`;

// Injecter les styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = pulseStyles;
  document.head.appendChild(styleSheet);
}