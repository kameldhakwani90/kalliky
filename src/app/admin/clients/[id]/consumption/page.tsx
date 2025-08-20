'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  Phone,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';

interface BusinessConsumptionData {
  business: {
    id: string;
    name: string;
    type: string;
    createdAt: string;
    owner: {
      email: string;
      name: string;
      memberSince: string;
    };
  };
  period: string;
  globalStats: {
    totalCost: number;
    openai: {
      totalCalls: number;
      totalTokens: number;
      totalCost: number;
    };
    telnyx: {
      totalCalls: number;
      totalDuration: number;
      totalCost: number;
      numbersCost: number;
    };
  };
  stores: Array<{
    id: string;
    name: string;
    address: string;
    country: string;
    createdAt: string;
    isActive: boolean;
    summary?: any;
  }>;
  phoneNumbers: Array<{
    id: string;
    number: string;
    country: string;
    status: string;
    monthlyPrice: number;
    purchaseDate: string;
  }>;
  evolutionData: Array<{
    period: string;
    openaiCost: number;
    telnyxCost: number;
    totalCost: number;
  }>;
  storeBreakdown: Array<{
    storeId: string;
    storeName: string;
    storeCountry: string;
    totalCost: number;
    openaiCost: number;
    telnyxCost: number;
    percentageOfTotal: number;
  }>;
  topOpenAIOperations: Array<{
    operation: string;
    _sum: { totalCost: number };
    _count: { id: number };
    _avg: { totalCost: number };
  }>;
  recentActivity: {
    openaiUsage: Array<any>;
    telnyxUsage: Array<any>;
  };
}

export default function ClientConsumptionPage() {
  const params = useParams();
  const businessId = params.id as string;
  
  const [data, setData] = useState<BusinessConsumptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().substring(0, 7));

  const fetchConsumptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/consumption/${businessId}?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Erreur chargement données');
      const result = await response.json();
      setData(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      console.error('Error fetching consumption data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePeriodOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const period = date.toISOString().substring(0, 7);
      const label = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      options.push({ value: period, label });
    }
    return options;
  };

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatDuration = (seconds: number) => `${Math.round(seconds / 60)}min`;

  useEffect(() => {
    if (businessId) {
      fetchConsumptionData();
    }
  }, [businessId, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement des détails...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchConsumptionData()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return { trend: 'new', percentage: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs(change)
    };
  };

  const currentMonthData = data.evolutionData[data.evolutionData.length - 1];
  const previousMonthData = data.evolutionData[data.evolutionData.length - 2];
  const totalTrend = previousMonthData ? getTrend(currentMonthData?.totalCost || 0, previousMonthData.totalCost) : { trend: 'new', percentage: 0 };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{data.business.name}</h1>
            <p className="text-muted-foreground">{data.business.owner.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {generatePeriodOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût Total</CardTitle>
            <div className="flex items-center">
              {totalTrend.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : totalTrend.trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.globalStats.totalCost)}</div>
            {totalTrend.trend !== 'new' && (
              <p className={`text-xs mt-1 ${
                totalTrend.trend === 'up' ? 'text-red-600' : 
                totalTrend.trend === 'down' ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                {totalTrend.trend === 'up' ? '+' : totalTrend.trend === 'down' ? '-' : ''}
                {totalTrend.percentage.toFixed(1)}% vs mois précédent
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OpenAI</CardTitle>
            <Brain className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.globalStats.openai.totalCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.globalStats.openai.totalCalls.toLocaleString()} appels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Telnyx</CardTitle>
            <Phone className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.globalStats.telnyx.totalCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.globalStats.telnyx.totalCalls.toLocaleString()} appels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boutiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stores.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stores.filter(s => s.isActive).length} actives
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Répartition par boutique */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Boutique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.storeBreakdown.map((store) => (
                <div key={store.storeId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{store.storeName}</span>
                      <Badge variant="outline">{store.storeCountry}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      OpenAI: {formatCurrency(store.openaiCost)} | 
                      Telnyx: {formatCurrency(store.telnyxCost)}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold">{formatCurrency(store.totalCost)}</div>
                    <div className="text-xs text-muted-foreground">
                      {store.percentageOfTotal.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Numéros Telnyx */}
        <Card>
          <CardHeader>
            <CardTitle>Numéros Telnyx</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.phoneNumbers.map((phone) => (
                <div key={phone.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{phone.number}</div>
                    <div className="text-sm text-muted-foreground">
                      {phone.country} • Depuis {new Date(phone.purchaseDate).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={phone.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {phone.status}
                    </Badge>
                    <div className="text-sm font-medium mt-1">
                      {formatCurrency(phone.monthlyPrice)}/mois
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Opérations OpenAI */}
      <Card>
        <CardHeader>
          <CardTitle>Top Opérations OpenAI - 30 derniers jours</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opération</TableHead>
                <TableHead className="text-right">Nb Appels</TableHead>
                <TableHead className="text-right">Coût Total</TableHead>
                <TableHead className="text-right">Coût Moyen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topOpenAIOperations.map((op, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{op.operation}</TableCell>
                  <TableCell className="text-right">{op._count.id}</TableCell>
                  <TableCell className="text-right">{formatCurrency(op._sum.totalCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(op._avg.totalCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Évolution sur 6 mois */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Coûts (6 derniers mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Période</TableHead>
                <TableHead className="text-right">OpenAI</TableHead>
                <TableHead className="text-right">Telnyx</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.evolutionData.map((period) => (
                <TableRow key={period.period}>
                  <TableCell className="font-medium">
                    {new Date(period.period + '-01').toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(period.openaiCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(period.telnyxCost)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(period.totalCost)}
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