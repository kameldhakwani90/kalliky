

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
import { Eye, Receipt, Phone, Flag, Star, Edit, Save, PlayCircle, MessageSquare, Printer, Languages, Loader2, Calendar, Ticket, ArrowRight } from 'lucide-react';
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
import { useLanguage } from '@/contexts/language-context';
import { translateText } from '@/ai/flows/translate-flow';


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
    type: 'order';
    id: string;
    date: string;
    items: DetailedOrderItem[];
    total: number;
    storeId: string;
};

// Structures for reservation ticket
type ReservationPricingDetail = {
    description: string; // e.g., "Location Porsche 911 (2 jours x 950.00€)"
    amount: number;
};

type HistoryReservation = {
    type: 'reservation';
    id: string;
    date: string;
    serviceName: string;
    total: number;
    storeId: string;
    taxRate: number;
    pricingDetails: ReservationPricingDetail[];
};

type HistoryItem = DetailedOrder | HistoryReservation;


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

type CustomerStatus = 'Nouveau' | 'Fidèle' | 'VIP';
type CustomerGender = 'Homme' | 'Femme' | 'Autre';

type Customer = {
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    address?: string;
    birthDate?: string;
    gender?: CustomerGender;
    status: CustomerStatus;
    avgBasket: string;
    totalSpent: string;
    firstSeen: string;
    lastSeen: string;
    history: HistoryItem[];
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

const mockHistory: HistoryItem[] = [
    {
        type: 'order',
        id: "#1024",
        date: "28/05/2024",
        storeId: "store-1",
        items: [
            { id: "item-1", name: 'Burger "Le Personnalisé"', quantity: 1, basePrice: 16.50, taxRate: 10, customizations: [ { type: 'add', name: 'Bacon grillé', price: 2.00 }, { type: 'add', name: 'Oeuf au plat', price: 1.00 }, { type: 'remove', name: 'Oignons' } ], finalPrice: 19.50 },
            { id: "item-2", name: 'Bière Blonde', quantity: 1, basePrice: 6.00, taxRate: 20, customizations: [], finalPrice: 6.00 },
            { id: "item-3", name: 'Eau (bouteille)', quantity: 1, basePrice: 2.50, taxRate: 5.5, customizations: [], finalPrice: 2.50 },
        ],
        total: 28.00,
    },
    { type: 'reservation', id: "#resa-1", date: "25/05/2024", serviceName: "Location Salle 'Prestige'", total: 500, storeId: 'store-1', taxRate: 20, pricingDetails: [{ description: "Forfait journée", amount: 500 }] },
    { type: 'order', id: "#987", date: "15/05/2024", storeId: "store-1", items: [], total: 90.75 },
    { type: 'reservation', id: "#resa-2", date: "12/05/2024", serviceName: "Consultation Décorateur", total: 80, storeId: 'store-1', taxRate: 20, pricingDetails: [{ description: "Consultation (1 heure x 80.00€)", amount: 80 }] },
    {
        type: 'order',
        id: "#1028",
        date: "29/05/2024",
        storeId: "store-3",
        items: [ { id: "item-pza-4f", name: 'Pizza 4 Fromages', quantity: 1, basePrice: 15.00, taxRate: 10, customizations: [], finalPrice: 15.00 }, { id: "item-coke", name: 'Coca-cola', quantity: 2, basePrice: 5.00, taxRate: 5.5, customizations: [], finalPrice: 5.00 } ],
        total: 25.00,
    },
    { 
        type: 'reservation', 
        id: "#resa-3", 
        date: "01/04/2024", 
        serviceName: "Location Porsche 911 (2 jours)", 
        total: 2050, 
        storeId: 'store-1',
        taxRate: 20,
        pricingDetails: [
            { description: "Location Porsche 911 (2 jours x 950.00€)", amount: 1900 },
            { description: "Option: Siège bébé (2 jours x 40.00€)", amount: 80 },
            { description: "Option: Service livraison (Forfait)", amount: 70 },
        ]
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
        history: mockHistory.filter(h => ['#1024', '#987', '#resa-1', '#resa-2', '#resa-3'].includes(h.id)),
        callHistory: [
            { id: 'call-1', date: "28/05/2024 - 19:30", duration: "3m 45s", type: 'Commande', transcript: "Hello, I would like to order a custom burger with bacon and egg, no onions. And also a Caesar salad please. It will be for a delivery to 123 Rue de la Paix. Thank you.", audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
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
        history: [],
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
        history: mockHistory.filter(h => h.id === '#1028'),
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
    const { language, t } = useLanguage();
    const params = useParams();
    const customerId = params.id as string;
    const customer = mockCustomers.find(c => c.id === customerId);

    const [isEditing, setIsEditing] = useState(false);
    const [editedCustomer, setEditedCustomer] = useState<Customer | null>(customer ? { ...customer } : null);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
    const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
    const ticketRef = useRef<HTMLDivElement>(null);

    const [activeCall, setActiveCall] = useState<Call | null>(null);
    const [translatedTranscript, setTranslatedTranscript] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const handleTranslate = async () => {
        if (!activeCall) return;

        if (translatedTranscript) {
            setTranslatedTranscript(null); // Toggle back to original
            return;
        }

        setIsTranslating(true);
        try {
            const targetLanguage = language === 'fr' ? 'English' : 'French';
            const response = await translateText({ text: activeCall.transcript, targetLanguage });
            setTranslatedTranscript(response.translatedText);
        } catch (error) {
            console.error("Translation failed", error);
            // Optionally, show a toast notification
        } finally {
            setIsTranslating(false);
        }
    };
    
    const handleOpenCallDialog = (call: Call) => {
        setActiveCall(call);
        setTranslatedTranscript(null);
    };

    const handleCloseCallDialog = () => {
        setActiveCall(null);
        setTranslatedTranscript(null);
    };

    const translations = {
        edit: { fr: "Modifier", en: "Edit" },
        save: { fr: "Enregistrer", en: "Save" },
        devInProgress: { fr: "Fonctionnalité en cours de développement", en: "Feature in development" },
        editSoon: { fr: "La modification des fiches clients sera bientôt disponible.", en: "Editing customer files will be available soon." },
        understood: { fr: "Compris", en: "Got it" },
        status: { fr: "Statut", en: "Status" },
        loyal: { fr: "Fidèle", en: "Loyal" },
        new: { fr: "Nouveau", en: "New" },
        vip: { fr: "VIP", en: "VIP" },
        avgBasket: { fr: "Panier Moyen", en: "Average Basket" },
        totalSpent: { fr: "Total Dépensé", en: "Total Spent" },
        lastVisit: { fr: "Dernière Visite", en: "Last Visit" },
        personalInfo: { fr: "Informations Personnelles", en: "Personal Information" },
        firstName: { fr: "Prénom", en: "First Name" },
        lastName: { fr: "Nom", en: "Last Name" },
        email: { fr: "Email", en: "Email" },
        address: { fr: "Adresse", en: "Address" },
        birthDate: { fr: "Date de naissance", en: "Birth Date" },
        gender: { fr: "Genre", en: "Gender" },
        unspecified: { fr: "Non spécifié", en: "Unspecified" },
        male: { fr: "Homme", en: "Male" },
        female: { fr: "Femme", en: "Female" },
        other: { fr: "Autre", en: "Other" },
        orderHistory: { fr: "Historique", en: "History" },
        callHistory: { fr: "Historique des Appels", en: "Call History" },
        reportHistory: { fr: "Historique des Signalements", en: "Report History" },
        order: { fr: "Commande", en: "Order" },
        reservation: { fr: "Réservation", en: "Reservation" },
        date: { fr: "Date", en: "Date" },
        amountTTC: { fr: "Montant (TTC)", en: "Amount (incl. tax)" },
        action: { fr: "Action", en: "Action" },
        items: { fr: "art.", en: "items" },
        readCall: { fr: "Lire l'échange", en: "Read transcript" },
        callDetails: { fr: "Détails de l'appel", en: "Call Details" },
        transcript: { fr: "Transcription :", en: "Transcript:" },
        close: { fr: "Fermer", en: "Close" },
        reason: { fr: "Raison", en: "Reason" },
        statusLabel: { fr: "Statut", en: "Status" },
        resolved: { fr: "Résolu", en: "Resolved" },
        open: { fr: "Ouvert", en: "Open" },
        inProgress: { fr: "En cours", en: "In Progress" },
        reportDetails: { fr: "Détails du Signalement", en: "Report Details" },
        ticketTitle: { fr: "Ticket", en: "Ticket" },
        orderTicket: { fr: "Ticket de commande", en: "Order Ticket" },
        reservationTicket: { fr: "Billet de réservation", en: "Reservation Ticket" },
        orderFor: { fr: "Détail de la commande {orderId} pour {storeName}.", en: "Details for order {orderId} for {storeName}." },
        reservationFor: { fr: "Détail de la réservation {reservationId} pour {storeName}.", en: "Details for reservation {reservationId} for {storeName}." },
        taxDetails: { fr: "Détail TVA incluse :", en: "Included tax details:" },
        tax: { fr: "TVA", en: "VAT" },
        thankYou: { fr: "Merci de votre visite !", en: "Thank you for your visit!" },
        print: { fr: "Imprimer", en: "Print" },
        noPrinter: { fr: "Aucune imprimante configurée", en: "No printer configured" },
        translate: { fr: "Traduire", en: "Translate" },
        showOriginal: { fr: "Voir l'original", en: "Show Original" },
        prestationDetails: { fr: "Détail de la prestation", en: "Service Details" },
    };

    if (!customer || !editedCustomer) {
        return notFound();
    }

    const translateStatus = (status: CustomerStatus) => {
        const map = { 'Nouveau': translations.new.fr, 'Fidèle': translations.loyal.fr, 'VIP': translations.vip.fr };
        const mapEn = { 'Nouveau': translations.new.en, 'Fidèle': translations.loyal.en, 'VIP': translations.vip.en };
        return t({ fr: map[status], en: mapEn[status] });
    };

    const handleInputChange = (field: keyof Customer, value: string) => {
        setEditedCustomer(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSave = () => {
        console.log("Saving customer data:", editedCustomer);
        setIsEditing(false);
    };

    const handleViewHistoryItem = (item: HistoryItem) => {
        setSelectedHistoryItem(item);
        setIsTicketDialogOpen(true);
    }
    
    const handlePrint = () => {
        if (!selectedHistoryItem) return;

        const ticketElement = ticketRef.current;
        const storeInfo = getStoreInfo(selectedHistoryItem.storeId);
        if (!ticketElement || !storeInfo) return;
        
        const storePrinters = storeInfo.printers;
        const receiptPrinter = storePrinters?.find(p => p.role === 'receipt');
        const printerToUse = receiptPrinter || storePrinters?.[0];

        if (!printerToUse) {
            console.error("No printer configured for this store.");
            return;
        }

        ticketElement.classList.remove('width-58mm', 'width-80mm');
        ticketElement.classList.add(`width-${printerToUse.width}`);
        window.print();
    };


    const renderTicketContent = () => {
        if (!selectedHistoryItem) return null;

        const storeInfo = getStoreInfo(selectedHistoryItem.storeId);

        if (selectedHistoryItem.type === 'order') {
            const calculatedTotals = calculateOrderTotals(selectedHistoryItem);
            return (
                <div ref={ticketRef} className="printable-ticket font-mono p-2 bg-white text-black">
                    <div className="text-center space-y-2 mb-4">
                        <h2 className="text-lg font-bold">{storeInfo?.name}</h2>
                        <p className="text-xs">{storeInfo?.address}</p>
                        <p className="text-xs">{t(translations.order)} {selectedHistoryItem.id} - {selectedHistoryItem.date}</p>
                    </div>
                    <Separator className="border-dashed border-black" />
                    <div className="space-y-2 my-2 text-xs">
                        {selectedHistoryItem.items.map((item, index) => (
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
                       <p className="font-bold">{t(translations.taxDetails)}</p>
                       {calculatedTotals.taxDetails.map(tax => (
                            <div key={tax.rate} className="flex justify-between">
                                <span>{t(translations.tax)} ({tax.rate.toFixed(2)}%)</span>
                                <span>{tax.amount.toFixed(2)}€</span>
                            </div>
                        ))}
                    </div>
                    <Separator className="border-dashed border-black" />
                    <div className="text-center text-xs pt-2">{t(translations.thankYou)}</div>
                </div>
            );
        }

        if (selectedHistoryItem.type === 'reservation') {
            const totalTTC = selectedHistoryItem.total;
            const taxAmount = totalTTC - (totalTTC / (1 + selectedHistoryItem.taxRate / 100));

            return (
                <div ref={ticketRef} className="printable-ticket font-mono p-2 bg-white text-black">
                     <div className="text-center space-y-2 mb-4">
                        <h2 className="text-lg font-bold">{storeInfo?.name}</h2>
                        <p className="text-xs">{storeInfo?.address}</p>
                        <p className="text-xs">{t(translations.reservation)} {selectedHistoryItem.id} - {selectedHistoryItem.date}</p>
                        <p className="text-xs">Client: {customer.firstName} {customer.lastName}</p>
                    </div>
                    <Separator className="border-dashed border-black" />
                     <div className="space-y-2 my-2 text-xs">
                        <p className="font-bold">{t(translations.prestationDetails)}: {selectedHistoryItem.serviceName}</p>
                         {selectedHistoryItem.pricingDetails.map((detail, index) => (
                            <div key={index} className="flex justify-between">
                                <span>{detail.description}</span>
                                <span>{detail.amount.toFixed(2)}€</span>
                            </div>
                         ))}
                    </div>
                    <Separator className="border-dashed border-black" />
                    <div className="flex justify-between font-bold text-base my-2">
                        <span>TOTAL TTC</span>
                        <span>{totalTTC.toFixed(2)}€</span>
                    </div>
                    <Separator className="border-dashed border-black" />
                     <div className="space-y-1 my-2 text-xs">
                       <p className="font-bold">{t(translations.taxDetails)}</p>
                       <div className="flex justify-between">
                            <span>{t(translations.tax)} ({selectedHistoryItem.taxRate.toFixed(2)}%)</span>
                            <span>{taxAmount.toFixed(2)}€</span>
                        </div>
                    </div>
                    <Separator className="border-dashed border-black" />
                    <div className="text-center text-xs pt-2">{t(translations.thankYou)}</div>
                </div>
            );
        }
        return null;
    }

    return (
        <>
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
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
                <div className="flex items-center gap-2 shrink-0">
                    {isEditing ? (
                        <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/>{t(translations.save)}</Button>
                    ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button><Edit className="mr-2 h-4 w-4"/>{t(translations.edit)}</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t(translations.devInProgress)}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t(translations.editSoon)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t(translations.understood)}</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t(translations.status)}</CardTitle></CardHeader>
                    <CardContent><p className="text-lg font-semibold flex items-center gap-2"><Star className="text-yellow-500"/> {translateStatus(customer.status)}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t(translations.avgBasket)}</CardTitle></CardHeader>
                    <CardContent><p className="text-lg font-semibold">{customer.avgBasket}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t(translations.totalSpent)}</CardTitle></CardHeader>
                    <CardContent><p className="text-lg font-semibold">{customer.totalSpent}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t(translations.lastVisit)}</CardTitle></CardHeader>
                    <CardContent><p className="text-lg font-semibold">{customer.lastSeen}</p></CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t(translations.personalInfo)}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t(translations.firstName)}</Label>
                                <Input value={editedCustomer.firstName || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('firstName', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t(translations.lastName)}</Label>
                                <Input value={editedCustomer.lastName || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('lastName', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t(translations.email)}</Label>
                                <Input type="email" value={editedCustomer.email || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('email', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label>{t(translations.address)}</Label>
                                <Input value={editedCustomer.address || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('address', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label>{t(translations.birthDate)}</Label>
                                <Input type="date" value={editedCustomer.birthDate || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('birthDate', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t(translations.gender)}</Label>
                                <Select value={editedCustomer.gender || ''} disabled={!isEditing} onValueChange={(value) => handleInputChange('gender', value)}>
                                    <SelectTrigger><SelectValue placeholder={t(translations.unspecified)} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Homme">{t(translations.male)}</SelectItem>
                                        <SelectItem value="Femme">{t(translations.female)}</SelectItem>
                                        <SelectItem value="Autre">{t(translations.other)}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Tabs defaultValue="history">
                        <TabsList className="mb-4">
                            <TabsTrigger value="history"><Receipt className="mr-2 h-4 w-4"/>{t(translations.orderHistory)}</TabsTrigger>
                            <TabsTrigger value="calls"><Phone className="mr-2 h-4 w-4"/>{t(translations.callHistory)}</TabsTrigger>
                            <TabsTrigger value="reports"><Flag className="mr-2 h-4 w-4"/>{t(translations.reportHistory)}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="history">
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t({fr: "Type", en: "Type"})}</TableHead>
                                                <TableHead>{t({fr: "Détail", en: "Detail"})}</TableHead>
                                                <TableHead>{t(translations.date)}</TableHead>
                                                <TableHead>{t(translations.amountTTC)}</TableHead>
                                                <TableHead className="text-right">{t(translations.action)}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customer.history.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <Badge variant="outline" className="flex items-center gap-2">
                                                            {item.type === 'order' ? <Receipt className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                                                            <span>{item.type === 'order' ? t(translations.order) : t(translations.reservation)}</span>
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {item.type === 'order' ? `${item.id} (${item.items.length} ${t(translations.items)})` : item.serviceName}
                                                    </TableCell>
                                                    <TableCell>{item.date}</TableCell>
                                                    <TableCell>{item.total.toFixed(2)}€</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewHistoryItem(item)}>
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
                                                    <Dialog onOpenChange={(open) => !open && handleCloseCallDialog()}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-8" onClick={() => handleOpenCallDialog(call)}>
                                                                <PlayCircle className="mr-2 h-4 w-4"/> {t(translations.readCall)}
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>{t(translations.callDetails)}</DialogTitle>
                                                                <DialogDescription>{activeCall?.date} - {activeCall?.duration}</DialogDescription>
                                                            </DialogHeader>
                                                            {activeCall?.audioUrl && (
                                                                <div className="my-4">
                                                                    <audio controls className="w-full">
                                                                        <source src={activeCall.audioUrl} type="audio/mpeg" />
                                                                        Your browser does not support the audio element.
                                                                    </audio>
                                                                </div>
                                                            )}
                                                            <div className="my-4 p-4 bg-muted rounded-md text-sm max-h-64 overflow-y-auto">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <p className="font-semibold">{t(translations.transcript)}</p>
                                                                    <Button variant="ghost" size="sm" onClick={handleTranslate} disabled={isTranslating}>
                                                                        {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                                                                        {translatedTranscript ? t(translations.showOriginal) : t(translations.translate)}
                                                                    </Button>
                                                                </div>
                                                                <p className="whitespace-pre-wrap leading-relaxed">
                                                                    {translatedTranscript || activeCall?.transcript}
                                                                </p>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button variant="outline" onClick={handleCloseCallDialog}>{t(translations.close)}</Button>
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
                                                <TableHead>{t(translations.date)}</TableHead>
                                                <TableHead>{t(translations.reason)}</TableHead>
                                                <TableHead>{t(translations.statusLabel)}</TableHead>
                                                <TableHead className="text-right">{t(translations.action)}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                                {customer.reportHistory.map(report => (
                                                <TableRow key={report.id}>
                                                    <TableCell>{report.date}</TableCell>
                                                    <TableCell className="font-medium">{report.reason}</TableCell>
                                                    <TableCell><Badge variant={report.status === 'Résolu' ? 'default' : 'secondary'} className={report.status === 'Résolu' ? 'bg-green-100 text-green-700' : ''}>{report.status === 'Résolu' ? t(translations.resolved) : (report.status === 'Ouvert' ? t(translations.open) : t(translations.inProgress))}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4"/></Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>{t(translations.reportDetails)}</DialogTitle>
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
        {selectedHistoryItem && (
            <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                <DialogContent className="sm:max-w-md">
                   <DialogHeader>
                        <DialogTitle className="text-center font-headline text-lg flex items-center justify-center gap-2">
                           {selectedHistoryItem.type === 'order' ? <Receipt className="h-5 w-5"/> : <Ticket className="h-5 w-5"/>}
                           {selectedHistoryItem.type === 'order' ? t(translations.orderTicket) : t(translations.reservationTicket)}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                           {selectedHistoryItem.type === 'order' 
                               ? t(translations.orderFor).replace('{orderId}', selectedHistoryItem.id).replace('{storeName}', getStoreInfo(selectedHistoryItem.storeId)?.name || '')
                               : t(translations.reservationFor).replace('{reservationId}', selectedHistoryItem.id).replace('{storeName}', getStoreInfo(selectedHistoryItem.storeId)?.name || '')
                           }
                        </DialogDescription>
                    </DialogHeader>
                   {renderTicketContent()}
                    <DialogFooter className="print-hide mt-4">
                        {(getStoreInfo(selectedHistoryItem.storeId)?.printers?.length || 0) > 0 ? (
                            <Button className="w-full font-sans" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" /> {t(translations.print)}
                            </Button>
                        ) : (
                             <Button className="w-full font-sans" disabled>
                                <Printer className="mr-2 h-4 w-4" /> {t(translations.noPrinter)}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
        </>
    );
}
