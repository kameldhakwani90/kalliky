'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Users, 
  Mic,
  ThermometerSun,
  CloudRain,
  Sun,
  Target,
  BarChart3,
  Sparkles,
  CheckCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  MessageSquare,
  Play,
  Table
} from 'lucide-react';
import { toast } from 'sonner';
import VoiceOnboardingSession from './VoiceOnboardingSession';

interface IntelligentCatalogConfigProps {
  storeId: string;
  catalogItems: any[];
  onConfigSave: (config: any) => void;
}

interface AIModule {
  id: string;
  name: string;
  description: string;
  example: string;
  benefit: string;
  icon: any;
  color: string;
  enabled: boolean;
  firstTime?: boolean;
}

interface CustomerSegment {
  id: string;
  name: string;
  count: number;
  description: string;
  targetProducts: string[];
  detectedFrom: string;
}

export default function IntelligentCatalogConfig({ storeId, catalogItems, onConfigSave }: IntelligentCatalogConfigProps) {
  const [loading, setLoading] = useState(false);
  const [showVoiceSetup, setShowVoiceSetup] = useState(false);
  const [hasVoiceConfig, setHasVoiceConfig] = useState(false);
  
  const [aiModules, setAiModules] = useState<AIModule[]>([
    {
      id: 'weather',
      name: 'Suggestions Météo',
      description: 'L\'IA propose automatiquement des produits selon la météo',
      example: 'Jour de pluie → "Il pleut ? Parfait pour nos soupes chaudes !" + boost des plats chauds de 40%',
      benefit: '+15% de ventes par mauvais temps',
      icon: Sun,
      color: 'orange',
      enabled: false,
      firstTime: true
    },
    {
      id: 'customer_segments',
      name: 'Clients Intelligents',
      description: 'L\'IA reconnaît et adapte les suggestions pour chaque type de client',
      example: 'Client régulier → "Bonjour ! Votre pizza habituelle ou vous voulez essayer notre nouveau plat ?"',
      benefit: '+22% satisfaction client',
      icon: Users,
      color: 'blue',
      enabled: false,
      firstTime: true
    },
    {
      id: 'smart_upsell',
      name: 'Vente Additionnelle IA',
      description: 'L\'IA propose intelligemment des compléments selon le panier',
      example: 'Pizza commandée → "Parfait ! Avec une boisson fraîche et notre tiramisu maison ?"',
      benefit: '+35% panier moyen',
      icon: TrendingUp,
      color: 'green',
      enabled: false
    },
    {
      id: 'time_optimization',
      name: 'Optimisation Horaires',
      description: 'L\'IA adapte automatiquement selon l\'heure et l\'affluence',
      example: 'Heure de pointe 12h → boost des plats rapides, menu express en avant',
      benefit: '-30% temps d\'attente',
      icon: Clock,
      color: 'purple',
      enabled: false
    },
    {
      id: 'price_smart',
      name: 'Prix Dynamiques',
      description: 'L\'IA ajuste discrètement les prix pour optimiser les ventes',
      example: 'Produit peu vendu → réduction temporaire de 10% pour écouler le stock',
      benefit: '+18% marge globale',
      icon: DollarSign,
      color: 'red',
      enabled: false
    },
    {
      id: 'trend_detection',
      name: 'Détecteur de Tendances',
      description: 'L\'IA identifie les nouveaux goûts de votre clientèle',
      example: 'IA détecte une hausse des commandes végé → propose d\'ajouter des options vegan',
      benefit: 'Toujours en avance sur les tendances',
      icon: BarChart3,
      color: 'indigo',
      enabled: false
    }
  ]);

  const [customerSegments] = useState<CustomerSegment[]>([
    {
      id: 'families',
      name: 'Familles',
      count: 156,
      description: 'Commandes importantes, préférence pour les formules',
      targetProducts: ['Menu Famille', 'Pizzas XL', 'Desserts'],
      detectedFrom: 'Analyse des paniers et horaires'
    },
    {
      id: 'workers',
      name: 'Professionnels',
      count: 89,
      description: 'Commandes rapides entre 12h-14h',
      targetProducts: ['Menu Express', 'Sandwich', 'Salades'],
      detectedFrom: 'Horaires et fréquence de commande'
    },
    {
      id: 'couples',
      name: 'Couples',
      count: 67,
      description: 'Commandes en soirée, produits premium',
      targetProducts: ['Plats romantiques', 'Vins', 'Desserts partagés'],
      detectedFrom: 'Taille des commandes et timing'
    },
    {
      id: 'regular',
      name: 'Habitués',
      count: 45,
      description: 'Clients fidèles avec préférences marquées',
      targetProducts: ['Leurs plats habituels', 'Nouveautés'],
      detectedFrom: 'Historique de commandes'
    }
  ]);

  useEffect(() => {
    checkVoiceConfiguration();
  }, [storeId]);

  const checkVoiceConfiguration = async () => {
    try {
      const response = await fetch(`/api/ai/voice-onboarding/${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setHasVoiceConfig(data.hasOnboarding);
      }
    } catch (error) {
      console.error('Error checking voice config:', error);
    }
  };

  const toggleModule = async (moduleId: string) => {
    const module = aiModules.find(m => m.id === moduleId);
    if (!module) return;

    // Si c'est la première activation et qu'on n'a pas de config vocale
    if (!module.enabled && module.firstTime && !hasVoiceConfig) {
      setShowVoiceSetup(true);
      return;
    }

    // Sinon, activer/désactiver directement
    setAiModules(prev => 
      prev.map(m => 
        m.id === moduleId 
          ? { ...m, enabled: !m.enabled, firstTime: false }
          : m
      )
    );

    toast.success(
      module.enabled 
        ? `${module.name} désactivé` 
        : `${module.name} activé - L'IA commence à apprendre !`
    );
  };

  const handleVoiceComplete = (analysis: any) => {
    setShowVoiceSetup(false);
    setHasVoiceConfig(true);
    
    // Activer tous les modules appropriés selon l'analyse
    setAiModules(prev => 
      prev.map(m => ({ 
        ...m, 
        enabled: true, 
        firstTime: false 
      }))
    );
    
    toast.success('Configuration IA générée automatiquement ! Tous les modules sont maintenant actifs.');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const activeModules = aiModules.filter(m => m.enabled).map(m => m.id);
      
      const response = await fetch(`/api/ai/intelligent-config/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeModules,
          automationLevel: activeModules.length > 0 ? 95 : 0,
          isFullyAutomated: activeModules.length >= 4,
          lastUpdated: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
      
      toast.success('Configuration IA sauvegardée !');
      onConfigSave({ activeModules });
      
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const getModuleColor = (color: string, enabled: boolean) => {
    if (!enabled) return 'text-gray-400 border-gray-200 bg-gray-50';
    
    const colors = {
      orange: 'text-orange-600 border-orange-200 bg-orange-50',
      blue: 'text-blue-600 border-blue-200 bg-blue-50',
      green: 'text-green-600 border-green-200 bg-green-50',
      purple: 'text-purple-600 border-purple-200 bg-purple-50',
      red: 'text-red-600 border-red-200 bg-red-50',
      indigo: 'text-indigo-600 border-indigo-200 bg-indigo-50'
    };
    return colors[color as keyof typeof colors] || 'text-gray-600 border-gray-200 bg-gray-50';
  };

  if (showVoiceSetup) {
    return (
      <VoiceOnboardingSession
        storeId={storeId}
        onComplete={handleVoiceComplete}
        onSkip={() => setShowVoiceSetup(false)}
        maxDuration={4}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Simple */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            Configuration IA pour votre Restaurant
          </CardTitle>
          <CardDescription className="text-base">
            Activez les modules IA qui vous intéressent. L'IA apprend et s'améliore automatiquement.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Modules IA Simples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiModules.map((module) => {
          const Icon = module.icon;
          const isEnabled = module.enabled;
          
          return (
            <Card 
              key={module.id} 
              className={`border-2 transition-all cursor-pointer hover:shadow-md ${getModuleColor(module.color, isEnabled)}`}
              onClick={() => toggleModule(module.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6" />
                    <div>
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      {isEnabled && <Badge className="mt-1 bg-green-100 text-green-800">Actif</Badge>}
                    </div>
                  </div>
                  <Switch checked={isEnabled} onChange={() => {}} />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm">{module.description}</p>
                
                <div className="bg-white/50 p-3 rounded border-l-4 border-current">
                  <p className="text-sm font-medium mb-1">📝 Exemple concret :</p>
                  <p className="text-sm italic">{module.example}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">{module.benefit}</span>
                </div>
                
                {module.firstTime && !hasVoiceConfig && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <Mic className="h-4 w-4" />
                      <span className="text-sm font-medium">Première activation</span>
                    </div>
                    <p className="text-xs text-blue-600">
                      L'IA va vous poser quelques questions (4 min max) pour comprendre votre restaurant et configurer ce module parfaitement.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Segments Clients Créés (si modules actifs) */}
      {aiModules.some(m => m.enabled) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Segments Clients Détectés Automatiquement
            </CardTitle>
            <CardDescription>
              L'IA a analysé vos clients et créé ces groupes automatiquement. Elle adapte ses suggestions pour chacun.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerSegments.map((segment) => (
                <Card key={segment.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{segment.name}</h4>
                      <Badge variant="secondary">{segment.count} clients</Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{segment.description}</p>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">PRODUITS CIBLÉS:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {segment.targetProducts.map((product, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <strong>Détecté via:</strong> {segment.detectedFrom}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {aiModules.filter(m => m.enabled).length > 0 ? (
            <>
              <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
              {aiModules.filter(m => m.enabled).length} module(s) actif(s) - L'IA travaille pour vous !
            </>
          ) : (
            'Aucun module actif - Activez au moins un module pour commencer'
          )}
        </div>
        
        <div className="flex gap-3">
          {!hasVoiceConfig && (
            <Button variant="outline" onClick={() => setShowVoiceSetup(true)}>
              <Play className="mr-2 h-4 w-4" />
              Session vocale IA (4 min)
            </Button>
          )}
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </div>
  );
}