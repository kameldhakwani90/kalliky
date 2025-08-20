'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  ShoppingBag, 
  Calendar, 
  BrainCircuit, 
  AlertTriangle,
  Mail,
  MessageSquare,
  Printer,
  CalendarDays,
  Webhook,
  Phone,
  MessageCircle,
  Bell,
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';

type NotificationConfig = {
  id: string;
  activityType: 'ORDER' | 'SERVICE' | 'CONSULTATION' | 'SIGNALEMENT';
  isActive: boolean;
  conditions: {
    minAmount?: number;
    clientType?: string[];
    urgency?: string[];
    timeSlots?: string[];
  };
  actions: NotificationAction[];
};

type NotificationAction = {
  id: string;
  type: 'EMAIL' | 'WHATSAPP' | 'PRINT' | 'CALENDAR' | 'N8N_WEBHOOK' | 'SMS' | 'SLACK';
  provider?: string;
  settings: any;
  delay: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isActive: boolean;
};

export default function NotificationsSettingsPage() {
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'ORDER' | 'SERVICE' | 'CONSULTATION' | 'SIGNALEMENT'>('ORDER');
  const [loading, setLoading] = useState(true);

  // Chargement des configurations depuis l'API
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      // TODO: Récupérer storeId et businessId depuis le contexte/session
      const storeId = 'demo-store'; // Remplacer par la vraie valeur
      const businessId = 'demo-business'; // Remplacer par la vraie valeur

      const response = await fetch(`/api/restaurant/notifications/configs?storeId=${storeId}&businessId=${businessId}`);
      
      if (response.ok) {
        const apiConfigs = await response.json();
        // Convertir les configs API vers le format de l'interface
        const formattedConfigs = apiConfigs.map((config: any) => ({
          id: config.id,
          activityType: config.activityType,
          isActive: config.isActive,
          conditions: config.conditions || {},
          actions: config.actions.map((action: any) => ({
            id: action.id,
            type: action.type,
            provider: action.provider,
            settings: action.settings || {},
            delay: action.delay,
            priority: action.priority,
            isActive: action.isActive
          }))
        }));
        setConfigs(formattedConfigs);
      } else {
        console.error('Erreur chargement configurations:', response.statusText);
        // Fallback vers données mock en cas d'erreur
        setConfigs([]);
      }
    } catch (error) {
      console.error('Erreur chargement configurations:', error);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <ShoppingBag className="h-4 w-4" />;
      case 'SERVICE': return <Calendar className="h-4 w-4" />;
      case 'CONSULTATION': return <BrainCircuit className="h-4 w-4" />;
      case 'SIGNALEMENT': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'WHATSAPP': return <MessageSquare className="h-4 w-4" />;
      case 'PRINT': return <Printer className="h-4 w-4" />;
      case 'CALENDAR': return <CalendarDays className="h-4 w-4" />;
      case 'N8N_WEBHOOK': return <Webhook className="h-4 w-4" />;
      case 'SMS': return <Phone className="h-4 w-4" />;
      case 'SLACK': return <MessageCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getCurrentConfig = () => {
    return configs.find(c => c.activityType === activeTab) || {
      id: '',
      activityType: activeTab,
      isActive: false,
      conditions: {},
      actions: []
    };
  };

  const updateConfig = async (updates: Partial<NotificationConfig>) => {
    try {
      const currentConfig = getCurrentConfig();
      const updatedConfig = { ...currentConfig, ...updates };

      // TODO: Récupérer storeId et businessId depuis le contexte/session
      const storeId = 'demo-store';
      const businessId = 'demo-business';

      const response = await fetch('/api/restaurant/notifications/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId,
          businessId,
          activityType: activeTab,
          isActive: updatedConfig.isActive,
          conditions: updatedConfig.conditions,
          actions: updatedConfig.actions
        })
      });

      if (response.ok) {
        const savedConfig = await response.json();
        
        // Mettre à jour l'état local
        setConfigs(prev => {
          const existing = prev.find(c => c.activityType === activeTab);
          if (existing) {
            return prev.map(c => c.activityType === activeTab ? { 
              ...c, 
              id: savedConfig.id,
              ...updates 
            } : c);
          } else {
            return [...prev, { 
              id: savedConfig.id, 
              activityType: activeTab, 
              isActive: false,
              conditions: {},
              actions: [],
              ...updates 
            }];
          }
        });
      } else {
        console.error('Erreur sauvegarde configuration:', response.statusText);
        // En cas d'erreur, on met à jour quand même l'état local pour l'UX
        setConfigs(prev => {
          const existing = prev.find(c => c.activityType === activeTab);
          if (existing) {
            return prev.map(c => c.activityType === activeTab ? { ...c, ...updates } : c);
          } else {
            return [...prev, { 
              id: Date.now().toString(), 
              activityType: activeTab, 
              isActive: false,
              conditions: {},
              actions: [],
              ...updates 
            }];
          }
        });
      }
    } catch (error) {
      console.error('Erreur mise à jour configuration:', error);
    }
  };

  const addAction = () => {
    const newAction: NotificationAction = {
      id: Date.now().toString(),
      type: 'EMAIL',
      settings: {},
      delay: 0,
      priority: 'NORMAL',
      isActive: true
    };
    
    const config = getCurrentConfig();
    updateConfig({
      actions: [...config.actions, newAction]
    });
  };

  const removeAction = (actionId: string) => {
    const config = getCurrentConfig();
    updateConfig({
      actions: config.actions.filter(a => a.id !== actionId)
    });
  };

  const updateAction = (actionId: string, updates: Partial<NotificationAction>) => {
    const config = getCurrentConfig();
    updateConfig({
      actions: config.actions.map(a => a.id === actionId ? { ...a, ...updates } : a)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentConfig = getCurrentConfig();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Configuration des Notifications
        </h1>
        <p className="text-muted-foreground mt-1">
          Configurez les notifications automatiques pour chaque type d'activité AI Phone Agent
        </p>
      </header>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-1 mb-8 p-1 bg-gray-100 rounded-xl">
          <TabsTrigger value="ORDER" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
            {getTabIcon('ORDER')}
            <span className="font-semibold">Commandes</span>
          </TabsTrigger>
          
          <TabsTrigger value="SERVICE" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
            {getTabIcon('SERVICE')}
            <span className="font-semibold">Services</span>
          </TabsTrigger>
          
          <TabsTrigger value="CONSULTATION" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
            {getTabIcon('CONSULTATION')}
            <span className="font-semibold">Consultations</span>
          </TabsTrigger>
          
          <TabsTrigger value="SIGNALEMENT" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
            {getTabIcon('SIGNALEMENT')}
            <span className="font-semibold">Signalements</span>
          </TabsTrigger>
        </TabsList>

        {/* Contenu des onglets */}
        {(['ORDER', 'SERVICE', 'CONSULTATION', 'SIGNALEMENT'] as const).map((type) => (
          <TabsContent key={type} value={type} className="space-y-6">
            
            {/* Configuration générale */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTabIcon(type)}
                    <div>
                      <CardTitle>
                        Configuration {type === 'ORDER' ? 'Commandes' : 
                                   type === 'SERVICE' ? 'Services' : 
                                   type === 'CONSULTATION' ? 'Consultations' : 'Signalements'}
                      </CardTitle>
                      <CardDescription>
                        {type === 'ORDER' && 'Notifications pour les commandes de produits'}
                        {type === 'SERVICE' && 'Notifications pour les services et réservations'}
                        {type === 'CONSULTATION' && 'Notifications pour les consultations'}
                        {type === 'SIGNALEMENT' && 'Notifications pour les problèmes et réclamations'}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch 
                    checked={currentConfig.isActive}
                    onCheckedChange={(checked) => updateConfig({ isActive: checked })}
                  />
                </div>
              </CardHeader>
              
              {currentConfig.isActive && (
                <CardContent className="space-y-6">
                  
                  {/* Conditions de déclenchement */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Conditions de déclenchement</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {type !== 'SIGNALEMENT' && (
                        <div className="space-y-2">
                          <Label>Montant minimum</Label>
                          <Input 
                            type="number"
                            placeholder="0.00"
                            value={currentConfig.conditions.minAmount || ''}
                            onChange={(e) => updateConfig({
                              conditions: { 
                                ...currentConfig.conditions, 
                                minAmount: parseFloat(e.target.value) || 0 
                              }
                            })}
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Type de client</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tous">Tous les clients</SelectItem>
                            <SelectItem value="vip">Clients VIP</SelectItem>
                            <SelectItem value="fidele">Clients fidèles</SelectItem>
                            <SelectItem value="nouveau">Nouveaux clients</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {type === 'SIGNALEMENT' && (
                        <div className="space-y-2">
                          <Label>Niveau d'urgence</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tous">Tous niveaux</SelectItem>
                              <SelectItem value="critique">🚨 Critique seulement</SelectItem>
                              <SelectItem value="eleve">⚠️ Élevé et plus</SelectItem>
                              <SelectItem value="moyen">📋 Moyen et plus</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Créneaux horaires</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="toujours">24h/24</SelectItem>
                            <SelectItem value="ouverture">Heures d'ouverture</SelectItem>
                            <SelectItem value="bureau">Heures de bureau</SelectItem>
                            <SelectItem value="urgence">Urgences seulement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Actions configurées */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Actions configurées</h3>
                      <Button onClick={addAction} size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Ajouter une action
                      </Button>
                    </div>

                    {currentConfig.actions.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                          <Bell className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500 mb-4">Aucune action configurée</p>
                          <Button onClick={addAction} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter votre première action
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {currentConfig.actions.map((action, index) => (
                          <Card key={action.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  {getActionIcon(action.type)}
                                  <div>
                                    <p className="font-semibold">{action.type}</p>
                                    <p className="text-sm text-gray-500">
                                      Priorité: {action.priority} • Délai: {action.delay}min
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch 
                                    checked={action.isActive}
                                    onCheckedChange={(checked) => updateAction(action.id, { isActive: checked })}
                                  />
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => removeAction(action.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Type d'action</Label>
                                  <Select 
                                    value={action.type}
                                    onValueChange={(value) => updateAction(action.id, { type: value as any })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="EMAIL">📧 Email</SelectItem>
                                      <SelectItem value="WHATSAPP">💬 WhatsApp</SelectItem>
                                      <SelectItem value="PRINT">🖨️ Impression</SelectItem>
                                      <SelectItem value="CALENDAR">📅 Google Calendar</SelectItem>
                                      <SelectItem value="N8N_WEBHOOK">🔗 Webhook N8N</SelectItem>
                                      <SelectItem value="SMS">📱 SMS</SelectItem>
                                      <SelectItem value="SLACK">💼 Slack</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Priorité</Label>
                                  <Select 
                                    value={action.priority}
                                    onValueChange={(value) => updateAction(action.id, { priority: value as any })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="LOW">🔽 Faible</SelectItem>
                                      <SelectItem value="NORMAL">▶️ Normal</SelectItem>
                                      <SelectItem value="HIGH">🔼 Élevée</SelectItem>
                                      <SelectItem value="URGENT">🚨 Urgente</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Délai (minutes)</Label>
                                  <Input 
                                    type="number"
                                    value={action.delay}
                                    onChange={(e) => updateAction(action.id, { delay: parseInt(e.target.value) || 0 })}
                                  />
                                </div>
                              </div>

                              {/* Configuration spécifique selon le type */}
                              {action.type === 'EMAIL' && (
                                <div className="mt-4 space-y-2">
                                  <Label>Configuration Email</Label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input placeholder="Destinataire" />
                                    <Select>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Template" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="confirmation">Confirmation</SelectItem>
                                        <SelectItem value="alert">Alerte</SelectItem>
                                        <SelectItem value="reminder">Rappel</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}

                              {action.type === 'N8N_WEBHOOK' && (
                                <div className="mt-4 space-y-2">
                                  <Label>URL Webhook N8N</Label>
                                  <Input placeholder="https://your-n8n-instance.com/webhook/..." />
                                </div>
                              )}

                              {action.type === 'CALENDAR' && (
                                <div className="mt-4 space-y-2">
                                  <Label>Configuration Calendar</Label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input placeholder="Calendrier" />
                                    <Input placeholder="Invités" />
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bouton de sauvegarde */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => updateConfig({})}>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder la configuration
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}