'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Mic, MessageSquare, Brain, Phone, Settings, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface AIAgentConfig {
  enabled: boolean;
  name: string;
  personality: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  language: 'fr' | 'en' | 'ar' | 'multi';
  plan: 'STARTER' | 'PRO' | 'BUSINESS';
  features: {
    multilingual: boolean;
    customerMemory: boolean;
    productSuggestions: boolean;
    advancedAnalytics: boolean;
    voiceCloning: boolean;
    customScripts: boolean;
  };
  upselling: {
    enabled: boolean;
    strategy: 'conservative' | 'balanced' | 'aggressive';
    targetIncrease: number;
  };
  businessHours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      [key: string]: { open: string; close: string; enabled: boolean };
    };
  };
  fallback: {
    enabled: boolean;
    transferNumber: string;
    message: string;
  };
}

interface Store {
  id: string;
  name: string;
  address: string;
  settings: any;
  subscription?: {
    plan: string;
    status: string;
  };
}

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy (Neutre)', gender: 'neutral' },
  { value: 'echo', label: 'Echo (Masculin)', gender: 'male' },
  { value: 'fable', label: 'Fable (Féminin)', gender: 'female' },
  { value: 'onyx', label: 'Onyx (Masculin)', gender: 'male' },
  { value: 'nova', label: 'Nova (Féminin)', gender: 'female' },
  { value: 'shimmer', label: 'Shimmer (Féminin)', gender: 'female' }
];

const PLAN_FEATURES = {
  STARTER: {
    multilingual: false,
    customerMemory: false,
    productSuggestions: true,
    advancedAnalytics: false,
    voiceCloning: false,
    customScripts: false,
    maxVoices: 1
  },
  PRO: {
    multilingual: true,
    customerMemory: true,
    productSuggestions: true,
    advancedAnalytics: true,
    voiceCloning: false,
    customScripts: true,
    maxVoices: 3
  },
  BUSINESS: {
    multilingual: true,
    customerMemory: true,
    productSuggestions: true,
    advancedAnalytics: true,
    voiceCloning: true,
    customScripts: true,
    maxVoices: 6
  }
};

export default function AIConfigPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams.get('store');
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [aiConfig, setAiConfig] = useState<AIAgentConfig>({
    enabled: false,
    name: 'Assistant IA',
    personality: 'Vous êtes un assistant professionnel et sympathique pour prendre les commandes.',
    voice: 'alloy',
    language: 'fr',
    plan: 'PRO',
    features: {
      multilingual: false,
      customerMemory: false,
      productSuggestions: true,
      advancedAnalytics: false,
      voiceCloning: false,
      customScripts: false
    },
    upselling: {
      enabled: true,
      strategy: 'balanced',
      targetIncrease: 25
    },
    businessHours: {
      enabled: true,
      timezone: 'Europe/Paris',
      schedule: {
        monday: { open: '09:00', close: '22:00', enabled: true },
        tuesday: { open: '09:00', close: '22:00', enabled: true },
        wednesday: { open: '09:00', close: '22:00', enabled: true },
        thursday: { open: '09:00', close: '22:00', enabled: true },
        friday: { open: '09:00', close: '22:00', enabled: true },
        saturday: { open: '09:00', close: '22:00', enabled: true },
        sunday: { open: '09:00', close: '22:00', enabled: false }
      }
    },
    fallback: {
      enabled: true,
      transferNumber: '',
      message: 'Je transfère votre appel à un conseiller humain.'
    }
  });

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    // Si un store est spécifié dans l'URL, le sélectionner automatiquement
    if (storeIdFromUrl && stores.length > 0) {
      const storeFromUrl = stores.find(s => s.id === storeIdFromUrl);
      if (storeFromUrl) {
        handleStoreSelect(storeFromUrl);
      }
    }
  }, [storeIdFromUrl, stores]);

  const loadStores = async () => {
    try {
      const response = await fetch('/api/restaurant/activities');
      if (response.ok) {
        const data = await response.json();
        const allStores = data.flatMap((business: any) => 
          business.stores.map((store: any) => ({
            ...store,
            subscription: store.subscription
          }))
        );
        setStores(allStores);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    
    // Charger la config IA existante
    const settings = store.settings || {};
    if (settings.aiAgent) {
      setAiConfig({ ...aiConfig, ...settings.aiAgent });
    } else {
      // Config par défaut basée sur le plan
      const plan = store.subscription?.plan || 'STARTER';
      setAiConfig({
        ...aiConfig,
        plan: plan as any,
        features: {
          ...aiConfig.features,
          ...PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES]
        }
      });
    }
  };

  const handleSave = async () => {
    if (!selectedStore) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/stores/${selectedStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            aiAgent: aiConfig
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      toast.success('Configuration IA sauvegardée avec succès');
      
    } catch (error: any) {
      console.error('Error saving AI config:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = selectedStore?.subscription?.plan || 'STARTER';
  const planFeatures = PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/restaurant/stores" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Retour aux boutiques
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Configuration Agent IA
            {selectedStore && storeIdFromUrl && (
              <span className="text-xl font-normal text-muted-foreground"> - {selectedStore.name}</span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Configurez votre assistant IA pour répondre automatiquement aux appels
          </p>
        </div>

        <div className={`grid ${storeIdFromUrl ? 'grid-cols-1' : 'lg:grid-cols-4'} gap-6`}>
          {/* Sélection boutique - masquée si store spécifié dans URL */}
          {!storeIdFromUrl && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Boutiques</CardTitle>
                  <CardDescription>Sélectionnez une boutique à configurer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted ${
                        selectedStore?.id === store.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => handleStoreSelect(store)}
                    >
                      <div className="font-medium">{store.name}</div>
                      <div className="text-sm text-muted-foreground">{store.address}</div>
                      <Badge variant="secondary" className="mt-1">
                        {store.subscription?.plan || 'STARTER'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Configuration */}
          <div className={storeIdFromUrl ? 'col-span-1' : 'lg:col-span-3'}>
            {selectedStore ? (
              <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Général
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Voix
                  </TabsTrigger>
                  <TabsTrigger value="personality" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Personnalité
                  </TabsTrigger>
                  <TabsTrigger value="business" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Business
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>

                {/* Général */}
                <TabsContent value="general">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuration générale</CardTitle>
                      <CardDescription>
                        Paramètres de base de votre agent IA
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Activer l'agent IA</Label>
                          <div className="text-sm text-muted-foreground">
                            Permet à l'IA de répondre automatiquement aux appels
                          </div>
                        </div>
                        <Switch
                          checked={aiConfig.enabled}
                          onCheckedChange={(checked) => setAiConfig({ ...aiConfig, enabled: checked })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Nom de l'assistant</Label>
                        <Input
                          id="name"
                          value={aiConfig.name}
                          onChange={(e) => setAiConfig({ ...aiConfig, name: e.target.value })}
                          placeholder="Assistant IA"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language">Langue principale</Label>
                        <Select
                          value={aiConfig.language}
                          onValueChange={(value: any) => setAiConfig({ ...aiConfig, language: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ar">العربية</SelectItem>
                            {planFeatures.multilingual && (
                              <SelectItem value="multi">Multi-langue (détection auto)</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-4 border rounded-lg bg-muted/50">
                        <h4 className="font-medium mb-3">Fonctionnalités disponibles</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant={planFeatures.multilingual ? "default" : "secondary"}>
                              {planFeatures.multilingual ? "✓" : "✗"}
                            </Badge>
                            Multi-langue
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={planFeatures.customerMemory ? "default" : "secondary"}>
                              {planFeatures.customerMemory ? "✓" : "✗"}
                            </Badge>
                            Mémoire client
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={planFeatures.productSuggestions ? "default" : "secondary"}>
                              {planFeatures.productSuggestions ? "✓" : "✗"}
                            </Badge>
                            Suggestions produits
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={planFeatures.voiceCloning ? "default" : "secondary"}>
                              {planFeatures.voiceCloning ? "✓" : "✗"}
                            </Badge>
                            Clonage vocal
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Voix */}
                <TabsContent value="voice">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuration vocale</CardTitle>
                      <CardDescription>
                        Choisissez la voix de votre assistant IA
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {VOICE_OPTIONS.slice(0, planFeatures.maxVoices).map((voice) => (
                          <div
                            key={voice.value}
                            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              aiConfig.voice === voice.value ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                            onClick={() => setAiConfig({ ...aiConfig, voice: voice.value as any })}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-primary" />
                              <div>
                                <div className="font-medium">{voice.label}</div>
                                <div className="text-sm text-muted-foreground capitalize">{voice.gender}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {currentPlan !== 'BUSINESS' && (
                        <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
                          <h4 className="font-medium text-amber-800 mb-2">🎤 Clonage vocal disponible</h4>
                          <p className="text-sm text-amber-700">
                            Avec le plan Business, vous pouvez cloner votre propre voix pour un assistant personnalisé.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Personnalité */}
                <TabsContent value="personality">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personnalité et scripts</CardTitle>
                      <CardDescription>
                        Définissez le comportement de votre assistant
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="personality">Instructions de personnalité</Label>
                        <Textarea
                          id="personality"
                          value={aiConfig.personality}
                          onChange={(e) => setAiConfig({ ...aiConfig, personality: e.target.value })}
                          placeholder="Décrivez comment l'assistant doit se comporter..."
                          className="min-h-[120px]"
                        />
                        <p className="text-sm text-muted-foreground">
                          Exemple: "Vous êtes un assistant sympathique et professionnel. Utilisez un ton chaleureux mais respectueux."
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Vente additionnelle (Upselling)</h4>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Activer l'upselling</Label>
                            <div className="text-sm text-muted-foreground">
                              L'IA proposera des produits complémentaires
                            </div>
                          </div>
                          <Switch
                            checked={aiConfig.upselling.enabled}
                            onCheckedChange={(checked) => 
                              setAiConfig({ 
                                ...aiConfig, 
                                upselling: { ...aiConfig.upselling, enabled: checked }
                              })
                            }
                          />
                        </div>

                        {aiConfig.upselling.enabled && (
                          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                            <div className="space-y-2">
                              <Label>Stratégie d'upselling</Label>
                              <Select
                                value={aiConfig.upselling.strategy}
                                onValueChange={(value: any) => 
                                  setAiConfig({ 
                                    ...aiConfig, 
                                    upselling: { ...aiConfig.upselling, strategy: value }
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="conservative">Conservateur - Suggestions subtiles</SelectItem>
                                  <SelectItem value="balanced">Équilibré - Suggestions appropriées</SelectItem>
                                  <SelectItem value="aggressive">Agressif - Suggestions fréquentes</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Objectif d'augmentation du panier (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={aiConfig.upselling.targetIncrease}
                                onChange={(e) => 
                                  setAiConfig({ 
                                    ...aiConfig, 
                                    upselling: { 
                                      ...aiConfig.upselling, 
                                      targetIncrease: parseInt(e.target.value) || 0 
                                    }
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Business */}
                <TabsContent value="business">
                  <Card>
                    <CardHeader>
                      <CardTitle>Horaires et transferts</CardTitle>
                      <CardDescription>
                        Configuration des horaires d'ouverture et transferts d'appels
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Respecter les horaires d'ouverture</Label>
                          <div className="text-sm text-muted-foreground">
                            L'IA ne prendra les commandes que pendant les heures d'ouverture
                          </div>
                        </div>
                        <Switch
                          checked={aiConfig.businessHours.enabled}
                          onCheckedChange={(checked) => 
                            setAiConfig({ 
                              ...aiConfig, 
                              businessHours: { ...aiConfig.businessHours, enabled: checked }
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Numéro de transfert (optionnel)</Label>
                        <Input
                          value={aiConfig.fallback.transferNumber}
                          onChange={(e) => 
                            setAiConfig({ 
                              ...aiConfig, 
                              fallback: { ...aiConfig.fallback, transferNumber: e.target.value }
                            })
                          }
                          placeholder="+33 1 23 45 67 89"
                        />
                        <p className="text-sm text-muted-foreground">
                          Numéro vers lequel transférer les appels en cas de problème
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Message de transfert</Label>
                        <Input
                          value={aiConfig.fallback.message}
                          onChange={(e) => 
                            setAiConfig({ 
                              ...aiConfig, 
                              fallback: { ...aiConfig.fallback, message: e.target.value }
                            })
                          }
                          placeholder="Je transfère votre appel..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Analytics */}
                <TabsContent value="analytics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analytics et suivi</CardTitle>
                      <CardDescription>
                        Configuration du suivi des performances
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Fonctionnalités analytiques</div>
                          <div className="space-y-2">
                            {[
                              { key: 'customerMemory', label: 'Mémoire client', desc: 'Historique des commandes' },
                              { key: 'advancedAnalytics', label: 'Analytics avancés', desc: 'Rapports détaillés' },
                              { key: 'customScripts', label: 'Scripts personnalisés', desc: 'Scripts par produit' }
                            ].map((feature) => (
                              <div key={feature.key} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <div className="font-medium text-sm">{feature.label}</div>
                                  <div className="text-xs text-muted-foreground">{feature.desc}</div>
                                </div>
                                <Badge variant={planFeatures[feature.key as keyof typeof planFeatures] ? "default" : "secondary"}>
                                  {planFeatures[feature.key as keyof typeof planFeatures] ? "Inclus" : "Non disponible"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Statistiques en temps réel</div>
                          <div className="p-4 border rounded-lg bg-muted/50">
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold">0</div>
                                <div className="text-xs text-muted-foreground">Appels aujourd'hui</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold">0%</div>
                                <div className="text-xs text-muted-foreground">Taux de conversion</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold">0€</div>
                                <div className="text-xs text-muted-foreground">CA généré</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold">0s</div>
                                <div className="text-xs text-muted-foreground">Durée moyenne</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6">
                  <Button variant="outline" onClick={() => router.back()}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sauvegarder la configuration
                  </Button>
                </div>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-medium">Sélectionnez une boutique</h3>
                    <p className="text-muted-foreground">
                      Choisissez une boutique dans la liste pour configurer son agent IA
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}