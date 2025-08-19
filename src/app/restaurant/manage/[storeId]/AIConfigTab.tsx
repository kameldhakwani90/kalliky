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
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface AIConfigTabProps {
  storeId: string;
  storeName: string;
  settings: any;
  onConfigUpdate: (settings: any) => void;
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

  const handleSave = () => {
    const updatedSettings = {
      ...settings,
      aiAgent: aiConfig
    };
    onConfigUpdate(updatedSettings);
    toast.success('Configuration IA mise à jour avec succès');
  };

  const handleTestVoice = () => {
    toast.info('Test de la voix en cours...');
    // TODO: Implémenter le test vocal
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
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
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleTestVoice}>
                    Tester la voix
                  </Button>
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