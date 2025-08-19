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
    title: 'Vente de Produits',
    description: 'Restaurants, cafés, boulangeries, fast-foods...',
    icon: Utensils,
    color: 'bg-orange-100 text-orange-600 border-orange-200',
    iconColor: 'text-orange-600',
    examples: ['Prise de commandes', 'Catalogue produits', 'Gestion stock', 'Livraison'],
    key: 'hasProducts' as keyof ServiceConfig
  },
  {
    id: 'reservations',
    title: 'Gestion de Réservations',
    description: 'Restaurants, hôtels, salons, événements...',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-600 border-blue-200',
    iconColor: 'text-blue-600',
    examples: ['Réservation tables', 'Planning horaires', 'Confirmation automatique', 'Rappels'],
    key: 'hasReservations' as keyof ServiceConfig
  },
  {
    id: 'consultations',
    title: 'Prise de RDV & Consultations',
    description: 'Avocats, médecins, conseillers, coaches...',
    icon: UserCheck,
    color: 'bg-purple-100 text-purple-600 border-purple-200',
    iconColor: 'text-purple-600',
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Settings2 className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Assistant de configuration</h2>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">
          Quels services propose votre établissement ?
        </h3>
        <p className="text-gray-600">
          Vous pouvez activer plusieurs services. Cette configuration détermine les outils disponibles.
        </p>
        {hasSelection && (
          <Badge variant="secondary" className="mt-2">
            {selectedCount} service{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Service Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {serviceTypes.map((service) => {
          const isSelected = config[service.key];
          const Icon = service.icon;
          
          return (
            <Card 
              key={service.id}
              className={cn(
                "relative cursor-pointer transition-all duration-200 hover:shadow-lg",
                isSelected 
                  ? "ring-2 ring-primary shadow-lg bg-primary/5" 
                  : "hover:shadow-md border-gray-200"
              )}
              onClick={() => handleServiceToggle(service.key)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-3">
                {/* Icon */}
                <div className="mx-auto mb-3">
                  <div className={cn(
                    "w-16 h-16 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-primary/10" : service.color
                  )}>
                    <Icon className={cn(
                      "h-8 w-8",
                      isSelected ? "text-primary" : service.iconColor
                    )} />
                  </div>
                </div>

                <CardTitle className="text-lg">{service.title}</CardTitle>
                <CardDescription className="text-sm">
                  {service.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Examples */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Fonctionnalités incluses
                  </Label>
                  <ul className="space-y-1">
                    {service.examples.map((example, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <Label htmlFor={service.id} className="text-sm font-medium">
                    Activer ce service
                  </Label>
                  <Switch
                    id={service.id}
                    checked={isSelected}
                    onCheckedChange={() => handleServiceToggle(service.key)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Summary */}
      {hasSelection && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">
                  Configuration validée
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Votre établissement aura accès aux fonctionnalités : {' '}
                  {Object.entries(config)
                    .filter(([_, enabled]) => enabled)
                    .map(([key, _]) => {
                      const service = serviceTypes.find(s => s.key === key);
                      return service?.title;
                    })
                    .join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {showNavigation && (
        <div className="flex justify-between items-center pt-6">
          <Button 
            variant="outline" 
            onClick={onPrevious}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>
          
          <Button 
            onClick={onNext}
            disabled={!hasSelection}
            className="flex items-center gap-2"
          >
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Helper Text */}
      {!hasSelection && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Sélectionnez au moins un service pour continuer
        </p>
      )}
    </div>
  );
}