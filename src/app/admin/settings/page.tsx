'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Mail, Building, Eye, CreditCard, Phone } from 'lucide-react';

interface SettingsData {
  // Général
  company_name: string;
  email_logo_url: string;
  
  // Email
  email_footer_text: string;
  email_from: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  
  // Stripe
  stripe_publishable_key: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  
  // Telnyx
  telnyx_api_key: string;
  telnyx_phone_number_pool_id: string;
  telnyx_webhook_url: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    // Général
    company_name: '',
    email_logo_url: '',
    
    // Email
    email_footer_text: '',
    email_from: '',
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: '',
    
    // Stripe
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    
    // Telnyx
    telnyx_api_key: '',
    telnyx_phone_number_pool_id: '',
    telnyx_webhook_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Erreur chargement settings');
      
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Erreur chargement settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Erreur sauvegarde');

      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres ont été mis à jour avec succès"
      });
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const previewEmail = async () => {
    try {
      setPreviewing(true);
      const response = await fetch('/api/admin/settings/preview-email');
      if (!response.ok) throw new Error('Erreur preview');
      
      const html = await response.text();
      
      // Ouvrir dans une nouvelle fenêtre
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Erreur preview:', error);
      toast({
        title: "Erreur",
        description: "Impossible de prévisualiser l'email",
        variant: "destructive"
      });
    } finally {
      setPreviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement des paramètres...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Configurez les paramètres globaux de votre application
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={previewEmail} disabled={previewing}>
            <Eye className="mr-2 h-4 w-4" />
            {previewing ? 'Prévisualisation...' : 'Prévisualiser email'}
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Settings className="mr-2 h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="telephony" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Téléphonie
          </TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'entreprise</CardTitle>
              <CardDescription>
                Paramètres généraux de votre société
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company_name">Nom de la société</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                  placeholder="Kalliky"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Ce nom sera affiché dans les emails et l'interface
                </p>
              </div>

              <div>
                <Label htmlFor="email_logo_url">URL du logo</Label>
                <Input
                  id="email_logo_url"
                  value={settings.email_logo_url}
                  onChange={(e) => setSettings({...settings, email_logo_url: e.target.value})}
                  placeholder="https://votre-site.com/logo.png"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Logo affiché en haut des emails (optionnel). Format recommandé : 120x40px
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Email */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des emails</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de vos emails transactionnels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email_from">Email d'expédition</Label>
                <Input
                  id="email_from"
                  type="email"
                  value={settings.email_from}
                  onChange={(e) => setSettings({...settings, email_from: e.target.value})}
                  placeholder="votre-email@gmail.com"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Adresse email utilisée pour envoyer les emails (pour les tests)
                </p>
              </div>

              <div>
                <Label htmlFor="email_footer_text">Texte du footer</Label>
                <Textarea
                  id="email_footer_text"
                  value={settings.email_footer_text}
                  onChange={(e) => setSettings({...settings, email_footer_text: e.target.value})}
                  placeholder="Kalliky - Solution IA pour restaurants"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Texte affiché en bas de tous les emails
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration SMTP</CardTitle>
              <CardDescription>
                Paramètres pour l'envoi d'emails via différents fournisseurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="smtp_provider">Fournisseur SMTP</Label>
                <select
                  id="smtp_provider"
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                  onChange={(e) => {
                    const provider = e.target.value;
                    if (provider === 'gmail') {
                      setSettings({...settings, smtp_host: 'smtp.gmail.com', smtp_port: '587'});
                    } else if (provider === 'ovh') {
                      setSettings({...settings, smtp_host: 'ssl0.ovh.net', smtp_port: '465'});
                    } else if (provider === 'outlook') {
                      setSettings({...settings, smtp_host: 'smtp.office365.com', smtp_port: '587'});
                    } else if (provider === 'yahoo') {
                      setSettings({...settings, smtp_host: 'smtp.mail.yahoo.com', smtp_port: '587'});
                    }
                  }}
                >
                  <option value="">Choisir un fournisseur</option>
                  <option value="gmail">Gmail</option>
                  <option value="ovh">OVH Mail</option>
                  <option value="outlook">Outlook/Office 365</option>
                  <option value="yahoo">Yahoo Mail</option>
                  <option value="custom">Configuration personnalisée</option>
                </select>
                <p className="text-sm text-muted-foreground mt-1">
                  Sélectionnez votre fournisseur pour configurer automatiquement les paramètres
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_host">Serveur SMTP</Label>
                  <Input
                    id="smtp_host"
                    value={settings.smtp_host}
                    onChange={(e) => setSettings({...settings, smtp_host: e.target.value})}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">Port</Label>
                  <Input
                    id="smtp_port"
                    value={settings.smtp_port}
                    onChange={(e) => setSettings({...settings, smtp_port: e.target.value})}
                    placeholder="587"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="smtp_user">Nom d'utilisateur SMTP</Label>
                <Input
                  id="smtp_user"
                  type="email"
                  value={settings.smtp_user}
                  onChange={(e) => setSettings({...settings, smtp_user: e.target.value})}
                  placeholder="votre-email@domaine.com"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Votre adresse email (généralement la même que l'email d'expédition)
                </p>
              </div>

              <div>
                <Label htmlFor="smtp_pass">Mot de passe SMTP</Label>
                <Input
                  id="smtp_pass"
                  type="password"
                  value={settings.smtp_pass}
                  onChange={(e) => setSettings({...settings, smtp_pass: e.target.value})}
                  placeholder="Mot de passe ou mot de passe d'application"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  ⚠️ Pour Gmail: utilisez un mot de passe d'application, pas votre mot de passe principal.
                  <br />
                  Pour OVH/autres: utilisez votre mot de passe email habituel.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prévisualisation</CardTitle>
              <CardDescription>
                Testez l'apparence de vos emails avec les paramètres actuels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={previewEmail} disabled={previewing}>
                <Eye className="mr-2 h-4 w-4" />
                {previewing ? 'Génération...' : 'Prévisualiser l\'email de bienvenue'}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Ouvre un aperçu de l'email de bienvenue dans une nouvelle fenêtre
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Paiements */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Stripe</CardTitle>
              <CardDescription>
                Paramètres pour les paiements et abonnements Stripe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stripe_publishable_key">Clé publique Stripe</Label>
                <Input
                  id="stripe_publishable_key"
                  value={settings.stripe_publishable_key}
                  onChange={(e) => setSettings({...settings, stripe_publishable_key: e.target.value})}
                  placeholder="pk_test_..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Clé publique pour le frontend (commence par pk_)
                </p>
              </div>

              <div>
                <Label htmlFor="stripe_secret_key">Clé secrète Stripe</Label>
                <Input
                  id="stripe_secret_key"
                  type="password"
                  value={settings.stripe_secret_key}
                  onChange={(e) => setSettings({...settings, stripe_secret_key: e.target.value})}
                  placeholder="sk_test_..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Clé secrète pour les API (commence par sk_)
                </p>
              </div>

              <div>
                <Label htmlFor="stripe_webhook_secret">Secret webhook Stripe</Label>
                <Input
                  id="stripe_webhook_secret"
                  type="password"
                  value={settings.stripe_webhook_secret}
                  onChange={(e) => setSettings({...settings, stripe_webhook_secret: e.target.value})}
                  placeholder="whsec_..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Secret pour vérifier les webhooks Stripe (commence par whsec_)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Téléphonie */}
        <TabsContent value="telephony" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Telnyx</CardTitle>
              <CardDescription>
                Paramètres pour la téléphonie et l'IA vocale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="telnyx_api_key">Clé API Telnyx</Label>
                <Input
                  id="telnyx_api_key"
                  type="password"
                  value={settings.telnyx_api_key}
                  onChange={(e) => setSettings({...settings, telnyx_api_key: e.target.value})}
                  placeholder="KEY..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Clé API pour les services Telnyx
                </p>
              </div>

              <div>
                <Label htmlFor="telnyx_phone_number_pool_id">ID du pool de numéros</Label>
                <Input
                  id="telnyx_phone_number_pool_id"
                  value={settings.telnyx_phone_number_pool_id}
                  onChange={(e) => setSettings({...settings, telnyx_phone_number_pool_id: e.target.value})}
                  placeholder="12345678-1234-1234-1234-123456789012"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  ID du pool de numéros de téléphone Telnyx
                </p>
              </div>

              <div>
                <Label htmlFor="telnyx_webhook_url">URL webhook Telnyx</Label>
                <Input
                  id="telnyx_webhook_url"
                  value={settings.telnyx_webhook_url}
                  onChange={(e) => setSettings({...settings, telnyx_webhook_url: e.target.value})}
                  placeholder="https://votre-app.com/api/webhooks/telnyx"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  URL pour recevoir les webhooks Telnyx (appels, messages)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}