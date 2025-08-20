'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Bot, 
  Mic, 
  MessageSquare, 
  Brain, 
  Globe, 
  TrendingUp,
  Clock,
  Zap,
  Sparkles,
  Briefcase,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface AIConfigTabProps {
  storeId: string;
  storeName: string;
  settings: any;
  onConfigUpdate: (settings: any) => void;
}

interface BusinessConfig {
  category: string;
  displayName: string;
  defaultParams: Record<string, any>;
  availableOptions: Array<{
    key: string;
    label: string;
    type: 'boolean' | 'string' | 'number';
  }>;
}

interface CustomSpecification {
  id: string;
  title: string;
  content: string;
}

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy (Neutre)', gender: 'neutral' },
  { value: 'echo', label: 'Echo (Masculin)', gender: 'male' },
  { value: 'fable', label: 'Fable (Féminin)', gender: 'female' },
  { value: 'onyx', label: 'Onyx (Masculin)', gender: 'male' },
  { value: 'nova', label: 'Nova (Féminin)', gender: 'female' },
  { value: 'shimmer', label: 'Shimmer (Féminin)', gender: 'female' }
];

export default function AIConfigTab({ storeId, storeName, settings, onConfigUpdate }: AIConfigTabProps) {
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [businessParams, setBusinessParams] = useState<Record<string, any>>({});
  const [businessOptions, setBusinessOptions] = useState<Record<string, boolean>>({});
  const [customSpecs, setCustomSpecs] = useState<CustomSpecification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [aiConfig, setAiConfig] = useState({
    enabled: true,
    personality: 'friendly',
    voice: 'nova',
    language: 'fr',
    voiceSpeed: 1.0,
    greeting: `Bonjour, bienvenue chez ${storeName}. Comment puis-je vous aider aujourd'hui ?`,
    goodbye: 'Merci pour votre commande. À bientôt !',
    waitingMessage: 'Un instant s\'il vous plaît, je consulte notre carte...',
    confirmationMessage: 'Parfait, j\'ai bien noté votre commande. Puis-je vous aider avec autre chose ?',
    upselling: {
      enabled: true,
      strategy: 'balanced',
      threshold: 15,
      suggestions: [
        'Voulez-vous ajouter une boisson à votre commande ?',
        'Puis-je vous suggérer notre délicieux dessert du jour ?',
        'Souhaitez-vous compléter avec une entrée ?'
      ]
    },
    multiLanguage: false,
    supportedLanguages: ['fr'],
    memoryEnabled: true,
    analyticsEnabled: true,
    customScripts: [],
    fallbackBehavior: 'transfer',
    fallbackNumber: '',
    maxConversationTime: 600, // 10 minutes
    ...((settings && settings.aiAgent) || {})
  });

  // Charger la configuration métier
  useEffect(() => {
    const loadBusinessConfig = async () => {
      try {
        // Récupérer la config depuis les settings store
        if (settings?.businessConfig) {
          setBusinessConfig(settings.businessConfig);
          
          // Charger les paramètres sauvegardés ou valeurs par défaut
          const savedParams = settings.businessParams || {};
          const savedOptions = settings.businessOptions || {};
          const savedSpecs = settings.customSpecifications || [];
          
          setBusinessParams({ ...settings.businessConfig.defaultParams, ...savedParams });
          setBusinessOptions(savedOptions);
          setCustomSpecs(savedSpecs);
        }
      } catch (error) {
        console.error('Erreur chargement config métier:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBusinessConfig();
  }, [settings]);

  const handleSave = () => {
    const updatedSettings = {
      ...settings,
      aiAgent: aiConfig,
      businessParams,
      businessOptions,
      customSpecifications: customSpecs
    };
    onConfigUpdate(updatedSettings);
    toast.success('Configuration IA mise à jour avec succès');
  };

  const handleTestVoice = async (voiceType: string = aiConfig.voice) => {
    try {
      toast.info('Test de la voix en cours...');
      
      // Créer l'audio avec l'API OpenAI TTS
      const response = await fetch('/api/openai/tts-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Salut toi !',
          voice: voiceType,
          speed: aiConfig.voiceSpeed || 1.0
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
        toast.success('Test vocal terminé');
      } else {
        throw new Error('Erreur génération audio');
      }
    } catch (error) {
      console.error('Erreur test vocal:', error);
      toast.error('Erreur lors du test vocal');
    }
  };

  const addCustomSpec = () => {
    const newSpec: CustomSpecification = {
      id: `spec_${Date.now()}`,
      title: '',
      content: ''
    };
    setCustomSpecs([...customSpecs, newSpec]);
  };

  const updateCustomSpec = (id: string, field: 'title' | 'content', value: string) => {
    // Limite de 150 caractères pour le contenu
    if (field === 'content' && value.length > 150) {
      toast.warning('Le contenu ne peut pas dépasser 150 caractères');
      return;
    }
    
    setCustomSpecs(prev => prev.map(spec => 
      spec.id === id ? { ...spec, [field]: value } : spec
    ));
  };

  const removeCustomSpec = (id: string) => {
    setCustomSpecs(prev => prev.filter(spec => spec.id !== id));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="business">Métier</TabsTrigger>
          <TabsTrigger value="specifications">Spécifications</TabsTrigger>
          <TabsTrigger value="personality">Personnalité</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="advanced">Avancé</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration générale</CardTitle>
              <CardDescription>
                Paramètres de base de votre agent IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Agent IA activé</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer/désactiver l'agent IA pour répondre aux appels
                  </p>
                </div>
                <Switch 
                  checked={aiConfig.enabled}
                  onCheckedChange={(checked) => setAiConfig({...aiConfig, enabled: checked})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Voix de l'agent</Label>
                  <Select value={aiConfig.voice} onValueChange={(value) => setAiConfig({...aiConfig, voice: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_OPTIONS.map(voice => (
                        <SelectItem key={voice.value} value={voice.value}>
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4" />
                            {voice.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 space-y-2">
                    <Button variant="outline" size="sm" onClick={() => handleTestVoice()}>
                      Tester {VOICE_OPTIONS.find(v => v.value === aiConfig.voice)?.label || 'la voix'}
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      Ou testez toutes les voix :
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {VOICE_OPTIONS.map(voice => (
                        <Button 
                          key={voice.value}
                          variant="ghost" 
                          size="xs"
                          onClick={() => handleTestVoice(voice.value)}
                          className="text-xs h-6"
                        >
                          ▶️ {voice.label.split(' ')[0]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Langue principale</Label>
                  <Select value={aiConfig.language} onValueChange={(value) => setAiConfig({...aiConfig, language: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="multi">Multi-langue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Vitesse de parole</Label>
                  <span className="text-sm text-muted-foreground">{aiConfig.voiceSpeed}x</span>
                </div>
                <Slider 
                  value={[aiConfig.voiceSpeed]} 
                  onValueChange={([value]) => setAiConfig({...aiConfig, voiceSpeed: value})}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Chargement configuration métier...</span>
                </div>
              </CardContent>
            </Card>
          ) : businessConfig ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Type de métier : {businessConfig.displayName}
                  </CardTitle>
                  <CardDescription>
                    Paramètres spécifiques à votre secteur d'activité
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(businessConfig.defaultParams).map(([key, defaultValue]) => (
                    <div key={key} className="grid grid-cols-3 gap-4 items-center">
                      <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</Label>
                      <div className="col-span-2">
                        {typeof defaultValue === 'boolean' ? (
                          <Switch 
                            checked={businessParams[key] ?? defaultValue}
                            onCheckedChange={(checked) => setBusinessParams(prev => ({ ...prev, [key]: checked }))}
                          />
                        ) : typeof defaultValue === 'number' ? (
                          <Input 
                            type="number"
                            value={businessParams[key] ?? defaultValue}
                            onChange={(e) => setBusinessParams(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                          />
                        ) : (
                          <Input 
                            value={businessParams[key] ?? defaultValue}
                            onChange={(e) => setBusinessParams(prev => ({ ...prev, [key]: e.target.value }))}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Options spécialisées</CardTitle>
                  <CardDescription>
                    Fonctionnalités avancées pour votre type d'activité
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {businessConfig.availableOptions.map((option) => (
                    <div key={option.key} className="flex items-center justify-between">
                      <div>
                        <Label>{option.label}</Label>
                        <p className="text-sm text-muted-foreground">
                          Type: {option.type}
                        </p>
                      </div>
                      <Switch 
                        checked={businessOptions[option.key] || false}
                        onCheckedChange={(checked) => setBusinessOptions(prev => ({ ...prev, [option.key]: checked }))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  Aucune configuration métier disponible pour cette boutique.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="specifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-green-600" />
                Spécifications personnalisées
              </CardTitle>
              <CardDescription>
                Ajoutez des instructions spécifiques à votre établissement (150 caractères max par spécification)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={addCustomSpec} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une spécification
              </Button>
              
              {customSpecs.map((spec) => (
                <Card key={spec.id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <Label>Titre de la spécification</Label>
                      <Input 
                        value={spec.title}
                        onChange={(e) => updateCustomSpec(spec.id, 'title', e.target.value)}
                        placeholder="ex: Remarques allergies"
                      />
                    </div>
                    <div>
                      <Label>Contenu ({spec.content.length}/150)</Label>
                      <Textarea 
                        value={spec.content}
                        onChange={(e) => updateCustomSpec(spec.id, 'content', e.target.value)}
                        placeholder="Si vous avez d'autres remarques, n'hésitez pas à me le dire ;)"
                        rows={3}
                        className={spec.content.length > 150 ? 'border-red-500' : ''}
                      />
                      {spec.content.length > 150 && (
                        <p className="text-sm text-red-500 mt-1">
                          Dépassement de {spec.content.length - 150} caractères
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeCustomSpec(spec.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </Card>
              ))}

              {customSpecs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucune spécification personnalisée.</p>
                  <p className="text-sm">Cliquez sur "Ajouter une spécification" pour commencer.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personnalité de l'agent</CardTitle>
              <CardDescription>
                Définissez le comportement et le ton de votre agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type de personnalité</Label>
                <Select value={aiConfig.personality} onValueChange={(value) => setAiConfig({...aiConfig, personality: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Amical et chaleureux</SelectItem>
                    <SelectItem value="professional">Professionnel et formel</SelectItem>
                    <SelectItem value="casual">Décontracté et moderne</SelectItem>
                    <SelectItem value="enthusiastic">Enthousiaste et dynamique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mémoire client</Label>
                  <p className="text-sm text-muted-foreground">
                    Se souvenir des préférences des clients réguliers
                  </p>
                </div>
                <Switch 
                  checked={aiConfig.memoryEnabled}
                  onCheckedChange={(checked) => setAiConfig({...aiConfig, memoryEnabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Multi-langue</Label>
                  <p className="text-sm text-muted-foreground">
                    Détecter et répondre dans la langue du client
                  </p>
                </div>
                <Switch 
                  checked={aiConfig.multiLanguage}
                  onCheckedChange={(checked) => setAiConfig({...aiConfig, multiLanguage: checked})}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vente additionnelle</CardTitle>
              <CardDescription>
                Configurez les stratégies de vente incitative
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Vente additionnelle activée</Label>
                  <p className="text-sm text-muted-foreground">
                    Suggérer des produits complémentaires
                  </p>
                </div>
                <Switch 
                  checked={aiConfig.upselling.enabled}
                  onCheckedChange={(checked) => setAiConfig({
                    ...aiConfig, 
                    upselling: {...aiConfig.upselling, enabled: checked}
                  })}
                />
              </div>

              {aiConfig.upselling.enabled && (
                <>
                  <div>
                    <Label>Stratégie de vente</Label>
                    <Select 
                      value={aiConfig.upselling.strategy} 
                      onValueChange={(value) => setAiConfig({
                        ...aiConfig,
                        upselling: {...aiConfig.upselling, strategy: value}
                      })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative (1 suggestion max)</SelectItem>
                        <SelectItem value="balanced">Équilibrée (2-3 suggestions)</SelectItem>
                        <SelectItem value="aggressive">Aggressive (suggestions multiples)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Seuil de panier (€)</Label>
                    <Input 
                      type="number"
                      value={aiConfig.upselling.threshold}
                      onChange={(e) => setAiConfig({
                        ...aiConfig,
                        upselling: {...aiConfig.upselling, threshold: parseInt(e.target.value)}
                      })}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Montant minimum avant de proposer des extras
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages personnalisés</CardTitle>
              <CardDescription>
                Personnalisez les messages de votre agent IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Message d'accueil</Label>
                <Textarea 
                  value={aiConfig.greeting}
                  onChange={(e) => setAiConfig({...aiConfig, greeting: e.target.value})}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label>Message d'au revoir</Label>
                <Textarea 
                  value={aiConfig.goodbye}
                  onChange={(e) => setAiConfig({...aiConfig, goodbye: e.target.value})}
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label>Message d'attente</Label>
                <Textarea 
                  value={aiConfig.waitingMessage}
                  onChange={(e) => setAiConfig({...aiConfig, waitingMessage: e.target.value})}
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label>Message de confirmation</Label>
                <Textarea 
                  value={aiConfig.confirmationMessage}
                  onChange={(e) => setAiConfig({...aiConfig, confirmationMessage: e.target.value})}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres avancés</CardTitle>
              <CardDescription>
                Configuration avancée de l'agent IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Comportement en cas d'échec</Label>
                <Select 
                  value={aiConfig.fallbackBehavior} 
                  onValueChange={(value) => setAiConfig({...aiConfig, fallbackBehavior: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retry">Réessayer la compréhension</SelectItem>
                    <SelectItem value="transfer">Transférer à un humain</SelectItem>
                    <SelectItem value="message">Laisser un message</SelectItem>
                    <SelectItem value="end">Terminer l'appel poliment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {aiConfig.fallbackBehavior === 'transfer' && (
                <div>
                  <Label>Numéro de transfert</Label>
                  <Input 
                    type="tel"
                    value={aiConfig.fallbackNumber}
                    onChange={(e) => setAiConfig({...aiConfig, fallbackNumber: e.target.value})}
                    placeholder="+33 6 12 34 56 78"
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label>Durée max de conversation (secondes)</Label>
                <Input 
                  type="number"
                  value={aiConfig.maxConversationTime}
                  onChange={(e) => setAiConfig({...aiConfig, maxConversationTime: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Analytics avancés</Label>
                  <p className="text-sm text-muted-foreground">
                    Collecte de données détaillées sur les conversations
                  </p>
                </div>
                <Switch 
                  checked={aiConfig.analyticsEnabled}
                  onCheckedChange={(checked) => setAiConfig({...aiConfig, analyticsEnabled: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Enregistrer la configuration IA
        </Button>
      </div>
    </div>
  );
}