

'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Filter, Eye, MessageSquare, User, Store, Calendar, Edit, Phone, PlayCircle, Printer, Receipt, FileImage, Send, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { format } from 'date-fns';


type ReportStatus = 'Ouvert' | 'En cours' | 'Résolu';

type Call = {
    id: string;
    date: string;
    duration: string;
    type: 'Commande' | 'Info' | 'Signalement';
    transcript: string;
    audioUrl?: string;
};

// Data structures copied from client page for ticket display
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
    date: Date;
    reason: string;
    status: ReportStatus;
    details: string;
    customer: {
        id: string;
        name: string;
        phone: string;
    };
    storeId: string;
    orderId: string;
    call?: Call;
    proofs?: {
        url: string;
        hint: string;
        caption: string;
    }[]
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
    connectionType: 'network' | 'usb';
    ipAddress?: string;
    port?: string;
};

type StoreInfo = {
    id: string;
    name: string;
    address: string;
    whatsappNumber?: string;
    taxRates: TaxRate[];
    printers?: PrinterDevice[];
};

const mockStores: StoreInfo[] = [
    {
        id: "store-1",
        name: "Le Gourmet Parisien",
        address: "12 Rue de la Paix, 75002 Paris",
        whatsappNumber: "+33612345678",
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
        whatsappNumber: "+33611223344",
        taxRates: [
             { id: 'tax-3-1', name: 'À emporter', rate: 5.5, isDefault: true },
             { id: 'tax-3-2', name: 'Sur place', rate: 10, isDefault: false },
        ],
        printers: []
    },
];

const mockOrders: DetailedOrder[] = [
    {
        id: "#987",
        date: "16/05/2025",
        storeId: "store-1",
        items: [
             { id: "item-x", name: 'Plat exemple 1', quantity: 2, basePrice: 25.00, taxRate: 10, customizations: [], finalPrice: 25.00 },
             { id: "item-y", name: 'Boisson exemple 2', quantity: 2, basePrice: 5.00, taxRate: 5.5, customizations: [], finalPrice: 5.00 },
        ],
        total: 60.00
    },
    {
        id: "#1028",
        date: "29/05/2025",
        storeId: "store-3",
        items: [
            { id: "item-pza-4f", name: 'Pizza 4 Fromages', quantity: 1, basePrice: 15.00, taxRate: 10, customizations: [], finalPrice: 15.00 },
            { id: "item-coke", name: 'Coca-cola', quantity: 2, basePrice: 5.00, taxRate: 5.5, customizations: [], finalPrice: 5.00 },
        ],
        total: 25.00,
    },
    {
        id: "#1031",
        date: "30/05/2025",
        storeId: "store-2",
        items: [
             { id: "item-z", name: 'Burger', quantity: 1, basePrice: 18.00, taxRate: 10, customizations: [], finalPrice: 18.00 },
        ],
        total: 18.00
    },
];

const initialReports: Report[] = [
    {
        id: 'rep-1',
        date: new Date(2025, 4, 16),
        reason: 'Retard de livraison',
        status: 'Résolu',
        details: 'La commande a été livrée avec 30 minutes de retard. Un geste commercial (boisson offerte sur la prochaine commande) a été fait.',
        customer: { id: 'cust-1', name: 'Alice Martin', phone: '01 23 45 67 89' },
        storeId: 'store-1',
        orderId: "#987",
        call: { id: 'call-2', date: "15/05/2025 - 12:10", duration: "4m 10s", type: 'Commande', transcript: "Bonjour, je voudrais passer la commande #987...", audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    },
    {
        id: 'rep-2',
        date: new Date(2025, 4, 29),
        reason: 'Erreur dans la commande',
        status: 'Ouvert',
        details: 'Le client a reçu une Pizza Regina au lieu d\'une 4 Fromages.',
        customer: { id: 'cust-3', name: 'Carole Leblanc', phone: '06 11 22 33 44' },
        storeId: 'store-3',
        orderId: "#1028",
        call: { id: 'call-4', date: "29/05/2025 - 19:10", duration: "3m 15s", type: 'Commande', transcript: "Bonjour, je voudrais une pizza 4 fromages et deux coca...", audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
        proofs: [
            {
                url: 'https://placehold.co/600x400.png',
                hint: 'wrong pizza',
                caption: 'Photo envoyée par le client le 29/05/2025'
            }
        ]
    },
    {
        id: 'rep-3',
        date: new Date(2025, 4, 30),
        reason: 'Problème de paiement',
        status: 'En cours',
        details: 'Le paiement par lien n\'a pas fonctionné. Le client a dû payer en espèces à la livraison.',
        customer: { id: 'cust-2', name: 'Bob Dupont', phone: '07 87 65 43 21' },
        storeId: 'store-2',
        orderId: "#1031",
        call: { id: 'call-5', date: "30/05/2025 - 11:45", duration: "2m 50s", type: 'Commande', transcript: "Bonjour, je voudrais commander pour la commande #1031...", audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    }
];

const availableStoresSummary = [
    { id: "store-1", name: "Le Gourmet Parisien - Centre" },
    { id: "store-2", name: "Le Gourmet Parisien - Montmartre"},
    { id: "store-3", name: "Pizzeria Bella - Bastille" },
];

const getStoreName = (id: string) => availableStoresSummary.find(s => s.id === id)?.name || 'N/A';

const statusStyles: Record<ReportStatus, string> = {
    'Ouvert': 'bg-red-100 text-red-800',
    'En cours': 'bg-yellow-100 text-yellow-800',
    'Résolu': 'bg-green-100 text-green-800',
};

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

const isMobilePhone = (phone: string): boolean => {
    const mobilePrefixes = ['06', '07'];
    const cleanedPhone = phone.replace(/\s/g, '');
    return mobilePrefixes.some(prefix => cleanedPhone.startsWith(prefix));
}

const ITEMS_PER_PAGE = 10;

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>(initialReports);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
    
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE);

    const paginatedReports = reports.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    
    const ticketRef = useRef<HTMLDivElement>(null);
    
    const [whatsappNumberInput, setWhatsappNumberInput] = useState('');
    const currentUserPlan = 'pro'; // 'starter', 'pro', or 'business'

    const handleViewReport = (report: Report) => {
        setSelectedReport(report);
        setIsReportDialogOpen(true);
    };
    
    const handleStatusChange = (newStatus: ReportStatus) => {
        if (!selectedReport) return;
        const updatedReport = { ...selectedReport, status: newStatus };
        setSelectedReport(updatedReport);
        setReports(prev => prev.map(r => r.id === selectedReport.id ? updatedReport : r));
    }
    
    const handlePrint = () => {
        const order = selectedReport ? mockOrders.find(o => o.id === selectedReport.orderId) : null;
        if (!order) return;

        const ticketElement = ticketRef.current;
        const storeInfo = getStoreInfo(order.storeId);
        if (!ticketElement || !storeInfo) return;

        const receiptPrinter = storeInfo.printers?.find(p => p.role === 'receipt');
        const printerToUse = receiptPrinter || storeInfo.printers?.[0];

        if (!printerToUse) {
            console.error("No printer configured for this store.");
            return;
        }

        ticketElement.classList.remove('width-58mm', 'width-80mm');
        ticketElement.classList.add(`width-${printerToUse.width}`);
        window.print();
    };

    const currentOrderForTicket = selectedReport ? mockOrders.find(o => o.id === selectedReport.orderId) : null;
    const currentStoreForTicket = currentOrderForTicket ? getStoreInfo(currentOrderForTicket.storeId) : null;
    const currentCalculatedTotals = currentOrderForTicket ? calculateOrderTotals(currentOrderForTicket) : null;

    const translations = {
        previous: { fr: "Précédent", en: "Previous" },
        next: { fr: "Suivant", en: "Next" },
        pageOf: { fr: "Page {current} sur {total}", en: "Page {current} of {total}" },
    };


    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Signalements</h1>
                    <p className="text-muted-foreground">Consultez et traitez les réclamations et retours de vos clients.</p>
                </div>
                 
            </header>

            <Card>
                <CardHeader>
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                     <CardTitle>Liste des signalements</CardTitle>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                         <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rechercher un signalement..." className="pl-10" />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className="w-full sm:w-[240px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Choisir une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <ShadcnCalendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                   </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="hidden md:table-cell">Boutique</TableHead>
                                    <TableHead>Raison</TableHead>
                                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedReports.map((report) => (
                                    <TableRow key={report.id} className="cursor-pointer" onClick={() => handleViewReport(report)}>
                                        <TableCell className="font-medium">
                                            <p>{report.customer.name}</p>
                                            <p className="text-xs text-muted-foreground">{report.customer.phone}</p>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{getStoreName(report.storeId)}</TableCell>
                                        <TableCell>{report.reason}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{format(report.date, "dd/MM/yyyy")}</TableCell>
                                        <TableCell>
                                            <Badge className={statusStyles[report.status]}>{report.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewReport(report); }}>
                                                <Eye className="h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="flex items-center justify-between w-full">
                        <div className="text-xs text-muted-foreground">
                            {translations.pageOf.fr.replace('{current}', currentPage.toString()).replace('{total}', totalPages.toString())}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                {translations.previous.fr}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                {translations.next.fr}
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            </Card>
            
            {selectedReport && (
                 <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-headline">Détail du Signalement</DialogTitle>
                            <DialogDescription>
                                Signalement n°{selectedReport.id} - {selectedReport.reason}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 flex-1 overflow-y-auto">
                           <div className="md:col-span-2 space-y-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4"/> Description</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{selectedReport.details}</p>
                                        <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={() => setIsTicketDialogOpen(true)}>
                                            <Receipt className="mr-2 h-4 w-4"/> Voir le ticket (Commande {selectedReport.orderId})
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><FileImage className="h-4 w-4"/> Preuves du client</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedReport.proofs && selectedReport.proofs.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {selectedReport.proofs.map((proof, i) => (
                                                    <div key={i} className="space-y-2">
                                                        <Image
                                                            src={proof.url}
                                                            alt={proof.caption}
                                                            width={300}
                                                            height={200}
                                                            data-ai-hint={proof.hint}
                                                            className="rounded-md object-cover border"
                                                        />
                                                        <p className="text-xs text-muted-foreground">{proof.caption}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">Aucune preuve fournie.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {selectedReport.call && (
                                     <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base flex items-center gap-2"><PlayCircle className="h-4 w-4"/> Échange téléphonique lié</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <audio controls className="w-full h-10" src={selectedReport.call.audioUrl} />
                                            <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded-md line-clamp-2">
                                                {selectedReport.call.transcript}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                 <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><Edit className="h-4 w-4"/> Notes internes</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea placeholder="Ajouter une note pour le suivi..."/>
                                    </CardContent>
                                </Card>
                           </div>
                           <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Statut du ticket</Label>
                                    <Select value={selectedReport.status} onValueChange={(value: ReportStatus) => handleStatusChange(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ouvert">Ouvert</SelectItem>
                                            <SelectItem value="En cours">En cours</SelectItem>
                                            <SelectItem value="Résolu">Résolu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4"/> Client</CardTitle>
                                    </CardHeader>
                                     <CardContent>
                                        <p className="font-medium">{selectedReport.customer.name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedReport.customer.phone}</p>
                                        <Button variant="link" size="sm" className="p-0 h-auto mt-1" asChild>
                                            <Link href={`/app/clients/${selectedReport.customer.id}`}>
                                                Voir la fiche client
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4"/> Boutique</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm font-medium">{getStoreName(selectedReport.storeId)}</p>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4"/> Date</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm font-medium">{format(selectedReport.date, 'dd/MM/yyyy')}</p>
                                    </CardContent>
                                </Card>
                           </div>
                        </div>
                        <DialogFooter className="border-t pt-4 flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="secondary" disabled={currentUserPlan === 'starter'}>
                                        <Send className="mr-2 h-4 w-4" /> Demander une preuve
                                        {currentUserPlan === 'starter' && <Badge className="ml-2">Plan Pro</Badge>}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmer la demande de preuve ?</AlertDialogTitle>
                                        {isMobilePhone(selectedReport.customer.phone) ? (
                                            <AlertDialogDescription>
                                                Un **SMS** va être envoyé automatiquement à <span className="font-semibold">{selectedReport.customer.phone}</span> pour lui demander une preuve. Il sera invité à répondre par photo sur le numéro WhatsApp de la boutique.
                                            </AlertDialogDescription>
                                        ) : (
                                            <>
                                                <AlertDialogDescription>
                                                    Le numéro du client (<span className="font-semibold">{selectedReport.customer.phone}</span>) semble être une ligne fixe. Veuillez renseigner son numéro WhatsApp pour lui envoyer la demande.
                                                </AlertDialogDescription>
                                                <div className="mt-4 pt-4 border-t">
                                                    <Label htmlFor="whatsapp-input">Numéro WhatsApp du client</Label>
                                                    <Input id="whatsapp-input" placeholder="Ex: 0612345678" value={whatsappNumberInput} onChange={(e) => setWhatsappNumberInput(e.target.value)} />
                                                </div>
                                            </>
                                        )}
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction>Confirmer et envoyer</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <div className="flex-grow"></div>
                            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Fermer</Button>
                            <Button>Enregistrer les modifications</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {isTicketDialogOpen && currentOrderForTicket && currentStoreForTicket && currentCalculatedTotals && (
                <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="sr-only">Ticket de commande {currentOrderForTicket.id}</DialogTitle>
                            <DialogDescription className="sr-only">
                                Détail de la commande {currentOrderForTicket.id} pour {currentStoreForTicket.name}.
                            </DialogDescription>
                        </DialogHeader>
                        <div ref={ticketRef} className="printable-ticket font-mono p-2 bg-white text-black">
                            <div className="text-center space-y-2 mb-4">
                                <h2 className="text-lg font-bold">{currentStoreForTicket.name}</h2>
                                <p className="text-xs">{currentStoreForTicket.address}</p>
                                <p className="text-xs">Commande {currentOrderForTicket.id} - {currentOrderForTicket.date}</p>
                            </div>
                            
                            <Separator className="border-dashed border-black" />

                            <div className="space-y-2 my-2 text-xs">
                                {currentOrderForTicket.items.map((item, index) => (
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
                                <span>{currentCalculatedTotals.totalTTC.toFixed(2)}€</span>
                            </div>

                            <Separator className="border-dashed border-black" />

                            <div className="space-y-1 my-2 text-xs">
                            <p className="font-bold">Détail TVA incluse :</p>
                            {currentCalculatedTotals.taxDetails.map(tax => (
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
                             {(currentStoreForTicket.printers && currentStoreForTicket.printers.length > 0) ? (
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

        </div>
    );
}
