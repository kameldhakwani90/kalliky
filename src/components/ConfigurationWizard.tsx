'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Utensils, 
  Calendar, 
  UserCheck, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceConfig {
  hasProducts: boolean;
  hasReservations: boolean;
  hasConsultations: boolean;
}

interface ConfigurationWizardProps {
  initialConfig?: ServiceConfig;
  onConfigChange: (config: ServiceConfig) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
}

const serviceTypes = [
  {
    id: 'products',
    title: 'IA Avancée',
    description: 'Réception intelligente des appels',
    emoji: '🤖',
    examples: ['Prise de commandes', 'Catalogue produits', 'Gestion stock', 'Livraison'],
    key: 'hasProducts' as keyof ServiceConfig
  },
  {
    id: 'reservations',
    title: 'Configuration Rapide',
    description: 'Prêt en quelques minutes',
    emoji: '⚡',
    examples: ['Réservation tables', 'Planning horaires', 'Confirmation automatique', 'Rappels'],
    key: 'hasReservations' as keyof ServiceConfig
  },
  {
    id: 'consultations',
    title: 'Service Premium',
    description: 'Expérience client exceptionnelle',
    emoji: '🛎️',
    examples: ['Prise de RDV', 'Consultations privées', 'Suivi dossiers', 'Facturation'],
    key: 'hasConsultations' as keyof ServiceConfig
  }
];

export default function ConfigurationWizard({ 
  initialConfig, 
  onConfigChange, 
  onNext, 
  onPrevious, 
  showNavigation = true 
}: ConfigurationWizardProps) {
  const [config, setConfig] = useState<ServiceConfig>(initialConfig || {
    hasProducts: false,
    hasReservations: false,
    hasConsultations: false
  });

  const handleServiceToggle = (serviceKey: keyof ServiceConfig) => {
    const newConfig = {
      ...config,
      [serviceKey]: !config[serviceKey]
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const selectedCount = Object.values(config).filter(Boolean).length;
  const hasSelection = selectedCount > 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header Apple Style */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 backdrop-blur-xl mx-auto mb-6">
          <span className="text-4xl">✨</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">
            Bienvenue chez Kalliky.ai !
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Prêt à transformer la gestion de votre activité ? Cet assistant va vous guider pour configurer votre espace de travail en quelques minutes.
          </p>
        </div>
        {hasSelection && (
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 px-4 py-2 rounded-full">
            <span className="text-lg">✅</span>
            <span className="text-green-300 font-medium text-sm">
              {selectedCount} service{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Service Cards - Style Apple */}
      <div className="grid md:grid-cols-3 gap-8">
        {serviceTypes.map((service) => {
          const isSelected = config[service.key];
          
          return (
            <div
              key={service.id}
              className={cn(
                "relative cursor-pointer group transition-all duration-300 ease-out",
                "hover:scale-105 hover:shadow-2xl hover:shadow-black/20"
              )}
              onClick={() => handleServiceToggle(service.key)}
            >
              {/* Selection glow effect */}
              {isSelected && (
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl opacity-20 blur-lg"></div>
              )}
              
              <Card 
                className={cn(
                  "relative backdrop-blur-2xl border rounded-3xl overflow-hidden h-72 transition-all duration-300",
                  isSelected 
                    ? "bg-white/15 border-white/30 shadow-xl" 
                    : "bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30"
                )}
              >
                {/* Selection badge */}
                {isSelected && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                      <span className="text-sm">✓</span>
                    </div>
                  </div>
                )}

                <CardContent className="p-6 h-full flex flex-col">
                  {/* Emoji avec animation */}
                  <div className="text-center mb-4">
                    <div className={cn(
                      "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-all duration-300",
                      "group-hover:scale-110 group-hover:rotate-3",
                      isSelected 
                        ? "bg-gradient-to-br from-white/20 to-white/10 shadow-lg" 
                        : "bg-white/10"
                    )}>
                      <span className="text-3xl">{service.emoji}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-100 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Features avec emojis */}
                  <div className="flex-1 space-y-2">
                    {service.examples.slice(0, 3).map((example, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="text-sm">
                          {i === 0 ? '🎯' : i === 1 ? '⚡' : '🔥'}
                        </span>
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>

                  {/* Toggle animé */}
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className={cn(
                      "flex items-center justify-center gap-2 py-2 px-4 rounded-full transition-all duration-200",
                      isSelected 
                        ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30" 
                        : "bg-white/10 border border-white/20"
                    )}>
                      <span className="text-lg">
                        {isSelected ? '✅' : '⭕'}
                      </span>
                      <span className={cn(
                        "text-sm font-medium transition-colors",
                        isSelected ? "text-green-300" : "text-gray-400"
                      )}>
                        {isSelected ? 'Activé' : 'Cliquer pour activer'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Configuration Summary - Apple Style */}
      {hasSelection && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl">
              <span className="text-2xl">🎉</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-200 text-lg mb-2">
                Configuration validée !
              </h3>
              <p className="text-green-300 text-sm leading-relaxed">
                Votre établissement aura accès aux services : {' '}
                <span className="font-medium">
                  {Object.entries(config)
                    .filter(([_, enabled]) => enabled)
                    .map(([key, _]) => {
                      const service = serviceTypes.find(s => s.key === key);
                      return service?.title;
                    })
                    .join(', ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Apple Style */}
      {showNavigation && (
        <div className="flex justify-between items-center pt-8">
          <Button 
            variant="outline" 
            onClick={onPrevious}
            className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10 rounded-2xl px-6 py-3 backdrop-blur-sm"
          >
            <span className="text-lg">←</span>
            <span>Précédent</span>
          </Button>
          
          <Button 
            onClick={onNext}
            disabled={!hasSelection}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-8 py-3 font-medium transition-all duration-200",
              hasSelection 
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105" 
                : "bg-white/20 text-gray-400 cursor-not-allowed"
            )}
          >
            <span>Continuer</span>
            <span className="text-lg">→</span>
          </Button>
        </div>
      )}

      {/* Helper Text avec emoji */}
      {!hasSelection && (
        <div className="text-center pt-4">
          <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
            <span className="text-lg">👆</span>
            <span>Sélectionnez au moins un service pour continuer</span>
          </p>
        </div>
      )}
    </div>
  );
}