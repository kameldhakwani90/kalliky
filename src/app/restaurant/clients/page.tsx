
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Search, Filter, Eye, Phone, Receipt, Flag, Star, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type OrderItem = { name: string; quantity: number; price: string };
type Order = { id: string; date: string; amount: string; items: OrderItem[] };

type Report = {
    id: string;
    date: string;
    reason: string;
    status: 'Ouvert' | 'En cours' | 'Résolu';
    details: string;
};

type Call = {
    id: string;
    date: string;
    duration: string;
    type: 'Commande' | 'Info' | 'Signalement';
    transcript: string;
};

type Customer = {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    address?: string;
    status: 'Nouveau' | 'Fidèle' | 'VIP';
    avgBasket: string;
    totalSpent: string;
    firstSeen: string;
    lastSeen: string;
    orderHistory: Order[];
    callHistory: Call[];
    reportHistory: Report[];
};

const initialCustomers: Customer[] = [
    {
        id: 'cust-1',
        phone: "06 12 34 56 78",
        name: "Alice Martin",
        email: "alice.martin@email.com",
        address: "123 Rue de la Paix, 75001 Paris",
        status: "Fidèle",
        avgBasket: "72.50€",
        totalSpent: "870.00€",
        firstSeen: "12/01/2024",
        lastSeen: "28/05/2024",
        orderHistory: [
            { id: "#1024", date: "28/05/2024", amount: "67.00€", items: [{name: 'Pizza Regina', quantity: 2, price: '14.00€'}, {name: 'Salade César', quantity: 1, price: '12.50€'}] },
            { id: "#987", date: "15/05/2024", amount: "82.50€", items: [] },
        ],
        callHistory: [
            { id: 'call-1', date: "28/05/2024 - 19:30", duration: "3m 45s", type: 'Commande', transcript: "Bonjour, je voudrais commander deux pizzas Regina..." },
            { id: 'call-2', date: "15/05/2024 - 12:10", duration: "4m 10s", type: 'Commande', transcript: "..." },
        ],
        reportHistory: [
            {id: 'rep-1', date: '16/05/2024', reason: 'Retard de livraison', status: 'Résolu', details: 'La commande #987 a été livrée avec 30 minutes de retard. Un geste commercial a été fait.'}
        ]
    },
     {
        id: 'cust-2',
        phone: "07 87 65 43 21",
        name: "Bob Dupont",
        status: "Nouveau",
        avgBasket: "57.90€",
        totalSpent: "57.90€",
        firstSeen: "27/05/2024",
        lastSeen: "27/05/2024",
        orderHistory: [
            { id: "#1023", date: "27/05/2024", amount: "57.90€", items: [{name: 'Burger "Le Personnalisé"', quantity: 2, price: '18.50€'}] },
        ],
        callHistory: [
            { id: 'call-3', date: "27/05/2024 - 20:15", duration: "2m 30s", type: 'Commande', transcript: "..." },
        ],
        reportHistory: []
    },
];


export default function ClientsPage() {
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const handleOpenDialog = (customer: Customer | null) => {
        setSelectedCustomer(customer);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fichier Clients</h1>
                    <p className="text-muted-foreground">Consultez et gérez les informations de vos clients.</p>
                </div>
                <div className="flex items-center gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher par nom, tél..." className="pl-10" />
                    </div>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtres
                    </Button>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Liste de vos clients</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Total Dépensé</TableHead>
                                <TableHead>Dernière Commande</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer.id} className="cursor-pointer" onClick={() => handleOpenDialog(customer)}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{customer.name ? customer.name.slice(0, 2) : 'CL'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p>{customer.name || 'Client Anonyme'}</p>
                                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{customer.email || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={customer.status === 'Fidèle' ? 'text-green-600 border-green-200' : ''}>{customer.status}</Badge>
                                    </TableCell>
                                    <TableCell>{customer.totalSpent}</TableCell>
                                    <TableCell>{customer.lastSeen}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenDialog(customer); }}>
                                            <Eye className="h-4 w-4"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedCustomer && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                         <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                   <AvatarFallback>{selectedCustomer.name ? selectedCustomer.name.slice(0,2) : 'CL'}</AvatarFallback>
                                </Avatar>
                                <div>
                                 {selectedCustomer.name || "Client"}
                                 <p className="text-lg font-normal text-muted-foreground">{selectedCustomer.phone}</p>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto -mx-6 px-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Statut</CardTitle></CardHeader>
                                    <CardContent><p className="text-lg font-semibold flex items-center gap-2"><Star className="text-yellow-500"/> {selectedCustomer.status}</p></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Panier Moyen</CardTitle></CardHeader>
                                    <CardContent><p className="text-lg font-semibold">{selectedCustomer.avgBasket}</p></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Dépensé</CardTitle></CardHeader>
                                    <CardContent><p className="text-lg font-semibold">{selectedCustomer.totalSpent}</p></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Dernière Visite</CardTitle></CardHeader>
                                    <CardContent><p className="text-lg font-semibold">{selectedCustomer.lastSeen}</p></CardContent>
                                </Card>
                            </div>

                            <Tabs defaultValue="orders">
                                <TabsList>
                                    <TabsTrigger value="orders"><Receipt className="mr-2 h-4 w-4"/>Commandes</TabsTrigger>
                                    <TabsTrigger value="calls"><Phone className="mr-2 h-4 w-4"/>Appels</TabsTrigger>
                                    <TabsTrigger value="reports"><Flag className="mr-2 h-4 w-4"/>Signalements</TabsTrigger>
                                </TabsList>
                                <TabsContent value="orders" className="pt-4">
                                     <Card>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Commande</TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Montant</TableHead>
                                                        <TableHead className="text-right">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedCustomer.orderHistory.map(order => (
                                                        <TableRow key={order.id}>
                                                            <TableCell className="font-medium">{order.id} ({order.items.length} art.)</TableCell>
                                                            <TableCell>{order.date}</TableCell>
                                                            <TableCell>{order.amount}</TableCell>
                                                            <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4"/></Button></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="calls" className="pt-4">
                                     <Card>
                                        <CardContent className="p-4 space-y-4">
                                            {selectedCustomer.callHistory.map(call => (
                                                <div key={call.id} className="text-sm p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center justify-between font-medium">
                                                        <p>{call.date}</p>
                                                        <div className="flex items-center gap-4">
                                                            <p className="text-xs text-muted-foreground">{call.type} - {call.duration}</p>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4"/></Button>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-2 italic p-2 border-l-2 border-primary">"{call.transcript}"</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="reports" className="pt-4">
                                     <Card>
                                        <CardContent className="p-0">
                                             <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Raison</TableHead>
                                                        <TableHead>Statut</TableHead>
                                                        <TableHead className="text-right">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                     {selectedCustomer.reportHistory.map(report => (
                                                        <TableRow key={report.id}>
                                                            <TableCell>{report.date}</TableCell>
                                                            <TableCell className="font-medium">{report.reason}</TableCell>
                                                            <TableCell><Badge variant={report.status === 'Résolu' ? 'default' : 'secondary'} className={report.status === 'Résolu' ? 'bg-green-100 text-green-700' : ''}>{report.status}</Badge></TableCell>
                                                            <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4"/></Button></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <DialogFooter className="pt-4 border-t mt-auto">
                            <Button variant="outline">Envoyer un SMS</Button>
                            <Button>Contacter le client</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
