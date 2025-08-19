// ============================================================================
// HELP BUTTON - Bouton principal d'activation de l'aide
// ============================================================================

'use client';

import { useState } from 'react';
import { useHelp } from './help-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  HelpCircle,
  Lightbulb,
  BookOpen,
  Eye,
  EyeOff,
  Settings,
  PlayCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpButtonProps {
  className?: string;
  variant?: 'default' | 'floating';
}

export function HelpButton({ className, variant = 'default' }: HelpButtonProps) {
  const {
    isHelpModeActive,
    showAllTips,
    isEnabled,
    toggleHelpMode,
    toggleShowAllTips,
    setEnabled
  } = useHelp();

  const [isOpen, setIsOpen] = useState(false);

  if (!isEnabled && variant === 'floating') {
    return null;
  }

  const handleToggleHelp = () => {
    if (!isEnabled) {
      setEnabled(true);
    }
    toggleHelpMode();
    setIsOpen(false);
  };

  const handleToggleAllTips = () => {
    toggleShowAllTips();
    setIsOpen(false);
  };

  const handleToggleEnabled = () => {
    setEnabled(!isEnabled);
    setIsOpen(false);
  };

  if (variant === 'floating') {
    return (
      <div className={cn(
        'fixed bottom-6 right-6 z-50',
        className
      )}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className={cn(
                'rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
                'bg-blue-600 hover:bg-blue-700 text-white',
                isHelpModeActive && 'bg-green-600 hover:bg-green-700 animate-pulse'
              )}
            >
              <HelpCircle className="h-5 w-5 mr-2" />
              Aide
              {isHelpModeActive && (
                <Badge className="ml-2 bg-white text-blue-600 text-xs">
                  Actif
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            side="top"
            className="w-56"
            sideOffset={8}
          >
            <DropdownMenuLabel>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Aide contextuelle
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleToggleHelp}>
              <PlayCircle className="h-4 w-4 mr-2" />
              {isHelpModeActive ? 'Désactiver le mode aide' : 'Activer le mode aide'}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleToggleAllTips}>
              {showAllTips ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showAllTips ? 'Masquer tous les conseils' : 'Afficher tous les conseils'}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleToggleEnabled}>
              <Settings className="h-4 w-4 mr-2" />
              {isEnabled ? 'Désactiver l\'aide' : 'Activer l\'aide'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2',
            isHelpModeActive && 'bg-green-50 border-green-200 text-green-700',
            className
          )}
        >
          <HelpCircle className="h-4 w-4" />
          Aide
          {isHelpModeActive && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
              Actif
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Options d'aide</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleToggleHelp}>
          <PlayCircle className="h-4 w-4 mr-2" />
          {isHelpModeActive ? 'Désactiver' : 'Mode aide'}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleToggleAllTips}>
          {showAllTips ? (
            <EyeOff className="h-4 w-4 mr-2" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          {showAllTips ? 'Masquer conseils' : 'Tous les conseils'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}