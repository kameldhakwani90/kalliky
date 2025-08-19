'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Phone,
  ShoppingCart,
  Users,
  DollarSign,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  PhoneCall,
  PhoneOff,
  PhoneForwarded,
  Star,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Brain,
  Sparkles,
  Calendar,
  Timer
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DashboardOnboardingFlow } from '@/components/onboarding/flows/dashboard-flow';

// Types
interface DashboardStats {
  metrics: {
    revenue: { today: number; growth: number; yesterday: number };
    orders: { today: number; growth: number; yesterday: number };
    calls: { today: number; growth: number; yesterday: number };
    customers: { total: number; new: number; returning: number };
    avgOrderValue: { value: number; growth: number };
    conversionRate: { value: number; growth: number };
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    amount?: number;
    store: string;
    createdAt: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }>;
  revenueChart: Array<{ date: string; revenue: number }>;
  callsChart: Array<{ date: string; calls: number }>;
  peakHours: Array<{ hour: string; orders: number }>;
  customerSegments: { new: number; regular: number; vip: number };
  aiPerformance: {
    totalCalls: number;
    resolvedByAI: number;
    transferredToHuman: number;
    avgResponseTime: number;
    satisfactionScore: number;
  };
  subscription?: {
    plan: string;
    status: string;
  };
}

interface LiveCall {
  id: string;
  customerName: string;
  customerPhone: string;
  customerStatus: string;
  duration: number;
  status: string;
  aiHandling: boolean;
  sentiment: string;
}

interface LiveCallsData {
  activeCalls: LiveCall[];
  queuedCalls: Array<{
    id: string;
    position: number;
    estimatedWaitTime: number;
    priority: number;
  }>;
  stats: {
    activeCount: number;
    queuedCount: number;
    avgWaitTime: number;
    avgCallDuration: number;
  };
}

// Composant MetricCard moderne avec animation
function MetricCard({
  title,
  value,
  growth,
  icon: Icon,
  color = 'blue',
  prefix = '',
  suffix = '',
  loading = false
}: {
  title: string;
  value: number;
  growth?: number;
  icon: any;
  color?: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20 hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("p-2 rounded-lg", colorClasses[color as keyof typeof colorClasses])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {prefix}{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}{suffix}
          </h2>
          
          {growth !== undefined && (
            <div className="flex items-center gap-1">
              {growth > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">+{growth.toFixed(1)}%</span>
                </>
              ) : growth < 0 ? (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">{growth.toFixed(1)}%</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Pas de changement</span>
              )}
              <span className="text-xs text-muted-foreground">vs hier</span>
            </div>
          )}
        </div>
        
        {/* Effet de brillance au hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 transition-all duration-500 group-hover:translate-x-full" />
      </CardContent>
    </Card>
  );
}

// Composant LiveCallCard
function LiveCallCard({ call }: { call: LiveCall }) {
  const sentimentColors = {
    positive: 'text-green-500',
    neutral: 'text-gray-500',
    negative: 'text-red-500'
  };

  const statusColors = {
    Nouveau: 'bg-blue-100 text-blue-700',
    Fidèle: 'bg-green-100 text-green-700',
    VIP: 'bg-purple-100 text-purple-700'
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <PhoneCall className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-ping" />
        </div>
        
        <div>
          <p className="font-medium">{call.customerName}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{call.customerPhone}</span>
            <Badge variant="secondary" className={cn("text-xs", statusColors[call.customerStatus as keyof typeof statusColors])}>
              {call.customerStatus}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {call.aiHandling && (
          <Badge variant="outline" className="gap-1">
            <Brain className="h-3 w-3" />
            IA
          </Badge>
        )}
        
        <div className="text-right">
          <p className="text-sm font-medium">
            {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
          </p>
          <p className={cn("text-xs", sentimentColors[call.sentiment as keyof typeof sentimentColors])}>
            {call.sentiment === 'positive' ? '😊' : call.sentiment === 'negative' ? '😟' : '😐'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Composant ActivityCard
function ActivityCard({ activity }: { activity: DashboardStats['recentActivity'][0] }) {
  const typeIcons = {
    ORDER_CREATED: ShoppingCart,
    CALL_RECEIVED: Phone,
    CUSTOMER_REGISTERED: Users,
    SERVICE_BOOKED: Calendar,
    CONSULTATION_SCHEDULED: Clock
  };

  const Icon = typeIcons[activity.type as keyof typeof typeIcons] || Activity;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{activity.title}</p>
        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
      </div>
      
      <div className="text-right">
        {activity.amount && (
          <p className="text-sm font-semibold text-green-600">{activity.amount.toFixed(2)}€</p>
        )}
        <p className="text-xs text-muted-foreground">
          {format(new Date(activity.createdAt), 'HH:mm', { locale: fr })}
        </p>
      </div>
    </div>
  );
}

export default function ModernDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [liveCalls, setLiveCalls] = useState<LiveCallsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('day');

  // Fetch des données dashboard
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/restaurant/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Erreur fetch dashboard:', error);
    }
  };

  // Fetch des appels en temps réel
  const fetchLiveCalls = async () => {
    try {
      const response = await fetch('/api/restaurant/live-calls');
      if (response.ok) {
        const data = await response.json();
        setLiveCalls(data.data);
      }
    } catch (error) {
      console.error('Erreur fetch live calls:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardStats(), fetchLiveCalls()]);
      setLoading(false);
    };
    loadData();

    // Refresh automatique toutes les 30 secondes
    const interval = setInterval(() => {
      fetchLiveCalls();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Refresh manuel
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardStats(), fetchLiveCalls()]);
    setRefreshing(false);
  };

  // Export des données
  const handleExport = async () => {
    try {
      const response = await fetch('/api/exports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: 'current-business-id', // TODO: Get from context
          type: 'analytics',
          format: 'excel',
          dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: new Date()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  // Couleurs pour les graphiques
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <>
      <DashboardOnboardingFlow />
      <div className="min-h-screen bg-black text-white">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        </div>
        {/* Header avec actions */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10 relative"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                  Tableau de bord
                </h1>
                <p className="text-gray-400">
                  {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  className="gap-2 bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-2xl"
                >
                  <Download className="h-4 w-4" data-icon="download" />
                  Exporter
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="gap-2 bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-2xl"
                >
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} data-icon="refresh" />
                  Actualiser
                </Button>
                
                <Badge 
                  variant={stats?.subscription?.status === 'active' ? 'default' : 'secondary'}
                  className="bg-white/20 text-white border-white/20 rounded-full px-4 py-2"
                >
                  {stats?.subscription?.plan || 'FREE'}
                </Badge>
              </motion.div>
            </div>
          </div>
        </motion.div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-onboarding="metrics-cards">
          <MetricCard
            title="Revenus aujourd'hui"
            value={stats?.metrics.revenue.today || 0}
            growth={stats?.metrics.revenue.growth}
            icon={DollarSign}
            color="green"
            prefix="€"
            loading={loading}
          />
          
          <MetricCard
            title="Commandes"
            value={stats?.metrics.orders.today || 0}
            growth={stats?.metrics.orders.growth}
            icon={ShoppingCart}
            color="blue"
            loading={loading}
          />
          
          <MetricCard
            title="Appels"
            value={stats?.metrics.calls.today || 0}
            growth={stats?.metrics.calls.growth}
            icon={Phone}
            color="purple"
            loading={loading}
          />
          
          <MetricCard
            title="Taux conversion"
            value={stats?.metrics.conversionRate.value || 0}
            growth={stats?.metrics.conversionRate.growth}
            icon={Target}
            color="orange"
            suffix="%"
            loading={loading}
          />
        </div>

        {/* Section Appels en temps réel + Performance IA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appels actifs */}
          <Card className="lg:col-span-2 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20" data-onboarding="live-calls">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="relative">
                    <Phone className="h-5 w-5" />
                    {liveCalls && liveCalls.activeCalls.length > 0 && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  Appels en cours
                </CardTitle>
                <CardDescription>
                  {liveCalls?.stats.activeCount || 0} actifs • {liveCalls?.stats.queuedCount || 0} en attente
                </CardDescription>
              </div>
              
              <Badge variant="outline" className="gap-1">
                <Timer className="h-3 w-3" />
                Temps moyen: {liveCalls?.stats.avgCallDuration || 0}s
              </Badge>
            </CardHeader>
            
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : liveCalls?.activeCalls.length ? (
                  <div className="space-y-3">
                    {liveCalls.activeCalls.map(call => (
                      <LiveCallCard key={call.id} call={call} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <PhoneOff className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm text-muted-foreground">Aucun appel en cours</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Performance IA */}
          <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20" data-onboarding="ai-performance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Performance IA
              </CardTitle>
              <CardDescription>Derniers 30 jours</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Taux de résolution IA */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Résolution IA</span>
                      <span className="text-sm font-bold">
                        {stats?.aiPerformance.totalCalls ? 
                          Math.round((stats.aiPerformance.resolvedByAI / stats.aiPerformance.totalCalls) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={stats?.aiPerformance.totalCalls ? 
                        (stats.aiPerformance.resolvedByAI / stats.aiPerformance.totalCalls) * 100 : 0} 
                      className="h-2"
                    />
                  </div>

                  {/* Temps de réponse */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm">Temps réponse</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {stats?.aiPerformance.avgResponseTime || 0}s
                    </span>
                  </div>

                  {/* Satisfaction */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm">Satisfaction</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i <= (stats?.aiPerformance.satisfactionScore || 0)
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stats détaillées */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {stats?.aiPerformance.resolvedByAI || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Résolus par IA</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {stats?.aiPerformance.transferredToHuman || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Transférés</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique revenus */}
          <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20" data-onboarding="revenue-chart">
            <CardHeader>
              <CardTitle>Évolution des revenus</CardTitle>
              <CardDescription>7 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats?.revenueChart || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: any) => [`€${value}`, 'Revenus']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top produits */}
          <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20" data-onboarding="top-products">
            <CardHeader>
              <CardTitle>Top produits</CardTitle>
              <CardDescription>Les plus vendus ce mois</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">€{product.revenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} vendus</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activité récente et segments clients */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activité récente */}
          <Card className="lg:col-span-2 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20" data-onboarding="activity-feed">
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Derniers événements</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : stats?.recentActivity.length ? (
                  <div className="space-y-2">
                    {stats.recentActivity.map(activity => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Segments clients */}
          <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20" data-onboarding="customer-segments">
            <CardHeader>
              <CardTitle>Segments clients</CardTitle>
              <CardDescription>Répartition de la base</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <RePieChart>
                      <Pie
                        data={[
                          { name: 'Nouveaux', value: stats?.customerSegments.new || 0 },
                          { name: 'Réguliers', value: stats?.customerSegments.regular || 0 },
                          { name: 'VIP', value: stats?.customerSegments.vip || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[0, 1, 2].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center">
                      <div className="h-3 w-3 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[0] }} />
                      <p className="text-xs font-medium">Nouveaux</p>
                      <p className="text-lg font-bold">{stats?.customerSegments.new || 0}</p>
                    </div>
                    <div className="text-center">
                      <div className="h-3 w-3 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[1] }} />
                      <p className="text-xs font-medium">Réguliers</p>
                      <p className="text-lg font-bold">{stats?.customerSegments.regular || 0}</p>
                    </div>
                    <div className="text-center">
                      <div className="h-3 w-3 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[2] }} />
                      <p className="text-xs font-medium">VIP</p>
                      <p className="text-lg font-bold">{stats?.customerSegments.vip || 0}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Heures de pointe */}
        <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20">
          <CardHeader>
            <CardTitle>Heures de pointe</CardTitle>
            <CardDescription>Distribution des commandes sur 24h</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.peakHours || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="hour" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="orders" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}