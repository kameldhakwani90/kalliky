// ============================================================================
// HELP PROVIDER - Système d'aide contextuel avec tooltips
// ============================================================================

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface HelpTip {
  id: string;
  title: string;
  content: string;
  category: string;
  target: string;         // Sélecteur CSS
  trigger?: 'hover' | 'click' | 'focus';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay?: number;         // Délai avant affichage en ms
  persistent?: boolean;   // Reste ouvert jusqu'à fermeture explicite
  priority?: number;      // Priorité d'affichage (plus élevé = plus prioritaire)
}

interface HelpContextType {
  // État
  activeTip: HelpTip | null;
  isHelpModeActive: boolean;
  showAllTips: boolean;
  
  // Actions
  showTip: (tipId: string) => void;
  hideTip: () => void;
  toggleHelpMode: () => void;
  toggleShowAllTips: () => void;
  
  // Gestion des tips
  registerTip: (tip: HelpTip) => void;
  unregisterTip: (tipId: string) => void;
  getTip: (tipId: string) => HelpTip | null;
  getTipsByCategory: (category: string) => HelpTip[];
  
  // Préférences utilisateur
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const HelpContext = createContext<HelpContextType | null>(null);

export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within HelpProvider');
  }
  return context;
}

interface HelpProviderProps {
  children: ReactNode;
}

export function HelpProvider({ children }: HelpProviderProps) {
  const [tips, setTips] = useState<Map<string, HelpTip>>(new Map());
  const [activeTip, setActiveTip] = useState<HelpTip | null>(null);
  const [isHelpModeActive, setIsHelpModeActive] = useState(false);
  const [showAllTips, setShowAllTips] = useState(false);
  const [isEnabled, setIsEnabledState] = useState(true);

  // Charger les préférences depuis localStorage
  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('kalliky-help-preferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        setIsEnabledState(prefs.enabled ?? true);
      }
    } catch (error) {
      console.error('Erreur chargement préférences aide:', error);
    }
  };

  // Sauvegarder les préférences
  const savePreferences = (enabled: boolean) => {
    localStorage.setItem('kalliky-help-preferences', JSON.stringify({
      enabled,
      lastUpdated: new Date().toISOString()
    }));
  };

  // Enregistrer un tip
  const registerTip = useCallback((tip: HelpTip) => {
    setTips(prev => new Map(prev.set(tip.id, tip)));
  }, []);

  // Désinscrire un tip
  const unregisterTip = useCallback((tipId: string) => {
    setTips(prev => {
      const newTips = new Map(prev);
      newTips.delete(tipId);
      return newTips;
    });
  }, []);

  // Obtenir un tip par ID
  const getTip = (tipId: string): HelpTip | null => {
    return tips.get(tipId) || null;
  };

  // Obtenir les tips par catégorie
  const getTipsByCategory = (category: string): HelpTip[] => {
    return Array.from(tips.values()).filter(tip => tip.category === category);
  };

  // Afficher un tip
  const showTip = (tipId: string) => {
    if (!isEnabled) return;
    
    const tip = getTip(tipId);
    if (tip) {
      setActiveTip(tip);
      
      // Auto-hide si pas persistant
      if (!tip.persistent) {
        setTimeout(() => {
          if (activeTip?.id === tipId) {
            hideTip();
          }
        }, 5000); // 5 secondes par défaut
      }
    }
  };

  // Masquer le tip actuel
  const hideTip = () => {
    setActiveTip(null);
  };

  // Basculer le mode aide
  const toggleHelpMode = () => {
    setIsHelpModeActive(!isHelpModeActive);
    if (!isHelpModeActive) {
      setShowAllTips(true);
    } else {
      setShowAllTips(false);
      hideTip();
    }
  };

  // Basculer l'affichage de tous les tips
  const toggleShowAllTips = () => {
    setShowAllTips(!showAllTips);
  };

  // Activer/désactiver l'aide
  const setEnabled = (enabled: boolean) => {
    setIsEnabledState(enabled);
    savePreferences(enabled);
    
    if (!enabled) {
      hideTip();
      setIsHelpModeActive(false);
      setShowAllTips(false);
    }
  };

  const contextValue = {
    activeTip,
    isHelpModeActive,
    showAllTips,
    
    showTip,
    hideTip,
    toggleHelpMode,
    toggleShowAllTips,
    
    registerTip,
    unregisterTip,
    getTip,
    getTipsByCategory,
    
    isEnabled,
    setEnabled
  };

  return (
    <HelpContext.Provider value={contextValue}>
      {children}
    </HelpContext.Provider>
  );
}