'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Mail,
  Send,
  Settings,
  Eye,
  Edit,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Server,
  Key,
  User,
  Globe
} from 'lucide-react';

interface EmailSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  email_from: string;
  email_logo_url: string;
  company_name: string;
  email_footer_text: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: 'welcome' | 'trial_warning' | 'trial_blocked' | 'trial_deletion' | 'account_deleted';
  subject: string;
  description: string;
  enabled: boolean;
  lastSent?: string;
  sentCount: number;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Email de Bienvenue',
    type: 'welcome',
    subject: 'Bienvenue chez Kalliky !',
    description: 'Envoyé lors de la création d\'un nouveau compte',
    enabled: true,
    sentCount: 45
  },
  {
    id: 'trial_warning',
    name: 'Avertissement Trial',
    type: 'trial_warning',
    subject: '⚠️ Période d\'essai bientôt terminée',
    description: 'Envoyé quand 8 appels utilisés ou 3 jours restants',
    enabled: true,
    lastSent: '2025-01-15T10:30:00Z',
    sentCount: 23
  },
  {
    id: 'trial_blocked',
    name: 'Service Bloqué',
    type: 'trial_blocked',
    subject: '🔒 Service suspendu',
    description: 'Envoyé quand les limites de trial sont dépassées',
    enabled: true,
    lastSent: '2025-01-15T14:20:00Z',
    sentCount: 12
  },
  {
    id: 'trial_deletion',
    name: 'Avertissement Suppression',
    type: 'trial_deletion',
    subject: '🚨 Compte supprimé dans X jours',
    description: 'Envoyé 3 jours avant suppression définitive',
    enabled: true,
    lastSent: '2025-01-14T09:15:00Z',
    sentCount: 5
  },
  {
    id: 'account_deleted',
    name: 'Confirmation Suppression',
    type: 'account_deleted',
    subject: 'Compte supprimé',
    description: 'Confirmation de suppression définitive du compte',
    enabled: true,
    lastSent: '2025-01-13T16:45:00Z',
    sentCount: 2
  }
];

export default function EmailConfigurationManager() {
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [templates] = useState<EmailTemplate[]>(EMAIL_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editedSettings, setEditedSettings] = useState<EmailSettings | null>(null);

  const fetchEmailSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      const data = await response.json();
      
      // Extraire les settings email
      const settings: EmailSettings = {
        smtp_host: data.smtp_host || 'smtp.gmail.com',
        smtp_port: data.smtp_port || '587',
        smtp_user: data.smtp_user || '',
        smtp_pass: data.smtp_pass || '',
        email_from: data.email_from || 'no-reply@pixigrad.com',
        email_logo_url: data.email_logo_url || '',
        company_name: data.company_name || 'Kalliky',
        email_footer_text: data.email_footer_text || 'Kalliky - Solution IA pour restaurants'
      };

      setEmailSettings(settings);
      setEditedSettings({ ...settings });
    } catch (error) {
      console.error('Erreur récupération settings email:', error);
      setError('Impossible de charger la configuration email');
    } finally {
      setLoading(false);
    }
  };

  const saveEmailSettings = async () => {
    if (!editedSettings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedSettings)
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      setEmailSettings({ ...editedSettings });
      setSuccess('Configuration email sauvegardée avec succès');
      
      // Recharger les données depuis l'API pour s'assurer qu'elles sont à jour
      await fetchEmailSettings();
    } catch (error) {
      console.error('Erreur sauvegarde settings email:', error);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const testEmailConnection = async () => {
    if (!editedSettings) return;

    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          smtp_host: editedSettings.smtp_host,
          smtp_port: editedSettings.smtp_port,
          smtp_user: editedSettings.smtp_user,
          smtp_pass: editedSettings.smtp_pass,
          email_from: editedSettings.email_from,
          test_email: editedSettings.smtp_user
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setSuccess('Test de connexion réussi ! Email de test envoyé.');
      } else {
        setError(`Test échoué: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur test email:', error);
      setError('Erreur lors du test de connexion');
    } finally {
      setTesting(false);
    }
  };

  const previewTemplate = (templateType: string) => {
    // Méthode simple : ouvrir directement l'URL dans une nouvelle fenêtre
    const previewUrl = `/api/admin/email/preview/${templateType}`;
    const newWindow = window.open(previewUrl, '_blank', 'width=800,height=600,scrollbars=yes');
    
    if (!newWindow) {
      setError('Impossible d\'ouvrir la fenêtre de prévisualisation. Veuillez autoriser les pop-ups.');
    }
  };

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const getStatusBadge = (enabled: boolean, sentCount: number) => {
    if (!enabled) {
      return <Badge variant="secondary">Désactivé</Badge>;
    }
    if (sentCount > 0) {
      return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Configuré</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Chargement configuration email...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Mail className="h-6 w-6 mr-2" />
            Configuration Email
          </h2>
          <p className="text-muted-foreground">
            Gestion des paramètres SMTP et des templates d'emails automatiques
          </p>
        </div>
        <Button onClick={fetchEmailSettings} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Messages de feedback */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              {success}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="smtp">
            <Server className="h-4 w-4 mr-2" />
            Configuration SMTP
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Mail className="h-4 w-4 mr-2" />
            Templates Email
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Globe className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Paramètres SMTP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedSettings && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="smtp_host">Serveur SMTP</Label>
                      <Input
                        id="smtp_host"
                        value={editedSettings.smtp_host}
                        onChange={(e) => setEditedSettings({
                          ...editedSettings,
                          smtp_host: e.target.value
                        })}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_port">Port</Label>
                      <Input
                        id="smtp_port"
                        value={editedSettings.smtp_port}
                        onChange={(e) => setEditedSettings({
                          ...editedSettings,
                          smtp_port: e.target.value
                        })}
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="smtp_user">Nom d'utilisateur</Label>
                      <Input
                        id="smtp_user"
                        value={editedSettings.smtp_user}
                        onChange={(e) => setEditedSettings({
                          ...editedSettings,
                          smtp_user: e.target.value
                        })}
                        placeholder="votre@email.com"
                        type="email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_pass">Mot de passe</Label>
                      <Input
                        id="smtp_pass"
                        value={editedSettings.smtp_pass}
                        onChange={(e) => setEditedSettings({
                          ...editedSettings,
                          smtp_pass: e.target.value
                        })}
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email_from">Adresse d'expéditeur</Label>
                    <Input
                      id="email_from"
                      value={editedSettings.email_from}
                      onChange={(e) => setEditedSettings({
                        ...editedSettings,
                        email_from: e.target.value
                      })}
                      placeholder="no-reply@pixigrad.com"
                      type="email"
                    />
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={saveEmailSettings}
                      disabled={saving}
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Sauvegarder
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={testEmailConnection}
                      disabled={testing || !editedSettings.smtp_user}
                    >
                      {testing ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Tester la Connexion
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates d'Emails Automatiques</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Envois</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.type}</div>
                      </TableCell>
                      <TableCell>{template.subject}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-muted-foreground truncate">
                          {template.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(template.enabled, template.sentCount)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.sentCount}</div>
                          {template.lastSent && (
                            <div className="text-xs text-muted-foreground">
                              Dernier: {new Date(template.lastSent).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => previewTemplate(template.type)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Branding des Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedSettings && (
                <>
                  <div>
                    <Label htmlFor="company_name">Nom de l'entreprise</Label>
                    <Input
                      id="company_name"
                      value={editedSettings.company_name}
                      onChange={(e) => setEditedSettings({
                        ...editedSettings,
                        company_name: e.target.value
                      })}
                      placeholder="Kalliky"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email_logo_url">URL du logo</Label>
                    <Input
                      id="email_logo_url"
                      value={editedSettings.email_logo_url}
                      onChange={(e) => setEditedSettings({
                        ...editedSettings,
                        email_logo_url: e.target.value
                      })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email_footer_text">Texte du footer</Label>
                    <Textarea
                      id="email_footer_text"
                      value={editedSettings.email_footer_text}
                      onChange={(e) => setEditedSettings({
                        ...editedSettings,
                        email_footer_text: e.target.value
                      })}
                      placeholder="Kalliky - Solution IA pour restaurants"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={saveEmailSettings}
                      disabled={saving}
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Sauvegarder
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}