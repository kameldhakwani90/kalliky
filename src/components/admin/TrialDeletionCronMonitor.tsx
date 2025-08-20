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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  TrashIcon,
  Clock,
  AlertTriangle,
  Play,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3
} from 'lucide-react';

interface CronStatistics {
  totalBlockedTrials: number;
  pendingWarningEmails: number;
  pendingDeletions: number;
}

interface RecentDeletion {
  date: string;
  businessName: string;
  businessId: string;
  ownerEmail: string;
}

interface CronData {
  statistics: CronStatistics;
  recentDeletions: RecentDeletion[];
  cronStatus: string;
  lastUpdate: string;
}

export default function TrialDeletionCronMonitor() {
  const [cronData, setCronData] = useState<CronData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [lastExecution, setLastExecution] = useState<any>(null);

  const fetchCronData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cron/trial-deletion');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      setCronData(data);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      console.error('Error fetching cron data:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeManualCron = async (action: 'process_deletions' | 'cleanup_data' | 'dry_run') => {
    try {
      setExecuting(true);
      
      const response = await fetch('/api/cron/trial-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error('Erreur exécution cron');
      }

      const result = await response.json();
      setLastExecution(result);
      
      // Rafraîchir les données après exécution
      await fetchCronData();
      
      alert(`${action} exécuté avec succès!`);
    } catch (error) {
      console.error('Error executing manual cron:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    fetchCronData();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchCronData, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement données cron...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <TrashIcon className="h-6 w-6 mr-2" />
          Monitoring Suppression Automatique
        </h2>
        <Button onClick={fetchCronData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* KPIs Cron */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comptes Bloqués</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cronData?.statistics.totalBlockedTrials || 0}
            </div>
            <p className="text-xs text-muted-foreground">Trials bloqués actuellement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails d&apos;Avertissement</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {cronData?.statistics.pendingWarningEmails || 0}
            </div>
            <p className="text-xs text-muted-foreground">En attente d&apos;envoi (3j)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppressions Programmées</CardTitle>
            <TrashIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cronData?.statistics.pendingDeletions || 0}
            </div>
            <p className="text-xs text-muted-foreground">Prêts pour suppression (5j)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Cron</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <Badge className="bg-green-100 text-green-800">
                {cronData?.cronStatus || 'Inactif'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Dernière MAJ: {cronData?.lastUpdate ? formatDate(cronData.lastUpdate) : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent-deletions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent-deletions">Suppressions Récentes</TabsTrigger>
          <TabsTrigger value="manual-actions">Actions Manuelles</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="recent-deletions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Suppressions des 7 Derniers Jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cronData?.recentDeletions && cronData.recentDeletions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Email Propriétaire</TableHead>
                      <TableHead>ID Business</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cronData.recentDeletions.map((deletion, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(deletion.date)}</TableCell>
                        <TableCell className="font-medium">{deletion.businessName}</TableCell>
                        <TableCell className="text-muted-foreground">{deletion.ownerEmail}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {deletion.businessId.substring(0, 8)}...
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune suppression automatique dans les 7 derniers jours
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual-actions">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="h-5 w-5 mr-2" />
                  Exécutions Manuelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button
                    onClick={() => executeManualCron('process_deletions')}
                    disabled={executing}
                    className="w-full"
                    variant="destructive"
                  >
                    {executing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TrashIcon className="h-4 w-4 mr-2" />
                    )}
                    Exécuter Suppressions
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Lance le processus complet de suppression des comptes éligibles
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => executeManualCron('cleanup_data')}
                    disabled={executing}
                    className="w-full"
                    variant="secondary"
                  >
                    {executing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Settings className="h-4 w-4 mr-2" />
                    )}
                    Nettoyage Données
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supprime les anciens logs et données temporaires
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => executeManualCron('dry_run')}
                    disabled={executing}
                    className="w-full"
                    variant="outline"
                  >
                    {executing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Simulation (Dry Run)
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Simule l&apos;exécution sans suppression réelle
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Dernière Exécution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lastExecution ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Action:</span>
                      <Badge>{lastExecution.action}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Résultat:</span>
                      <Badge className={lastExecution.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {lastExecution.success ? 'Succès' : 'Échec'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Date:</span>
                      <span className="text-sm">{formatDate(lastExecution.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Par:</span>
                      <span className="text-sm">{lastExecution.executedBy}</span>
                    </div>
                    {lastExecution.result && (
                      <pre className="text-xs bg-muted p-2 rounded">
                        {JSON.stringify(lastExecution.result, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Aucune exécution manuelle récente
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configuration du Cron Job
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Configuration Actuelle:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>• Email d&apos;avertissement: <strong>3 jours</strong> après blocage</li>
                      <li>• Suppression automatique: <strong>5 jours</strong> après blocage</li>
                      <li>• Exécution: <strong>Quotidienne</strong> à 2h00 UTC</li>
                      <li>• Webhook: <code>/api/webhooks/cron/trial-deletion</code></li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Instructions Configuration Externe</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Pour configurer un service de cron externe (recommandé pour la production):
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>URL:</strong> <code>POST https://your-domain.com/api/webhooks/cron/trial-deletion</code>
                    </div>
                    <div>
                      <strong>Headers:</strong> <code>Authorization: Bearer [CRON_SECRET]</code>
                    </div>
                    <div>
                      <strong>Fréquence:</strong> Quotidien à 2h00 UTC
                    </div>
                    <div>
                      <strong>Variable d&apos;environnement:</strong> <code>CRON_SECRET=your-secret-token</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}