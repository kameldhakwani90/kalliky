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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Trash2,
  Database,
  Phone,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Play,
  Eye,
  Settings,
  BarChart3
} from 'lucide-react';

interface CleanupStats {
  orphanedTelnyxNumbers: number;
  inactiveStripeSubscriptions: number;
  oldActivityLogs: number;
  unusedPhoneNumbers: number;
  expiredTrials: number;
  duplicateRecords: number;
}

interface CleanupData {
  statistics: CleanupStats;
  recommendations: {
    criticalActions: boolean;
    suggestedActions: string[];
  };
  recentOperations: Array<{
    date: string;
    type: string;
    description: string;
    metadata: any;
  }>;
  lastUpdate: string;
}

interface CleanupResult {
  operation: string;
  success: boolean;
  itemsCleaned: number;
  details: string[];
  errors: string[];
}

const CLEANUP_OPERATIONS = [
  {
    id: 'telnyx_orphaned_numbers',
    label: 'Numéros Telnyx Orphelins',
    description: 'Libérer les numéros Telnyx sans business associé',
    icon: Phone,
    critical: true,
    category: 'telnyx'
  },
  {
    id: 'unused_phone_numbers',
    label: 'Numéros Non Utilisés',
    description: 'Supprimer les numéros sans appels depuis 1 mois',
    icon: Phone,
    critical: false,
    category: 'telnyx'
  },
  {
    id: 'stripe_inactive_subscriptions',
    label: 'Subscriptions Stripe Inactives',
    description: 'Nettoyer les subscriptions annulées/expirées',
    icon: CreditCard,
    critical: false,
    category: 'stripe'
  },
  {
    id: 'expired_trials',
    label: 'Trials Expirés',
    description: 'Supprimer les trials expirés depuis 1 mois',
    icon: Database,
    critical: false,
    category: 'database'
  },
  {
    id: 'old_activity_logs',
    label: 'Anciens Logs',
    description: 'Supprimer les logs de plus de 3 mois',
    icon: Database,
    critical: false,
    category: 'database'
  },
  {
    id: 'duplicate_consumption',
    label: 'Données Consommation Dupliquées',
    description: 'Dédupliquer les résumés de consommation',
    icon: BarChart3,
    critical: false,
    category: 'database'
  }
];

export default function SystemCleanupManager() {
  const [cleanupData, setCleanupData] = useState<CleanupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
  const [executing, setExecuting] = useState(false);
  const [lastResults, setLastResults] = useState<CleanupResult[] | null>(null);

  const fetchCleanupData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cleanup');
      
      if (!response.ok) {
        throw new Error('Erreur chargement données cleanup');
      }
      
      const data = await response.json();
      setCleanupData(data);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      console.error('Error fetching cleanup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeCleanup = async (dryRun: boolean = false) => {
    if (selectedOperations.length === 0) {
      alert('Veuillez sélectionner au moins une opération de nettoyage');
      return;
    }

    try {
      setExecuting(true);
      
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operations: selectedOperations,
          dryRun
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur exécution cleanup');
      }

      const result = await response.json();
      setLastResults(result.results);
      
      // Rafraîchir les données après l'opération
      await fetchCleanupData();
      
      const message = dryRun 
        ? `Simulation terminée: ${result.totalItemsCleaned} éléments seraient nettoyés`
        : `Nettoyage terminé: ${result.totalItemsCleaned} éléments nettoyés`;
        
      alert(message);
    } catch (error) {
      console.error('Error executing cleanup:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setExecuting(false);
    }
  };

  const toggleOperation = (operationId: string) => {
    setSelectedOperations(prev => 
      prev.includes(operationId)
        ? prev.filter(id => id !== operationId)
        : [...prev, operationId]
    );
  };

  const selectAllCritical = () => {
    const criticalOps = CLEANUP_OPERATIONS
      .filter(op => op.critical)
      .map(op => op.id);
    setSelectedOperations(criticalOps);
  };

  const selectAllByCategory = (category: string) => {
    const categoryOps = CLEANUP_OPERATIONS
      .filter(op => op.category === category)
      .map(op => op.id);
    setSelectedOperations(prev => [...new Set([...prev, ...categoryOps])]);
  };

  useEffect(() => {
    fetchCleanupData();
    // Actualiser toutes les 2 minutes
    const interval = setInterval(fetchCleanupData, 2 * 60 * 1000);
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
            <span>Chargement données nettoyage...</span>
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

  const stats = cleanupData?.statistics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          Nettoyage Système
        </h2>
        <Button onClick={fetchCleanupData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Alertes critiques */}
      {cleanupData?.recommendations.criticalActions && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Actions critiques recommandées:</strong>
            <ul className="mt-2 list-disc list-inside">
              {cleanupData.recommendations.suggestedActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Telnyx Orphelins</CardTitle>
            <Phone className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">
              {stats?.orphanedTelnyxNumbers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Numéros Inutilisés</CardTitle>
            <Phone className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-orange-600">
              {stats?.unusedPhoneNumbers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Stripe Inactif</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              {stats?.inactiveStripeSubscriptions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Trials Expirés</CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">
              {stats?.expiredTrials || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Anciens Logs</CardTitle>
            <Database className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-600">
              {stats?.oldActivityLogs || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Doublons</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-indigo-600">
              {stats?.duplicateRecords || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operations">Opérations de Nettoyage</TabsTrigger>
          <TabsTrigger value="results">Résultats</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          <div className="space-y-4">
            {/* Sélection rapide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sélection Rapide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={selectAllCritical} size="sm" variant="destructive">
                    Actions Critiques
                  </Button>
                  <Button onClick={() => selectAllByCategory('telnyx')} size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-1" />
                    Telnyx
                  </Button>
                  <Button onClick={() => selectAllByCategory('stripe')} size="sm" variant="outline">
                    <CreditCard className="h-4 w-4 mr-1" />
                    Stripe
                  </Button>
                  <Button onClick={() => selectAllByCategory('database')} size="sm" variant="outline">
                    <Database className="h-4 w-4 mr-1" />
                    Base de Données
                  </Button>
                  <Button onClick={() => setSelectedOperations([])} size="sm" variant="ghost">
                    Désélectionner Tout
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liste des opérations */}
            <div className="grid gap-4 md:grid-cols-2">
              {CLEANUP_OPERATIONS.map((operation) => {
                const Icon = operation.icon;
                const isSelected = selectedOperations.includes(operation.id);
                const stat = stats?.[operation.id as keyof CleanupStats] || 0;
                
                return (
                  <Card key={operation.id} className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  } ${operation.critical && stat > 0 ? 'border-red-200' : ''}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3" onClick={() => toggleOperation(operation.id)}>
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => toggleOperation(operation.id)}
                        />
                        <Icon className={`h-5 w-5 mt-0.5 ${
                          operation.critical && stat > 0 ? 'text-red-600' : 'text-muted-foreground'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{operation.label}</h4>
                            <Badge variant={stat > 0 ? (operation.critical ? 'destructive' : 'secondary') : 'outline'}>
                              {stat}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {operation.description}
                          </p>
                          {operation.critical && stat > 0 && (
                            <div className="flex items-center mt-2">
                              <AlertTriangle className="h-3 w-3 text-red-600 mr-1" />
                              <span className="text-xs text-red-600 font-medium">Action critique</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedOperations.length} opération(s) sélectionnée(s)
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Button
                      onClick={() => executeCleanup(true)}
                      disabled={executing || selectedOperations.length === 0}
                      variant="outline"
                    >
                      {executing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      Simulation
                    </Button>
                    <Button
                      onClick={() => executeCleanup(false)}
                      disabled={executing || selectedOperations.length === 0}
                      variant="destructive"
                    >
                      {executing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Exécuter Nettoyage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Résultats de la Dernière Exécution</CardTitle>
            </CardHeader>
            <CardContent>
              {lastResults ? (
                <div className="space-y-4">
                  {lastResults.map((result, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                          )}
                          {CLEANUP_OPERATIONS.find(op => op.id === result.operation)?.label || result.operation}
                        </h4>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.itemsCleaned} éléments
                        </Badge>
                      </div>
                      
                      {result.details.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Détails:</p>
                          <ul className="text-xs space-y-1">
                            {result.details.slice(0, 5).map((detail, i) => (
                              <li key={i} className="text-muted-foreground">• {detail}</li>
                            ))}
                            {result.details.length > 5 && (
                              <li className="text-muted-foreground">... et {result.details.length - 5} autres</li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      {result.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-red-600 mb-1">Erreurs:</p>
                          <ul className="text-xs space-y-1">
                            {result.errors.map((error, i) => (
                              <li key={i} className="text-red-600">• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune exécution récente
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Opérations</CardTitle>
            </CardHeader>
            <CardContent>
              {cleanupData?.recentOperations && cleanupData.recentOperations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cleanupData.recentOperations.map((operation, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(operation.date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{operation.type}</Badge>
                        </TableCell>
                        <TableCell>{operation.description}</TableCell>
                        <TableCell>
                          {operation.metadata?.totalItemsCleaned && (
                            <span className="text-sm text-muted-foreground">
                              {operation.metadata.totalItemsCleaned} éléments nettoyés
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun historique de nettoyage disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}