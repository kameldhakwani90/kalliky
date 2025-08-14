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
import {
  Users,
  DollarSign,
  ClipboardList,
  Activity,
  CheckCircle,
  Clock,
} from 'lucide-react';

const kpiData = [
  {
    title: 'Restaurateurs Inscrits',
    value: '128',
    icon: <Users className="h-6 w-6 text-muted-foreground" />,
  },
  {
    title: 'Revenus Mensuels (MRR)',
    value: '8,450€',
    icon: <DollarSign className="h-6 w-6 text-muted-foreground" />,
  },
  {
    title: 'Commandes Générées (Mois)',
    value: '4,210',
    icon: <ClipboardList className="h-6 w-6 text-muted-foreground" />,
  },
  {
    title: 'Commissions Collectées',
    value: '1,230€',
    icon: <Activity className="h-6 w-6 text-muted-foreground" />,
  },
];

const restaurants = [
  {
    name: 'Le Gourmet Parisien',
    email: 'contact@gourmet.fr',
    stripeStatus: 'connecté',
    plan: 'Pro',
    orders: 120,
    revenue: '2,400€',
  },
  {
    name: 'Pizzeria Bella',
    email: 'bella@pizza.it',
    stripeStatus: 'en attente',
    plan: 'Starter',
    orders: 45,
    revenue: '890€',
  },
  {
    name: 'Sushi Zen',
    email: 'sushi@zen.jp',
    stripeStatus: 'connecté',
    plan: 'Business',
    orders: 250,
    revenue: '6,200€',
  },
  {
    name: 'Burger Corner',
    email: 'contact@burger-corner.com',
    stripeStatus: 'connecté',
    plan: 'Pro',
    orders: 180,
    revenue: '3,100€',
  },
];

export default function AdminDashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord Administrateur</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Restaurateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Statut Stripe</TableHead>
                  <TableHead className="hidden sm:table-cell">Plan</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Commandes (Mois)</TableHead>
                  <TableHead className="text-right">CA (Mois)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants.map((resto) => (
                  <TableRow key={resto.name}>
                    <TableCell className="font-medium">{resto.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{resto.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={resto.stripeStatus === 'connecté' ? 'default' : 'secondary'}
                        className={resto.stripeStatus === 'connecté' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}
                      >
                        {resto.stripeStatus === 'connecté' ? (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        ) : (
                          <Clock className="mr-2 h-4 w-4" />
                        )}
                        {resto.stripeStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                       <Badge variant="outline">{resto.plan}</Badge>
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">{resto.orders}</TableCell>
                    <TableCell className="text-right">{resto.revenue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
