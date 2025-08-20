'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ConfigurationModal from './ConfigurationModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Settings,
  Utensils,
  Calendar,
  UserCheck,
  Mail,
  MessageSquare,
  Printer,
  CalendarDays,
  Webhook,
  Phone,
  MessageCircle
} from 'lucide-react';

interface NotificationsTabProps {
  storeId: string;
  storeName: string;
  businessId?: string;
}

export default function NotificationsTab({ storeId, storeName, businessId = 'demo-business' }: NotificationsTabProps) {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ORDER' | 'SERVICE' | 'CONSULTATION' | 'SIGNALEMENT'>('ORDER');
  const [showAddAction, setShowAddAction] = useState(false);
  const [limitsStatus, setLimitsStatus] = useState<any>(null);
  const [availableActionTypes, setAvailableActionTypes] = useState<any[]>([]);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [selectedActionIndex, setSelectedActionIndex] = useState<number>(-1);

  useEffect(() => {
    loadNotificationConfigs();
    loadLimitsStatus();
  }, [storeId]);

  useEffect(() => {
    if (showAddAction) {
      loadAvailableActionTypes();
    }
  }, [activeTab, showAddAction]);

  const loadNotificationConfigs = async () => {
    try {
      setLoading(true);
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

  const loadLimitsStatus = async () => {
    try {
      const response = await fetch(`/api/restaurant/notifications/limits?storeId=${storeId}`);
      
      if (response.ok) {
        const data = await response.json();
        setLimitsStatus(data);
      }
    } catch (error) {
      console.error('Erreur chargement limites notifications:', error);
    }
  };

  const loadAvailableActionTypes = async () => {
    try {
      const response = await fetch('/api/restaurant/notifications/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          activityType: activeTab,
          actionType: 'CHECK' // Juste pour obtenir la liste
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableActionTypes(data.availableActionTypes || []);
      }
    } catch (error) {
      console.error('Erreur chargement types d\'actions:', error);
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
    // Vérifier d'abord si on peut ajouter cette action
    try {
      const checkResponse = await fetch('/api/restaurant/notifications/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          activityType: activeTab,
          actionType
        })
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        
        if (!checkData.canAdd) {
          alert(`Impossible d'ajouter cette notification:\n${checkData.upgradeMessage || checkData.reason}`);
          return;
        }
      }
    } catch (error) {
      console.error('Erreur vérification limitation:', error);
    }

    const newAction = {
      actionType: actionType,
      settings: {},
      delay: 0,
      priority: 'NORMAL',
      isActive: true
    };

    try {
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
        await loadNotificationConfigs();
        await loadLimitsStatus(); // Recharger les limites
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.error}\n${errorData.upgradeMessage || ''}`);
      }
    } catch (error) {
      console.error('Erreur ajout action:', error);
    }
    
    setShowAddAction(false);
  };

  const removeAction = async (actionIndex: number) => {
    try {
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
        await loadLimitsStatus();
      }
    } catch (error) {
      console.error('Erreur suppression action:', error);
    }
  };

  const openConfigModal = (action: any, actionIndex: number) => {
    setSelectedAction(action);
    setSelectedActionIndex(actionIndex);
    setConfigModalOpen(true);
  };

  const saveActionConfig = async (updatedAction: any) => {
    try {
      const config = getConfigForType(activeTab);
      const updatedActions = [...config.actions];
      updatedActions[selectedActionIndex] = updatedAction;

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
        await loadLimitsStatus();
      }
    } catch (error) {
      console.error('Erreur sauvegarde configuration action:', error);
    }
  };

  const toggleNotifications = async (activityType: string, isActive: boolean) => {
    try {
      const config = getConfigForType(activityType);
      
      const response = await fetch('/api/restaurant/notifications/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          businessId,
          activityType,
          isActive,
          conditions: config.conditions || {},
          actions: config.actions || []
        })
      });

      if (response.ok) {
        await loadNotificationConfigs();
      }
    } catch (error) {
      console.error('Erreur toggle notifications:', error);
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuration des Notifications
              </CardTitle>
              <CardDescription>
                Configurez les notifications automatiques pour chaque type d'activité de votre boutique
              </CardDescription>
            </div>
            {limitsStatus && (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    Plan {limitsStatus.plan}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Max {limitsStatus.limits.maxNotificationsPerType} notifications/type
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 gap-1 mb-6 p-1 bg-gray-100 rounded-xl">
              {(['ORDER', 'SERVICE', 'CONSULTATION', 'SIGNALEMENT'] as const).map((type) => {
                const config = getConfigForType(type);
                const activityStatus = limitsStatus?.activityTypes?.[type];
                const label = {
                  'ORDER': 'Commandes',
                  'SERVICE': 'Services', 
                  'CONSULTATION': 'Consultations',
                  'SIGNALEMENT': 'Signalements'
                }[type];
                
                return (
                  <TabsTrigger 
                    key={type}
                    value={type} 
                    className="flex items-center gap-2 px-4 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md"
                  >
                    {getTabIcon(type)}
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{label}</span>
                      {activityStatus && (
                        <span className="text-xs text-muted-foreground">
                          {activityStatus.currentCount}/{activityStatus.maxAllowed}
                        </span>
                      )}
                    </div>
                  </TabsTrigger>
                );
              })}
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
                        <Switch 
                          checked={config.isActive} 
                          onCheckedChange={(checked) => toggleNotifications(type, checked)}
                        />
                      </div>
                    </CardHeader>
                    
                    {config.isActive && (
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Actions configurées</h4>
                            
                            <Dialog open={showAddAction} onOpenChange={setShowAddAction}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  className="flex items-center gap-2"
                                  disabled={limitsStatus?.activityTypes?.[type]?.canAddMore === false}
                                >
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
                                    // Chercher si ce type est disponible dans availableActionTypes
                                    const availableActionType = availableActionTypes.find(
                                      at => at.actionType === actionType.value
                                    );
                                    const isAllowed = availableActionType ? availableActionType.isAllowed : true;
                                    const requiresUpgrade = availableActionType ? availableActionType.requiresUpgrade : false;
                                    
                                    return (
                                      <Button
                                        key={actionType.value}
                                        variant={isAllowed ? "outline" : "secondary"}
                                        className={`justify-start h-auto p-4 ${!isAllowed ? 'opacity-60' : ''}`}
                                        onClick={() => isAllowed ? addAction(actionType.value) : null}
                                        disabled={!isAllowed}
                                      >
                                        <Icon className="h-5 w-5 mr-3" />
                                        <div className="text-left">
                                          <div className="font-medium">
                                            {actionType.label}
                                            {requiresUpgrade && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">PRO+</span>}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            {availableActionType?.description || 
                                              (actionType.value === 'EMAIL' && 'Envoyer un email de notification') ||
                                              (actionType.value === 'WHATSAPP' && 'Envoyer via WhatsApp Business') ||
                                              (actionType.value === 'SMS' && 'Envoyer un SMS') ||
                                              (actionType.value === 'SLACK' && 'Notifier dans un canal Slack') ||
                                              (actionType.value === 'PRINT' && 'Imprimer un ticket') ||
                                              (actionType.value === 'CALENDAR' && 'Créer un événement calendar') ||
                                              (actionType.value === 'N8N_WEBHOOK' && 'Déclencher un webhook N8N')
                                            }
                                            {requiresUpgrade && (
                                              <div className="text-orange-600 text-xs mt-1">
                                                Nécessite un plan supérieur
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </Button>
                                    );
                                  })}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          {/* Message d'information sur les limites */}
                          {limitsStatus?.activityTypes?.[type]?.canAddMore === false && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                              <div className="flex items-center gap-2 text-orange-800">
                                <Bell className="h-4 w-4" />
                                <span className="font-medium">Limite atteinte</span>
                              </div>
                              <p className="text-sm text-orange-700 mt-1">
                                Vous avez atteint la limite de {limitsStatus.limits.maxNotificationsPerType} notifications pour ce type d'activité. 
                                {limitsStatus.limits.upgradeMessage && (
                                  <span className="block mt-1 font-medium">
                                    {limitsStatus.limits.upgradeMessage}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}

                          {config.actions?.length > 0 ? (
                            <div className="space-y-2">
                              {config.actions.map((action: any, index: number) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    {getActionIcon(action.actionType || action.type)}
                                    <Badge variant="outline">{action.actionType || action.type}</Badge>
                                  </div>
                                  <span className="text-sm">Priorité: {action.priority}</span>
                                  <span className="text-sm">Délai: {action.delay}min</span>
                                  <div className="ml-auto flex items-center gap-2">
                                    {action.isActive && <Badge variant="default">Actif</Badge>}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openConfigModal(action, index)}
                                      title="Configurer cette action"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
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
                      </CardContent>
                    )}
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
      
      <ConfigurationModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        action={selectedAction}
        actionIndex={selectedActionIndex}
        activityType={activeTab}
        storeId={storeId}
        onSave={saveActionConfig}
      />
    </div>
  );
}