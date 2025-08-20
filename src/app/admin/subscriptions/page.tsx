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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Edit,
  RefreshCw,
  Euro,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';

interface Subscription {
  id: string;
  customerName: string;
  customerEmail: string;
  currentPlan: string;
  currentPrice: number;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  nextBillingDate: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
}

const AVAILABLE_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'STARTER',
    price: 49,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_starter'
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 99,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_pro'
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    price: 199,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_enterprise'
  }
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [newPlan, setNewPlan] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/subscriptions');
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Erreur récupération abonnements:', error);
      setError('Impossible de charger les abonnements');
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async () => {
    if (!selectedSubscription || !newPlan) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/admin/subscriptions/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId: selectedSubscription.stripeSubscriptionId,
          newPriceId: newPlan
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      // Recharger les données
      await fetchSubscriptions();
      setSelectedSubscription(null);
      setNewPlan('');
    } catch (error) {
      console.error('Erreur mise à jour abonnement:', error);
      setError('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800">En retard</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Annulé</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800">Essai</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Chargement des abonnements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <CreditCard className="h-8 w-8 mr-3" />
            Gestion des Abonnements
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les plans et tarifs de vos clients
          </p>
        </div>
        <Button onClick={fetchSubscriptions} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600">
              <Euro className="h-4 w-4 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Abonnements</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Clients avec abonnement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {subscriptions.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Payants actuellement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Mensuels</CardTitle>
            <Euro className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatPrice(subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.currentPrice, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Estimation MRR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prix Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {subscriptions.length > 0 ? formatPrice(subscriptions.reduce((sum, s) => sum + s.currentPrice, 0) / subscriptions.length) : '0€'}
            </div>
            <p className="text-xs text-muted-foreground">Par client</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des abonnements */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Abonnements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Plan Actuel</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Prochaine Facturation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subscription.customerName}</div>
                      <div className="text-sm text-muted-foreground">{subscription.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{subscription.currentPlan}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(subscription.currentPrice)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(subscription.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      {formatDate(subscription.nextBillingDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedSubscription(subscription)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modifier l'abonnement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium">{subscription.customerName}</p>
                            <p className="text-sm text-muted-foreground">{subscription.customerEmail}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Plan actuel : {subscription.currentPlan} ({formatPrice(subscription.currentPrice)})</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Nouveau plan :</label>
                            <Select value={newPlan} onValueChange={setNewPlan}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir un plan" />
                              </SelectTrigger>
                              <SelectContent>
                                {AVAILABLE_PLANS.map((plan) => (
                                  <SelectItem key={plan.id} value={plan.stripePriceId}>
                                    {plan.name} - {formatPrice(plan.price)}/{plan.interval === 'month' ? 'mois' : 'an'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={updateSubscription}
                              disabled={!newPlan || updating}
                              className="flex-1"
                            >
                              {updating ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CreditCard className="h-4 w-4 mr-2" />
                              )}
                              Mettre à jour
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {subscriptions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun abonnement trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}