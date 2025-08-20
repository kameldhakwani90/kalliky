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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TelnyxFailuresManager from '@/components/admin/TelnyxFailuresManager';
import TrialMonitoringDashboard from '@/components/admin/TrialMonitoringDashboard';
import BusinessParametersManager from '@/components/admin/BusinessParametersManager';
import EmailConfigurationManager from '@/components/admin/EmailConfigurationManager';
import ProfitabilityMetrics from '@/components/admin/ProfitabilityMetrics';
import AllClientsConsumption from '@/components/admin/AllClientsConsumption';
import TrialDeletionCronMonitor from '@/components/admin/TrialDeletionCronMonitor';
import SystemCleanupManager from '@/components/admin/SystemCleanupManager';
import {
  Users,
  DollarSign,
  ClipboardList,
  Activity,
  CheckCircle,
  Clock,
  Brain,
  Phone,
  AlertTriangle,
  Loader2,
  RefreshCw,
  CreditCard,
  Shield,
  Building2,
  Mail,
  TrashIcon,
  Settings
} from 'lucide-react';

interface ConsumptionData {
  globalTotals: {
    totalClients: number;
    totalStores: number;
    totalOpenAICost: number;
    totalOpenAICalls: number;
    totalOpenAITokens: number;
    totalTelnyxCost: number;
    totalTelnyxCalls: number;
    totalTelnyxDuration: number;
    totalNumbersCost: number;
    grandTotal: number;
  };
  topClients: Array<{
    businessId: string;
    businessName: string;
    ownerEmail: string;
    ownerName: string;
    totalCost: number;
    openaiCost: number;
    telnyxCost: number;
    storesCount: number;
  }>;
  highUsageAlerts: Array<{
    businessName: string;
    storeName: string;
    totalCost: number;
    openaiCost: number;
    telnyxCost: number;
    alertLevel: string;
  }>;
}

export default function AdminDashboard() {
  const [consumptionData, setConsumptionData] = useState<ConsumptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConsumptionData = async () => {
    try {
      const response = await fetch('/api/admin/consumption-simple');
      if (!response.ok) throw new Error('Erreur chargement données');
      const data = await response.json();
      setConsumptionData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      console.error('Error fetching consumption data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConsumptionData();
  };

  useEffect(() => {
    fetchConsumptionData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement des métriques...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const kpiData = [
    {
      title: 'Clients Actifs',
      value: consumptionData?.globalTotals.totalClients?.toString() || '0',
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      trend: '+12% ce mois'
    },
    {
      title: 'Coûts OpenAI',
      value: `${(consumptionData?.globalTotals.totalOpenAICost || 0).toFixed(2)}€`,
      icon: <Brain className="h-6 w-6 text-muted-foreground" />,
      trend: `${consumptionData?.globalTotals.totalOpenAICalls || 0} appels`
    },
    {
      title: 'Coûts Telnyx',
      value: `${(consumptionData?.globalTotals.totalTelnyxCost || 0).toFixed(2)}€`,
      icon: <Phone className="h-6 w-6 text-muted-foreground" />,
      trend: `${consumptionData?.globalTotals.totalTelnyxCalls || 0} appels`
    },
    {
      title: 'Coût Total',
      value: `${(consumptionData?.globalTotals.grandTotal || 0).toFixed(2)}€`,
      icon: <DollarSign className="h-6 w-6 text-muted-foreground" />,
      trend: 'Ce mois'
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Superadmin</h2>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      <Tabs defaultValue="consumption" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consumption">
            <DollarSign className="h-4 w-4 mr-2" />
            Consommation
          </TabsTrigger>
          <TabsTrigger value="trial-monitoring">
            <Shield className="h-4 w-4 mr-2" />
            Surveillance Trial
          </TabsTrigger>
          <TabsTrigger value="business-parameters">
            <Building2 className="h-4 w-4 mr-2" />
            Paramètres Business
          </TabsTrigger>
          <TabsTrigger value="email-config">
            <Mail className="h-4 w-4 mr-2" />
            Configuration Email
          </TabsTrigger>
          <TabsTrigger value="telnyx-failures">
            <CreditCard className="h-4 w-4 mr-2" />
            Échecs Telnyx
          </TabsTrigger>
          <TabsTrigger value="trial-deletion-cron">
            <TrashIcon className="h-4 w-4 mr-2" />
            Cron Suppression
          </TabsTrigger>
          <TabsTrigger value="system-cleanup">
            <Settings className="h-4 w-4 mr-2" />
            Nettoyage Système
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="space-y-4">
      
      {/* KPIs Principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertes Seuils Dépassés */}
      {consumptionData?.highUsageAlerts && consumptionData.highUsageAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Alertes - Consommation Élevée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {consumptionData.highUsageAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="font-medium">{alert.businessName} - {alert.storeName}</div>
                    <div className="text-sm text-muted-foreground">
                      OpenAI: €{alert.openaiCost.toFixed(2)} | Telnyx: €{alert.telnyxCost.toFixed(2)}
                    </div>
                  </div>
                  <Badge variant={alert.alertLevel === 'high' ? 'destructive' : 'secondary'}>
                    €{alert.totalCost.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Clients avec Tabs */}
      <div className="space-y-4">
        <Tabs defaultValue="top-clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="top-clients">Top 10 Clients</TabsTrigger>
            <TabsTrigger value="all-clients">Tous les Clients</TabsTrigger>
          </TabsList>
          
          <TabsContent value="top-clients">
            <Card>
              <CardHeader>
                <CardTitle>Top Clients - Consommation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="text-right">Boutiques</TableHead>
                        <TableHead className="text-right">OpenAI</TableHead>
                        <TableHead className="text-right">Telnyx</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consumptionData?.topClients?.map((client, index) => (
                        <TableRow key={`${client.businessId}-${index}`}>
                          <TableCell className="font-medium">{client.businessName}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {client.ownerEmail}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{client.storesCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right">€{client.openaiCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right">€{client.telnyxCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            €{client.totalCost.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Aucune données de consommation disponible
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="all-clients">
            <AllClientsConsumption />
          </TabsContent>
        </Tabs>
      </div>

      {/* Métriques Détaillées */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-blue-500" />
              Métriques OpenAI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Appels:</span>
              <span className="font-medium">{consumptionData?.globalTotals.totalOpenAICalls?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Tokens:</span>
              <span className="font-medium">{consumptionData?.globalTotals.totalOpenAITokens?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coût Moyen/Appel:</span>
              <span className="font-medium">
                €{consumptionData?.globalTotals.totalOpenAICalls 
                  ? (consumptionData.globalTotals.totalOpenAICost / consumptionData.globalTotals.totalOpenAICalls).toFixed(4)
                  : '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2 text-green-500" />
              Métriques Telnyx
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Appels:</span>
              <span className="font-medium">{consumptionData?.globalTotals.totalTelnyxCalls?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durée Totale:</span>
              <span className="font-medium">
                {Math.round((consumptionData?.globalTotals.totalTelnyxDuration || 0) / 60)} min
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coût Numéros:</span>
              <span className="font-medium">€{(consumptionData?.globalTotals.totalNumbersCost || 0).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Profitabilité en Temps Réel */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Profitabilité Temps Réel
        </h3>
        <ProfitabilityMetrics />
      </div>
        </TabsContent>

        <TabsContent value="trial-monitoring" className="space-y-4">
          <TrialMonitoringDashboard />
        </TabsContent>

        <TabsContent value="business-parameters" className="space-y-4">
          <BusinessParametersManager />
        </TabsContent>

        <TabsContent value="email-config" className="space-y-4">
          <EmailConfigurationManager />
        </TabsContent>

        <TabsContent value="telnyx-failures" className="space-y-4">
          <TelnyxFailuresManager />
        </TabsContent>

        <TabsContent value="trial-deletion-cron" className="space-y-4">
          <TrialDeletionCronMonitor />
        </TabsContent>

        <TabsContent value="system-cleanup" className="space-y-4">
          <SystemCleanupManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
