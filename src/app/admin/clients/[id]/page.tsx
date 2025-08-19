'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Building, 
  Mail, 
  Phone, 
  Calendar,
  CreditCard,
  Store,
  FileText,
  TrendingUp,
  Download,
  ExternalLink,
  Edit,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface ClientDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  plan: 'STARTER' | 'PRO' | 'BUSINESS';
  status: 'active' | 'inactive' | 'trial';
  subscriptionStart: string;
  subscriptionEnd: string;
  totalRevenue: number;
  storesCount: number;
  lastLogin?: string;
  stripeCustomerId?: string;
  createdAt: string;
  stores: Array<{
    id: string;
    name: string;
    address: string;
    status: string;
    revenue: number;
  }>;
  invoices: Array<{
    id: string;
    amount: number;
    status: string;
    date: string;
    period: string;
    stripeInvoiceId?: string;
  }>;
  subscriptionHistory: Array<{
    id: string;
    plan: string;
    startDate: string;
    endDate: string;
    amount: number;
    status: string;
  }>;
}

// Données mockées
const mockClientDetail: ClientDetail = {
  id: '1',
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@restaurant.com',
  phone: '+33 1 23 45 67 89',
  company: 'Le Bistrot Parisien',
  plan: 'PRO',
  status: 'active',
  subscriptionStart: '2024-01-15',
  subscriptionEnd: '2025-01-15',
  totalRevenue: 3948.00,
  storesCount: 2,
  lastLogin: '2024-08-14',
  stripeCustomerId: 'cus_test123',
  createdAt: '2024-01-15',
  stores: [
    {
      id: 'store-1',
      name: 'Le Bistrot Parisien - République',
      address: '12 Place de la République, 75011 Paris',
      status: 'active',
      revenue: 2450.00
    },
    {
      id: 'store-2',
      name: 'Le Bistrot Parisien - Bastille',
      address: '8 Rue de la Bastille, 75012 Paris',
      status: 'active',
      revenue: 1498.00
    }
  ],
  invoices: [
    {
      id: 'inv-001',
      amount: 329.00,
      status: 'paid',
      date: '2024-08-01',
      period: 'Août 2024',
      stripeInvoiceId: 'in_1234567890'
    },
    {
      id: 'inv-002',
      amount: 329.00,
      status: 'paid',
      date: '2024-07-01',
      period: 'Juillet 2024',
      stripeInvoiceId: 'in_0987654321'
    },
    {
      id: 'inv-003',
      amount: 329.00,
      status: 'pending',
      date: '2024-09-01',
      period: 'Septembre 2024',
      stripeInvoiceId: 'in_1122334455'
    }
  ],
  subscriptionHistory: [
    {
      id: 'sub-001',
      plan: 'PRO',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      amount: 329.00,
      status: 'active'
    },
    {
      id: 'sub-002',
      plan: 'STARTER',
      startDate: '2024-01-01',
      endDate: '2024-01-15',
      amount: 129.00,
      status: 'completed'
    }
  ]
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation du chargement
    setTimeout(() => {
      setClient(mockClientDetail);
      setLoading(false);
    }, 500);
  }, [params.id]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  if (!client) {
    return <div className="text-center">Client non trouvé</div>;
  }

  const getPlanColor = (plan: string) => {
    switch(plan) {
      case 'STARTER': return 'bg-blue-100 text-blue-800';
      case 'PRO': return 'bg-purple-100 text-purple-800';
      case 'BUSINESS': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {client.firstName} {client.lastName}
          </h1>
          <p className="text-muted-foreground">{client.company}</p>
        </div>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </Button>
      </div>

      {/* Profil Client */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informations du Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {client.firstName[0]}{client.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{client.company}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Client depuis le {new Date(client.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className={getPlanColor(client.plan)}>
                    Plan {client.plan}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(client.status)}>
                    {client.status === 'active' ? 'Actif' : 
                     client.status === 'trial' ? 'Essai' : 'Inactif'}
                  </Badge>
                  {client.stripeCustomerId && (
                    <Badge variant="outline">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Stripe: {client.stripeCustomerId}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenus Total</span>
              <span className="font-semibold">{client.totalRevenue.toFixed(2)}€</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Points de vente</span>
              <span className="font-semibold">{client.storesCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dernière connexion</span>
              <span className="font-semibold">
                {client.lastLogin ? new Date(client.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Abonnement jusqu'au</span>
              <span className="font-semibold">
                {new Date(client.subscriptionEnd).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets détaillés */}
      <Tabs defaultValue="stores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stores">Points de vente</TabsTrigger>
          <TabsTrigger value="invoices">Facturation</TabsTrigger>
          <TabsTrigger value="subscription">Abonnements</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Points de vente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Revenus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.stores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell>{store.address}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(store.status)}>
                            {store.status === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {store.revenue.toFixed(2)}€
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique de facturation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Période</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Stripe ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.period}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="font-medium">{invoice.amount.toFixed(2)}€</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(invoice.status)}>
                            {invoice.status === 'paid' ? 'Payée' : 
                             invoice.status === 'pending' ? 'En attente' : 'Échouée'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.stripeInvoiceId && (
                            <code className="text-xs">{invoice.stripeInvoiceId}</code>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des abonnements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Début</TableHead>
                      <TableHead>Fin</TableHead>
                      <TableHead>Montant mensuel</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.subscriptionHistory.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <Badge variant="outline" className={getPlanColor(sub.plan)}>
                            {sub.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(sub.startDate).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{new Date(sub.endDate).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="font-medium">{sub.amount.toFixed(2)}€</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(sub.status)}>
                            {sub.status === 'active' ? 'Actif' : 'Terminé'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}