'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneMissed, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock,
  MessageSquare,
  Bot,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Calendar,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Store {
  id: string;
  name: string;
  address: string;
}

interface AnalyticsData {
  calls: {
    total: number;
    answered: number;
    missed: number;
    avgDuration: number;
    conversionRate: number;
  };
  orders: {
    total: number;
    revenue: number;
    avgBasket: number;
    topProducts: Array<{ name: string; count: number; revenue: number }>;
  };
  ai: {
    accuracy: number;
    responseTime: number;
    customerSatisfaction: number;
    errorRate: number;
  };
  trends: {
    callsByHour: Array<{ hour: number; calls: number; orders: number }>;
    revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
    customerTypes: Array<{ type: string; count: number; color: string }>;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function AnalyticsPage() {
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [stores, setStores] = useState<Store[]>([]);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    calls: {
      total: 156,
      answered: 142,
      missed: 14,
      avgDuration: 185,
      conversionRate: 78.5
    },
    orders: {
      total: 98,
      revenue: 2847.50,
      avgBasket: 29.06,
      topProducts: [
        { name: 'Pizza Margherita', count: 24, revenue: 312.00 },
        { name: 'Burger Classic', count: 18, revenue: 234.00 },
        { name: 'Salade César', count: 15, revenue: 165.00 },
        { name: 'Pasta Carbonara', count: 12, revenue: 156.00 },
        { name: 'Tiramisu', count: 8, revenue: 64.00 }
      ]
    },
    ai: {
      accuracy: 94.2,
      responseTime: 0.8,
      customerSatisfaction: 4.6,
      errorRate: 2.1
    },
    trends: {
      callsByHour: [
        { hour: 8, calls: 2, orders: 1 },
        { hour: 9, calls: 5, orders: 3 },
        { hour: 10, calls: 8, orders: 6 },
        { hour: 11, calls: 12, orders: 9 },
        { hour: 12, calls: 18, orders: 14 },
        { hour: 13, calls: 15, orders: 11 },
        { hour: 14, calls: 9, orders: 7 },
        { hour: 15, calls: 6, orders: 4 },
        { hour: 16, calls: 8, orders: 6 },
        { hour: 17, calls: 11, orders: 8 },
        { hour: 18, calls: 16, orders: 12 },
        { hour: 19, calls: 22, orders: 17 },
        { hour: 20, calls: 19, orders: 15 },
        { hour: 21, calls: 15, orders: 11 },
        { hour: 22, calls: 8, orders: 6 }
      ],
      revenueByDay: [
        { date: '10/08', revenue: 385.20, orders: 12 },
        { date: '11/08', revenue: 428.50, orders: 15 },
        { date: '12/08', revenue: 312.80, orders: 11 },
        { date: '13/08', revenue: 456.30, orders: 16 },
        { date: '14/08', revenue: 398.70, orders: 14 },
        { date: '15/08', revenue: 521.40, orders: 18 },
        { date: '16/08', revenue: 344.80, orders: 12 }
      ],
      customerTypes: [
        { type: 'Nouveaux', count: 45, color: '#8884d8' },
        { type: 'Réguliers', count: 78, color: '#82ca9d' },
        { type: 'VIP', count: 23, color: '#ffc658' },
        { type: 'Inactifs', count: 12, color: '#ff7c7c' }
      ]
    }
  });

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadAnalytics();
    }
  }, [selectedStore, period]);

  const loadStores = async () => {
    try {
      const response = await fetch('/api/restaurant/activities');
      if (response.ok) {
        const data = await response.json();
        const allStores = data.flatMap((business: any) => 
          business.stores.map((store: any) => ({
            id: store.id,
            name: store.name,
            address: store.address
          }))
        );
        setStores(allStores);
        if (allStores.length > 0) {
          setSelectedStore(allStores[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // TODO: Récupérer les vraies données analytics
      // const response = await fetch(`/api/analytics?storeId=${selectedStore}&period=${period}`);
      // const data = await response.json();
      // setAnalytics(data);
      
      // Pour l'instant, utiliser les données mockées
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Analytics IA</h1>
          <p className="text-muted-foreground">
            Analysez les performances de votre agent IA téléphonique
          </p>
        </div>

        {/* Sélecteurs */}
        <div className="flex gap-4 mb-8">
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionnez une boutique" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Dernières 24h</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">3 derniers mois</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedStore && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="calls" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Appels
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Performance IA
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Clients
              </TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPIs principaux */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Appels totaux</p>
                        <p className="text-3xl font-bold">{analytics.calls.total}</p>
                        <p className="text-sm text-green-600">+12% vs période précédente</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Phone className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Commandes</p>
                        <p className="text-3xl font-bold">{analytics.orders.total}</p>
                        <p className="text-sm text-green-600">+8% vs période précédente</p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</p>
                        <p className="text-3xl font-bold">{analytics.orders.revenue.toFixed(2)}€</p>
                        <p className="text-sm text-green-600">+15% vs période précédente</p>
                      </div>
                      <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Taux de conversion</p>
                        <p className="text-3xl font-bold">{analytics.calls.conversionRate}%</p>
                        <p className="text-sm text-green-600">+3% vs période précédente</p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Graphiques principaux */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution du chiffre d'affaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.trends.revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`${value}€`, 'CA']} />
                        <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Répartition des clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.trends.customerTypes}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="count"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {analytics.trends.customerTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Produits les plus vendus */}
              <Card>
                <CardHeader>
                  <CardTitle>Produits les plus vendus</CardTitle>
                  <CardDescription>Top 5 des produits commandés via l'IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.orders.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.count} commandes</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{product.revenue.toFixed(2)}€</div>
                          <div className="text-sm text-muted-foreground">
                            {(product.revenue / product.count).toFixed(2)}€/unité
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appels */}
            <TabsContent value="calls" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <PhoneIncoming className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Appels répondus</p>
                        <p className="text-2xl font-bold">{analytics.calls.answered}</p>
                        <p className="text-sm text-muted-foreground">
                          {((analytics.calls.answered / analytics.calls.total) * 100).toFixed(1)}% du total
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <PhoneMissed className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Appels manqués</p>
                        <p className="text-2xl font-bold">{analytics.calls.missed}</p>
                        <p className="text-sm text-muted-foreground">
                          {((analytics.calls.missed / analytics.calls.total) * 100).toFixed(1)}% du total
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Durée moyenne</p>
                        <p className="text-2xl font-bold">{formatDuration(analytics.calls.avgDuration)}</p>
                        <p className="text-sm text-muted-foreground">par appel</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition des appels par heure</CardTitle>
                  <CardDescription>Nombre d'appels et de commandes par tranche horaire</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analytics.trends.callsByHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}h`} />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(hour) => `${hour}h00`}
                        formatter={(value: any, name: string) => [
                          value,
                          name === 'calls' ? 'Appels' : 'Commandes'
                        ]}
                      />
                      <Bar dataKey="calls" fill="#8884d8" name="calls" />
                      <Bar dataKey="orders" fill="#82ca9d" name="orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance IA */}
            <TabsContent value="ai" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">Précision IA</p>
                        <Badge variant="default">{analytics.ai.accuracy}%</Badge>
                      </div>
                      <Progress value={analytics.ai.accuracy} className="w-full" />
                      <p className="text-xs text-muted-foreground">Reconnaissance et traitement</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">Temps de réponse</p>
                        <Badge variant="secondary">{analytics.ai.responseTime}s</Badge>
                      </div>
                      <Progress value={(2 - analytics.ai.responseTime) * 50} className="w-full" />
                      <p className="text-xs text-muted-foreground">Latence moyenne</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">Satisfaction client</p>
                        <Badge variant="default">{analytics.ai.customerSatisfaction}/5</Badge>
                      </div>
                      <Progress value={(analytics.ai.customerSatisfaction / 5) * 100} className="w-full" />
                      <p className="text-xs text-muted-foreground">Note moyenne des clients</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">Taux d'erreur</p>
                        <Badge variant={analytics.ai.errorRate < 5 ? "secondary" : "destructive"}>
                          {analytics.ai.errorRate}%
                        </Badge>
                      </div>
                      <Progress value={100 - analytics.ai.errorRate} className="w-full" />
                      <p className="text-xs text-muted-foreground">Erreurs de traitement</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Statut du système IA</CardTitle>
                    <CardDescription>État en temps réel des composants</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'OpenAI Realtime API', status: 'active', latency: '120ms' },
                      { name: 'Telnyx Téléphonie', status: 'active', latency: '45ms' },
                      { name: 'Base de données', status: 'active', latency: '12ms' },
                      { name: 'Webhook notifications', status: 'active', latency: '89ms' },
                      { name: 'Analytics pipeline', status: 'warning', latency: '234ms' }
                    ].map((component, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {component.status === 'active' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : component.status === 'warning' ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">{component.name}</span>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            component.status === 'active' ? 'default' : 
                            component.status === 'warning' ? 'secondary' : 'destructive'
                          }>
                            {component.status === 'active' ? 'Actif' : 
                             component.status === 'warning' ? 'Attention' : 'Erreur'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">{component.latency}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Historique des erreurs</CardTitle>
                    <CardDescription>Dernières erreurs détectées</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { time: '14:23', type: 'Timeout API', severity: 'low', resolved: true },
                        { time: '12:45', type: 'Produit non trouvé', severity: 'medium', resolved: true },
                        { time: '11:12', type: 'Client raccroché', severity: 'low', resolved: true },
                        { time: '09:34', type: 'Erreur de transcription', severity: 'medium', resolved: false }
                      ].map((error, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              error.severity === 'high' ? 'bg-red-500' :
                              error.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`} />
                            <div>
                              <div className="font-medium text-sm">{error.type}</div>
                              <div className="text-xs text-muted-foreground">{error.time}</div>
                            </div>
                          </div>
                          <Badge variant={error.resolved ? "secondary" : "destructive"}>
                            {error.resolved ? 'Résolu' : 'En cours'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Clients */}
            <TabsContent value="customers" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">158</p>
                      <p className="text-sm text-muted-foreground">Clients totaux</p>
                      <p className="text-xs text-green-600 mt-1">+12 cette semaine</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{analytics.orders.avgBasket.toFixed(2)}€</p>
                      <p className="text-sm text-muted-foreground">Panier moyen</p>
                      <p className="text-xs text-green-600 mt-1">+8% ce mois</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">68%</p>
                      <p className="text-sm text-muted-foreground">Clients fidèles</p>
                      <p className="text-xs text-green-600 mt-1">+5% ce mois</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Derniers clients</CardTitle>
                  <CardDescription>Clients ayant appelé récemment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { phone: '+33 6 12 34 56 78', name: 'Marie Dupont', lastCall: '2h', orders: 3, total: 87.50, type: 'Régulier' },
                      { phone: '+33 6 98 76 54 32', name: 'Client', lastCall: '4h', orders: 1, total: 29.80, type: 'Nouveau' },
                      { phone: '+33 6 55 44 33 22', name: 'Pierre Martin', lastCall: '6h', orders: 12, total: 340.20, type: 'VIP' },
                      { phone: '+33 6 11 22 33 44', name: 'Sophie Bernard', lastCall: '1j', orders: 5, total: 145.60, type: 'Régulier' }
                    ].map((customer, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.phone}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-sm font-medium">{customer.orders}</div>
                            <div className="text-xs text-muted-foreground">commandes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{customer.total.toFixed(2)}€</div>
                            <div className="text-xs text-muted-foreground">total</div>
                          </div>
                          <div className="text-center">
                            <Badge variant={
                              customer.type === 'VIP' ? 'default' :
                              customer.type === 'Régulier' ? 'secondary' : 'outline'
                            }>
                              {customer.type}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">il y a {customer.lastCall}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}