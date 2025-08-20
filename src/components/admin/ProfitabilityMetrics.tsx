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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  RefreshCw,
  Building,
  Target,
  BarChart3
} from 'lucide-react';

interface ProfitabilityData {
  businessId: string;
  businessName: string;
  subscriptionPlan: string;
  subscriptionAmount: number;
  totalCosts: number;
  totalRevenue: number;
  profitMargin: number;
  profitAmount: number;
  roi: number;
  callsCount: number;
  ordersCount: number;
  avgOrderValue: number;
}

interface ProfitabilitySummary {
  totalBusinesses: number;
  profitableBusinesses: number;
  totalProfit: number;
  totalRevenue: number;
  totalCosts: number;
  averageMargin: number;
  topPerformers: ProfitabilityData[];
  lossmakers: ProfitabilityData[];
}

export default function ProfitabilityMetrics() {
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfitabilityData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/profitability?period=current_month');
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      const data = await response.json();
      setProfitabilityData(data);
      setError(null);
    } catch (error) {
      console.error('Erreur récupération profitabilité:', error);
      setError('Impossible de charger les données de profitabilité');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitabilityData();
    // Actualiser toutes les 5 minutes
    const interval = setInterval(fetchProfitabilityData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getProfitabilityBadge = (profitAmount: number, profitMargin: number) => {
    if (profitAmount <= 0) {
      return <Badge className="bg-red-100 text-red-800">Perte</Badge>;
    } else if (profitMargin < 20) {
      return <Badge className="bg-yellow-100 text-yellow-800">Risque</Badge>;
    } else if (profitMargin < 50) {
      return <Badge className="bg-blue-100 text-blue-800">Stable</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Chargement métriques profitabilité...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center text-red-600">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profitabilityData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* KPIs Profitabilité */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Total</CardTitle>
            {profitabilityData.totalProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitabilityData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profitabilityData.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Marge: {formatPercentage(profitabilityData.averageMargin)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(profitabilityData.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Coûts: {formatCurrency(profitabilityData.totalCosts)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Rentables</CardTitle>
            <Building className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitabilityData.profitableBusinesses}/{profitabilityData.totalBusinesses}
            </div>
            <p className="text-xs text-muted-foreground">
              {((profitabilityData.profitableBusinesses / profitabilityData.totalBusinesses) * 100).toFixed(1)}% rentables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients à Risque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {profitabilityData.lossmakers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              En perte ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profitabilityData.topPerformers.slice(0, 5).map((business, index) => (
                <div key={business.businessId} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{business.businessName}</p>
                    <p className="text-xs text-muted-foreground">
                      Plan {business.subscriptionPlan} • {business.callsCount} appels
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(business.profitAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(business.profitMargin)} marge
                    </p>
                  </div>
                </div>
              ))}
              {profitabilityData.topPerformers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucun client profitable ce mois
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clients à Risque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Clients à Risque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profitabilityData.lossmakers.map((business, index) => (
                <div key={business.businessId} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{business.businessName}</p>
                    <p className="text-xs text-muted-foreground">
                      Plan {business.subscriptionPlan} • {business.callsCount} appels
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {formatCurrency(business.profitAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ROI: {formatPercentage(business.roi)}
                    </p>
                  </div>
                </div>
              ))}
              {profitabilityData.lossmakers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  🎉 Tous les clients sont rentables !
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Détail Profitabilité par Client
            </CardTitle>
            <Button onClick={fetchProfitabilityData} size="sm" variant="outline">
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
                <TableHead>Plan</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Coûts</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Marge</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...profitabilityData.topPerformers, ...profitabilityData.lossmakers]
                .sort((a, b) => b.profitAmount - a.profitAmount)
                .map((business) => (
                <TableRow key={business.businessId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{business.businessName}</p>
                      <p className="text-xs text-muted-foreground">
                        {business.ordersCount} commandes • {business.callsCount} appels
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{business.subscriptionPlan}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(business.totalRevenue)}</TableCell>
                  <TableCell>{formatCurrency(business.totalCosts)}</TableCell>
                  <TableCell className={business.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(business.profitAmount)}
                  </TableCell>
                  <TableCell>
                    {formatPercentage(business.profitMargin)}
                  </TableCell>
                  <TableCell>
                    {getProfitabilityBadge(business.profitAmount, business.profitMargin)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}