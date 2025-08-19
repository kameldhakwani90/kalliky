// ============================================================================
// HELP TOOLTIP - Composant tooltip contextuel
// ============================================================================

'use client';

import { useEffect, useState, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useHelp, HelpTip } from './help-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  HelpCircle,
  Info,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Zap,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipPosition {
  top: number;
  left: number;
  arrow: {
    position: 'top' | 'bottom' | 'left' | 'right';
    offset: number;
  };
}

export function HelpTooltip() {
  const { activeTip, hideTip, isEnabled } = useHelp();
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Calculer la position du tooltip
  useEffect(() => {
    if (!activeTip || !isEnabled) {
      setTooltipPosition(null);
      return;
    }

    const calculatePosition = () => {
      const targetElement = document.querySelector(activeTip.target);
      if (!targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      const tooltipWidth = 300;
      const tooltipHeight = 200; // Estimation
      const arrowSize = 8;
      const padding = 12;

      let top = rect.top + scrollTop;
      let left = rect.left + scrollLeft;
      let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
      let arrowOffset = 0;

      // Déterminer la meilleure position
      const position = activeTip.position || 'auto';
      const spaceTop = rect.top;
      const spaceBottom = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;

      if (position === 'auto') {
        // Choisir automatiquement la meilleure position
        if (spaceBottom >= tooltipHeight + arrowSize + padding) {
          arrowPosition = 'top';
          top = rect.bottom + scrollTop + arrowSize;
        } else if (spaceTop >= tooltipHeight + arrowSize + padding) {
          arrowPosition = 'bottom';
          top = rect.top + scrollTop - tooltipHeight - arrowSize;
        } else if (spaceRight >= tooltipWidth + arrowSize + padding) {
          arrowPosition = 'left';
          left = rect.right + scrollLeft + arrowSize;
          top = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2);
        } else if (spaceLeft >= tooltipWidth + arrowSize + padding) {
          arrowPosition = 'right';
          left = rect.left + scrollLeft - tooltipWidth - arrowSize;
          top = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2);
        }
      } else {
        arrowPosition = getOppositePosition(position);
        switch (position) {
          case 'top':
            top = rect.top + scrollTop - tooltipHeight - arrowSize;
            left = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case 'bottom':
            top = rect.bottom + scrollTop + arrowSize;
            left = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case 'left':
            left = rect.left + scrollLeft - tooltipWidth - arrowSize;
            top = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2);
            break;
          case 'right':
            left = rect.right + scrollLeft + arrowSize;
            top = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2);
            break;
        }
      }

      // S'assurer que le tooltip reste dans la fenêtre
      const maxLeft = window.innerWidth - tooltipWidth - padding;
      const maxTop = window.innerHeight + scrollTop - tooltipHeight - padding;
      
      left = Math.max(padding, Math.min(left, maxLeft));
      top = Math.max(scrollTop + padding, Math.min(top, maxTop));

      // Calculer l'offset de la flèche
      if (arrowPosition === 'top' || arrowPosition === 'bottom') {
        arrowOffset = (rect.left + rect.width / 2) - left;
        arrowOffset = Math.max(20, Math.min(arrowOffset, tooltipWidth - 20));
      } else {
        arrowOffset = (rect.top + rect.height / 2) - top;
        arrowOffset = Math.max(20, Math.min(arrowOffset, tooltipHeight - 20));
      }

      setTooltipPosition({
        top,
        left,
        arrow: {
          position: arrowPosition,
          offset: arrowOffset
        }
      });
    };

    calculatePosition();
    
    const handleResize = () => setTimeout(calculatePosition, 100);
    window.addEventListener('scroll', calculatePosition);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', calculatePosition);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTip, isEnabled]);

  if (!activeTip || !isEnabled || !tooltipPosition) {
    return null;
  }

  const getOppositePosition = (pos: string): 'top' | 'bottom' | 'left' | 'right' => {
    const map = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    return map[pos as keyof typeof map] as 'top' | 'bottom' | 'left' | 'right';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      info: Info,
      warning: AlertCircle,
      success: CheckCircle,
      tip: Lightbulb,
      feature: Zap,
      tutorial: BookOpen,
      default: HelpCircle
    };
    return icons[category as keyof typeof icons] || icons.default;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      info: 'text-blue-600 bg-blue-100',
      warning: 'text-orange-600 bg-orange-100',
      success: 'text-green-600 bg-green-100',
      tip: 'text-purple-600 bg-purple-100',
      feature: 'text-indigo-600 bg-indigo-100',
      tutorial: 'text-cyan-600 bg-cyan-100',
      default: 'text-gray-600 bg-gray-100'
    };
    return colors[category as keyof typeof colors] || colors.default;
  };

  const Icon = getCategoryIcon(activeTip.category);
  const categoryColorClass = getCategoryColor(activeTip.category);

  const arrowStyles = {
    top: {
      bottom: '-6px',
      left: `${tooltipPosition.arrow.offset}px`,
      borderTop: '6px solid white',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent'
    },
    bottom: {
      top: '-6px',
      left: `${tooltipPosition.arrow.offset}px`,
      borderBottom: '6px solid white',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent'
    },
    left: {
      right: '-6px',
      top: `${tooltipPosition.arrow.offset}px`,
      borderLeft: '6px solid white',
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent'
    },
    right: {
      left: '-6px',
      top: `${tooltipPosition.arrow.offset}px`,
      borderRight: '6px solid white',
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent'
    }
  };

  const tooltip = (
    <div
      ref={tooltipRef}
      className="fixed z-[10000] animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        maxWidth: '300px',
        pointerEvents: 'auto'
      }}
    >
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-lg relative">
        {/* Flèche */}
        <div
          className="absolute w-0 h-0 z-10"
          style={arrowStyles[tooltipPosition.arrow.position]}
        />
        
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-lg', categoryColorClass)}>
                <Icon className="h-4 w-4" />
              </div>
              <Badge variant="secondary" className="text-xs capitalize">
                {activeTip.category}
              </Badge>
            </div>
            
            {!activeTip.persistent && (
              <Button
                variant="ghost"
                size="icon"
                onClick={hideTip}
                className="h-6 w-6 -mt-1 -mr-1"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">
              {activeTip.title}
            </h4>
            
            <p className="text-xs text-gray-600 leading-relaxed">
              {activeTip.content}
            </p>
          </div>

          {/* Actions */}
          {activeTip.persistent && (
            <div className="flex justify-end mt-4 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={hideTip}
              >
                Compris
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(tooltip, document.body) : null;
}

interface HelpTriggerProps {
  tipId: string;
  children?: ReactNode;
  className?: string;
  asChild?: boolean;
}

export function HelpTrigger({ tipId, children, className, asChild }: HelpTriggerProps) {
  const { showTip, getTip, isEnabled } = useHelp();
  const tip = getTip(tipId);

  if (!tip || !isEnabled) {
    return asChild ? children : null;
  }

  const handleTrigger = () => {
    showTip(tipId);
  };

  if (asChild && children) {
    return children;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleTrigger}
      className={cn('h-5 w-5 text-gray-400 hover:text-gray-600', className)}
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
}