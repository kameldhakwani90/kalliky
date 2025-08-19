'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Mail, 
  MessageSquare, 
  Printer, 
  CalendarDays, 
  Webhook, 
  Phone, 
  MessageCircle,
  Wifi,
  Usb,
  Globe,
  Lock,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: any;
  actionIndex: number;
  activityType: string;
  storeId: string;
  onSave: (updatedAction: any) => void;
}

export default function ConfigurationModal({
  isOpen,
  onClose,
  action,
  actionIndex,
  activityType,
  storeId,
  onSave
}: ConfigurationModalProps) {
  const [config, setConfig] = useState(action || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (action) {
      setConfig(action);
    }
  }, [action]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'EMAIL': return <Mail className="h-5 w-5" />;
      case 'WHATSAPP': return <MessageSquare className="h-5 w-5" />;
      case 'PRINT': return <Printer className="h-5 w-5" />;
      case 'CALENDAR': return <CalendarDays className="h-5 w-5" />;
      case 'N8N_WEBHOOK': return <Webhook className="h-5 w-5" />;
      case 'SMS': return <Phone className="h-5 w-5" />;
      case 'SLACK': return <MessageCircle className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'EMAIL': return '📧 Configuration Email';
      case 'WHATSAPP': return '💬 Configuration WhatsApp';
      case 'PRINT': return '🖨️ Configuration Imprimante';
      case 'CALENDAR': return '📅 Configuration Google Calendar';
      case 'N8N_WEBHOOK': return '🔗 Configuration Webhook N8N';
      case 'SMS': return '📱 Configuration SMS';
      case 'SLACK': return '💼 Configuration Slack';
      default: return '⚙️ Configuration';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      onSave(config);
      onClose();
    } catch (error) {
      console.error('Erreur sauvegarde configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  const renderEmailConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email-to">Destinataire</Label>
          <Input
            id="email-to"
            placeholder="email@example.com"
            value={config.settings?.to || ''}
            onChange={(e) => updateSettings('to', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="email-cc">CC (optionnel)</Label>
          <Input
            id="email-cc"
            placeholder="cc@example.com"
            value={config.settings?.cc || ''}
            onChange={(e) => updateSettings('cc', e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="email-subject">Sujet du mail</Label>
        <Input
          id="email-subject"
          placeholder="Nouvelle notification - {activityType}"
          value={config.settings?.subject || ''}
          onChange={(e) => updateSettings('subject', e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="email-template">Template email</Label>
        <Textarea
          id="email-template"
          placeholder="Bonjour,&#10;&#10;Une nouvelle {activityType} a été créée.&#10;&#10;Détails: {details}"
          rows={6}
          value={config.settings?.template || ''}
          onChange={(e) => updateSettings('template', e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Variables disponibles: {'{activityType}'}, {'{details}'}, {'{date}'}, {'{storeName}'}
        </p>
      </div>
    </div>
  );

  const renderWhatsAppConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="whatsapp-number">Numéro WhatsApp</Label>
          <Input
            id="whatsapp-number"
            placeholder="+33123456789"
            value={config.settings?.phoneNumber || ''}
            onChange={(e) => updateSettings('phoneNumber', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="whatsapp-business-id">Business Account ID</Label>
          <Input
            id="whatsapp-business-id"
            placeholder="123456789"
            value={config.settings?.businessAccountId || ''}
            onChange={(e) => updateSettings('businessAccountId', e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="whatsapp-template">Message template</Label>
        <Textarea
          id="whatsapp-template"
          placeholder="🔔 Nouvelle {activityType}&#10;&#10;📝 {details}&#10;📅 {date}"
          rows={4}
          value={config.settings?.template || ''}
          onChange={(e) => updateSettings('template', e.target.value)}
        />
      </div>
    </div>
  );

  const renderPrinterConfig = () => (
    <Tabs defaultValue="network" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="network">
          <Wifi className="h-4 w-4 mr-2" />
          Réseau (IP)
        </TabsTrigger>
        <TabsTrigger value="usb">
          <Usb className="h-4 w-4 mr-2" />
          USB/Local
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="network" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="printer-ip">Adresse IP</Label>
            <Input
              id="printer-ip"
              placeholder="192.168.1.100"
              value={config.settings?.ipAddress || ''}
              onChange={(e) => updateSettings('ipAddress', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="printer-port">Port</Label>
            <Input
              id="printer-port"
              placeholder="9100"
              value={config.settings?.port || '9100'}
              onChange={(e) => updateSettings('port', e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="printer-name">Nom de l'imprimante</Label>
          <Input
            id="printer-name"
            placeholder="Imprimante Cuisine"
            value={config.settings?.printerName || ''}
            onChange={(e) => updateSettings('printerName', e.target.value)}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="usb" className="space-y-4">
        <div>
          <Label htmlFor="printer-device">Périphérique USB</Label>
          <Input
            id="printer-device"
            placeholder="/dev/usb/lp0 ou COM1"
            value={config.settings?.usbDevice || ''}
            onChange={(e) => updateSettings('usbDevice', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="printer-driver">Driver d'impression</Label>
          <Select value={config.settings?.driver || 'ESC_POS'} onValueChange={(value) => updateSettings('driver', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ESC_POS">ESC/POS (Standard)</SelectItem>
              <SelectItem value="STAR">Star Micronics</SelectItem>
              <SelectItem value="EPSON">Epson TM</SelectItem>
              <SelectItem value="ZEBRA">Zebra ZPL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>
      
      <div className="mt-4 space-y-4">
        <div>
          <Label htmlFor="ticket-template">Template du ticket</Label>
          <Textarea
            id="ticket-template"
            placeholder="================================&#10;    {storeName}&#10;================================&#10;&#10;{activityType}: {details}&#10;Date: {date}&#10;&#10;================================"
            rows={6}
            value={config.settings?.ticketTemplate || ''}
            onChange={(e) => updateSettings('ticketTemplate', e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-cut"
            checked={config.settings?.autoCut || false}
            onCheckedChange={(checked) => updateSettings('autoCut', checked)}
          />
          <Label htmlFor="auto-cut">Coupe automatique du papier</Label>
        </div>
      </div>
    </Tabs>
  );

  const renderCalendarConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="calendar-id">ID du calendrier Google</Label>
        <Input
          id="calendar-id"
          placeholder="primary ou calendar@group.calendar.google.com"
          value={config.settings?.calendarId || 'primary'}
          onChange={(e) => updateSettings('calendarId', e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event-duration">Durée de l'événement (min)</Label>
          <Input
            id="event-duration"
            type="number"
            placeholder="30"
            value={config.settings?.duration || '30'}
            onChange={(e) => updateSettings('duration', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reminder-time">Rappel avant (min)</Label>
          <Input
            id="reminder-time"
            type="number"
            placeholder="15"
            value={config.settings?.reminderMinutes || '15'}
            onChange={(e) => updateSettings('reminderMinutes', e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="event-title">Titre de l'événement</Label>
        <Input
          id="event-title"
          placeholder="📋 {activityType} - {storeName}"
          value={config.settings?.eventTitle || ''}
          onChange={(e) => updateSettings('eventTitle', e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="event-description">Description</Label>
        <Textarea
          id="event-description"
          placeholder="Nouvelle {activityType} créée&#10;&#10;Détails: {details}&#10;Date: {date}"
          rows={4}
          value={config.settings?.eventDescription || ''}
          onChange={(e) => updateSettings('eventDescription', e.target.value)}
        />
      </div>
    </div>
  );

  const renderWebhookConfig = () => (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-800">
          <Webhook className="h-4 w-4" />
          <span className="font-medium">Webhook N8N</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Configurez l'URL de votre workflow N8N pour déclencher des actions automatiques.
        </p>
      </div>
      
      <div>
        <Label htmlFor="webhook-url">URL du webhook N8N</Label>
        <Input
          id="webhook-url"
          placeholder="https://n8n.yoursite.com/webhook/your-workflow-id"
          value={config.settings?.webhookUrl || ''}
          onChange={(e) => updateSettings('webhookUrl', e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="webhook-method">Méthode HTTP</Label>
          <Select value={config.settings?.method || 'POST'} onValueChange={(value) => updateSettings('method', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="webhook-timeout">Timeout (secondes)</Label>
          <Input
            id="webhook-timeout"
            type="number"
            placeholder="30"
            value={config.settings?.timeout || '30'}
            onChange={(e) => updateSettings('timeout', e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="webhook-headers">Headers personnalisés (JSON)</Label>
        <Textarea
          id="webhook-headers"
          placeholder='{"Authorization": "Bearer your-token", "Content-Type": "application/json"}'
          rows={3}
          value={config.settings?.headers || ''}
          onChange={(e) => updateSettings('headers', e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="webhook-payload">Payload personnalisé (JSON)</Label>
        <Textarea
          id="webhook-payload"
          placeholder='{"event": "{activityType}", "store": "{storeName}", "data": "{details}", "timestamp": "{date}"}'
          rows={4}
          value={config.settings?.payload || ''}
          onChange={(e) => updateSettings('payload', e.target.value)}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="webhook-verify-ssl"
          checked={config.settings?.verifySSL !== false}
          onCheckedChange={(checked) => updateSettings('verifySSL', checked)}
        />
        <Label htmlFor="webhook-verify-ssl">Vérifier le certificat SSL</Label>
      </div>
    </div>
  );

  const renderSMSConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="sms-number">Numéro de téléphone</Label>
        <Input
          id="sms-number"
          placeholder="+33123456789"
          value={config.settings?.phoneNumber || ''}
          onChange={(e) => updateSettings('phoneNumber', e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="sms-message">Message SMS</Label>
        <Textarea
          id="sms-message"
          placeholder="🔔 Nouvelle {activityType} - {storeName}&#10;{details}"
          rows={4}
          maxLength={160}
          value={config.settings?.message || ''}
          onChange={(e) => updateSettings('message', e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {(config.settings?.message || '').length}/160 caractères
        </p>
      </div>
    </div>
  );

  const renderSlackConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="slack-webhook">Webhook URL Slack</Label>
        <Input
          id="slack-webhook"
          placeholder="https://hooks.slack.com/services/..."
          value={config.settings?.webhookUrl || ''}
          onChange={(e) => updateSettings('webhookUrl', e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="slack-channel">Canal</Label>
          <Input
            id="slack-channel"
            placeholder="#general"
            value={config.settings?.channel || ''}
            onChange={(e) => updateSettings('channel', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="slack-username">Nom d'utilisateur bot</Label>
          <Input
            id="slack-username"
            placeholder="Kalliky Bot"
            value={config.settings?.username || 'Kalliky Bot'}
            onChange={(e) => updateSettings('username', e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="slack-message">Message</Label>
        <Textarea
          id="slack-message"
          placeholder="🔔 Nouvelle {activityType} sur {storeName}&#10;📝 {details}"
          rows={4}
          value={config.settings?.message || ''}
          onChange={(e) => updateSettings('message', e.target.value)}
        />
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priorité</Label>
          <Select value={config.priority || 'NORMAL'} onValueChange={(value) => setConfig(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">🟢 Basse</SelectItem>
              <SelectItem value="NORMAL">🟡 Normale</SelectItem>
              <SelectItem value="HIGH">🟠 Haute</SelectItem>
              <SelectItem value="CRITICAL">🔴 Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="delay">Délai d'exécution (minutes)</Label>
          <Input
            id="delay"
            type="number"
            placeholder="0"
            min="0"
            value={config.delay || 0}
            onChange={(e) => setConfig(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={config.isActive !== false}
          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="active">Action active</Label>
      </div>
    </div>
  );

  const renderConfigForm = () => {
    switch (config.actionType || config.type) {
      case 'EMAIL':
        return renderEmailConfig();
      case 'WHATSAPP':
        return renderWhatsAppConfig();
      case 'PRINT':
        return renderPrinterConfig();
      case 'CALENDAR':
        return renderCalendarConfig();
      case 'N8N_WEBHOOK':
        return renderWebhookConfig();
      case 'SMS':
        return renderSMSConfig();
      case 'SLACK':
        return renderSlackConfig();
      default:
        return <div>Configuration non disponible pour ce type d'action.</div>;
    }
  };

  if (!isOpen || !action) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon(config.actionType || config.type)}
            {getActionLabel(config.actionType || config.type)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4" />
                Paramètres généraux
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderGeneralSettings()}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                {getActionIcon(config.actionType || config.type)}
                Configuration spécifique
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderConfigForm()}
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}