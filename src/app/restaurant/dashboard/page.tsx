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
    Calendar,
    ChevronDown,
    CreditCard,
    DollarSign,
    Users,
    Eye
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

const chartData = [
  { name: "Lun", revenue: 186, orders: 80 },
  { name: "Mar", revenue: 305, orders: 90 },
  { name: "Mer", revenue: 237, orders: 70 },
  { name: "Jeu", revenue: 273, orders: 110 },
  { name: "Ven", revenue: 450, orders: 150 },
  { name: "Sam", revenue: 680, orders: 200 },
  { name: "Dim", revenue: 550, orders: 180 },
]

const recentOrders = [
    { id: "#1024", customer: "Alice Martin", amount: "67.00€", status: "Payée" },
    { id: "#1023", customer: "Bob Dupont", amount: "57.90€", status: "Payée" },
    { id: "#1022", customer: "Carla Durand", amount: "22.50€", status: "En attente" },
    { id: "#1021", customer: "David Petit", amount: "89.00€", status: "Payée" },
    { id: "#1020", customer: "Eve Leroy", amount: "45.00€", status: "Annulée" },
]


export default function RestaurantDashboard() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord</h2>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="h-8">
                    <Calendar className="mr-2 h-4 w-4" />
                    Aujourd'hui
                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2 701€</div>
                <p className="text-xs text-muted-foreground">+20.1% depuis le mois dernier</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+780</div>
                <p className="text-xs text-muted-foreground">+19% depuis le mois dernier</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients Uniques</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+235</div>
                <p className="text-xs text-muted-foreground">+180.1% depuis le mois dernier</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.50€</div>
                <p className="text-xs text-muted-foreground">+2% depuis le mois dernier</p>
              </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Vue d'ensemble</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                 <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}€`}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)"
                             }}
                        />
                        <Legend iconType="circle" />
                        <Bar dataKey="revenue" name="Revenu" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </CardContent>
            </Card>

             <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Commandes Récentes</CardTitle>
                <CardDescription>
                  Il y a eu 780 commandes ce mois-ci.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentOrders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.customer}</TableCell>
                                <TableCell>{order.amount}</TableCell>
                                <TableCell>
                                    <Badge
                                      variant={order.status === 'Payée' ? 'default' : order.status === 'En attente' ? 'secondary' : 'destructive'}
                                      className={
                                        order.status === 'Payée'
                                          ? 'bg-green-100 text-green-800'
                                          : order.status === 'En attente'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }
                                    >
                                      {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>
        </div>
    </div>
  );
}
