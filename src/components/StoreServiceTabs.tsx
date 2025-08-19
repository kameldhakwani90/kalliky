'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Utensils, 
  Calendar, 
  UserCheck, 
  Settings, 
  Plus,
  BarChart3,
  Clock,
  Users,
  Bell,
  PhoneForwarded,
  Mail,
  MessageSquare,
  Printer,
  CalendarDays,
  Webhook,
  Phone,
  MessageCircle,
  Trash2,
  Edit,
  BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoreConfig {
  hasProducts: boolean;
  hasReservations: boolean;
  hasConsultations: boolean;
  productsConfig?: any;
  reservationsConfig?: any;
  consultationsConfig?: any;
}

interface StoreServiceTabsProps {
  storeId: string;
  storeName: string;
  config: StoreConfig;
  onConfigUpdate: (config: StoreConfig) => void;
}

const serviceConfigs = [
  {
    id: 'products',
    title: 'Catalogue Produits',
    description: 'Gestion des produits, prix et commandes',
    icon: Utensils,
    color: 'orange',
    configKey: 'hasProducts' as keyof StoreConfig,
    features: [
      'Catalogue de produits',
      'Gestion des prix',
      'Prise de commandes',
      'Gestion du stock',
      'Upselling automatique'
    ]
  },
  {
    id: 'reservations',
    title: 'Réservations',
    description: 'Planning, créneaux et confirmations',
    icon: Calendar,
    color: 'blue',
    configKey: 'hasReservations' as keyof StoreConfig,
    features: [
      'Planning des créneaux',
      'Réservations automatiques',
      'Confirmations SMS/Email',
      'Gestion des annulations',
      'Rappels automatiques'
    ]
  },
  {
    id: 'consultations',
    title: 'Consultations',
    description: 'RDV privés et suivi clientèle',
    icon: UserCheck,
    color: 'purple',
    configKey: 'hasConsultations' as keyof StoreConfig,
    features: [
      'Prise de RDV',
      'Consultations privées',
      'Suivi des dossiers',
      'Facturation automatique',
      'Notes de consultation'
    ]
  }
];

export default function StoreServiceTabs({ 
  storeId, 
  storeName, 
  config, 
  onConfigUpdate 
}: StoreServiceTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [localConfig, setLocalConfig] = useState<StoreConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleServiceToggle = (serviceKey: keyof StoreConfig) => {
    const newConfig = {
      ...localConfig,
      [serviceKey]: !localConfig[serviceKey]
    };
    setLocalConfig(newConfig);
    onConfigUpdate(newConfig);
  };

  const enabledServices = serviceConfigs.filter(service => localConfig[service.configKey]);
  const enabledCount = enabledServices.length;

  // Détermine l'onglet par défaut basé sur les services activés
  useEffect(() => {
    if (enabledServices.length > 0 && activeTab === 'overview') {
      setActiveTab(enabledServices[0].id);
    }
  }, [enabledServices, activeTab]);

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b">
          <div className="flex items-center justify-between p-4">
            <div>
              <h2 className="text-2xl font-bold">{storeName}</h2>
              <p className="text-muted-foreground">
                {enabledCount} service{enabledCount > 1 ? 's' : ''} activé{enabledCount > 1 ? 's' : ''}
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              <Settings className="h-3 w-3" />
              Configuration
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <TabsList className="flex w-max min-w-full p-0 bg-transparent h-auto space-x-0">
              {/* Onglet Vue d'ensemble */}
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 whitespace-nowrap"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Vue d'ensemble
              </TabsTrigger>

              {/* Onglets des services activés */}
              {serviceConfigs.map((service) => {
                const isEnabled = localConfig[service.configKey];
                const Icon = service.icon;
                
                if (!isEnabled) return null;

                return (
                  <TabsTrigger 
                    key={service.id}
                    value={service.id}
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {service.title}
                  </TabsTrigger>
                );
              })}

              {/* Onglet Config IA */}
              <TabsTrigger 
                value="ai-config" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 whitespace-nowrap"
              >
                <BrainCircuit className="h-4 w-4 mr-2" />
                Config IA
              </TabsTrigger>

              {/* Onglet Renvoi d'appel */}
              <TabsTrigger 
                value="call-forwarding" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 whitespace-nowrap"
              >
                <PhoneForwarded className="h-4 w-4 mr-2" />
                Renvoi d'appel
              </TabsTrigger>

              {/* Onglet Notifications */}
              <TabsTrigger 
                value="notifications" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 whitespace-nowrap"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>

              {/* Onglet Configuration */}
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3 whitespace-nowrap"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceConfigs.map((service) => {
                const isEnabled = localConfig[service.configKey];
                const Icon = service.icon;
                
                return (
                  <Card key={service.id} className={cn(
                    "relative transition-all",
                    isEnabled ? "border-primary/20 bg-primary/5" : "border-dashed"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Icon className={cn(
                          "h-8 w-8",
                          isEnabled ? `text-${service.color}-600` : "text-muted-foreground"
                        )} />
                        <Badge variant={isEnabled ? "default" : "outline"}>
                          {isEnabled ? "Activé" : "Désactivé"}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      {isEnabled ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center p-2 bg-background rounded">
                              <div className="font-semibold">24</div>
                              <div className="text-muted-foreground">Aujourd'hui</div>
                            </div>
                            <div className="text-center p-2 bg-background rounded">
                              <div className="font-semibold">156</div>
                              <div className="text-muted-foreground">Ce mois</div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setActiveTab(service.id)}
                          >
                            Gérer {service.title.toLowerCase()}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Service non activé pour cette boutique
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleServiceToggle(service.configKey)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Activer
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Onglets des services */}
          {serviceConfigs.map((service) => {
            const isEnabled = localConfig[service.configKey];
            if (!isEnabled) return null;

            return (
              <TabsContent key={service.id} value={service.id} className="mt-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{service.title}</h3>
                      <p className="text-muted-foreground">{service.description}</p>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau
                    </Button>
                  </div>

                  {/* Contenu spécifique à chaque service */}
                  <ServiceContent serviceId={service.id} storeId={storeId} />
                </div>
              </TabsContent>
            );
          })}

          {/* Configuration */}
          <TabsContent value="settings" className="mt-0">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold">Configuration des services</h3>
                <p className="text-muted-foreground">
                  Activez ou désactivez les services pour cette boutique
                </p>
              </div>

              <div className="grid gap-6">
                {serviceConfigs.map((service) => {
                  const isEnabled = localConfig[service.configKey];
                  const Icon = service.icon;
                  
                  return (
                    <Card key={service.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Icon className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium">{service.title}</h4>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                              <div className="mt-2">
                                <div className="flex flex-wrap gap-1">
                                  {service.features.map((feature, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Label htmlFor={service.id} className="text-sm">
                              {isEnabled ? 'Activé' : 'Désactivé'}
                            </Label>
                            <Switch
                              id={service.id}
                              checked={isEnabled}
                              onCheckedChange={() => handleServiceToggle(service.configKey)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Contenu onglet Config IA */}
          <TabsContent value="ai-config" className="mt-0">
            <AIConfigContent storeId={storeId} />
          </TabsContent>

          {/* Contenu onglet Renvoi d'appel */}
          <TabsContent value="call-forwarding" className="mt-0">
            <CallForwardingContent storeId={storeId} />
          </TabsContent>

          {/* Contenu onglet Notifications */}
          <TabsContent value="notifications" className="mt-0">
            <NotificationsContent storeId={storeId} />
          </TabsContent>

          {/* Contenu onglet Configuration */}
          <TabsContent value="settings" className="mt-0">
            <StoreConfigurationContent storeId={storeId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Composant pour le contenu spécifique à chaque service
function ServiceContent({ serviceId, storeId }: { serviceId: string; storeId: string }) {
  switch (serviceId) {
    case 'products':
      return <ProductsContent storeId={storeId} />;
    case 'reservations':
      return <ReservationsContent storeId={storeId} />;
    case 'consultations':
      return <ConsultationsContent storeId={storeId} />;
    default:
      return <div>Service non trouvé</div>;
  }
}

function ProductsContent({ storeId }: { storeId: string }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Catalogue de produits</CardTitle>
          <CardDescription>Gérez vos produits et leurs prix</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Interface du catalogue produits à implémenter
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReservationsContent({ storeId }: { storeId: string }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Planning des réservations</CardTitle>
          <CardDescription>Gérez les créneaux et confirmations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Interface de gestion des réservations à implémenter
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ConsultationsContent({ storeId }: { storeId: string }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Agenda des consultations</CardTitle>
          <CardDescription>Gérez les RDV et le suivi client</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Interface de gestion des consultations à implémenter
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AIConfigContent({ storeId }: { storeId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" />
            Configuration de l'IA
          </CardTitle>
          <CardDescription>
            Personnalisez le comportement de l'assistant IA pour cette boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'assistant</Label>
              <Input placeholder="Ex: Sophie, l'assistante des Coutumes" />
            </div>
            
            <div className="space-y-2">
              <Label>Personnalité</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un style..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professionnel</SelectItem>
                  <SelectItem value="friendly">Amical</SelectItem>
                  <SelectItem value="casual">Décontracté</SelectItem>
                  <SelectItem value="formal">Formel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Message d'accueil personnalisé</Label>
              <Textarea 
                placeholder="Ex: Bonjour et bienvenue chez Les Coutumes ! Je suis Sophie, votre assistante IA. Comment puis-je vous aider aujourd'hui ?"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Instructions spéciales</Label>
              <Textarea 
                placeholder="Ex: Toujours proposer les spécialités du jour, mentionner les allergènes si demandé..."
                rows={4}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button>Sauvegarder la configuration IA</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CallForwardingContent({ storeId }: { storeId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneForwarded className="h-5 w-5" />
            Configuration du Renvoi d'Appel
          </CardTitle>
          <CardDescription>
            Configurez les numéros de renvoi pour cette boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Numéro principal de renvoi</Label>
              <Input placeholder="+33 6 12 34 56 78" />
            </div>
            
            <div className="space-y-2">
              <Label>Numéro de secours</Label>
              <Input placeholder="+33 6 98 76 54 32" />
            </div>
            
            <div className="space-y-2">
              <Label>Heures de renvoi</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">24h/24</SelectItem>
                  <SelectItem value="business">Heures d'ouverture seulement</SelectItem>
                  <SelectItem value="after">Après fermeture seulement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button>Sauvegarder la configuration</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsContent({ storeId }: { storeId: string }) {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ORDER' | 'SERVICE' | 'CONSULTATION' | 'SIGNALEMENT'>('ORDER');
  const [showAddAction, setShowAddAction] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<string>('');

  useEffect(() => {
    loadNotificationConfigs();
  }, [storeId]);

  const loadNotificationConfigs = async () => {
    try {
      setLoading(true);
      const businessId = 'demo-business'; // TODO: récupérer depuis le contexte
      const response = await fetch(`/api/restaurant/notifications/configs?storeId=${storeId}&businessId=${businessId}`);
      
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error('Erreur chargement configurations notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <Utensils className="h-4 w-4" />;
      case 'SERVICE': return <Calendar className="h-4 w-4" />;
      case 'CONSULTATION': return <UserCheck className="h-4 w-4" />;
      case 'SIGNALEMENT': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getConfigForType = (type: string) => {
    return configs.find(c => c.activityType === type) || {
      activityType: type,
      isActive: false,
      actions: []
    };
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

  const actionTypes = [
    { value: 'EMAIL', label: '📧 Email', icon: Mail },
    { value: 'WHATSAPP', label: '💬 WhatsApp', icon: MessageSquare },
    { value: 'SMS', label: '📱 SMS', icon: Phone },
    { value: 'SLACK', label: '💼 Slack', icon: MessageCircle },
    { value: 'PRINT', label: '🖨️ Impression', icon: Printer },
    { value: 'CALENDAR', label: '📅 Google Calendar', icon: CalendarDays },
    { value: 'N8N_WEBHOOK', label: '🔗 Webhook N8N', icon: Webhook }
  ];

  const addAction = async (actionType: string) => {
    const newAction = {
      type: actionType,
      settings: {},
      delay: 0,
      priority: 'NORMAL',
      isActive: true
    };

    try {
      const businessId = 'demo-business';
      const config = getConfigForType(activeTab);
      const updatedActions = [...(config.actions || []), newAction];

      const response = await fetch('/api/restaurant/notifications/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          businessId,
          activityType: activeTab,
          isActive: config.isActive,
          conditions: config.conditions || {},
          actions: updatedActions
        })
      });

      if (response.ok) {
        await loadNotificationConfigs(); // Recharger les configs
      }
    } catch (error) {
      console.error('Erreur ajout action:', error);
    }
    
    setShowAddAction(false);
  };

  const removeAction = async (actionIndex: number) => {
    try {
      const businessId = 'demo-business';
      const config = getConfigForType(activeTab);
      const updatedActions = config.actions.filter((_: any, index: number) => index !== actionIndex);

      const response = await fetch('/api/restaurant/notifications/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          businessId,
          activityType: activeTab,
          isActive: config.isActive,
          conditions: config.conditions || {},
          actions: updatedActions
        })
      });

      if (response.ok) {
        await loadNotificationConfigs();
      }
    } catch (error) {
      console.error('Erreur suppression action:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configuration des Notifications
          </CardTitle>
          <CardDescription>
            Configurez les notifications automatiques pour chaque type d'activité de votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 gap-1 mb-6 p-1 bg-gray-100 rounded-xl">
              <TabsTrigger value="ORDER" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
                {getTabIcon('ORDER')}
                <span className="font-semibold">Commandes</span>
              </TabsTrigger>
              
              <TabsTrigger value="SERVICE" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
                {getTabIcon('SERVICE')}
                <span className="font-semibold">Services</span>
              </TabsTrigger>
              
              <TabsTrigger value="CONSULTATION" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
                {getTabIcon('CONSULTATION')}
                <span className="font-semibold">Consultations</span>
              </TabsTrigger>
              
              <TabsTrigger value="SIGNALEMENT" className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
                {getTabIcon('SIGNALEMENT')}
                <span className="font-semibold">Signalements</span>
              </TabsTrigger>
            </TabsList>

            {(['ORDER', 'SERVICE', 'CONSULTATION', 'SIGNALEMENT'] as const).map((type) => {
              const config = getConfigForType(type);
              
              return (
                <TabsContent key={type} value={type} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTabIcon(type)}
                          <div>
                            <CardTitle>
                              {type === 'ORDER' ? 'Notifications Commandes' : 
                               type === 'SERVICE' ? 'Notifications Services' : 
                               type === 'CONSULTATION' ? 'Notifications Consultations' : 'Notifications Signalements'}
                            </CardTitle>
                            <CardDescription>
                              {type === 'ORDER' && 'Configurez les notifications pour les commandes de produits'}
                              {type === 'SERVICE' && 'Configurez les notifications pour les services et réservations'}
                              {type === 'CONSULTATION' && 'Configurez les notifications pour les consultations'}
                              {type === 'SIGNALEMENT' && 'Configurez les notifications pour les problèmes et réclamations'}
                            </CardDescription>
                          </div>
                        </div>
                        <Switch checked={config.isActive} />
                      </div>
                    </CardHeader>
                    
                    {config.isActive && (
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Actions configurées</h4>
                            
                            <Dialog open={showAddAction} onOpenChange={setShowAddAction}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Ajouter une action
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Choisir un type d'action</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-3">
                                  {actionTypes.map((actionType) => {
                                    const Icon = actionType.icon;
                                    return (
                                      <Button
                                        key={actionType.value}
                                        variant="outline"
                                        className="justify-start h-auto p-4"
                                        onClick={() => addAction(actionType.value)}
                                      >
                                        <Icon className="h-5 w-5 mr-3" />
                                        <div className="text-left">
                                          <div className="font-medium">{actionType.label}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {actionType.value === 'EMAIL' && 'Envoyer un email de notification'}
                                            {actionType.value === 'WHATSAPP' && 'Envoyer via WhatsApp Business'}
                                            {actionType.value === 'SMS' && 'Envoyer un SMS'}
                                            {actionType.value === 'SLACK' && 'Notifier dans un canal Slack'}
                                            {actionType.value === 'PRINT' && 'Imprimer un ticket'}
                                            {actionType.value === 'CALENDAR' && 'Créer un événement calendar'}
                                            {actionType.value === 'N8N_WEBHOOK' && 'Déclencher un webhook N8N'}
                                          </div>
                                        </div>
                                      </Button>
                                    );
                                  })}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          {config.actions?.length > 0 ? (
                            <div className="space-y-2">
                              {config.actions.map((action: any, index: number) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    {getActionIcon(action.type)}
                                    <Badge variant="outline">{action.type}</Badge>
                                  </div>
                                  <span className="text-sm">Priorité: {action.priority}</span>
                                  <span className="text-sm">Délai: {action.delay}min</span>
                                  <div className="ml-auto flex items-center gap-2">
                                    {action.isActive && <Badge variant="default">Actif</Badge>}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeAction(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-muted-foreground text-sm mb-3">Aucune action configurée</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowAddAction(true)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter votre première action
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-4 border-t">
                          <Button 
                            variant="outline" 
                            onClick={() => window.open(`/restaurant/settings/notifications`, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            Configurer les notifications
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StoreConfigurationContent({ storeId }: { storeId: string }) {
  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStoreData();
  }, [storeId]);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'API réelle
      const mockData = {
        id: storeId,
        name: 'MARIO Pizza',
        description: 'Pizzeria traditionnelle avec des ingrédients frais',
        address: '123 Rue de la Pizza, 75001 Paris',
        phone: '+33 1 23 45 67 89',
        email: 'contact@mario-pizza.fr',
        website: 'https://mario-pizza.fr',
        currency: 'EUR',
        timezone: 'Europe/Paris',
        businessHours: {
          monday: { isOpen: true, open: '11:00', close: '22:00' },
          tuesday: { isOpen: true, open: '11:00', close: '22:00' },
          wednesday: { isOpen: true, open: '11:00', close: '22:00' },
          thursday: { isOpen: true, open: '11:00', close: '22:00' },
          friday: { isOpen: true, open: '11:00', close: '22:00' },
          saturday: { isOpen: true, open: '11:00', close: '23:00' },
          sunday: { isOpen: false, open: '', close: '' }
        },
        taxSettings: {
          defaultTaxRate: 20,
          taxIncluded: true,
          taxName: 'TVA'
        },
        socialMedia: {
          facebook: 'https://facebook.com/mario-pizza',
          instagram: '@mario_pizza_paris',
          twitter: '@mario_pizza'
        }
      };
      setStoreData(mockData);
    } catch (error) {
      console.error('Erreur chargement données boutique:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveStoreData = async () => {
    try {
      setSaving(true);
      // TODO: Implémenter l'API de sauvegarde
      console.log('Sauvegarde des données:', storeData);
      // Simulation d'un délai de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateStoreField = (field: string, value: any) => {
    setStoreData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setStoreData((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const daysOfWeek = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Informations générales
          </CardTitle>
          <CardDescription>
            Gérez les informations de base de votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Nom de la boutique</Label>
              <Input
                id="storeName"
                value={storeData?.name || ''}
                onChange={(e) => updateStoreField('name', e.target.value)}
                placeholder="Ex: MARIO Pizza"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeEmail">Email</Label>
              <Input
                id="storeEmail"
                type="email"
                value={storeData?.email || ''}
                onChange={(e) => updateStoreField('email', e.target.value)}
                placeholder="contact@mario-pizza.fr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeDescription">Description</Label>
            <Textarea
              id="storeDescription"
              value={storeData?.description || ''}
              onChange={(e) => updateStoreField('description', e.target.value)}
              placeholder="Décrivez votre boutique..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storePhone">Téléphone</Label>
              <Input
                id="storePhone"
                value={storeData?.phone || ''}
                onChange={(e) => updateStoreField('phone', e.target.value)}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeWebsite">Site web</Label>
              <Input
                id="storeWebsite"
                value={storeData?.website || ''}
                onChange={(e) => updateStoreField('website', e.target.value)}
                placeholder="https://mario-pizza.fr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeAddress">Adresse</Label>
            <Textarea
              id="storeAddress"
              value={storeData?.address || ''}
              onChange={(e) => updateStoreField('address', e.target.value)}
              placeholder="123 Rue de la Pizza, 75001 Paris"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Horaires d'ouverture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horaires d'ouverture
          </CardTitle>
          <CardDescription>
            Configurez les horaires d'ouverture de votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {daysOfWeek.map((day) => {
            const dayData = storeData?.businessHours?.[day.key];
            return (
              <div key={day.key} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-20 font-medium">{day.label}</div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dayData?.isOpen || false}
                    onCheckedChange={(checked) => {
                      const updated = {
                        ...storeData.businessHours,
                        [day.key]: {
                          ...dayData,
                          isOpen: checked
                        }
                      };
                      updateStoreField('businessHours', updated);
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {dayData?.isOpen ? 'Ouvert' : 'Fermé'}
                  </span>
                </div>
                {dayData?.isOpen && (
                  <div className="flex items-center gap-2 ml-4">
                    <Input
                      type="time"
                      value={dayData.open || ''}
                      onChange={(e) => {
                        const updated = {
                          ...storeData.businessHours,
                          [day.key]: {
                            ...dayData,
                            open: e.target.value
                          }
                        };
                        updateStoreField('businessHours', updated);
                      }}
                      className="w-24"
                    />
                    <span>à</span>
                    <Input
                      type="time"
                      value={dayData.close || ''}
                      onChange={(e) => {
                        const updated = {
                          ...storeData.businessHours,
                          [day.key]: {
                            ...dayData,
                            close: e.target.value
                          }
                        };
                        updateStoreField('businessHours', updated);
                      }}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Configuration fiscale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Configuration fiscale
          </CardTitle>
          <CardDescription>
            Gérez les taxes et la devise de votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select value={storeData?.currency || 'EUR'} onValueChange={(value) => updateStoreField('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Taux de TVA (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={storeData?.taxSettings?.defaultTaxRate || ''}
                onChange={(e) => updateNestedField('taxSettings', 'defaultTaxRate', parseFloat(e.target.value))}
                placeholder="20"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxName">Nom de la taxe</Label>
              <Input
                id="taxName"
                value={storeData?.taxSettings?.taxName || ''}
                onChange={(e) => updateNestedField('taxSettings', 'taxName', e.target.value)}
                placeholder="TVA"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={storeData?.taxSettings?.taxIncluded || false}
              onCheckedChange={(checked) => updateNestedField('taxSettings', 'taxIncluded', checked)}
            />
            <Label>Prix TTC (taxes incluses)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Réseaux sociaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Réseaux sociaux
          </CardTitle>
          <CardDescription>
            Ajoutez vos liens vers les réseaux sociaux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={storeData?.socialMedia?.facebook || ''}
                onChange={(e) => updateNestedField('socialMedia', 'facebook', e.target.value)}
                placeholder="https://facebook.com/mario-pizza"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={storeData?.socialMedia?.instagram || ''}
                onChange={(e) => updateNestedField('socialMedia', 'instagram', e.target.value)}
                placeholder="@mario_pizza_paris"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter/X</Label>
            <Input
              id="twitter"
              value={storeData?.socialMedia?.twitter || ''}
              onChange={(e) => updateNestedField('socialMedia', 'twitter', e.target.value)}
              placeholder="@mario_pizza"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button onClick={saveStoreData} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Settings className="h-4 w-4" />
          )}
          {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </Button>
      </div>
    </div>
  );
}