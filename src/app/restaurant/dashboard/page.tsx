
'use client';

import { useState } from "react";
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
    MoreHorizontal,
    Phone,
    MessageSquare,
    Star,
    Receipt
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const chartData = [
  { name: "Jan", revenue: 2800 },
  { name: "Fev", revenue: 3200 },
  { name: "Mar", revenue: 2500 },
  { name: "Avr", revenue: 4100 },
  { name: "Mai", revenue: 3800 },
  { name: "Jui", revenue: 5200 },
]

type Customer = {
    phone: string;
    name?: string;
    status: 'Nouveau' | 'Fidèle' | 'VIP';
    avgBasket: string;
    totalSpent: string;
    firstSeen: string;
    lastSeen: string;
    orderHistory: { id: string; date: string; amount: string; items: number }[];
    callHistory: { date: string; duration: string; type: 'Commande' | 'Info' }[];
};

const customersData: Record<string, Customer> = {
    "0612345678": {
        phone: "06 12 34 56 78",
        name: "Alice Martin",
        status: "Fidèle",
        avgBasket: "72.50€",
        totalSpent: "870.00€",
        firstSeen: "12/01/2024",
        lastSeen: "28/05/2024",
        orderHistory: [
            { id: "#1024", date: "28/05/2024", amount: "67.00€", items: 3 },
            { id: "#987", date: "15/05/2024", amount: "82.50€", items: 4 },
            { id: "#955", date: "02/05/2024", amount: "65.00€", items: 2 },
        ],
        callHistory: [
            { date: "28/05/2024 - 19:30", duration: "3m 45s", type: 'Commande' },
            { date: "15/05/2024 - 12:10", duration: "4m 10s", type: 'Commande' },
        ]
    },
     "0787654321": {
        phone: "07 87 65 43 21",
        name: "Bob Dupont",
        status: "Nouveau",
        avgBasket: "57.90€",
        totalSpent: "57.90€",
        firstSeen: "27/05/2024",
        lastSeen: "27/05/2024",
        orderHistory: [
            { id: "#1023", date: "27/05/2024", amount: "57.90€", items: 2 },
        ],
        callHistory: [
            { date: "27/05/2024 - 20:15", duration: "2m 30s", type: 'Commande' },
        ]
    },
};

const recentOrders = [
    { 
      id: "#1024", 
      customerPhone: "0612345678",
      amount: "67.00€", 
      items: 3 
    },
    { 
      id: "#1023", 
      customerPhone: "0787654321",
      amount: "57.90€", 
      items: 2 
    },
    { 
      id: "#1022", 
      customerPhone: "0601020304",
      amount: "22.50€", 
      items: 1 
    },
    { 
      id: "#1021", 
      customerPhone: "0655443322",
      amount: "89.00€", 
      items: 5 
    },
]

// Default customer for phones not in customersData
const defaultCustomer = (phone: string): Customer => ({
    phone: phone.replace(/(\d{2})(?=\d)/g, '$1 '),
    status: 'Nouveau',
    avgBasket: 'N/A',
    totalSpent: 'N/A',
    firstSeen: new Date().toLocaleDateString('fr-FR'),
    lastSeen: new Date().toLocaleDateString('fr-FR'),
    orderHistory: [],
    callHistory: []
})


export default function RestaurantDashboard() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isClientFileOpen, setClientFileOpen] = useState(false);

  const handleViewClientFile = (phone: string) => {
    const customerData = customersData[phone] || defaultCustomer(phone);
    setSelectedCustomer(customerData);
    setClientFileOpen(true);
  };
    
  return (
    <>
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
                  {recentOrders.map(order => {
                    const customer = customersData[order.customerPhone] || defaultCustomer(order.customerPhone);
                    return (
                        <div key={order.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="hidden h-9 w-9 sm:flex">
                                <AvatarFallback>{customer.name ? customer.name.charAt(0) : customer.phone.slice(-2)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1">
                                <p className="text-sm font-medium leading-none">
                                {customer.phone}
                                {customer.name && <span className="text-xs text-muted-foreground"> ({customer.name})</span>}
                                </p>
                                <div className="text-xs text-muted-foreground">
                                {order.items} article(s)
                                {customer.status && 
                                    <Badge variant="outline" className={`ml-2 ${customer.status === 'Fidèle' ? 'text-green-600 border-green-200' : ''}`}>
                                    {customer.status}
                                    </Badge>}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">{order.amount}</p>
                            <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground" onClick={() => handleViewClientFile(order.customerPhone)}>
                                Voir la fiche
                            </Button>
                        </div>
                        </div>
                    )
                   })}
                </div>
              </CardContent>
            </Card>
        </div>
    </div>
    {selectedCustomer && (
        <Dialog open={isClientFileOpen} onOpenChange={setClientFileOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                           <AvatarFallback>{selectedCustomer.name ? selectedCustomer.name.charAt(0) : selectedCustomer.phone.slice(-2)}</AvatarFallback>
                        </Avatar>
                        <div>
                         {selectedCustomer.name || "Client"}
                         <p className="text-lg font-normal text-muted-foreground">{selectedCustomer.phone}</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Statut</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold flex items-center gap-2"><Star className="text-yellow-500"/> {selectedCustomer.status}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Panier Moyen</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold">{selectedCustomer.avgBasket}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Dépensé</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold">{selectedCustomer.totalSpent}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Dernière Visite</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold">{selectedCustomer.lastSeen}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Historique des Commandes</h3>
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Commande</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Montant</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedCustomer.orderHistory.length > 0 ? selectedCustomer.orderHistory.map(order => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">{order.id} ({order.items} art.)</TableCell>
                                                    <TableCell>{order.date}</TableCell>
                                                    <TableCell className="text-right">{order.amount}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center h-24">Aucune commande</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Historique des Appels</h3>
                             <Card>
                                <CardContent className="p-4 space-y-4">
                                     {selectedCustomer.callHistory.length > 0 ? selectedCustomer.callHistory.map((call, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-4 w-4 text-muted-foreground"/>
                                                <div>
                                                    <p className="font-medium">{call.date}</p>
                                                    <p className="text-xs text-muted-foreground">{call.type} - Durée: {call.duration}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Eye className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                     )) : (
                                        <div className="text-center h-24 flex items-center justify-center text-sm text-muted-foreground">Aucun appel</div>
                                     )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
                 <DialogFooter className="pt-4 border-t">
                    <Button variant="outline">Envoyer un SMS</Button>
                    <Button>Contacter le client</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}
    </>
  );
}
