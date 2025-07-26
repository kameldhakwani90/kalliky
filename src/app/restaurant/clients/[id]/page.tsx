

'use client';

import { useState, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Receipt, Phone, Flag, Star, Edit, Save, PlayCircle, MessageSquare, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


type OrderItemCustomization = {
    type: 'add' | 'remove';
    name: string;
    price?: number;
};

type DetailedOrderItem = {
    id: string;
    name: string;
    quantity: number;
    basePrice: number;
    customizations: OrderItemCustomization[];
    finalPrice: number;
    taxRate: number; 
};

type OrderTotals = {
    totalTTC: number;
    taxDetails: { rate: number; amount: number }[];
};


type DetailedOrder = {
    id: string;
    date: string;
    items: DetailedOrderItem[];
    total: number;
    storeId: string;
};


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
    audioUrl?: string;
};

type Customer = {
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    address?: string;
    birthDate?: string;
    gender?: 'Homme' | 'Femme' | 'Autre';
    status: 'Nouveau' | 'Fidèle' | 'VIP';
    avgBasket: string;
    totalSpent: string;
    firstSeen: string;
    lastSeen: string;
    orderHistory: DetailedOrder[];
    callHistory: Call[];
    reportHistory: Report[];
};

type TaxRate = {
    id: string;
    name: string;
    rate: number;
    isDefault: boolean;
};

type PrinterDevice = {
    id: string;
    name: string;
    role: 'kitchen' | 'receipt';
    width: '58mm' | '80mm';
};

type Store = {
    id: string;
    name: string;
    address: string;
    taxRates: TaxRate[];
    printers?: PrinterDevice[];
};


const mockStores: Store[] = [
    {
        id: "store-1",
        name: "Le Gourmet Parisien",
        address: "12 Rue de la Paix, 75002 Paris",
        taxRates: [
            { id: 'tax-1', name: 'Réduit', rate: 5.5, isDefault: false },
            { id: 'tax-2', name: 'Intermédiaire', rate: 10, isDefault: true },
            { id: 'tax-3', name: 'Normal', rate: 20, isDefault: false },
        ],
        printers: [
            { id: 'p1', name: 'Imprimante Caisse', role: 'receipt', width: '80mm' },
            { id: 'p2', name: 'Imprimante Cuisine', role: 'kitchen', width: '58mm' },
        ]
    },
    {
        id: "store-2",
        name: "Pizzeria Bella",
        address: "3 Rue de la Roquette, 75011 Paris",
        taxRates: [
             { id: 'tax-1', name: 'À emporter', rate: 5.5, isDefault: true },
             { id: 'tax-2', name: 'Sur place', rate: 10, isDefault: false },
        ]
    },
    {
        id: "store-3",
        name: "Pizzeria Bella - Bastille",
        address: "3 Rue de la Roquette, 75011 Paris",
        taxRates: [
             { id: 'tax-3-1', name: 'À emporter', rate: 5.5, isDefault: true },
             { id: 'tax-3-2', name: 'Sur place', rate: 10, isDefault: false },
        ],
        printers: []
    },
];

const mockOrders: DetailedOrder[] = [
    {
        id: "#1024",
        date: "28/05/2024",
        storeId: "store-1",
        items: [
            {
                id: "item-1", name: 'Burger "Le Personnalisé"', quantity: 1, basePrice: 16.50, taxRate: 10, customizations: [
                    { type: 'add', name: 'Bacon grillé', price: 2.00 },
                    { type: 'add', name: 'Oeuf au plat', price: 1.00 },
                    { type: 'remove', name: 'Oignons' }
                ], finalPrice: 19.50
            },
            { id: "item-2", name: 'Bière Blonde', quantity: 1, basePrice: 6.00, taxRate: 20, customizations: [], finalPrice: 6.00 },
            { id: "item-3", name: 'Eau (bouteille)', quantity: 1, basePrice: 2.50, taxRate: 5.5, customizations: [], finalPrice: 2.50 },
        ],
        total: 28.00,
    },
     { id: "#987", date: "15/05/2024", storeId: "store-1", items: [], total: 90.75 },
     {
        id: "#1028",
        date: "29/05/2024",
        storeId: "store-3",
        items: [
            { id: "item-pza-4f", name: 'Pizza 4 Fromages', quantity: 1, basePrice: 15.00, taxRate: 10, customizations: [], finalPrice: 15.00 },
            { id: "item-coke", name: 'Coca-cola', quantity: 2, basePrice: 5.00, taxRate: 5.5, customizations: [], finalPrice: 5.00 },
        ],
        total: 25.00,
    },
];


const mockCustomers: Customer[] = [
    {
        id: 'cust-1',
        phone: "06 12 34 56 78",
        firstName: "Alice",
        lastName: "Martin",
        email: "alice.martin@email.com",
        address: "123 Rue de la Paix, 75001 Paris",
        birthDate: '1990-05-15',
        gender: 'Femme',
        status: "Fidèle",
        avgBasket: "72.50€",
        totalSpent: "870.00€",
        firstSeen: "12/01/2024",
        lastSeen: "28/05/2024",
        orderHistory: mockOrders.filter(o => ['#1024', '#987'].includes(o.id)),
        callHistory: [
            { id: 'call-1', date: "28/05/2024 - 19:30", duration: "3m 45s", type: 'Commande', transcript: "Bonjour, je voudrais commander un burger personnalisé avec bacon et oeuf, sans oignons. Et aussi une salade César s'il vous plaît. Ce sera pour une livraison au 123 Rue de la Paix. Merci.", audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
            { id: 'call-2', date: "15/05/2024 - 12:10", duration: "4m 10s", type: 'Commande', transcript: "...", audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
        ],
        reportHistory: [
            {id: 'rep-1', date: '16/05/2024', reason: 'Retard de livraison', status: 'Résolu', details: 'La commande #987 a été livrée avec 30 minutes de retard. Un geste commercial (boisson offerte sur la prochaine commande) a été fait.'}
        ]
    },
     {
        id: 'cust-2',
        phone: "07 87 65 43 21",
        firstName: "Bob",
        lastName: "Dupont",
        status: "Nouveau",
        avgBasket: "57.90€",
        totalSpent: "57.90€",
        firstSeen: "27/05/2024",
        lastSeen: "27/05/2024",
        orderHistory: [],
        callHistory: [
            { id: 'call-3', date: "27/05/2024 - 20:15", duration: "2m 30s", type: 'Commande', transcript: "Salut, je voudrais deux burgers personnalisés. Viande bien cuite pour les deux s'il vous plait. À emporter. C'est tout !", audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
        ],
        reportHistory: []
    },
    {
        id: 'cust-3',
        phone: "06 11 22 33 44",
        firstName: "Carole",
        lastName: "Leblanc",
        status: "Nouveau",
        avgBasket: "25.00€",
        totalSpent: "25.00€",
        firstSeen: "29/05/2024",
        lastSeen: "29/05/2024",
        orderHistory: mockOrders.filter(o => o.id === '#1028'),
        callHistory: [],
        reportHistory: [
            {id: 'rep-2', date: '29/05/2024', reason: 'Erreur dans la commande', status: 'Ouvert', details: 'Le client a reçu une Pizza Regina au lieu d\'une 4 Fromages. Commande #1028.'}
        ]
    },
];

const getStoreInfo = (storeId: string) => mockStores.find(s => s.id === storeId);

const calculateOrderTotals = (order: DetailedOrder): OrderTotals => {
    const taxBreakdown: Record<number, { baseTTC: number }> = {};
    let totalTTC = 0;

    order.items.forEach(item => {
        const itemTTC = item.finalPrice * item.quantity;
        totalTTC += itemTTC;
        
        const rate = item.taxRate;
        
        if (!taxBreakdown[rate]) {
            taxBreakdown[rate] = { baseTTC: 0 };
        }
        taxBreakdown[rate].baseTTC += itemTTC;
    });

    const taxDetails = Object.entries(taxBreakdown).map(([rateStr, { baseTTC }]) => {
        const rate = parseFloat(rateStr);
        const amount = baseTTC - (baseTTC / (1 + rate / 100));
        return {
            rate: rate,
            amount: amount,
        };
    });

    return { totalTTC, taxDetails };
};



export default function ClientProfilePage() {
    const params = useParams();
    const customerId = params.id as string;
    const customer = mockCustomers.find(c => c.id === customerId);

    const [isEditing, setIsEditing] = useState(false);
    const [editedCustomer, setEditedCustomer] = useState<Customer | null>(customer ? { ...customer } : null);
    const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null);
    const [isOrderTicketOpen, setOrderTicketOpen] = useState(false);
    const ticketRef = useRef<HTMLDivElement>(null);

    if (!customer || !editedCustomer) {
        return notFound();
    }

    const handleInputChange = (field: keyof Customer, value: string) => {
        setEditedCustomer(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSave = () => {
        console.log("Saving customer data:", editedCustomer);
        setIsEditing(false);
    };

    const handleViewOrderTicket = (order: DetailedOrder) => {
        setSelectedOrder(order);
        setOrderTicketOpen(true);
    }
    
    const handlePrint = () => {
        const ticketElement = ticketRef.current;
        if (!ticketElement) return;

        const receiptPrinter = storePrinters?.find(p => p.role === 'receipt');
        const printerToUse = receiptPrinter || storePrinters?.[0]; // Fallback to the first printer if no receipt printer is found

        if (!printerToUse) {
            console.error("No printer configured for this store.");
            // Optionally, show a toast to the user
            return;
        }

        // Remove any existing width classes
        ticketElement.classList.remove('width-58mm', 'width-80mm');
        
        // Add the desired width class
        ticketElement.classList.add(`width-${printerToUse.width}`);

        // Trigger print
        window.print();
    };


    const calculatedTotals = selectedOrder ? calculateOrderTotals(selectedOrder) : null;
    const storePrinters = selectedOrder ? getStoreInfo(selectedOrder.storeId)?.printers : [];

    return (
        <>
        <div className="space-y-6">
            <header className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                     <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-xl">
                            {(editedCustomer.firstName ? editedCustomer.firstName.charAt(0) : '') + (editedCustomer.lastName ? editedCustomer.lastName.charAt(0) : '') || 'CL'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{editedCustomer.firstName} {editedCustomer.lastName}</h1>
                        <p className="text-muted-foreground">{editedCustomer.phone}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/>Enregistrer</Button>
                    ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button><Edit className="mr-2 h-4 w-4"/>Modifier</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Fonctionnalité en cours de développement</AlertDialogTitle>
                              <AlertDialogDescription>
                                La modification des fiches clients sera bientôt disponible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Compris</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Statut</CardTitle></CardHeader>
                    <CardContent><p className="text-lg font-semibold flex items-center gap-2"><Star className="text-yellow-500"/> {customer.status}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Panier Moyen</CardTitle></CardHeader>
                    <CardContent><p className="text-lg font-semibold">{customer.avgBasket}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Dépensé</CardTitle></CardHeader>
                    <CardContent><p className="text-lg font-semibold">{customer.totalSpent}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Dernière Visite</CardTitle></CardHeader>
                    <CardContent><p className="text-lg font-semibold">{customer.lastSeen}</p></CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations Personnelles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Prénom</Label>
                                <Input value={editedCustomer.firstName || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('firstName', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Nom</Label>
                                <Input value={editedCustomer.lastName || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('lastName', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={editedCustomer.email || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('email', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label>Adresse</Label>
                                <Input value={editedCustomer.address || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('address', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label>Date de naissance</Label>
                                <Input type="date" value={editedCustomer.birthDate || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('birthDate', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Genre</Label>
                                <Select value={editedCustomer.gender || ''} disabled={!isEditing} onValueChange={(value) => handleInputChange('gender', value)}>
                                    <SelectTrigger><SelectValue placeholder="Non spécifié" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Homme">Homme</SelectItem>
                                        <SelectItem value="Femme">Femme</SelectItem>
                                        <SelectItem value="Autre">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Tabs defaultValue="orders">
                        <TabsList className="mb-4">
                            <TabsTrigger value="orders"><Receipt className="mr-2 h-4 w-4"/>Historique des Commandes</TabsTrigger>
                            <TabsTrigger value="calls"><Phone className="mr-2 h-4 w-4"/>Historique des Appels</TabsTrigger>
                            <TabsTrigger value="reports"><Flag className="mr-2 h-4 w-4"/>Historique des Signalements</TabsTrigger>
                        </TabsList>
                        <TabsContent value="orders">
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Commande</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Montant (TTC)</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customer.orderHistory.map(order => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">{order.id} ({order.items.length} art.)</TableCell>
                                                    <TableCell>{order.date}</TableCell>
                                                    <TableCell>{calculateOrderTotals(order).totalTTC.toFixed(2)}€</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewOrderTicket(order)}>
                                                            <Eye className="h-4 w-4"/>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="calls">
                            <Card>
                                <CardContent className="p-4 space-y-4">
                                    {customer.callHistory.map(call => (
                                        <div key={call.id} className="text-sm p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center justify-between font-medium">
                                                <p>{call.date}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary">{call.type}</Badge>
                                                    <p className="text-xs text-muted-foreground">{call.duration}</p>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-8">
                                                                <PlayCircle className="mr-2 h-4 w-4"/> Lire l'échange
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Détails de l'appel</DialogTitle>
                                                                <DialogDescription>{call.date} - {call.duration}</DialogDescription>
                                                            </DialogHeader>
                                                            {call.audioUrl && (
                                                                <div className="my-4">
                                                                    <audio controls className="w-full">
                                                                        <source src={call.audioUrl} type="audio/mpeg" />
                                                                        Your browser does not support the audio element.
                                                                    </audio>
                                                                </div>
                                                            )}
                                                            <div className="my-4 p-4 bg-muted rounded-md text-sm max-h-64 overflow-y-auto">
                                                                <p className="font-semibold mb-2">Transcription :</p>
                                                                <p className="whitespace-pre-wrap leading-relaxed">
                                                                    {call.transcript}
                                                                </p>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button variant="outline">Fermer</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="reports">
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
                                                {customer.reportHistory.map(report => (
                                                <TableRow key={report.id}>
                                                    <TableCell>{report.date}</TableCell>
                                                    <TableCell className="font-medium">{report.reason}</TableCell>
                                                    <TableCell><Badge variant={report.status === 'Résolu' ? 'default' : 'secondary'} className={report.status === 'Résolu' ? 'bg-green-100 text-green-700' : ''}>{report.status}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4"/></Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Détails du Signalement</DialogTitle>
                                                                    <DialogDescription>{report.reason} - {report.date}</DialogDescription>
                                                                </DialogHeader>
                                                                <div className="my-4 p-4 bg-muted rounded-md text-sm">
                                                                    <p>{report.details}</p>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
        {selectedOrder && calculatedTotals && (
            <Dialog open={isOrderTicketOpen} onOpenChange={setOrderTicketOpen}>
                <DialogContent className="sm:max-w-md">
                   <DialogHeader>
                        <DialogTitle className="sr-only">Ticket de commande {selectedOrder.id}</DialogTitle>
                        <DialogDescription className="sr-only">
                            Détail de la commande {selectedOrder.id} for {getStoreInfo(selectedOrder.storeId)?.name}.
                        </DialogDescription>
                    </DialogHeader>
                   <div ref={ticketRef} className="printable-ticket font-mono p-2 bg-white text-black">
                        <div className="text-center space-y-2 mb-4">
                            <h2 className="text-lg font-bold">{getStoreInfo(selectedOrder.storeId)?.name}</h2>
                            <p className="text-xs">{getStoreInfo(selectedOrder.storeId)?.address}</p>
                            <p className="text-xs">Commande {selectedOrder.id} - {selectedOrder.date}</p>
                        </div>
                        
                        <Separator className="border-dashed border-black" />

                        <div className="space-y-2 my-2 text-xs">
                            {selectedOrder.items.map((item, index) => (
                                <div key={item.id + index}>
                                    <div className="flex justify-between">
                                        <span className="font-bold">{item.quantity}x {item.name}</span>
                                        <span className="font-bold">{(item.finalPrice * item.quantity).toFixed(2)}€</span>
                                    </div>
                                    {item.customizations.length > 0 && (
                                        <div className="pl-4 mt-1 space-y-1">
                                            {item.customizations.map((cust, cIndex) => (
                                                <div key={cIndex} className={`flex justify-between ${cust.type === 'remove' ? 'text-red-500' : ''}`}>
                                                    <span>{cust.type === 'add' ? '+' : '-'} {cust.name}</span>
                                                    {cust.price && <span>{cust.price.toFixed(2)}€</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <Separator className="border-dashed border-black" />

                        <div className="flex justify-between font-bold text-base my-2">
                            <span>TOTAL TTC</span>
                            <span>{calculatedTotals.totalTTC.toFixed(2)}€</span>
                        </div>

                        <Separator className="border-dashed border-black" />

                        <div className="space-y-1 my-2 text-xs">
                           <p className="font-bold">Détail TVA incluse :</p>
                           {calculatedTotals.taxDetails.map(tax => (
                                <div key={tax.rate} className="flex justify-between">
                                    <span>TVA ({tax.rate.toFixed(2)}%)</span>
                                    <span>{tax.amount.toFixed(2)}€</span>
                                </div>
                            ))}
                        </div>

                         <Separator className="border-dashed border-black" />

                         <div className="text-center text-xs pt-2">
                            Merci de votre visite !
                         </div>
                    </div>
                    <DialogFooter className="print-hide mt-4">
                        {(storePrinters && storePrinters.length > 0) ? (
                            <Button className="w-full font-sans" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" /> Imprimer
                            </Button>
                        ) : (
                             <Button className="w-full font-sans" disabled>
                                <Printer className="mr-2 h-4 w-4" /> Aucune imprimante configurée
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
        </>
    );
}
