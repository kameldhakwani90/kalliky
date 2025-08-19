'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Phone,
  PhoneForwarded,
  PhoneOff,
  Clock,
  Settings,
  Copy,
  CheckCircle,
  AlertCircle,
  PhoneCall,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface CallForwardingTabProps {
  storeId: string;
  storeName: string;
  phoneNumber: string | null;
  settings: any;
  onConfigUpdate: (settings: any) => void;
}

export default function CallForwardingTab({ storeId, storeName, phoneNumber, settings, onConfigUpdate }: CallForwardingTabProps) {
  const [forwardingConfig, setForwardingConfig] = useState({
    enabled: true,
    forwardToNumber: '',
    forwardingMode: 'always', // always, busy, no-answer, offline
    noAnswerTimeout: 20, // seconds
    businessHoursOnly: false,
    schedule: {
      monday: { enabled: true, start: '09:00', end: '18:00' },
      tuesday: { enabled: true, start: '09:00', end: '18:00' },
      wednesday: { enabled: true, start: '09:00', end: '18:00' },
      thursday: { enabled: true, start: '09:00', end: '18:00' },
      friday: { enabled: true, start: '09:00', end: '18:00' },
      saturday: { enabled: false, start: '10:00', end: '14:00' },
      sunday: { enabled: false, start: '10:00', end: '14:00' },
    },
    voicemail: {
      enabled: true,
      greeting: `Bonjour, vous êtes bien chez ${storeName}. Nous ne sommes pas disponibles pour le moment. Veuillez laisser un message après le signal sonore.`,
      transcriptionEnabled: true,
      emailNotification: true,
    },
    notifications: {
      enabled: true,
      email: '',
      whatsapp: '',
      callNotifications: true,
      messageNotifications: true,
      orderNotifications: true,
    },
    onlinePayments: {
      enabled: true,
    },
    blacklist: [],
    whitelist: [],
    ...(settings?.callForwarding || {})
  });

  const [copiedNumber, setCopiedNumber] = useState(false);

  const handleCopyNumber = () => {
    if (phoneNumber) {
      navigator.clipboard.writeText(phoneNumber);
      setCopiedNumber(true);
      toast.success('Numéro copié dans le presse-papier');
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  const handleSave = () => {
    if (forwardingConfig.enabled && !forwardingConfig.forwardToNumber) {
      toast.error('Veuillez entrer un numéro de renvoi');
      return;
    }

    const updatedSettings = {
      ...settings,
      callForwarding: forwardingConfig
    };
    onConfigUpdate(updatedSettings);
    toast.success('Configuration de renvoi d\'appel mise à jour');
  };

  const handleTestCall = () => {
    toast.info('Test d\'appel en cours...');
    // TODO: Implémenter le test d'appel
  };

  if (!phoneNumber) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p>Aucun numéro virtuel n'est encore attribué à cette boutique.</p>
                <p className="text-sm text-muted-foreground">
                  Les numéros virtuels sont automatiquement achetés et configurés lors de la création d'une boutique après validation du paiement Stripe.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Vérifier à nouveau
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Si vous venez de créer cette boutique, patientez quelques minutes.
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Numéro virtuel */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Votre numéro virtuel</CardTitle>
              <CardDescription>
                Ce numéro est dédié à votre boutique pour recevoir les appels clients
              </CardDescription>
            </div>
            <Badge variant="default" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Actif
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{phoneNumber}</p>
                <p className="text-sm text-muted-foreground">Numéro local français</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyNumber}
              >
                {copiedNumber ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTestCall}
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Tester
              </Button>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-muted/50 rounded">
              <p className="text-2xl font-bold">142</p>
              <p className="text-xs text-muted-foreground">Appels ce mois</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded">
              <p className="text-2xl font-bold">89%</p>
              <p className="text-xs text-muted-foreground">Taux de réponse</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded">
              <p className="text-2xl font-bold">3:24</p>
              <p className="text-xs text-muted-foreground">Durée moyenne</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded">
              <p className="text-2xl font-bold">4.8</p>
              <p className="text-xs text-muted-foreground">Satisfaction</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration du renvoi */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration du renvoi d'appel</CardTitle>
          <CardDescription>
            Définissez comment et où rediriger les appels entrants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Renvoi d'appel activé</Label>
              <p className="text-sm text-muted-foreground">
                Rediriger les appels vers un autre numéro
              </p>
            </div>
            <Switch 
              checked={forwardingConfig.enabled}
              onCheckedChange={(checked) => setForwardingConfig({...forwardingConfig, enabled: checked})}
            />
          </div>

          {forwardingConfig.enabled && (
            <>
              <div>
                <Label>Numéro de renvoi</Label>
                <Input 
                  type="tel"
                  value={forwardingConfig.forwardToNumber}
                  onChange={(e) => setForwardingConfig({...forwardingConfig, forwardToNumber: e.target.value})}
                  placeholder="+33 6 12 34 56 78"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Les appels seront transférés vers ce numéro
                </p>
              </div>

              <div>
                <Label>Mode de renvoi</Label>
                <select 
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={forwardingConfig.forwardingMode}
                  onChange={(e) => setForwardingConfig({...forwardingConfig, forwardingMode: e.target.value})}
                >
                  <option value="always">Toujours (tous les appels)</option>
                  <option value="busy">Si occupé</option>
                  <option value="no-answer">Si pas de réponse</option>
                  <option value="offline">Si IA hors ligne</option>
                </select>
              </div>

              {forwardingConfig.forwardingMode === 'no-answer' && (
                <div>
                  <Label>Délai avant renvoi (secondes)</Label>
                  <Input 
                    type="number"
                    value={forwardingConfig.noAnswerTimeout}
                    onChange={(e) => setForwardingConfig({...forwardingConfig, noAnswerTimeout: parseInt(e.target.value)})}
                    className="mt-1"
                    min="5"
                    max="60"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Uniquement pendant les heures d'ouverture</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer le renvoi seulement durant vos horaires
                  </p>
                </div>
                <Switch 
                  checked={forwardingConfig.businessHoursOnly}
                  onCheckedChange={(checked) => setForwardingConfig({...forwardingConfig, businessHoursOnly: checked})}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Messagerie vocale */}
      <Card>
        <CardHeader>
          <CardTitle>Messagerie vocale</CardTitle>
          <CardDescription>
            Configuration de la messagerie pour les appels manqués
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Messagerie vocale activée</Label>
              <p className="text-sm text-muted-foreground">
                Permettre aux clients de laisser un message
              </p>
            </div>
            <Switch 
              checked={forwardingConfig.voicemail.enabled}
              onCheckedChange={(checked) => setForwardingConfig({
                ...forwardingConfig,
                voicemail: {...forwardingConfig.voicemail, enabled: checked}
              })}
            />
          </div>

          {forwardingConfig.voicemail.enabled && (
            <>
              <div>
                <Label>Message d'accueil</Label>
                <textarea 
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  rows={3}
                  value={forwardingConfig.voicemail.greeting}
                  onChange={(e) => setForwardingConfig({
                    ...forwardingConfig,
                    voicemail: {...forwardingConfig.voicemail, greeting: e.target.value}
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Transcription automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Convertir les messages vocaux en texte
                  </p>
                </div>
                <Switch 
                  checked={forwardingConfig.voicemail.transcriptionEnabled}
                  onCheckedChange={(checked) => setForwardingConfig({
                    ...forwardingConfig,
                    voicemail: {...forwardingConfig.voicemail, transcriptionEnabled: checked}
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notification par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir les messages par email
                  </p>
                </div>
                <Switch 
                  checked={forwardingConfig.voicemail.emailNotification}
                  onCheckedChange={(checked) => setForwardingConfig({
                    ...forwardingConfig,
                    voicemail: {...forwardingConfig.voicemail, emailNotification: checked}
                  })}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 Notifications
          </CardTitle>
          <CardDescription>
            Soyez prévenu des nouvelles demandes et appels entrants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Activer les notifications</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des alertes pour les nouveaux appels et messages
              </p>
            </div>
            <Switch 
              checked={forwardingConfig.notifications?.enabled || false}
              onCheckedChange={(checked) => setForwardingConfig({
                ...forwardingConfig,
                notifications: { ...forwardingConfig.notifications, enabled: checked }
              })}
            />
          </div>

          {(forwardingConfig.notifications?.enabled || false) && (
            <>
              <div>
                <Label>Email de notification</Label>
                <Input 
                  type="email"
                  value={forwardingConfig.notifications?.email || ''}
                  onChange={(e) => setForwardingConfig({
                    ...forwardingConfig,
                    notifications: { ...forwardingConfig.notifications, email: e.target.value }
                  })}
                  placeholder="contact@mondomaine.com"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recevez un email pour chaque nouvel appel ou message
                </p>
              </div>

              <div>
                <Label>N° WhatsApp de notification</Label>
                <Input 
                  type="tel"
                  value={forwardingConfig.notifications?.whatsapp || ''}
                  onChange={(e) => setForwardingConfig({
                    ...forwardingConfig,
                    notifications: { ...forwardingConfig.notifications, whatsapp: e.target.value }
                  })}
                  placeholder="+33612345678"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Notifications instantanées via WhatsApp
                </p>
              </div>

              <div className="space-y-3">
                <Label>Types de notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="notify-calls"
                      checked={forwardingConfig.notifications?.callNotifications !== false}
                      onChange={(e) => setForwardingConfig({
                        ...forwardingConfig,
                        notifications: { ...forwardingConfig.notifications, callNotifications: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <Label htmlFor="notify-calls" className="text-sm font-normal">
                      📞 Nouveaux appels entrants
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="notify-messages"
                      checked={forwardingConfig.notifications?.messageNotifications !== false}
                      onChange={(e) => setForwardingConfig({
                        ...forwardingConfig,
                        notifications: { ...forwardingConfig.notifications, messageNotifications: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <Label htmlFor="notify-messages" className="text-sm font-normal">
                      💬 Messages vocaux laissés
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="notify-orders"
                      checked={forwardingConfig.notifications?.orderNotifications !== false}
                      onChange={(e) => setForwardingConfig({
                        ...forwardingConfig,
                        notifications: { ...forwardingConfig.notifications, orderNotifications: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <Label htmlFor="notify-orders" className="text-sm font-normal">
                      🛒 Nouvelles commandes/réservations
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section Paiements en ligne */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💳 Paiements en ligne
          </CardTitle>
          <CardDescription>
            Permet à vos clients de payer leurs commandes/réservations en ligne. L'argent est directement versé sur votre compte Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Paiements en ligne activés</Label>
              <p className="text-sm text-muted-foreground">
                Les clients peuvent payer directement par téléphone
              </p>
            </div>
            <Switch 
              checked={forwardingConfig.onlinePayments?.enabled || false}
              onCheckedChange={(checked) => setForwardingConfig({
                ...forwardingConfig,
                onlinePayments: { ...forwardingConfig.onlinePayments, enabled: checked }
              })}
            />
          </div>

          {(forwardingConfig.onlinePayments?.enabled || false) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  Stripe connecté
                </p>
              </div>
              <p className="text-xs text-green-700">
                ✅ Les paiements sont automatiquement versés sur votre compte Stripe<br/>
                ✅ Commission Stripe: 1.4% + 0.25€ par transaction<br/>
                ✅ Paiements sécurisés et conformes PCI-DSS
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Enregistrer la configuration
        </Button>
      </div>
    </div>
  );
}