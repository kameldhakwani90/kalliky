

'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { notFound, useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Receipt, Phone, Flag, Star, Edit, Save, PlayCircle, MessageSquare, Printer, Languages, Loader2, Calendar, Ticket, ArrowRight, User, Check, Ban, BrainCircuit, Bot, PhoneCall, ShoppingBag, Wrench, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { OrderDetailPopup } from '@/components/order-detail-popup';


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

type ConsultationAnalysis = {
    score: number; // 0-100
    summary: string;
    positivePoints: string[];
    negativePoints: string[];
}

type HistoryConsultation = {
    type: 'consultation';
    id: string;
    date: string;
    serviceName: string;
    total: number; // Often 0 for first contact
    storeId: string;
    taxRate: number;
    pricingDetails: ReservationPricingDetail[]; // Can be empty
    transcript: string;
    analysis: ConsultationAnalysis;
};

type HistoryItem = DetailedOrder | HistoryReservation | HistoryConsultation;


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
    type: 'Commande' | 'Info' | 'Signalement' | 'Consultation';
    transcript: string;
    audioUrl?: string;
    telnyxCallId?: string;
    aiConversationId?: string;
};

type AIConversation = {
    id: string;
    callId: string;
    date: string;
    duration: string;
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
    language: string;
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: string;
    }>;
    extractedInfo?: {
        intent?: string;
        customerName?: string;
        customerPhone?: string;
        reservation?: any;
        order?: any;
        satisfaction?: number;
    };
    aiAnalysis?: {
        sentiment: string;
        satisfaction: number;
        summary: string;
        keywords: string[];
    };
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
    aiConversations: AIConversation[];
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
    { type: 'order', id: "#1025", date: "30/05/2025", storeId: 'store-1', items: [{ id: "item-sn", name: 'Salade Niçoise', quantity: 1, basePrice: 24.50, customizations: [], finalPrice: 24.50, taxRate: 10 }], total: 24.50 },
    { type: 'order', id: "#1024", date: "30/05/2025", storeId: 'store-1', items: [{ id: "item-pm", name: 'Pizza Margherita', quantity: 1, basePrice: 18.00, customizations: [], finalPrice: 18.00, taxRate: 10 }], total: 18.00 },
    { type: 'order', id: "#1023", date: "29/05/2025", storeId: 'store-1', items: [], total: 55.20 },
    { type: 'reservation', id: "#R87", date: "30/05/2025", serviceName: "Location Porsche 911 (2 jours)", total: 1900, storeId: 'store-loc', taxRate: 20, pricingDetails: [{ description: "Location Porsche 911 (2 jours x 950.00€)", amount: 1900 }] },
    { type: 'reservation', id: "#R86", date: "31/05/2025", serviceName: "Location Ferrari F8", total: 950, storeId: 'store-loc', taxRate: 20, pricingDetails: [{ description: "Location Ferrari F8 (1 jour x 950.00€)", amount: 950 }] },
    { type: 'consultation', id: "#C12", date: "30/05/2025", serviceName: "Consultation Droit des sociétés", total: 0, storeId: 'store-4', taxRate: 20, pricingDetails: [], transcript: "Bonjour, je suis en train de créer une startup dans le domaine de la tech et j'aurais besoin de conseils pour rédiger les statuts et un pacte d'actionnaires. J'ai vu que vous étiez spécialisé en droit des affaires.", analysis: { score: 85, summary: "Le prospect est hautement qualifié. Son besoin (statuts, pacte d'actionnaires) est au coeur de l'expertise de l'avocat et il mentionne des mots-clés pertinents (startup, tech).", positivePoints: ["Création de startup", "Pacte d'actionnaires", "Droit des affaires"], negativePoints: [] } },
    { type: 'consultation', id: "#C11", date: "29/05/2025", serviceName: "Consultation Création d'entreprise", total: 0, storeId: 'store-4', taxRate: 20, pricingDetails: [], transcript: "Bonjour, je voudrais savoir comment faire pour une garde d'enfant après un divorce. C'est bien vous qui vous occupez du droit de la famille ?", analysis: { score: 10, summary: "Le prospect n'est pas qualifié. Sa demande concerne le droit de la famille, un domaine explicitement exclu de l'expertise de l'avocat.", positivePoints: [], negativePoints: ["Garde d'enfant", "Divorce", "Droit de la famille"] } },
    { type: 'reservation', id: "#S33", date: "31/05/2025", serviceName: "Forfait 'Détente Absolue'", total: 250, storeId: 'store-spa', taxRate: 20, pricingDetails: [{ description: "Forfait 'Détente Absolue'", amount: 250 }] },
];


const mockAIConversations: AIConversation[] = [
    {
        id: 'ai-conv-1',
        callId: 'call-001',
        date: '01/08/2025',
        duration: '3:24',
        status: 'COMPLETED',
        language: 'fr',
        messages: [
            {
                role: 'assistant',
                content: 'Bonjour et merci d\'appeler Le Gourmet Parisien. Je suis votre assistante virtuelle. Comment puis-je vous aider aujourd\'hui ?',
                timestamp: '2025-08-01T14:00:00Z'
            },
            {
                role: 'user',
                content: 'Bonjour, je souhaiterais réserver une table pour 4 personnes pour ce soir vers 20h.',
                timestamp: '2025-08-01T14:00:15Z'
            },
            {
                role: 'assistant',
                content: 'Parfait ! Je peux vous proposer une table pour 4 personnes ce soir. Puis-je avoir votre nom pour la réservation ?',
                timestamp: '2025-08-01T14:00:20Z'
            },
            {
                role: 'user',
                content: 'Martin, Alice Martin.',
                timestamp: '2025-08-01T14:00:35Z'
            },
            {
                role: 'assistant',
                content: 'Merci Mme Martin. Votre table pour 4 personnes est réservée ce soir à 20h. Pourrais-je avoir votre numéro de téléphone pour confirmer ?',
                timestamp: '2025-08-01T14:00:40Z'
            }
        ],
        extractedInfo: {
            intent: 'reservation',
            customerName: 'Alice Martin',
            customerPhone: '06 12 34 56 78',
            reservation: {
                date: '2025-08-01',
                time: '20:00',
                guests: 4
            },
            satisfaction: 9
        },
        aiAnalysis: {
            sentiment: 'positive',
            satisfaction: 9,
            summary: 'Client satisfait ayant effectué une réservation pour 4 personnes. Conversation fluide et efficace.',
            keywords: ['réservation', 'table', '4 personnes', '20h', 'ce soir']
        }
    },
    {
        id: 'ai-conv-2',
        callId: 'call-002',
        date: '28/07/2025',
        duration: '2:15',
        status: 'COMPLETED',
        language: 'fr',
        messages: [
            {
                role: 'assistant',
                content: 'Bonjour et merci d\'appeler Le Gourmet Parisien. Comment puis-je vous aider ?',
                timestamp: '2025-07-28T12:30:00Z'
            },
            {
                role: 'user',
                content: 'Bonjour, j\'aimerais connaître vos horaires d\'ouverture et si vous avez des plats végétariens.',
                timestamp: '2025-07-28T12:30:10Z'
            },
            {
                role: 'assistant',
                content: 'Nous sommes ouverts du mardi au samedi de 12h à 14h30 et de 19h à 22h30. Nous proposons plusieurs options végétariennes, notamment notre salade niçoise végétarienne et notre risotto aux champignons.',
                timestamp: '2025-07-28T12:30:25Z'
            }
        ],
        extractedInfo: {
            intent: 'information',
            satisfaction: 8
        },
        aiAnalysis: {
            sentiment: 'neutral',
            satisfaction: 8,
            summary: 'Demande d\'informations sur les horaires et options végétariennes. Client intéressé.',
            keywords: ['horaires', 'végétarien', 'informations']
        }
    }
];

const mockCustomers: Customer[] = [
    { 
        id: 'cust-1', 
        phone: "06 12 34 56 78", 
        firstName: "Alice", 
        lastName: "Martin", 
        status: "Fidèle", 
        avgBasket: "30.00€", 
        totalSpent: "54.50€", 
        firstSeen: "28/05/2025", 
        lastSeen: "30/05/2025", 
        history: mockHistory.filter(h => h.id === "#1025"), 
        callHistory: [{
            id: 'call-001',
            date: '01/08/2025',
            duration: '3:24',
            type: 'Commande',
            transcript: 'Conversation complète disponible dans l\'onglet IA',
            audioUrl: '/audio/call-001.mp3',
            telnyxCallId: 'telnyx_call_001',
            aiConversationId: 'ai-conv-1'
        }], 
        aiConversations: [mockAIConversations[0]],
        reportHistory: [] 
    },
    { 
        id: 'cust-2', 
        phone: "07 87 65 43 21", 
        firstName: "Bob", 
        lastName: "Dupont", 
        status: "Nouveau", 
        avgBasket: "18.00€", 
        totalSpent: "18.00€", 
        firstSeen: "30/05/2025", 
        lastSeen: "30/05/2025", 
        history: mockHistory.filter(h => h.id === "#1024"), 
        callHistory: [], 
        aiConversations: [],
        reportHistory: [] 
    },
    { 
        id: 'cust-4', 
        phone: "06 99 88 77 66", 
        firstName: "Client", 
        lastName: "Anonyme", 
        status: "Nouveau", 
        avgBasket: "55.20€", 
        totalSpent: "55.20€", 
        firstSeen: "29/05/2025", 
        lastSeen: "29/05/2025", 
        history: mockHistory.filter(h => h.id === "#1023"), 
        callHistory: [], 
        aiConversations: [mockAIConversations[1]],
        reportHistory: [] 
    },
    { 
        id: 'cust-5', 
        phone: "06 11 22 33 44", 
        firstName: "Carlos", 
        lastName: "Sainz", 
        status: "Nouveau", 
        avgBasket: "1900.00€", 
        totalSpent: "1900.00€", 
        firstSeen: "30/05/2025", 
        lastSeen: "30/05/2025", 
        history: mockHistory.filter(h => h.id === "#R87"), 
        callHistory: [], 
        aiConversations: [],
        reportHistory: [] 
    },
    { 
        id: 'cust-6', 
        phone: "06 88 77 66 55", 
        firstName: "Lando", 
        lastName: "Norris", 
        status: "Nouveau", 
        avgBasket: "950.00€", 
        totalSpent: "950.00€", 
        firstSeen: "31/05/2025", 
        lastSeen: "31/05/2025", 
        history: mockHistory.filter(h => h.id === "#R86"), 
        callHistory: [], 
        aiConversations: [],
        reportHistory: [] 
    },
    { 
        id: 'cust-7', 
        phone: "01 23 45 67 89", 
        firstName: "Mme.", 
        lastName: "Lefevre", 
        status: "Nouveau", 
        avgBasket: "0€", 
        totalSpent: "0€", 
        firstSeen: "30/05/2025", 
        lastSeen: "30/05/2025", 
        history: mockHistory.filter(h => h.id === "#C12"), 
        callHistory: [], 
        aiConversations: [],
        reportHistory: [] 
    },
    { 
        id: 'cust-8', 
        phone: "01 98 76 54 32", 
        firstName: "M.", 
        lastName: "Bernard", 
        status: "Nouveau", 
        avgBasket: "0€", 
        totalSpent: "0€", 
        firstSeen: "29/05/2025", 
        lastSeen: "29/05/2025", 
        history: mockHistory.filter(h => h.id === "#C11"), 
        callHistory: [], 
        aiConversations: [],
        reportHistory: [] 
    },
    { 
        id: 'cust-9', 
        phone: "07 55 66 77 88", 
        firstName: "Claire", 
        lastName: "Chazal", 
        status: "Nouveau", 
        avgBasket: "250.00€", 
        totalSpent: "250.00€", 
        firstSeen: "31/05/2025", 
        lastSeen: "31/05/2025", 
        history: mockHistory.filter(h => h.id === "#S33"), 
        callHistory: [], 
        aiConversations: [],
        reportHistory: [] 
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
    const searchParams = useSearchParams();
    const router = useRouter();
    const customerId = params.clientId as string;
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
    const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
    const [selectedOrderForPopup, setSelectedOrderForPopup] = useState<any>(null);
    const [isOrderPopupOpen, setIsOrderPopupOpen] = useState(false);
    const ticketRef = useRef<HTMLDivElement>(null);

    const [activeCall, setActiveCall] = useState<Call | null>(null);
    const [translatedTranscript, setTranslatedTranscript] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [activeConversation, setActiveConversation] = useState<AIConversation | null>(null);
    
    // États pour les filtres
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);

    // Charger les données du client depuis l'API
    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(`/api/restaurant/customers/${customerId}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        // Pour les clients mockés, utiliser les données locales temporairement
                        const mockCustomer = mockCustomers.find(c => c.id === customerId);
                        if (mockCustomer) {
                            setCustomer(mockCustomer);
                            setEditedCustomer({ ...mockCustomer });
                            setLoading(false);
                            return;
                        }
                        setError('Client non trouvé');
                        return;
                    }
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Erreur lors du chargement du client');
                }
                
                const data = await response.json();
                
                // Transformer les données pour correspondre au format attendu
                const transformedCustomer: Customer = {
                    id: data.id,
                    phone: data.phone || 'N/A',
                    firstName: data.firstName || 'Client',
                    lastName: data.lastName || 'Anonyme',
                    email: data.email,
                    address: data.address,
                    birthDate: data.birthDate,
                    gender: data.gender as CustomerGender,
                    status: data.totalSpent > 500 ? 'VIP' as const : 
                            data.totalSpent > 100 ? 'Fidèle' as const : 
                            'Nouveau' as const,
                    avgBasket: data.averageBasket ? `${data.averageBasket.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€` : '0€',
                    totalSpent: data.totalSpent ? `${data.totalSpent.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€` : '0€',
                    firstSeen: data.firstSeen ? new Date(data.firstSeen).toLocaleDateString('fr-FR') : 'Inconnu',
                    lastSeen: data.lastSeen ? new Date(data.lastSeen).toLocaleDateString('fr-FR') : 'Jamais',
                    history: data.history?.map((item: any) => ({
                        type: item.type === 'ORDER' ? 'order' as const : 
                              item.type === 'RESERVATION' ? 'reservation' as const : 
                              'consultation' as const,
                        id: item.orderNumber || item.id,
                        date: new Date(item.createdAt).toLocaleDateString('fr-FR'),
                        total: item.amount || 0,
                        storeId: item.storeId || 'store-1',
                        serviceName: item.serviceName || item.description || 'Service',
                        items: item.items || [],
                        taxRate: 20,
                        pricingDetails: item.pricingDetails || [],
                        transcript: item.transcript || '',
                        analysis: item.analysis || { score: 0, summary: '', positivePoints: [], negativePoints: [] }
                    })) || [],
                    callHistory: data.callHistory?.map((call: any) => ({
                        id: call.id,
                        date: new Date(call.createdAt).toLocaleDateString('fr-FR'),
                        duration: call.duration || 'N/A',
                        type: call.type || 'Info',
                        transcript: call.transcript || '',
                        audioUrl: call.audioUrl,
                        telnyxCallId: call.telnyxCallId,
                        aiConversationId: call.aiConversationId
                    })) || [],
                    aiConversations: data.aiConversations?.map((conv: any) => ({
                        id: conv.id,
                        callId: conv.callId,
                        date: new Date(conv.createdAt).toLocaleDateString('fr-FR'),
                        duration: conv.duration || 'N/A',
                        status: conv.status,
                        language: conv.language || 'fr',
                        messages: conv.conversationData || [],
                        extractedInfo: conv.extractedData || {},
                        aiAnalysis: conv.analysis || {}
                    })) || [],
                    reportHistory: data.reportHistory || []
                };
                
                setCustomer(transformedCustomer);
                setEditedCustomer({ ...transformedCustomer });
                
            } catch (error: any) {
                console.error('Error fetching customer:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (customerId) {
            fetchCustomer();
        }
    }, [customerId]);

    useEffect(() => {
        if (!customer) return;

        const historyId = searchParams.get('historyId');
        if (historyId) {
            const item = customer.history.find(h => h.id === historyId);
            if (item) {
                handleViewHistoryItem(item);
            }
        }
    }, [searchParams, customer]);

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

    const handleOpenConversationDialog = (conversation: AIConversation) => {
        setActiveConversation(conversation);
    };

    const handleCloseConversationDialog = () => {
        setActiveConversation(null);
    };

    // Fonction pour unifier tous les historiques en tickets d'appels
    const getUnifiedHistory = () => {
        if (!customer) return [];
        
        const unifiedTickets: any[] = [];
        
        // Combiner toutes les activités par date/appel
        const ticketMap = new Map();
        
        // Traiter les appels d'abord (structure de base)
        customer.callHistory.forEach(call => {
            const ticketId = 'CALL-' + call.id;
            ticketMap.set(ticketId, {
                id: ticketId,
                callId: call.id,
                date: call.date,
                duration: call.duration,
                type: 'call',
                callType: call.type,
                items: [],
                conversation: customer.aiConversations.find(conv => conv.callId === call.id),
                audioUrl: call.audioUrl,
                transcript: call.transcript,
                total: 0,
                activities: []
            });
        });
        
        // Ajouter les activités (commandes, services, consultations, etc.)
        customer.history.forEach(historyItem => {
            const matchingTicket = Array.from(ticketMap.values()).find(ticket => 
                ticket.date === historyItem.date
            );
            
            if (matchingTicket) {
                matchingTicket.activities.push({
                    type: historyItem.type,
                    id: historyItem.id,
                    details: historyItem,
                    total: historyItem.total || 0
                });
                matchingTicket.total += historyItem.total || 0;
            } else {
                // Créer un nouveau ticket pour les activités sans appel associé
                const ticketId = 'ACT-' + historyItem.id;
                ticketMap.set(ticketId, {
                    id: ticketId,
                    date: historyItem.date,
                    type: 'activity',
                    duration: null,
                    activities: [{
                        type: historyItem.type,
                        id: historyItem.id,
                        details: historyItem,
                        total: historyItem.total || 0
                    }],
                    total: historyItem.total || 0,
                    conversation: null,
                    audioUrl: null,
                    transcript: null
                });
            }
        });
        
        return Array.from(ticketMap.values()).sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    };

    // Filtrer les tickets
    const getFilteredTickets = () => {
        const tickets = getUnifiedHistory();
        
        return tickets.filter(ticket => {
            // Filtre par type
            if (typeFilter !== 'all') {
                const hasMatchingActivity = ticket.activities.some((activity: any) => 
                    activity.type === typeFilter
                );
                if (!hasMatchingActivity && typeFilter !== 'call') return false;
                if (typeFilter === 'call' && ticket.type !== 'call') return false;
            }
            
            // Filtre par date (simplified - peut être étendu)
            if (dateFilter !== 'all') {
                const ticketDate = new Date(ticket.date);
                const now = new Date();
                
                switch (dateFilter) {
                    case 'today':
                        return ticketDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return ticketDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return ticketDate >= monthAgo;
                    default:
                        return true;
                }
            }
            
            return true;
        });
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
        lastCall: { fr: "Dernier Appel", en: "Last Call" },
        personalInfo: { fr: "Informations", en: "Information" },
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
        aiConversations: { fr: "Conversations IA", en: "AI Conversations" },
        reportHistory: { fr: "Historique des Signalements", en: "Report History" },
        order: { fr: "Commande", en: "Order" },
        reservation: { fr: "Réservation", en: "Reservation" },
        consultation: { fr: 'Consultation', en: 'Consultation' },
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
        consultationTicket: { fr: "Demande de Rendez-vous", en: "Appointment Request" },
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
        consultationFor: { fr: "Demande de RDV {consultationId} pour {storeName}.", en: "Appointment request {consultationId} for {storeName}." },
        consultationSubject: { fr: "Objet de la demande", en: "Subject of the request" },
        callTranscript: { fr: "Transcription de l'appel", en: "Call Transcript" },
        aiAnalysis: { fr: "Analyse & Score IA", en: "AI Analysis & Score" },
        relevanceScore: { fr: "Score de pertinence", en: "Relevance Score" },
        aiSummary: { fr: "Résumé de l'IA", en: "AI Summary" },
        positivePoints: { fr: "Points positifs", en: "Positive points" },
        negativePoints: { fr: "Freins / Vigilance", en: "Negative points / Caution" },
        viewConversation: { fr: "Voir conversation", en: "View conversation" },
        aiAssistant: { fr: "Assistant IA", en: "AI Assistant" },
        client: { fr: "Client", en: "Client" },
        conversationDetails: { fr: "Détails de la conversation IA", en: "AI Conversation Details" },
        extractedInformation: { fr: "Informations extraites", en: "Extracted information" },
        conversationAnalysis: { fr: "Analyse de la conversation", en: "Conversation analysis" },
        intent: { fr: "Intention", en: "Intent" },
        sentiment: { fr: "Sentiment", en: "Sentiment" },
        keywords: { fr: "Mots-clés", en: "Keywords" },
        satisfactionScore: { fr: "Score de satisfaction", en: "Satisfaction score" },
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Chargement du profil client...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <p className="text-red-500">Erreur: {error}</p>
                    <Button className="mt-4" onClick={() => window.location.reload()}>
                        Réessayer
                    </Button>
                </div>
            </div>
        );
    }

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

        if (selectedHistoryItem.type === 'consultation') {
            const scoreColor = selectedHistoryItem.analysis.score > 75 ? 'text-green-600' : selectedHistoryItem.analysis.score > 40 ? 'text-yellow-600' : 'text-red-600';

            return (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t(translations.consultationSubject)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-semibold">{selectedHistoryItem.serviceName}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t(translations.callTranscript)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground italic">"{selectedHistoryItem.transcript}"</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> {t(translations.aiAnalysis)}</CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-4">
                             <div>
                                <Label>{t(translations.relevanceScore)}</Label>
                                <div className="flex items-center gap-2">
                                    <Progress value={selectedHistoryItem.analysis.score} className="w-full" />
                                    <span className={cn("font-bold text-lg", scoreColor)}>{selectedHistoryItem.analysis.score}%</span>
                                </div>
                             </div>
                             <div>
                                <Label>{t(translations.aiSummary)}</Label>
                                <p className="text-sm text-muted-foreground">{selectedHistoryItem.analysis.summary}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t(translations.positivePoints)}</Label>
                                    <ul className="text-sm list-none space-y-1 mt-1">
                                    {selectedHistoryItem.analysis.positivePoints.map((point, i) => (
                                        <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500"/> {point}</li>
                                    ))}
                                    </ul>
                                </div>
                                 <div>
                                    <Label>{t(translations.negativePoints)}</Label>
                                     <ul className="text-sm list-none space-y-1 mt-1">
                                    {selectedHistoryItem.analysis.negativePoints.map((point, i) => (
                                        <li key={i} className="flex items-center gap-2"><Ban className="h-4 w-4 text-red-500"/> {point}</li>
                                    ))}
                                    </ul>
                                </div>
                             </div>
                         </CardContent>
                    </Card>
                </div>
            );
        }

        return null;
    }
    
    const getHistoryItemIcon = (item: HistoryItem) => {
        switch (item.type) {
            case 'order': return <Receipt className="h-4 w-4" />;
            case 'reservation': return <Calendar className="h-4 w-4" />;
            case 'consultation': return <User className="h-4 w-4" />;
            default: return <Ticket className="h-4 w-4" />;
        }
    };
    
    const getHistoryItemLabel = (item: HistoryItem) => {
         switch (item.type) {
            case 'order': return t(translations.order);
            case 'reservation': return t(translations.reservation);
            case 'consultation': return t(translations.consultation);
            default: return "Ticket";
        }
    }


    return (
        <>
        <div className="space-y-8">
            {/* Belle Card Client Moderne */}
            <Card className="glass-effect shadow-apple rounded-2xl border-0 bg-gradient-to-br from-gray-50 via-white to-gray-100">
                <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Informations principales */}
                        <div className="flex items-center gap-6">
                            <Avatar className="h-20 w-20 shadow-apple">
                                <AvatarFallback className="text-2xl bg-black text-white">
                                    {editedCustomer.firstName && editedCustomer.lastName 
                                        ? (editedCustomer.firstName.charAt(0) + editedCustomer.lastName.charAt(0)).toUpperCase()
                                        : '📞'
                                    }
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <Phone className="h-6 w-6 text-gray-700" />
                                    <h1 className="text-3xl font-bold tracking-tight font-mono text-gray-900">{editedCustomer.phone}</h1>
                                </div>
                                {editedCustomer.firstName || editedCustomer.lastName ? (
                                    <p className="text-xl text-gray-600 font-medium">
                                        {editedCustomer.firstName} {editedCustomer.lastName}
                                    </p>
                                ) : (
                                    <p className="text-xl text-gray-500 italic">
                                        Client Anonyme
                                    </p>
                                )}
                                <div className="flex items-center gap-4">
                                    <Badge 
                                        variant="outline"
                                        className={
                                            customer.status === 'VIP' ? 'bg-black text-white border-black rounded-full' :
                                            customer.status === 'Fidèle' ? 'bg-gray-100 text-gray-700 border-gray-300 rounded-full' :
                                            'bg-gray-100 text-gray-700 border-gray-300 rounded-full'
                                        }
                                    >
                                        <Star className="h-3 w-3 mr-1" />
                                        {translateStatus(customer.status)}
                                    </Badge>
                                    <span className="text-sm text-gray-500">Client depuis le {customer.firstSeen}</span>
                                </div>
                            </div>
                        </div>

                        {/* Statistiques rapides */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:min-w-[400px]">
                            <div className="text-center p-4 glass-effect rounded-2xl shadow-apple">
                                <PhoneCall className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-gray-900">{customer.callHistory?.length || 0}</div>
                                <div className="text-xs text-gray-500">Appels</div>
                            </div>
                            <div className="text-center p-4 glass-effect rounded-2xl shadow-apple">
                                <ShoppingBag className="h-5 w-5 text-green-500 mx-auto mb-1" />
                                <div className="text-2xl font-bold text-gray-900">{customer.history?.filter(h => h.type === 'order').length || 0}</div>
                                <div className="text-xs text-gray-500">Commandes</div>
                            </div>
                            <div className="text-center p-4 glass-effect rounded-2xl shadow-apple">
                                <TrendingUp className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                                <div className="text-lg font-bold text-gray-900">{customer.totalSpent}</div>
                                <div className="text-xs text-gray-500">Total dépensé</div>
                            </div>
                            <div className="text-center p-4 glass-effect rounded-2xl shadow-apple">
                                <Calendar className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                                <div className="text-sm font-bold text-gray-900">{customer.lastSeen}</div>
                                <div className="text-xs text-gray-500">Dernier appel</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            {isEditing ? (
                                <Button onClick={handleSave} size="lg" className="bg-black hover:bg-gray-800 rounded-xl">
                                    <Save className="mr-2 h-4 w-4"/>{t(translations.save)}
                                </Button>
                            ) : (
                                <Button onClick={() => setIsEditing(true)} variant="outline" size="lg" className="rounded-xl border-gray-300 hover:border-gray-400 transition-smooth">
                                    <Edit className="mr-2 h-4 w-4"/>{t(translations.edit)}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="history" className="space-y-6">
                <div className="glass-effect rounded-2xl p-4 shadow-apple">
                    <TabsList className="bg-gray-100 rounded-xl p-1">
                        <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-smooth"><Receipt className="mr-2 h-4 w-4"/>Historique Complet</TabsTrigger>
                        <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-smooth"><User className="mr-2 h-4 w-4"/>{t(translations.personalInfo)}</TabsTrigger>
                    </TabsList>
                </div>
                 <TabsContent value="info">
                    <Card className="glass-effect shadow-apple rounded-2xl border-0">
                        <CardHeader>
                            <CardTitle>{t(translations.personalInfo)}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t(translations.firstName)}</Label>
                                    <Input value={editedCustomer.firstName || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('firstName', e.target.value)} className="rounded-xl border-gray-300" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t(translations.lastName)}</Label>
                                    <Input value={editedCustomer.lastName || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('lastName', e.target.value)} className="rounded-xl border-gray-300" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t(translations.email)}</Label>
                                <Input type="email" value={editedCustomer.email || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('email', e.target.value)} className="rounded-xl border-gray-300" />
                            </div>
                             <div className="space-y-2">
                                <Label>{t(translations.address)}</Label>
                                <Input value={editedCustomer.address || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('address', e.target.value)} className="rounded-xl border-gray-300" />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t(translations.birthDate)}</Label>
                                    <Input type="date" value={editedCustomer.birthDate || ''} readOnly={!isEditing} onChange={(e) => handleInputChange('birthDate', e.target.value)} className="rounded-xl border-gray-300" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t(translations.gender)}</Label>
                                    <Select value={editedCustomer.gender || ''} disabled={!isEditing} onValueChange={(value) => handleInputChange('gender', value)}>
                                        <SelectTrigger className="rounded-xl border-gray-300"><SelectValue placeholder={t(translations.unspecified)} /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Homme">{t(translations.male)}</SelectItem>
                                            <SelectItem value="Femme">{t(translations.female)}</SelectItem>
                                            <SelectItem value="Autre">{t(translations.other)}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                    <Card className="glass-effect shadow-apple rounded-2xl border-0">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="h-5 w-5" />
                                    Historique des Appels & Activités
                                </CardTitle>
                                
                                {/* Filtres */}
                                <div className="flex gap-3">
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-[180px] rounded-xl border-gray-300">
                                            <SelectValue placeholder="Filtrer par type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous les types</SelectItem>
                                            <SelectItem value="call">Appels uniquement</SelectItem>
                                            <SelectItem value="order">Commandes</SelectItem>
                                            <SelectItem value="reservation">Réservations</SelectItem>
                                            <SelectItem value="consultation">Consultations</SelectItem>
                                            <SelectItem value="report">Signalements</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    
                                    <Select value={dateFilter} onValueChange={setDateFilter}>
                                        <SelectTrigger className="w-[160px] rounded-xl border-gray-300">
                                            <SelectValue placeholder="Période" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Toutes les dates</SelectItem>
                                            <SelectItem value="today">Aujourd'hui</SelectItem>
                                            <SelectItem value="week">7 derniers jours</SelectItem>
                                            <SelectItem value="month">30 derniers jours</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {getFilteredTickets().map(ticket => (
                                    <Card 
                                        key={ticket.id} 
                                        className="glass-effect shadow-apple rounded-2xl border-0 hover:shadow-apple-lg transition-smooth cursor-pointer hover-lift"
                                        onClick={() => {
                                            // Rediriger vers la page dédiée du ticket
                                            router.push(`/app/tickets/${ticket.id}?from=clients&customerId=${customer.id}`);
                                        }}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    {/* Icône et type principal */}
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-black">
                                                        <PhoneCall className="h-5 w-5 text-white" />
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-lg">{ticket.date}</span>
                                                            {ticket.duration && (
                                                                <Badge variant="outline" className="text-xs rounded-full border-gray-300">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    {ticket.duration}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Résumé des activités */}
                                                        <div className="flex flex-wrap gap-1">
                                                            {ticket.activities.map((activity: any, index: number) => {
                                                                const getActivityIcon = () => {
                                                                    switch (activity.type) {
                                                                        case 'order': return <ShoppingBag className="h-3 w-3" />;
                                                                        case 'reservation': return <Calendar className="h-3 w-3" />;
                                                                        case 'consultation': return <BrainCircuit className="h-3 w-3" />;
                                                                        case 'report': return <AlertTriangle className="h-3 w-3" />;
                                                                        default: return <Receipt className="h-3 w-3" />;
                                                                    }
                                                                };
                                                                
                                                                const getActivityColor = () => {
                                                                    switch (activity.type) {
                                                                        case 'order': return 'bg-green-100 text-green-700';
                                                                        case 'reservation': return 'bg-blue-100 text-blue-700';
                                                                        case 'consultation': return 'bg-purple-100 text-purple-700';
                                                                        case 'report': return 'bg-red-100 text-red-700';
                                                                        default: return 'bg-gray-100 text-gray-700';
                                                                    }
                                                                };
                                                                
                                                                const getActivityLabel = () => {
                                                                    switch (activity.type) {
                                                                        case 'order': return 'Commande';
                                                                        case 'reservation': return 'Réservation';
                                                                        case 'consultation': return 'Consultation';
                                                                        case 'report': return 'Signalement';
                                                                        default: return activity.type;
                                                                    }
                                                                };
                                                                
                                                                return (
                                                                    <Badge 
                                                                        key={index} 
                                                                        variant="outline" 
                                                                        className={`text-xs rounded-full ${getActivityColor()}`}
                                                                    >
                                                                        {getActivityIcon()}
                                                                        <span className="ml-1">{getActivityLabel()}</span>
                                                                        {activity.total > 0 && (
                                                                            <span className="ml-1 font-medium">{activity.total.toFixed(2)}€</span>
                                                                        )}
                                                                    </Badge>
                                                                );
                                                            })}
                                                            
                                                            {ticket.activities.length === 0 && (
                                                                <Badge variant="outline" className="text-xs rounded-full bg-gray-100 text-gray-700">
                                                                    <Phone className="h-3 w-3 mr-1" />
                                                                    Appel simple
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right space-y-1">
                                                    {ticket.total > 0 && (
                                                        <div className="text-lg font-bold text-green-600">
                                                            {ticket.total.toFixed(2)}€
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        {ticket.conversation && (
                                                            <Badge variant="secondary" className="text-xs rounded-full">
                                                                <Bot className="h-3 w-3 mr-1" />
                                                                IA
                                                            </Badge>
                                                        )}
                                                        {ticket.audioUrl && (
                                                            <Badge variant="secondary" className="text-xs rounded-full">
                                                                <PlayCircle className="h-3 w-3 mr-1" />
                                                                Audio
                                                            </Badge>
                                                        )}
                                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                
                                {getFilteredTickets().length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Aucun ticket trouvé pour les filtres sélectionnés</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
        {selectedHistoryItem && (
            <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                <DialogContent className={cn("sm:max-w-md glass-effect shadow-apple-lg rounded-2xl border-0", selectedHistoryItem.type === 'consultation' && 'sm:max-w-2xl')}>
                   <DialogHeader>
                        <DialogTitle className="text-center font-headline text-lg flex items-center justify-center gap-2">
                           {selectedHistoryItem.type === 'order' ? <Receipt className="h-5 w-5"/> : (selectedHistoryItem.type === 'reservation' ? <Ticket className="h-5 w-5"/> : <User className="h-5 w-5"/>)}
                           {selectedHistoryItem.type === 'order' ? t(translations.orderTicket) : (selectedHistoryItem.type === 'reservation' ? t(translations.reservationTicket) : t(translations.consultationTicket))}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                           {selectedHistoryItem.type === 'order' 
                               ? t(translations.orderFor).replace('{orderId}', selectedHistoryItem.id).replace('{storeName}', getStoreInfo(selectedHistoryItem.storeId)?.name || '')
                               : selectedHistoryItem.type === 'reservation' ? t(translations.reservationFor).replace('{reservationId}', selectedHistoryItem.id).replace('{storeName}', getStoreInfo(selectedHistoryItem.storeId)?.name || '')
                               : t(translations.consultationFor).replace('{consultationId}', selectedHistoryItem.id).replace('{storeName}', getStoreInfo(selectedHistoryItem.storeId)?.name || '')
                           }
                        </DialogDescription>
                    </DialogHeader>
                   {renderTicketContent()}
                    <DialogFooter className="print-hide mt-4">
                        {(getStoreInfo(selectedHistoryItem.storeId)?.printers?.length || 0) > 0 ? (
                            <Button className="w-full font-sans rounded-xl" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" /> {t(translations.print)}
                            </Button>
                        ) : (
                             <Button className="w-full font-sans rounded-xl" disabled>
                                <Printer className="mr-2 h-4 w-4" /> {t(translations.noPrinter)}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
        

        {/* Ancien popup pour compatibilité */}
        <OrderDetailPopup 
            order={selectedOrderForPopup}
            isOpen={isOrderPopupOpen}
            onClose={() => {
                setIsOrderPopupOpen(false);
                setSelectedOrderForPopup(null);
            }}
        />
        </>
    );
}

