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
import {
  AlertTriangle,
  Clock,
  Users,
  Phone,
  Ban,
  Trash2,
  RefreshCw,
  Mail,
  Play,
  ChevronRight
} from 'lucide-react';

interface TrialStats {
  counts: {
    active: number;
    warned: number;
    blocked: number;
    pendingDeletion: number;
    deleted: number;
  };
  recent: Array<{
    id: string;
    identifier: string;
    callsUsed: number;
    callsRemaining: number;
    daysRemaining: number;
    status: string;
    createdAt: string;
    business?: {
      name: string;
      owner?: {
        email: string;
      };
    };
  }>;
}

interface AutomatedEmailStatus {
  status: string;
  lastProcessing: string;
  schedule: {
    nextRun: string;
    priority: 'low' | 'medium' | 'high';
    reason: string;
  };
  report: {
    summary: {
      processed: number;
      warningsSent: number;
      blockingsSent: number;
      deletionWarningsSent: number;
      numbersBlocked: number;
      errors: string[];
    };
    nextActions: Array<{
      action: string;
      count: number;
      deadline: string;
    }>;
  };
}

export default function TrialMonitoringDashboard() {
  const [trialStats, setTrialStats] = useState<TrialStats | null>(null);
  const [emailStatus, setEmailStatus] = useState<AutomatedEmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrialStats = async () => {
    try {
      const response = await fetch('/api/admin/trial-stats');
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      const data = await response.json();
      setTrialStats(data);
    } catch (error) {
      console.error('Erreur récupération stats trial:', error);
      setError('Impossible de charger les statistiques trial');
    }
  };

  const fetchEmailStatus = async () => {
    try {
      const response = await fetch('/api/admin/automated-emails');
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      const data = await response.json();
      setEmailStatus(data);
    } catch (error) {
      console.error('Erreur récupération statut emails:', error);
      // Ne pas bloquer l'interface si les emails ne sont pas configurés
    }
  };

  const triggerAutomatedEmails = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/admin/automated-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      console.log('Traitement emails terminé:', result);
      
      // Recharger les données
      await Promise.all([fetchTrialStats(), fetchEmailStatus()]);
    } catch (error) {
      console.error('Erreur déclenchement emails:', error);
      setError('Erreur lors du traitement des emails automatiques');
    } finally {
      setProcessing(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchTrialStats(), fetchEmailStatus()]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'warned':
        return <Badge className="bg-yellow-100 text-yellow-800">Alerté</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800">Bloqué</Badge>;
      case 'pending_deletion':
        return <Badge className="bg-purple-100 text-purple-800">Suppression</Badge>;
      case 'deleted':
        return <Badge className="bg-gray-100 text-gray-800">Supprimé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Chargement surveillance trial...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Trial */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trials Actifs</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialStats?.counts.active || 0}</div>
            <p className="text-xs text-muted-foreground">En cours d'utilisation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertés</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialStats?.counts.warned || 0}</div>
            <p className="text-xs text-muted-foreground">Proche des limites</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqués</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialStats?.counts.blocked || 0}</div>
            <p className="text-xs text-muted-foreground">Service suspendu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppression</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialStats?.counts.pendingDeletion || 0}</div>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supprimés</CardTitle>
            <Trash2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialStats?.counts.deleted || 0}</div>
            <p className="text-xs text-muted-foreground">Comptes fermés</p>
          </CardContent>
        </Card>
      </div>

      {/* Emails Automatiques */}
      {emailStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Service Emails Automatiques
              </CardTitle>
              <Button 
                onClick={triggerAutomatedEmails} 
                disabled={processing}
                size="sm"
              >
                {processing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Traiter Maintenant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium mb-1">Prochaine exécution</p>
                <p className="text-sm text-muted-foreground">
                  {emailStatus.schedule?.nextRun 
                    ? new Date(emailStatus.schedule.nextRun).toLocaleString('fr-FR')
                    : 'Non planifiée'
                  }
                </p>
                <p className={`text-sm font-medium ${emailStatus.schedule?.priority ? getPriorityColor(emailStatus.schedule.priority) : ''}`}>
                  Priorité: {emailStatus.schedule?.priority || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Dernier traitement</p>
                <p className="text-sm text-muted-foreground">
                  Traités: {emailStatus.report?.summary?.processed || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Erreurs: {emailStatus.report?.summary?.errors?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Actions planifiées</p>
                {emailStatus.report?.nextActions?.map((action, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {action.action}: {action.count}
                  </p>
                )) || <p className="text-sm text-muted-foreground">Aucune action planifiée</p>}
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Raison: {emailStatus.schedule?.reason || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des Trials Récents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trials Récents</CardTitle>
            <Button onClick={loadData} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Appels</TableHead>
                <TableHead>Jours</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialStats?.recent.map((trial) => (
                <TableRow key={trial.id}>
                  <TableCell className="font-medium">
                    {trial.business?.name || 'Non défini'}
                  </TableCell>
                  <TableCell>
                    {trial.business?.owner?.email || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                      {trial.callsUsed}/{trial.callsUsed + trial.callsRemaining}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      {trial.daysRemaining}j
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(trial.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(trial.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}