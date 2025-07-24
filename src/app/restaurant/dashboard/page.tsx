
'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
    Activity,
    ArrowUp,
    Calendar,
    ChevronDown,
    CreditCard,
    DollarSign,
    Users,
    Eye,
    Filter,
    MoreHorizontal
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const chartData = [
  { name: "Jan", revenue: 2800 },
  { name: "Fev", revenue: 3200 },
  { name: "Mar", revenue: 2500 },
  { name: "Avr", revenue: 4100 },
  { name: "Mai", revenue: 3800 },
  { name: "Jui", revenue: 5200 },
]

const recentOrders = [
    { 
      id: "#1024", 
      customer: { phone: "06 12 34 56 78", name: "Alice Martin", status: "Fidèle", avgBasket: "72.50€" }, 
      amount: "67.00€", 
      items: 3 
    },
    { 
      id: "#1023", 
      customer: { phone: "07 87 65 43 21", name: "Bob Dupont" }, 
      amount: "57.90€", 
      items: 2 
    },
    { 
      id: "#1022", 
      customer: { phone: "06 01 02 03 04", name: "", status: "Nouveau" }, 
      amount: "22.50€", 
      items: 1 
    },
    { 
      id: "#1021", 
      customer: { phone: "06 55 44 33 22", name: "David Petit" }, 
      amount: "89.00€", 
      items: 5 
    },
]


export default function RestaurantDashboard() {
  return (
    <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord</h2>
              <p className="text-muted-foreground">Voici un aperçu de la performance de votre restaurant.</p>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtre
                </Button>
                <Button className="h-9">
                    Exporter
                </Button>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">21,495€</div>
                <div className="flex items-center text-xs text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>12% depuis le mois dernier</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">780</div>
                <div className="flex items-center text-xs text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>8.2% depuis le mois dernier</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">27.55€</div>
                <div className="flex items-center text-xs text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>2.1% depuis le mois dernier</span>
                </div>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clients Uniques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">482</div>
                 <div className="flex items-center text-xs text-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    <span>15% depuis le mois dernier</span>
                </div>
              </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Performance des Ventes</CardTitle>
                <CardDescription>Revenus mensuels de votre restaurant.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                        <XAxis
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value/1000}k€`}
                        />
                        <Tooltip
                            cursor={{fill: 'hsl(var(--accent))', radius: 'var(--radius)'}}
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)"
                             }}
                        />
                        <Bar dataKey="revenue" name="Revenu" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </CardContent>
            </Card>

             <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Commandes Récentes</CardTitle>
                <CardDescription>
                  Les dernières commandes passées par téléphone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <Avatar className="hidden h-9 w-9 sm:flex">
                           <AvatarFallback>{order.customer.name ? order.customer.name.charAt(0) : order.customer.phone.slice(-2)}</AvatarFallback>
                         </Avatar>
                         <div className="grid gap-1">
                            <p className="text-sm font-medium leading-none">
                              {order.customer.phone}
                              {order.customer.name && <span className="text-xs text-muted-foreground"> ({order.customer.name})</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.items} article(s)
                              {order.customer.status && 
                                <Badge variant="outline" className={`ml-2 ${order.customer.status === 'Fidèle' ? 'text-green-600 border-green-200' : ''}`}>
                                  {order.customer.status}
                                </Badge>}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-bold">{order.amount}</p>
                         <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground">
                           Voir la fiche
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
        </div>
    </div>
  );
}
