

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Clock, Upload, Utensils, Zap, Link as LinkIcon, CheckCircle, XCircle, BadgeEuro, X, Printer, Cog, TestTube2, Network, MessageCircle, TabletSmartphone, Copy, FileText, Bot, PhoneCall, PhoneForwarded, Car, Coffee, Building, Sparkles, BookOpen, BrainCircuit, ConciergeBell, Mail, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlanGate } from '@/components/PlanGate';
import { Textarea } from '@/components/ui/textarea';

type TaxRate = {
    id: string;
    name: string;
    rate: number;
    isDefault: boolean;
};

type PrinterDevice = {
    id: string;
    name: string;
    width: '58mm' | '80mm';
    connectionType: 'network' | 'usb';
    ipAddress?: string;
    port?: string;
};

type NotificationConfig = {
    enabled: boolean;
    email?: string;
    whatsapp?: string;
};

type ServiceType = 'products' | 'reservations' | 'consultation';

type DaySchedule = {
    enabled: boolean;
    periods: {
        start: string;
        end: string;
    }[];
};

type AIAgentConfig = {
    enabled: boolean;
    personality: 'professional' | 'friendly' | 'casual';
    voice: 'alloy' | 'echo' | 'nova';
    language: 'fr' | 'en' | 'ar';
    greeting: string;
    goodbye: string;
    upselling: boolean;
    upsellThreshold: number;
    multiLanguage: boolean;
    voiceSpeed: number;
};

type Store = {
    id: string;
    name: string;
    address: string;
    phone: string;
    status: 'active' | 'inactive';
    stripeStatus: 'connected' | 'disconnected';
    whatsappNumber?: string;
    currency: 'EUR' | 'USD' | 'TND';
    taxRates: TaxRate[];
    printers?: PrinterDevice[];
    isConfigured?: boolean;
    notifications: NotificationConfig;
    telnyxNumber?: string;
    telnyxConfigured?: boolean;
    serviceId?: string;
    serviceType: ServiceType;
    aiAgent?: AIAgentConfig;
    schedule?: {
        monday: DaySchedule;
        tuesday: DaySchedule;
        wednesday: DaySchedule;
        thursday: DaySchedule;
        friday: DaySchedule;
        saturday: DaySchedule;
        sunday: DaySchedule;
    };
};

const initialStores: Store[] = [
    { 
        id: "store-1", 
        name: "Le Gourmet Parisien - Centre", 
        address: "12 Rue de la Paix, 75002 Paris", 
        phone: "01 23 45 67 89", 
        status: 'active', 
        stripeStatus: 'connected', 
        currency: 'EUR', 
        whatsappNumber: '+33612345678',
        taxRates: [],
        printers: [],
        notifications: { enabled: true, email: 'contact@gourmet.fr', whatsapp: '+33612345678'},
        telnyxNumber: '+33987654321',
        telnyxConfigured: true,
        serviceId: 'service-1',
        serviceType: 'products',
    },
    { 
        id: "store-loc", 
        name: "Prestige Cars - Location", 
        address: "25 Avenue Montaigne, 75008 Paris",
        phone: "01 98 76 54 32",
        status: 'active',
        stripeStatus: 'connected',
        currency: 'EUR',
        taxRates: [],
        notifications: { enabled: false },
        serviceType: 'reservations',
        telnyxConfigured: true,
    },
     { 
        id: "store-4", 
        name: "Cabinet d'Avocats", 
        address: "1 Avenue des Champs-Élysées, 75008 Paris",
        phone: "01 44 55 66 77",
        status: 'active',
        stripeStatus: 'disconnected',
        currency: 'EUR',
        taxRates: [],
        notifications: { enabled: true, email: 'contact@avocats.fr' },
        serviceType: 'consultation',
        telnyxConfigured: false,
    },
     { 
        id: "store-spa", 
        name: "Spa & Bien-être 'Zen'", 
        address: "7 Rue du Faubourg Saint-Honoré, 75008 Paris",
        phone: "01 88 77 66 55",
        status: 'inactive',
        stripeStatus: 'disconnected',
        currency: 'EUR',
        taxRates: [],
        notifications: { enabled: false },
        serviceType: 'reservations',
        telnyxConfigured: false,
    },
];

const daysOfWeekEn = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const daysOfWeekFr = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];


const WIZARD_STEPS = [
    { id: 'welcome', title: { fr: 'Bienvenue', en: 'Welcome' } },                    // 0
    { id: 'general', title: { fr: 'Infos Générales', en: 'General Info' } },         // 1
    { id: 'opening', title: { fr: 'Horaires', en: 'Opening Hours' } },               // 2
    { id: 'taxes', title: { fr: 'Taxes', en: 'Taxes' } },                           // 3
    { id: 'peripherals', title: { fr: 'Périphériques & Notifications', en: 'Peripherals & Notifications' } }, // 4
    { id: 'finish', title: { fr: 'Finalisation', en: 'Finalization' } },            // 5
];

// Dynamic plan detection based on store subscription
const getCurrentPlan = (store: Store | null, allStores: Store[] = []) => {
    // Si c'est une édition, récupérer le plan du store
    if (store) {
        // Chercher le store avec sa subscription dans la liste des stores
        const foundStore = allStores.find(s => s.id === store.id);
        return foundStore?.subscription?.plan || 'STARTER';
    }
    // Pour nouveau store, utiliser le plan du premier store existant ou STARTER par défaut
    const defaultPlan = allStores[0]?.subscription?.plan || 'STARTER';
    return defaultPlan;
};

function StoreWizard({ store, onSave, onCancel, isFirstActivity = false, userStatus, onShowPlanModal, isAdvancedConfig = false, stores = [] }: { store: Store | null, onSave: (store: Store) => void, onCancel: () => void, isFirstActivity?: boolean, userStatus?: any, onShowPlanModal?: (activityData: any) => void, isAdvancedConfig?: boolean, stores?: Store[] }) {
    const router = useRouter();
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const [wizardStep, setWizardStep] = useState(
        isAdvancedConfig ? 2 : (store ? 1 : 0)
    ); // Start at schedules if advanced config, general info if editing, welcome if new
    
    // Récupérer le plan actuel de l'utilisateur
    const currentUserPlan = getCurrentPlan(store, stores);
    
    // Définir les fonctionnalités disponibles par plan
    const planFeatures = {
        STARTER: {
            voiceSelection: false,
            upselling: false,
            multiLanguage: false,
            maxVoices: 1,
            availableVoices: ['alloy']
        },
        PRO: {
            voiceSelection: true,
            upselling: true,
            multiLanguage: true,
            maxVoices: 3,
            availableVoices: ['alloy', 'echo', 'nova']
        },
        BUSINESS: {
            voiceSelection: true,
            upselling: true,
            multiLanguage: true,
            voiceCloning: true,
            maxVoices: 6,
            availableVoices: ['alloy', 'echo', 'nova', 'onyx', 'fable', 'shimmer']
        }
    };
    
    const currentFeatures = planFeatures[currentUserPlan as keyof typeof planFeatures] || planFeatures.STARTER;
    
    // Conserver isFirstActivity dans l'état local pour éviter qu'il soit perdu
    const [isFirstActivityState] = useState(isFirstActivity);
    
    const defaultSchedule = {
        monday: { enabled: true, periods: [{ start: "09:00", end: "18:00" }] },
        tuesday: { enabled: true, periods: [{ start: "09:00", end: "18:00" }] },
        wednesday: { enabled: true, periods: [{ start: "09:00", end: "18:00" }] },
        thursday: { enabled: true, periods: [{ start: "09:00", end: "18:00" }] },
        friday: { enabled: true, periods: [{ start: "09:00", end: "18:00" }] },
        saturday: { enabled: true, periods: [{ start: "09:00", end: "18:00" }] },
        sunday: { enabled: false, periods: [{ start: "09:00", end: "18:00" }] },
    };
    
    const defaultTaxRates = [
        { id: 'tax_normal', name: 'Normal', rate: 20, isDefault: true },
        { id: 'tax_reduced', name: 'Réduit', rate: 10, isDefault: false },
    ];
    
    const [editableStore, setEditableStore] = useState<Partial<Store>>(
        store || {
            status: 'active',
            stripeStatus: 'disconnected',
            currency: 'EUR',
            // Services multi-métiers (tous activés par défaut)
            hasProducts: true,
            hasReservations: true,
            hasConsultations: true,
            aiAgent: {
                enabled: true,
                personality: 'friendly',
                voice: 'nova',
                language: 'fr',
                greeting: `Bonjour, bienvenue chez ${store?.name || 'notre établissement'}. Comment puis-je vous aider ?`,
                goodbye: 'Merci pour votre commande. À bientôt !',
                upselling: false,
                upsellThreshold: 15,
                multiLanguage: false,
                voiceSpeed: 1.0
            },
            taxRates: defaultTaxRates,
            printers: [],
            notifications: { enabled: true },
            telnyxConfigured: false,
            schedule: defaultSchedule,
            isConfigured: false,
        }
    );
    const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'BUSINESS' | null>(null);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);

    const daysOfWeek = language === 'fr' ? daysOfWeekFr : daysOfWeekEn;

    // Modifier les étapes selon si c'est la première activité ou non
    const getFilteredSteps = () => {
        if (isFirstActivityState) {
            // Pour la première activité, pas d'étape plan (déjà payé)
            return WIZARD_STEPS.filter(step => step.id !== 'plan');
        }
        return WIZARD_STEPS;
    };

    const filteredSteps = getFilteredSteps();

    const handlePaymentForNewActivity = async () => {
        if (!editableStore.name || !editableStore.address || !editableStore.phone) {
            toast({
                title: t({ fr: "Erreur", en: "Error" }),
                description: t({ fr: "Veuillez remplir tous les champs obligatoires", en: "Please fill in all required fields" }),
                variant: "destructive"
            });
            return;
        }

        if (!selectedPlan) {
            toast({
                title: t({ fr: "Erreur", en: "Error" }),
                description: t({ fr: "Veuillez sélectionner un plan", en: "Please select a plan" }),
                variant: "destructive"
            });
            return;
        }

        try {
            setIsPaymentProcessing(true);

            const activityData = {
                name: editableStore.name,
                address: editableStore.address,
                phone: editableStore.phone,
                hasProducts: editableStore.hasProducts,
                hasReservations: editableStore.hasReservations,
                hasConsultations: editableStore.hasConsultations,
                currency: editableStore.currency,
                taxRates: editableStore.taxRates,
                schedule: editableStore.schedule,
                printers: editableStore.printers,
                notifications: editableStore.notifications,
                telnyxConfigured: editableStore.telnyxConfigured,
                isConfigured: true
            };

            const response = await fetch('/api/stripe/checkout-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    activityData
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la création de la session de paiement');
            }

            const { sessionUrl } = await response.json();
            window.location.href = sessionUrl;

        } catch (error: any) {
            console.error('Error creating payment session:', error);
            toast({
                title: t({ fr: "Erreur", en: "Error" }),
                description: error.message || t({ fr: "Erreur lors du paiement", en: "Payment error" }),
                variant: "destructive"
            });
            setIsPaymentProcessing(false);
        }
    };

    const handleFinalize = async () => {
        // Si c'est une modification d'un store existant, sauvegarder directement sans modal de plan
        if (store) {
            onSave(editableStore as Store);
            return;
        }
        
        // Pour les nouvelles activités (non-premières), appeler la fonction parent pour afficher le modal
        if (!isFirstActivityState && onShowPlanModal) {
            const activityData = {
                name: editableStore.name,
                address: editableStore.address,
                phone: editableStore.phone,
                hasProducts: editableStore.hasProducts,
                hasReservations: editableStore.hasReservations,
                hasConsultations: editableStore.hasConsultations,
                currency: editableStore.currency,
                taxRates: editableStore.taxRates,
                schedule: editableStore.schedule,
                printers: editableStore.printers,
                notifications: editableStore.notifications,
                telnyxConfigured: editableStore.telnyxConfigured,
                isConfigured: true
            };
            onShowPlanModal(activityData);
            return;
        }

        // Pour la première activité, créer directement (déjà payé)
        if (!editableStore.name || !editableStore.address || !editableStore.phone) {
            toast({
                title: t({ fr: "Erreur", en: "Error" }),
                description: t({ fr: "Veuillez remplir tous les champs obligatoires", en: "Please fill in all required fields" }),
                variant: "destructive"
            });
            return;
        }

        try {
            const response = await fetch('/api/restaurant/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editableStore.name,
                    address: editableStore.address,
                    phone: editableStore.phone,
                    hasProducts: editableStore.hasProducts,
                hasReservations: editableStore.hasReservations,
                hasConsultations: editableStore.hasConsultations,
                    currency: editableStore.currency,
                    taxRates: editableStore.taxRates,
                    schedule: editableStore.schedule,
                    printers: editableStore.printers,
                    notifications: editableStore.notifications,
                    telnyxConfigured: editableStore.telnyxConfigured,
                    isConfigured: true,
                    paidPlan: userStatus?.paidPlan // Ajouter le plan déjà payé pour la première activité
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la création');
            }

            const createdActivity = await response.json();
            
            toast({
                title: t({ fr: "Succès", en: "Success" }),
                description: t({ fr: "Activité créée avec succès", en: "Activity created successfully" }),
            });

            // Fermer le dialog et naviguer vers la configuration du service
            onCancel();
            router.push(`/restaurant/services/${createdActivity.stores[0]?.id || createdActivity.id}`);

        } catch (error: any) {
            console.error('Error creating activity:', error);
            toast({
                title: t({ fr: "Erreur", en: "Error" }),
                description: error.message || t({ fr: "Erreur lors de la création", en: "Error during creation" }),
                variant: "destructive"
            });
        }
    }

    const handleInputChange = (field: keyof Store, value: any) => {
        setEditableStore(prev => ({ ...prev, [field]: value }));
    };

    const handleNotificationChange = (field: keyof NotificationConfig, value: any) => {
        const currentNotifications = editableStore.notifications || { enabled: false };
        handleInputChange('notifications', { ...currentNotifications, [field]: value });
    }

    // Fonction supprimée - plus besoin de sélection de type de service


    const handleTaxRateChange = (index: number, field: keyof TaxRate, value: string | number | boolean) => {
        const newTaxRates = [...(editableStore.taxRates || [])];
        if (field === 'isDefault' && value === true) {
            newTaxRates.forEach((rate, i) => {
                rate.isDefault = i === index;
            });
        } else {
            (newTaxRates[index] as any)[field] = value;
        }
        handleInputChange('taxRates', newTaxRates);
    };

    const addTaxRate = () => {
        const newTaxRates = [...(editableStore.taxRates || []), { id: `tax_${Date.now()}`, name: '', rate: 0, isDefault: false }];
        handleInputChange('taxRates', newTaxRates);
    };

    const removeTaxRate = (index: number) => {
        let newTaxRates = (editableStore.taxRates || []).filter((_, i) => i !== index);
        if (newTaxRates.length > 0 && !newTaxRates.some(r => r.isDefault)) {
            newTaxRates[0].isDefault = true;
        }
        handleInputChange('taxRates', newTaxRates);
    };

    const handlePrinterChange = (index: number, field: keyof PrinterDevice, value: string) => {
        const newPrinters = [...(editableStore.printers || [])];
        (newPrinters[index] as any)[field] = value;
        handleInputChange('printers', newPrinters);
    };

    const addPrinter = () => {
        const newPrinters = [...(editableStore.printers || []), { id: `printer_${Date.now()}`, name: t({ fr: 'Nouvelle imprimante', en: 'New Printer' }), width: '80mm', connectionType: 'network' }];
        handleInputChange('printers', newPrinters);
    };

    const removePrinter = (index: number) => {
        const newPrinters = (editableStore.printers || []).filter((_, i) => i !== index);
        handleInputChange('printers', newPrinters);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: t({ fr: "Copié !", en: "Copied!" }),
        });
    }

    const handleScheduleChange = (day: string, field: 'enabled', value: boolean) => {
        const currentSchedule = editableStore.schedule || defaultSchedule;
        const daySchedule = currentSchedule[day as keyof typeof currentSchedule] || defaultSchedule[day as keyof typeof defaultSchedule];
        const updatedSchedule = {
            ...currentSchedule,
            [day]: {
                ...daySchedule,
                [field]: value
            }
        };
        handleInputChange('schedule', updatedSchedule);
    };

    const handlePeriodChange = (day: string, periodIndex: number, field: 'start' | 'end', value: string) => {
        const currentSchedule = editableStore.schedule || defaultSchedule;
        const daySchedule = currentSchedule[day as keyof typeof currentSchedule] || defaultSchedule[day as keyof typeof defaultSchedule];
        const updatedPeriods = [...(daySchedule?.periods || [])];
        updatedPeriods[periodIndex] = {
            ...updatedPeriods[periodIndex],
            [field]: value
        };
        
        const updatedSchedule = {
            ...currentSchedule,
            [day]: {
                ...daySchedule,
                periods: updatedPeriods
            }
        };
        handleInputChange('schedule', updatedSchedule);
    };

    const addPeriod = (day: string) => {
        const currentSchedule = editableStore.schedule || defaultSchedule;
        const daySchedule = currentSchedule[day as keyof typeof currentSchedule] || defaultSchedule[day as keyof typeof defaultSchedule];
        const updatedPeriods = [...(daySchedule?.periods || []), { start: "14:00", end: "18:00" }];
        
        const updatedSchedule = {
            ...currentSchedule,
            [day]: {
                ...daySchedule,
                periods: updatedPeriods
            }
        };
        handleInputChange('schedule', updatedSchedule);
    };

    const removePeriod = (day: string, periodIndex: number) => {
        const currentSchedule = editableStore.schedule || defaultSchedule;
        const daySchedule = currentSchedule[day as keyof typeof currentSchedule] || defaultSchedule[day as keyof typeof defaultSchedule];
        const updatedPeriods = (daySchedule?.periods || []).filter((_, index) => index !== periodIndex);
        
        const updatedSchedule = {
            ...currentSchedule,
            [day]: {
                ...daySchedule,
                periods: updatedPeriods.length > 0 ? updatedPeriods : [{ start: "09:00", end: "18:00" }]
            }
        };
        handleInputChange('schedule', updatedSchedule);
    };

    const nextStep = () => {
        // Validation des champs obligatoires selon l'étape
        
        if (wizardStep === 1) {
            // Étape general info - vérifier les champs obligatoires
            if (!editableStore.name || !editableStore.address || !editableStore.phone) {
                toast({
                    title: t({ fr: "Champs obligatoires", en: "Required fields" }),
                    description: t({ fr: "Veuillez remplir le nom, l'adresse et le téléphone", en: "Please fill in name, address and phone" }),
                    variant: "destructive"
                });
                return;
            }
        }
        
        setWizardStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    };
    const prevStep = () => setWizardStep(prev => Math.max(prev - 1, 0));

    const translations = {
        editStore: { fr: "Modifier l'activité", en: "Edit Activity" },
        addNewStore: { fr: "Assistant de configuration", en: "Setup Wizard" },
        stepOf: { fr: "Étape {step} sur {total}", en: "Step {step} of {total}" },
        welcomeTitle: { fr: 'Bienvenue chez Kalliky.ai !', en: 'Welcome to Kalliky.ai!' },
        welcomeDescription: { fr: 'Prêt à transformer la gestion de votre activité ? Cet assistant va vous guider pour configurer votre espace de travail en quelques minutes.', en: 'Ready to transform your business management? This wizard will guide you to set up your workspace in minutes.' },
        startConfig: { fr: 'Commencer la configuration', en: 'Start Configuration' },
        general: { fr: "Général", en: "General" },
        openingHours: { fr: "Horaires", en: "Hours" },
        taxes: { fr: "Taxes", en: "Taxes" },
        peripherals: { fr: "Périphériques & Notifications", en: "Peripherals & Notifications" },
        activityTypeTitle: { fr: "Quel est le cœur de votre métier ?", en: "What is the core of your business?" },
        activityTypeDescription: { fr: "Ce choix déterminera les outils de configuration disponibles.", en: "This choice will determine the available configuration tools." },
        productsSale: { fr: "Vente de Produits", en: "Product Sales" },
        productsSaleDesc: { fr: "Restaurants, cafés, fast-foods...", en: "Restaurants, cafes, fast-food..." },
        reservationsManagement: { fr: "Gestion de Réservations", en: "Reservation Management" },
        reservationsManagementDesc: { fr: "Location, spas, événements...", en: "Rentals, spas, events..." },
        qualifiedAppointments: { fr: "Prise de RDV Qualifiée", en: "Qualified Appointments" },
        qualifiedAppointmentsDesc: { fr: "Avocats, consultants...", en: "Lawyers, consultants..." },
        posName: { fr: "Nom de l'activité", en: "Activity Name" },
        fullAddress: { fr: "Adresse complète", en: "Full address" },
        landline: { fr: "Téléphone fixe (ligne principale)", en: "Landline phone (main line)" },
        openingHoursDesc: { fr: "Utilisé pour accepter ou refuser les demandes automatiquement.", en: "Used to automatically accept or refuse requests." },
        defaultCurrency: { fr: "Devise par défaut", en: "Default currency" },
        vatRates: { fr: "Taux de TVA applicables", en: "Applicable VAT rates" },
        taxNamePlaceholder: { fr: "Nom (ex: Normal)", en: "Name (e.g. Standard)" },
        rate: { fr: "Taux", en: "Rate" },
        default: { fr: "Défaut", en: "Default" },
        addVatRate: { fr: "Ajouter un taux de TVA", en: "Add a VAT rate" },
        notifications: { fr: "Notifications", en: "Notifications" },
        notificationsDesc: { fr: "Soyez prévenu des nouvelles demandes.", en: "Be notified of new requests." },
        enableNotifications: { fr: "Activer les notifications", en: "Enable notifications" },
        notificationEmail: { fr: "Email de notification", en: "Notification Email" },
        notificationWhatsapp: { fr: "N° WhatsApp de notification", en: "Notification WhatsApp No." },
        connectionsTitle: { fr: 'Connexions & Services', en: 'Connections & Services' },
        endCustomerPayments: { fr: "Paiements des clients finaux", en: "End-customer payments" },
        stripeDescription: { fr: "Permet à vos clients de payer leurs commandes/réservations en ligne. L'argent est directement versé sur votre compte Stripe.", en: "Allows your customers to pay for their orders/reservations online. The money is paid directly into your Stripe account." },
        connectStripe: { fr: "Connecter mon compte Stripe", en: "Connect my Stripe account" },
        stripePayments: { fr: "Paiements en ligne", en: "Online Payments" },
        enableStripePayments: { fr: "Activer les paiements en ligne", en: "Enable online payments" },
        connectStripeAccount: { fr: "Connecter mon compte Stripe", en: "Connect my Stripe account" },
        stripeInfo: { fr: "Connectez votre compte Stripe pour envoyer des liens de paiement à vos clients.", en: "Connect your Stripe account to send payment links to your customers." },
        planProRequired: { fr: 'Plan Pro requis', en: 'Pro Plan required' },
        messagingDescription: { fr: "Utilisé pour les demandes de preuve (Plan Pro et +).", en: "Used for proof requests (Pro Plan and up)." },
        whatsappNumber: { fr: "Numéro WhatsApp de l'activité", en: "Activity's WhatsApp number" },
        printerManagement: { fr: "Gestion des imprimantes de tickets", en: "Receipt Printer Management" },
        width: { fr: "Largeur", en: "Width" },
        connectionType: { fr: "Type de connexion", en: "Connection Type" },
        networkIp: { fr: "Réseau (IP)", en: "Network (IP)" },
        usbOther: { fr: "USB / Autre", en: "USB / Other" },
        ipAddress: { fr: "Adresse IP", en: "IP Address" },
        port: { fr: "Port", en: "Port" },
        addPrinter: { fr: "Ajouter une imprimante", en: "Add a printer" },
        telnyxTitle: { fr: "Activez la réception des appels", en: "Activate call reception" },
        telnyxDescription: { fr: "Pour que notre IA puisse répondre à vos clients, vous devez rediriger les appels de votre ligne principale vers le numéro que nous avons créé pour vous.", en: "For our AI to be able to answer your customers, you must forward calls from your main line to the number we have created for you." },
        telnyxNumberLabel: { fr: "Votre numéro vocal", en: "Your voice number" },
        telnyxInstructions: { fr: "Instructions :", en: "Instructions:" },
        telnyxInstruction1: { fr: "1. Connectez-vous à l'interface de votre opérateur téléphonique (Orange, Free, SFR...).", en: "1. Log in to your telephone operator's interface (Orange, Free, SFR...)." },
        telnyxInstruction2: { fr: "2. Trouvez l'option \"Renvoi d'appel\" ou \"Transfert d'appel\".", en: "2. Find the \"Call Forwarding\" or \"Call Transfer\" option." },
        telnyxInstruction3: { fr: "3. Configurez un renvoi de tous les appels vers votre numéro vocal ci-dessus.", en: "3. Set up forwarding for all calls to your voice number above." },
        telnyxConfirm: { fr: "J'ai configuré le renvoi d'appel", en: "I have configured call forwarding" },
        configureLater: { fr: 'Configurer plus tard', en: 'Configure later' },
        finishTitle: { fr: 'Votre espace est prêt !', en: 'Your space is ready!' },
        finishDescription: { fr: "Il ne reste plus qu'à configurer les services que vous proposez. C'est simple et rapide.", en: "All that's left is to configure the services you offer. It's quick and easy." },
        menuCreationMethod: { fr: 'Méthodes de configuration du service', en: 'Service Configuration Methods' },
        method1Title: { fr: 'Import de fichier', en: 'File Import' },
        method1Desc: { fr: 'Importez votre catalogue ou vos prestations depuis un fichier ou une photo.', en: 'Import your catalog or services from a file or photo.' },
        method2Title: { fr: 'Création manuelle', en: 'Manual Creation' },
        method2Desc: { fr: 'Utilisez notre éditeur complet pour créer vos offres pas à pas.', en: 'Use our comprehensive editor to create your offerings step-by-step.' },
        cancel: { fr: "Annuler", en: "Cancel" },
        previous: { fr: 'Précédent', en: 'Previous' },
        next: { fr: 'Suivant', en: 'Next' },
        finishAndCreateMenu: { fr: 'Finaliser ma configuration', en: 'Finalize my configuration' },
    };

    return (
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
            <DialogHeader className="border-b border-gradient-to-r from-transparent via-gray-200 to-transparent pb-6">
                <div className="flex items-center justify-between">
                    <DialogTitle className="text-center text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        {store ? t(translations.editStore) : t(translations.addNewStore)}
                    </DialogTitle>
                    {store && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {t({ fr: "Mode Édition", en: "Edit Mode" })}
                        </Badge>
                    )}
                </div>
                <DialogDescription className="text-center text-muted-foreground">
                    {store ? (
                        t({ fr: "Modifiez les paramètres de votre activité en naviguant entre les onglets", en: "Modify your activity settings by navigating between tabs" })
                    ) : (
                        WIZARD_STEPS[wizardStep].id !== 'welcome' && WIZARD_STEPS[wizardStep].id !== 'finish' 
                            ? `${t(translations.stepOf).replace('{step}', wizardStep.toString()).replace('{total}', (WIZARD_STEPS.length - 2).toString())} - ${t(WIZARD_STEPS[wizardStep].title)}`
                            : WIZARD_STEPS[wizardStep].id === 'welcome'
                            ? t(translations.welcomeDescription)
                            : t(translations.finishDescription)
                    )}
                </DialogDescription>
                
                {/* Navigation: Step Indicator (Creation) ou Tabs (Edition) */}
                {WIZARD_STEPS[wizardStep].id !== 'welcome' && WIZARD_STEPS[wizardStep].id !== 'finish' && (
                    <div className="pt-4">
                        {store ? (
                            // Mode Édition : Onglets cliquables
                            <div className="border-b border-gray-200">
                                <nav className="flex space-x-8 overflow-x-auto">
                                    {WIZARD_STEPS.slice(1, -1).map((step, index) => {
                                        const stepIndex = index + 1;
                                        const isActive = stepIndex === wizardStep;
                                        const isCompleted = stepIndex < wizardStep;
                                        
                                        return (
                                            <button
                                                key={step.id}
                                                onClick={() => setWizardStep(stepIndex)}
                                                className={cn(
                                                    "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200",
                                                    isActive
                                                        ? "border-blue-500 text-blue-600"
                                                        : isCompleted
                                                            ? "border-green-500 text-green-600 hover:text-green-700"
                                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                                )}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    {isCompleted && <CheckCircle className="w-4 h-4" />}
                                                    <span>{t(step.title)}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        ) : (
                            // Mode Création : Indicateur d'étapes (non cliquable)
                            <div className="flex items-center justify-center">
                                <div className="flex items-center space-x-3">
                                    {WIZARD_STEPS.slice(1, -1).map((step, index) => (
                                        <div key={index} className="flex items-center">
                                            <div
                                                className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                                                    index + 1 === wizardStep 
                                                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-110" 
                                                        : index + 1 < wizardStep 
                                                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25" 
                                                            : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                                                )}
                                            >
                                                {index + 1 < wizardStep ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <span>{index + 1}</span>
                                                )}
                                            </div>
                                            {index < WIZARD_STEPS.slice(1, -1).length - 1 && (
                                                <div className={cn(
                                                    "w-8 h-0.5 mx-2 transition-colors duration-300",
                                                    index + 1 < wizardStep 
                                                        ? "bg-gradient-to-r from-green-500 to-green-400" 
                                                        : "bg-gray-200"
                                                )}></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogHeader>

            {/* Apple-style Progress Bar */}
            {WIZARD_STEPS[wizardStep].id !== 'welcome' && WIZARD_STEPS[wizardStep].id !== 'finish' &&
                <div className="py-3">
                    <div className="relative">
                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(wizardStep / (WIZARD_STEPS.length - 2)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            }

            <div className="flex-1 overflow-y-auto space-y-6">
                <div className="px-1">
                    {wizardStep === 0 && (
                        <div className="text-center space-y-8 py-12">
                            {/* Apple-style Hero Icon */}
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 mb-6 shadow-2xl shadow-blue-500/20">
                                <Sparkles className="h-10 w-10 text-white" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-700 bg-clip-text text-transparent">
                                    {t(translations.welcomeTitle)}
                                </h2>
                                <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                                    {t(translations.welcomeDescription)}
                                </p>
                            </div>
                            
                            {/* Features Preview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
                                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                                        <BrainCircuit className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">{t({ fr: "IA Avancée", en: "Advanced AI" })}</h3>
                                    <p className="text-sm text-gray-600">{t({ fr: "Réception intelligente des appels", en: "Intelligent call reception" })}</p>
                                </div>
                                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl border border-purple-200/50">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                                        <Zap className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">{t({ fr: "Configuration Rapide", en: "Quick Setup" })}</h3>
                                    <p className="text-sm text-gray-600">{t({ fr: "Prêt en quelques minutes", en: "Ready in minutes" })}</p>
                                </div>
                                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-200/50">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                                        <ConciergeBell className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">{t({ fr: "Service Premium", en: "Premium Service" })}</h3>
                                    <p className="text-sm text-gray-600">{t({ fr: "Expérience client exceptionnelle", en: "Exceptional customer experience" })}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Étape de sélection du type de service supprimée - tous les services sont inclus par défaut */}
                    {wizardStep === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t(translations.posName)}</Label>
                                <Input id="name" name="name" value={editableStore.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">{t(translations.fullAddress)}</Label>
                                <Input id="address" name="address" value={editableStore.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phone">{t(translations.landline)}</Label>
                                <Input id="phone" name="phone" type="tel" value={editableStore.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} required />
                            </div>
                        </div>
                    )}
                     {wizardStep === 2 && (
                        <div className="space-y-6">
                            {/* Header avec description Apple-style */}
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                    {t(translations.openingHours)}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                    {t(translations.openingHoursDesc)}
                                </p>
                            </div>

                            {/* Layout ultra-compact inspiré d'Apple */}
                            <div className="space-y-6">
                                {/* Jours de semaine - Grille compacte 2x3 pour desktop */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                                            {t({ fr: "Jours de semaine", en: "Weekdays" })}
                                        </h4>
                                        <span className="text-xs text-gray-500">{t({ fr: "5 jours", en: "5 days" })}</span>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {daysOfWeek.slice(0, 5).map((dayName, dayIndex) => {
                                            const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'][dayIndex];
                                            const currentSchedule = editableStore.schedule || defaultSchedule;
                                            const daySchedule = currentSchedule[dayKey as keyof typeof currentSchedule] || defaultSchedule[dayKey as keyof typeof defaultSchedule];
                                            
                                            return (
                                                <Card key={dayKey} className={cn(
                                                    "group transition-all duration-300 border-0 shadow-sm hover:shadow-lg overflow-hidden",
                                                    daySchedule?.enabled 
                                                        ? "bg-gradient-to-br from-white via-blue-50/20 to-blue-100/30 ring-1 ring-blue-200/50" 
                                                        : "bg-gradient-to-br from-gray-50/80 to-gray-100/50 ring-1 ring-gray-200/50"
                                                )}>
                                                    <div className={cn(
                                                        "h-1 w-full",
                                                        daySchedule?.enabled 
                                                            ? "bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" 
                                                            : "bg-gray-300"
                                                    )} />
                                                    <CardContent className="p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm text-gray-900">{dayName.slice(0, 3)}</span>
                                                            </div>
                                                            <Switch 
                                                                checked={daySchedule?.enabled || false}
                                                                onCheckedChange={(checked) => handleScheduleChange(dayKey, 'enabled', checked)}
                                                                className="scale-75 data-[state=checked]:bg-blue-500"
                                                            />
                                                        </div>
                                                        {daySchedule?.enabled && (
                                                            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                                                                {daySchedule?.periods?.map((period, periodIndex) => (
                                                                    <div key={periodIndex} className="flex items-center gap-1.5 p-1.5 bg-white/80 rounded-md border border-blue-100/60">
                                                                        <Input 
                                                                            type="time" 
                                                                            value={period.start}
                                                                            onChange={(e) => handlePeriodChange(dayKey, periodIndex, 'start', e.target.value)}
                                                                            className="h-7 text-xs border-0 bg-transparent focus:bg-white/90 px-1"
                                                                        />
                                                                        <div className="w-2 h-0.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                                                                        <Input 
                                                                            type="time" 
                                                                            value={period.end}
                                                                            onChange={(e) => handlePeriodChange(dayKey, periodIndex, 'end', e.target.value)}
                                                                            className="h-7 text-xs border-0 bg-transparent focus:bg-white/90 px-1"
                                                                        />
                                                                        {(daySchedule?.periods?.length || 0) > 1 && (
                                                                            <Button 
                                                                                type="button" 
                                                                                variant="ghost" 
                                                                                size="icon" 
                                                                                className="h-5 w-5 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                onClick={() => removePeriod(dayKey, periodIndex)}
                                                                            >
                                                                                <X className="h-2.5 w-2.5" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                <Button 
                                                                    type="button" 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="w-full h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 border-dashed border border-blue-200/60"
                                                                    onClick={() => addPeriod(dayKey)}
                                                                >
                                                                    <PlusCircle className="mr-1 h-2.5 w-2.5" />
                                                                    {t({ fr: "+", en: "+" })}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Weekend - Layout côte à côte */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"></div>
                                            {t({ fr: "Weekend", en: "Weekend" })}
                                        </h4>
                                        <span className="text-xs text-gray-500">{t({ fr: "2 jours", en: "2 days" })}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {daysOfWeek.slice(5, 7).map((dayName, dayIndex) => {
                                            const dayKey = ['saturday', 'sunday'][dayIndex];
                                            const currentSchedule = editableStore.schedule || defaultSchedule;
                                            const daySchedule = currentSchedule[dayKey as keyof typeof currentSchedule] || defaultSchedule[dayKey as keyof typeof defaultSchedule];
                                            
                                            return (
                                                <Card key={dayKey} className={cn(
                                                    "group transition-all duration-300 border-0 shadow-sm hover:shadow-lg overflow-hidden",
                                                    daySchedule?.enabled 
                                                        ? "bg-gradient-to-br from-white via-purple-50/20 to-purple-100/30 ring-1 ring-purple-200/50" 
                                                        : "bg-gradient-to-br from-gray-50/80 to-gray-100/50 ring-1 ring-gray-200/50"
                                                )}>
                                                    <div className={cn(
                                                        "h-1 w-full",
                                                        daySchedule?.enabled 
                                                            ? "bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600" 
                                                            : "bg-gray-300"
                                                    )} />
                                                    <CardContent className="p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm text-gray-900">{dayName}</span>
                                                            </div>
                                                            <Switch 
                                                                checked={daySchedule?.enabled || false}
                                                                onCheckedChange={(checked) => handleScheduleChange(dayKey, 'enabled', checked)}
                                                                className="scale-75 data-[state=checked]:bg-purple-500"
                                                            />
                                                        </div>
                                                        {daySchedule?.enabled && (
                                                            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                                                                {daySchedule?.periods?.map((period, periodIndex) => (
                                                                    <div key={periodIndex} className="flex items-center gap-1.5 p-1.5 bg-white/80 rounded-md border border-purple-100/60">
                                                                        <Input 
                                                                            type="time" 
                                                                            value={period.start}
                                                                            onChange={(e) => handlePeriodChange(dayKey, periodIndex, 'start', e.target.value)}
                                                                            className="h-7 text-xs border-0 bg-transparent focus:bg-white/90 px-1"
                                                                        />
                                                                        <div className="w-2 h-0.5 bg-purple-400 rounded-full flex-shrink-0"></div>
                                                                        <Input 
                                                                            type="time" 
                                                                            value={period.end}
                                                                            onChange={(e) => handlePeriodChange(dayKey, periodIndex, 'end', e.target.value)}
                                                                            className="h-7 text-xs border-0 bg-transparent focus:bg-white/90 px-1"
                                                                        />
                                                                        {(daySchedule?.periods?.length || 0) > 1 && (
                                                                            <Button 
                                                                                type="button" 
                                                                                variant="ghost" 
                                                                                size="icon" 
                                                                                className="h-5 w-5 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                onClick={() => removePeriod(dayKey, periodIndex)}
                                                                            >
                                                                                <X className="h-2.5 w-2.5" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                <Button 
                                                                    type="button" 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="w-full h-6 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50/50 border-dashed border border-purple-200/60"
                                                                    onClick={() => addPeriod(dayKey)}
                                                                >
                                                                    <PlusCircle className="mr-1 h-2.5 w-2.5" />
                                                                    {t({ fr: "+", en: "+" })}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {wizardStep === 3 && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2"><BadgeEuro className="h-4 w-4"/> {t(translations.vatRates)}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <Label htmlFor="currency">{t(translations.defaultCurrency)}</Label>
                                        <Select name="currency" value={editableStore.currency || 'EUR'} onValueChange={(value) => handleInputChange('currency', value)}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EUR">Euro (€)</SelectItem>
                                                <SelectItem value="USD">Dollar ($)</SelectItem>
                                                <SelectItem value="TND">Dinar (DT)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>{t(translations.vatRates)}</Label>
                                        <div className="mt-2 space-y-2 p-3 border rounded-md">
                                            {(editableStore.taxRates || []).map((taxRate, index) => (
                                                <div key={taxRate.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                                    <div className="sm:col-span-5">
                                                        <Input placeholder={t(translations.taxNamePlaceholder)} value={taxRate.name} onChange={(e) => handleTaxRateChange(index, 'name', e.target.value)} />
                                                    </div>
                                                    <div className="sm:col-span-3 relative">
                                                        <Input placeholder={t(translations.rate)} type="number" value={taxRate.rate} onChange={(e) => handleTaxRateChange(index, 'rate', parseFloat(e.target.value))} step="0.1" />
                                                         <span className="absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">%</span>
                                                    </div>
                                                    <div className="sm:col-span-3 flex items-center gap-2">
                                                        <input type="radio" id={`default-tax-${index}`} name="default-tax" checked={taxRate.isDefault} onChange={(e) => handleTaxRateChange(index, 'isDefault', e.target.checked)} />
                                                        <Label htmlFor={`default-tax-${index}`} className="text-xs font-normal">{t(translations.default)}</Label>
                                                    </div>
                                                    {(editableStore.taxRates || []).length > 1 &&
                                                        <div className="sm:col-span-1">
                                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTaxRate(index)}>
                                                                <X className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    }
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={addTaxRate}>
                                                <PlusCircle className="mr-2 h-4 w-4"/> {t(translations.addVatRate)}
                                            </Button>
                                        </div>
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <div className="flex items-start gap-2">
                                                <BadgeEuro className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                <div className="text-sm">
                                                    <p className="font-medium text-blue-900">{t({ fr: "Important : Prix TTC", en: "Important: Prices including VAT" })}</p>
                                                    <p className="text-blue-800 text-xs mt-1">
                                                        {t({ fr: "Tous les prix que vous configurerez pour vos produits/services seront en TTC (toutes taxes comprises). La TVA sera automatiquement calculée et affichée sur les tickets.", en: "All prices you configure for your products/services will be inclusive of VAT. VAT will be automatically calculated and displayed on receipts." })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {wizardStep === 4 && (
                        <div className="space-y-4">
                           {editableStore.serviceType === 'products' && (
                               <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2"><Printer className="h-4 w-4"/> {t(translations.printerManagement)}</CardTitle>
                                    </CardHeader>
                                <CardContent className="space-y-3">
                                  {(editableStore.printers || []).map((printer, index) => (
                                    <Card key={printer.id} className="bg-muted/50">
                                      <CardHeader className="py-3 px-4 flex-row items-center justify-between">
                                          <CardTitle className="text-base flex items-center gap-2">
                                              <Input value={printer.name} onChange={(e) => handlePrinterChange(index, 'name', e.target.value)} className="border-none shadow-none focus-visible:ring-1 p-1 h-auto w-auto font-semibold bg-transparent" />
                                          </CardTitle>
                                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePrinter(index)}>
                                              <X className="h-4 w-4"/>
                                          </Button>
                                      </CardHeader>
                                      <CardContent className="p-4 pt-0 space-y-4">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                               <div>
                                                  <Label className="text-xs">{t(translations.width)}</Label>
                                                  <Select value={printer.width} onValueChange={(value) => handlePrinterChange(index, 'width', value)}>
                                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="80mm">80mm</SelectItem>
                                                        <SelectItem value="58mm">58mm</SelectItem>
                                                      </SelectContent>
                                                  </Select>
                                              </div>
                                              <div>
                                                <Label className="text-xs">{t(translations.connectionType)}</Label>
                                                <Select value={printer.connectionType} onValueChange={(value) => handlePrinterChange(index, 'connectionType', value)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="network">{t(translations.networkIp)}</SelectItem>
                                                        <SelectItem value="usb">{t(translations.usbOther)}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                          </div>
                                          {printer.connectionType === 'network' && (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                  <div>
                                                      <Label className="text-xs">{t(translations.ipAddress)}</Label>
                                                      <Input value={printer.ipAddress || ''} onChange={(e) => handlePrinterChange(index, 'ipAddress', e.target.value)} placeholder="192.168.1.100"/>
                                                  </div>
                                                  <div>
                                                      <Label className="text-xs">{t(translations.port)}</Label>
                                                      <Input value={printer.port || ''} onChange={(e) => handlePrinterChange(index, 'port', e.target.value)} placeholder="9100"/>
                                                  </div>
                                              </div>
                                          )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                  <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={addPrinter}>
                                      <Printer className="mr-2 h-4 w-4"/> {t(translations.addPrinter)}
                                  </Button>
                                </CardContent>
                            </Card>
                           )}
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4"/> {t(translations.notifications)}</CardTitle>
                                    <CardDescription>{t(translations.notificationsDesc)}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="notifications-enabled" checked={editableStore.notifications?.enabled} onCheckedChange={(checked) => handleNotificationChange('enabled', checked)} />
                                        <Label htmlFor="notifications-enabled">{t(translations.enableNotifications)}</Label>
                                    </div>
                                    {editableStore.notifications?.enabled && (
                                        <div className="space-y-4 pl-8">
                                            <div className="space-y-2">
                                                <Label htmlFor="notification-email">{t(translations.notificationEmail)}</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input id="notification-email" type="email" placeholder="contact@mondomaine.com" className="pl-10" value={editableStore.notifications?.email || ''} onChange={(e) => handleNotificationChange('email', e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="notification-whatsapp">{t(translations.notificationWhatsapp)}</Label>
                                                <div className="relative">
                                                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input id="notification-whatsapp" type="tel" placeholder="+33612345678" className="pl-10" value={editableStore.notifications?.whatsapp || ''} onChange={(e) => handleNotificationChange('whatsapp', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            
                            {/* Section Stripe - Paiement en ligne */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <svg role="img" viewBox="0 0 48 48" className="h-4 w-4"><path d="M43.013 13.062c.328-.18.72-.038.898.292.18.328.038.72-.29.898l-2.91 1.593c.318.92.483 1.88.483 2.864v.002c0 2.14-.52 4.19-1.48 5.968l-4.223 2.152a.634.634 0 0 1-.87-.303l-1.05-2.05c-.06-.118-.08-.25-.062-.378.017-.128-.072-.244-.158-.33l3.525-3.524a.632.632 0 0 1 .894 0 .632.632 0 0 1 0 .894l-3.525-3.523c-.34.34-.798.53-1.27.53-.47 0-.928-.19-1.27-.53l-2.028-2.027a1.796 1.796 0 1 1 2.54-2.54l3.525 3.525a.632.632 0 0 0 .894 0 .632.632 0 0 0 0-.894l-3.525-3.524a1.8 1.8 0 0 0-1.27-.527c-.47 0-.928.188-1.27.527L28.12 25.1a1.796 1.796 0 0 1-2.54 0 1.796 1.796 0 0 1 0-2.54l2.028-2.027a1.795 1.795 0 0 1 1.27-.53c.47 0 .93.19 1.27.53l1.05 1.05c.06.06.136.09.213.09s.154-.03-.213-.09l-4.223-2.152A7.26 7.26 0 0 0 37.3 13.44l2.91-1.593a.633.633 0 0 1 .802-.286Z" fill="#635bff"></path></svg>
                                        {t(translations.stripePayments)}
                                    </CardTitle>
                                    <CardDescription>{t(translations.stripeDescription)}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="stripe-enabled" 
                                            checked={editableStore.stripeEnabled || false} 
                                            onCheckedChange={(checked) => handleInputChange('stripeEnabled', checked)} 
                                        />
                                        <Label htmlFor="stripe-enabled">{t(translations.enableStripePayments)}</Label>
                                    </div>
                                    {editableStore.stripeEnabled && (
                                        <div className="space-y-4 pl-8">
                                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <svg role="img" viewBox="0 0 48 48" className="h-5 w-5"><path d="M43.013 13.062c.328-.18.72-.038.898.292.18.328.038.72-.29.898l-2.91 1.593c.318.92.483 1.88.483 2.864v.002c0 2.14-.52 4.19-1.48 5.968l-4.223 2.152a.634.634 0 0 1-.87-.303l-1.05-2.05c-.06-.118-.08-.25-.062-.378.017-.128-.072-.244-.158-.33l3.525-3.524a.632.632 0 0 1 .894 0 .632.632 0 0 1 0 .894l-3.525-3.523c-.34.34-.798.53-1.27.53-.47 0-.928-.19-1.27-.53l-2.028-2.027a1.796 1.796 0 1 1 2.54-2.54l3.525 3.525a.632.632 0 0 0 .894 0 .632.632 0 0 0 0-.894l-3.525-3.524a1.8 1.8 0 0 0-1.27-.527c-.47 0-.928.188-1.27.527L28.12 25.1a1.796 1.796 0 0 1-2.54 0 1.796 1.796 0 0 1 0-2.54l2.028-2.027a1.795 1.795 0 0 1 1.27-.53c.47 0 .93.19 1.27.53l1.05 1.05c.06.06.136.09.213.09s.154-.03-.213-.09l-4.223-2.152A7.26 7.26 0 0 0 37.3 13.44l2.91-1.593a.633.633 0 0 1 .802-.286Z" fill="#635bff"></path></svg>
                                                    <span className="font-medium">{t(translations.connectStripe)}</span>
                                                </div>
                                                <p className="text-sm text-blue-700 mb-3">{t(translations.stripeInfo)}</p>
                                                <Button variant="outline" className="w-full">
                                                    {t(translations.connectStripeAccount)}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {wizardStep === 5 && (
                        <div className="text-center space-y-6 py-8">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                            <h2 className="text-2xl font-bold font-headline">{t(translations.finishTitle)}</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">{t(translations.finishDescription)}</p>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t(translations.menuCreationMethod)}</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                        <FileText className="h-6 w-6 text-primary" />
                                        <h3 className="font-semibold">{t(translations.method1Title)}</h3>
                                        <p className="text-xs text-muted-foreground">{t(translations.method1Desc)}</p>
                                    </div>
                                     <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                        <Bot className="h-6 w-6 text-primary" />
                                        <h3 className="font-semibold">{t({fr: "Création via IA", en: "AI Creation"})}</h3>
                                        <p className="text-xs text-muted-foreground">{t({fr: "Laissez notre IA créer votre menu à partir de simples descriptions.", en: "Let our AI create your menu from simple descriptions."})}</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                        <Download className="h-6 w-6 text-primary" />
                                        <h3 className="font-semibold">{t(translations.method2Title)}</h3>
                                        <p className="text-xs text-muted-foreground">{t(translations.method2Desc)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {false && wizardStep === 5 && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Bot className="h-4 w-4" />
                                                Configuration de l'Agent IA
                                            </CardTitle>
                                            <CardDescription>
                                                Personnalisez votre assistant vocal qui répondra automatiquement aux appels de vos clients
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            Plan {currentUserPlan}
                                        </Badge>
                                    </div>
                                    
                                    {/* Fonctionnalités incluses */}
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                                        <h4 className="text-sm font-medium mb-2">Fonctionnalités incluses :</h4>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-1">
                                                <span className="text-green-600">✓</span>
                                                <span>Agent IA {currentUserPlan === 'STARTER' ? 'basique' : 'premium'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-green-600">✓</span>
                                                <span>{currentFeatures.maxVoices} voix disponible{currentFeatures.maxVoices > 1 ? 's' : ''}</span>
                                            </div>
                                            {currentFeatures.multiLanguage && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-green-600">✓</span>
                                                    <span>Support multi-langue</span>
                                                </div>
                                            )}
                                            {currentFeatures.upselling && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-green-600">✓</span>
                                                    <span>Vente additionnelle</span>
                                                </div>
                                            )}
                                            {currentFeatures.voiceCloning && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-green-600">✓</span>
                                                    <span>Clonage vocal</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Activation */}
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="ai-enabled">Activer l'agent IA</Label>
                                            <p className="text-xs text-muted-foreground">
                                                L'agent répondra automatiquement aux appels entrants
                                            </p>
                                        </div>
                                        <Switch
                                            id="ai-enabled"
                                            checked={editableStore.aiAgent?.enabled || false}
                                            onCheckedChange={(checked) => 
                                                setEditableStore({
                                                    ...editableStore,
                                                    aiAgent: { ...editableStore.aiAgent!, enabled: checked }
                                                })
                                            }
                                        />
                                    </div>

                                    <Separator />

                                    {/* Personnalité et Voix */}
                                    <div className={`grid gap-4 ${currentFeatures.voiceSelection ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                        <div className="space-y-2">
                                            <Label htmlFor="personality">Personnalité</Label>
                                            <Select 
                                                value={editableStore.aiAgent?.personality || 'friendly'}
                                                onValueChange={(value) => 
                                                    setEditableStore({
                                                        ...editableStore,
                                                        aiAgent: { ...editableStore.aiAgent!, personality: value as any }
                                                    })
                                                }
                                            >
                                                <SelectTrigger id="personality">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="professional">Professionnel</SelectItem>
                                                    <SelectItem value="friendly">Amical</SelectItem>
                                                    <SelectItem value="casual">Décontracté</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Sélection de voix - Seulement si disponible */}
                                        {currentFeatures.voiceSelection && (
                                            <div className="space-y-2">
                                                <Label htmlFor="voice">Voix</Label>
                                                <Select 
                                                    value={editableStore.aiAgent?.voice || currentFeatures.availableVoices[0]}
                                                    onValueChange={(value) => 
                                                        setEditableStore({
                                                            ...editableStore,
                                                            aiAgent: { ...editableStore.aiAgent!, voice: value as any }
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger id="voice">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {currentFeatures.availableVoices.map((voice) => {
                                                            const voiceLabels = {
                                                                alloy: 'Alloy (Neutre)',
                                                                echo: 'Echo (Masculin)', 
                                                                nova: 'Nova (Féminin)',
                                                                onyx: 'Onyx (Masculin)',
                                                                fable: 'Fable (Britannique)',
                                                                shimmer: 'Shimmer (Féminin)'
                                                            };
                                                            return (
                                                                <SelectItem key={voice} value={voice}>
                                                                    {voiceLabels[voice as keyof typeof voiceLabels]}
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Langue */}
                                    <div className="space-y-2">
                                        <Label htmlFor="language">Langue principale</Label>
                                        <Select 
                                            value={editableStore.aiAgent?.language || 'fr'}
                                            onValueChange={(value) => 
                                                setEditableStore({
                                                    ...editableStore,
                                                    aiAgent: { ...editableStore.aiAgent!, language: value as any }
                                                })
                                            }
                                        >
                                            <SelectTrigger id="language">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fr">Français</SelectItem>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="ar">العربية</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Multi-langue - Seulement si disponible */}
                                    {currentFeatures.multiLanguage && (
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="multi-language">Support multi-langue</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    L'agent détectera automatiquement la langue du client
                                                </p>
                                            </div>
                                            <Switch
                                                id="multi-language"
                                                checked={editableStore.aiAgent?.multiLanguage || false}
                                                onCheckedChange={(checked) => 
                                                    setEditableStore({
                                                        ...editableStore,
                                                        aiAgent: { ...editableStore.aiAgent!, multiLanguage: checked }
                                                    })
                                                }
                                            />
                                        </div>
                                    )}

                                    <Separator />

                                    {/* Messages personnalisés */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="greeting">Message d'accueil</Label>
                                            <Textarea
                                                id="greeting"
                                                value={editableStore.aiAgent?.greeting || ''}
                                                onChange={(e) => 
                                                    setEditableStore({
                                                        ...editableStore,
                                                        aiAgent: { ...editableStore.aiAgent!, greeting: e.target.value }
                                                    })
                                                }
                                                placeholder="Bonjour, bienvenue chez..."
                                                rows={2}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="goodbye">Message de fin</Label>
                                            <Textarea
                                                id="goodbye"
                                                value={editableStore.aiAgent?.goodbye || ''}
                                                onChange={(e) => 
                                                    setEditableStore({
                                                        ...editableStore,
                                                        aiAgent: { ...editableStore.aiAgent!, goodbye: e.target.value }
                                                    })
                                                }
                                                placeholder="Merci pour votre commande..."
                                                rows={2}
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Vente additionnelle - Seulement si disponible */}
                                    {currentFeatures.upselling && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="upselling">Vente additionnelle intelligente</Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        L'agent suggérera des produits complémentaires
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="upselling"
                                                    checked={editableStore.aiAgent?.upselling || false}
                                                    onCheckedChange={(checked) => 
                                                        setEditableStore({
                                                            ...editableStore,
                                                            aiAgent: { ...editableStore.aiAgent!, upselling: checked }
                                                        })
                                                    }
                                                />
                                            </div>

                                            {editableStore.aiAgent?.upselling && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="upsell-threshold">Seuil de déclenchement (€)</Label>
                                                    <Input
                                                        id="upsell-threshold"
                                                        type="number"
                                                        value={editableStore.aiAgent?.upsellThreshold || 15}
                                                        onChange={(e) => 
                                                            setEditableStore({
                                                                ...editableStore,
                                                                aiAgent: { ...editableStore.aiAgent!, upsellThreshold: Number(e.target.value) }
                                                            })
                                                        }
                                                        placeholder="15"
                                                        min="0"
                                                        step="5"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        L'agent proposera des suggestions pour les paniers au-dessus de ce montant
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Vitesse de parole */}
                                    <div className="space-y-2">
                                        <Label htmlFor="voice-speed">Vitesse d'élocution</Label>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-muted-foreground">Lent</span>
                                            <input
                                                type="range"
                                                id="voice-speed"
                                                min="0.5"
                                                max="1.5"
                                                step="0.1"
                                                value={editableStore.aiAgent?.voiceSpeed || 1.0}
                                                onChange={(e) => 
                                                    setEditableStore({
                                                        ...editableStore,
                                                        aiAgent: { ...editableStore.aiAgent!, voiceSpeed: Number(e.target.value) }
                                                    })
                                                }
                                                className="flex-1"
                                            />
                                            <span className="text-xs text-muted-foreground">Rapide</span>
                                            <span className="text-sm font-medium w-10">{editableStore.aiAgent?.voiceSpeed || 1.0}x</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
             <DialogFooter className="pt-6 border-t border-gray-200/50 flex flex-col sm:flex-row gap-3 bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50">
                    {store ? (
                        // Mode Édition : Boutons simples
                        <>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onCancel} 
                                className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 transition-all duration-200 rounded-xl"
                            >
                                {t(translations.cancel)}
                            </Button>
                            <div className="flex-grow" />
                            <Button 
                                onClick={handleFinalize} 
                                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 rounded-xl"
                            >
                                {t({ fr: "Sauvegarder", en: "Save" })}
                            </Button>
                        </>
                    ) : (
                        // Mode Création : Navigation par étapes
                        <>
                            {!isFirstActivityState && (
                                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 transition-all duration-200 rounded-xl">{t(translations.cancel)}</Button>
                            )}
                            <div className="flex-grow" />
                            {wizardStep > 0 && wizardStep < WIZARD_STEPS.length - 1 && (
                                <Button type="button" variant="ghost" onClick={prevStep} className="hover:bg-gray-100/80 transition-all duration-200 rounded-xl">{t(translations.previous)}</Button>
                            )}
                            
                            {wizardStep === 0 && (
                                <Button type="button" onClick={nextStep} className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 rounded-xl">{t(translations.startConfig)}</Button>
                            )}

                            {wizardStep > 0 && wizardStep < WIZARD_STEPS.length - 1 && (
                                <Button type="button" onClick={nextStep} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 rounded-xl">{t(translations.next)}</Button>
                            )}

                            {wizardStep === WIZARD_STEPS.length - 1 && (
                                <Button onClick={handleFinalize} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 rounded-xl">{t(translations.finishAndCreateMenu)}</Button>
                            )}
                        </>
                    )}
                </DialogFooter>
        </DialogContent>
    )
}

// Composant TelnyxPopup supprimé - configuration dans la page de gestion unifiée

export default function StoresPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const { toast } = useToast();
    const [stores, setStores] = useState<Store[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isAdvancedConfig, setIsAdvancedConfig] = useState(false);
    // Popup Telnyx supprimé - numéro attribué automatiquement
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [isFirstActivity, setIsFirstActivity] = useState(false);
    const [userStatus, setUserStatus] = useState<any>(null);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'BUSINESS' | null>(null);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const [pendingActivityData, setPendingActivityData] = useState<any>(null);

    useEffect(() => {
        const firstActivity = searchParams.get('firstActivity') === 'true';
        const firstPayment = searchParams.get('firstPayment') === 'true';
        const success = searchParams.get('success') === 'true';
        const activity = searchParams.get('activity') === 'true';
        const signup = searchParams.get('signup') === 'true';
        const sessionId = searchParams.get('session_id');
        
        console.log('🔍 Paramètres URL détectés:', {
            firstActivity,
            firstPayment,
            success,
            activity,
            signup,
            sessionId: sessionId ? 'présent' : 'absent',
            allParams: window.location.search
        });
        
        setIsFirstActivity(firstActivity || firstPayment);
        
        // Gérer le retour du premier paiement Stripe
        if (success && firstPayment && sessionId) {
            console.log('🎯 Détection du retour de premier paiement Stripe, appel de /api/stripe/success');
            // Appeler l'API pour finaliser le paiement
            fetch('/api/stripe/success', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            }).then(response => {
                console.log('🎯 Réponse de /api/stripe/success:', response.status);
                if (response.ok) {
                    // Nettoyer l'URL et recharger la page pour que le cookie d'authentification soit pris en compte
                    window.history.replaceState({}, '', '/restaurant/stores?firstActivity=true');
                    console.log('🎯 Rechargement de la page pour authentification');
                    window.location.reload();
                } else {
                    console.error('❌ Erreur lors de la connexion automatique');
                }
            }).catch(error => {
                console.error('❌ Erreur réseau lors de la connexion automatique:', error);
            });
        } else {
            console.log('🔍 Pas de retour de paiement détecté - success:', success, 'firstPayment:', firstPayment, 'sessionId:', sessionId ? 'présent' : 'absent');
        }

        // Gérer le retour de signup complet
        if (success && signup && sessionId) {
            console.log('🎯 Détection du retour de signup complet, appel de /api/auth/auto-login-signup');
            // Appeler l'API pour connecter automatiquement l'utilisateur
            fetch('/api/auth/auto-login-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            }).then(response => {
                console.log('🎯 Réponse de /api/auth/auto-login-signup:', response.status);
                if (response.ok) {
                    // Nettoyer l'URL et recharger la page pour que le cookie d'authentification soit pris en compte
                    window.history.replaceState({}, '', '/restaurant/stores');
                    console.log('🎯 Rechargement de la page pour authentification');
                    window.location.reload();
                } else {
                    console.error('❌ Erreur lors de la connexion automatique après signup');
                }
            }).catch(error => {
                console.error('❌ Erreur réseau lors de la connexion automatique après signup:', error);
            });
        }
        
        // Gérer le retour de paiement pour nouvelle activité
        if (success && activity && sessionId) {
            console.log('🎯 Détection du retour après paiement pour nouvelle activité');
            
            // Afficher un toast de succès
            toast({
                title: t({ fr: "✅ Paiement réussi", en: "✅ Payment successful" }),
                description: t({ fr: "Votre nouvelle activité est créée et configurée", en: "Your new activity is created and configured" })
            });
            
            // Recharger les activités pour voir la nouvelle
            loadActivities().then(() => {
                // Attendre un peu que les données soient chargées et que le webhook ait créé la boutique
                setTimeout(async () => {
                    // Recharger une fois de plus pour être sûr d'avoir les dernières données
                    await loadActivities();
                    
                    // Récupérer les activités depuis l'API pour trouver la boutique non configurée
                    try {
                        const response = await fetch('/api/restaurant/activities');
                        if (response.ok) {
                            const activities = await response.json();
                            
                            // Trouver la boutique non configurée (celle avec pendingConfiguration: true)
                            // MAIS pas celles créées via le nouveau processus qui sont déjà configurées
                            let storeToConfig = null;
                            for (const activity of activities) {
                                for (const store of activity.stores || []) {
                                    const settings = store.settings ? JSON.parse(store.settings) : {};
                                    // Ne configurer automatiquement que si pendingConfiguration est explicitement true
                                    // et que isConfigured n'est pas true (pour éviter les boutiques créées via nouveau processus)
                                    if (settings.pendingConfiguration === true && settings.isConfigured !== true) {
                                        storeToConfig = {
                                            id: store.id,
                                            name: store.name || activity.name,
                                            address: store.address,
                                            phone: activity.phoneNumbers?.[0]?.number || '',
                                            status: store.isActive ? 'active' : 'inactive',
                                            hasProducts: store.hasProducts || true,
                            hasReservations: store.hasReservations || true,
                            hasConsultations: store.hasConsultations || true,
                                            currency: settings.currency || 'EUR',
                                            taxRates: settings.taxRates || [],
                                            schedule: settings.schedule || {},
                                            printers: settings.printers || [],
                                            notifications: settings.notifications || { enabled: false },
                                            telnyxConfigured: settings.telnyxConfigured || false,
                                            isConfigured: settings.isConfigured || false,
                                            settings: store.settings
                                        };
                                        break;
                                    }
                                }
                                if (storeToConfig) break;
                            }
                            
                            if (storeToConfig) {
                                console.log('🎯 Ouverture automatique du wizard pour la nouvelle boutique:', storeToConfig.name);
                                handleConfigure(storeToConfig);
                                // Nettoyer l'URL
                                window.history.replaceState({}, '', '/restaurant/stores');
                            } else {
                                console.log('⚠️ Boutique en attente non trouvée');
                                toast({
                                    title: t({ fr: "⚠️ Boutique non trouvée", en: "⚠️ Store not found" }),
                                    description: t({ fr: "La nouvelle boutique n'a pas été créée automatiquement", en: "The new store was not created automatically" }),
                                    variant: "destructive"
                                });
                                // Nettoyer l'URL pour éviter la boucle
                                window.history.replaceState({}, '', '/restaurant/stores');
                            }
                        }
                    } catch (error) {
                        console.error('Erreur lors de la récupération des activités:', error);
                    }
                }, 2000); // Attendre 2 secondes que le webhook finisse
            });
        }
        
        if (searchParams.get('action') === 'new' && !firstPayment) {
            handleOpenWizard();
            // Ne pas nettoyer l'URL pour garder les paramètres
            if (!firstActivity) {
                router.replace('/restaurant/stores', { scroll: false });
            }
        }
        
        // Si c'est la première activité (après rechargement post-authentification), ouvrir le wizard
        if (firstActivity && !success && !firstPayment) {
            console.log('🎯 Première activité détectée après authentification, ouverture du wizard');
            setTimeout(() => {
                handleOpenWizard();
            }, 500);
        }
        loadActivities();
        
        if (firstActivity || firstPayment) {
            checkUserStatus();
        } else {
            // Vérifier le statut utilisateur même sans paramètres URL
            checkUserStatus();
        }
    }, [searchParams, router]);

    const checkUserStatus = async () => {
        try {
            const response = await fetch('/api/user/status');
            if (response.ok) {
                const status = await response.json();
                setUserStatus(status);
                
                // Si l'utilisateur a payé mais n'a pas configuré sa première boutique, c'est sa première activité
                if (status?.needsFirstActivity && status?.paidPlan) {
                    console.log('🔍 Utilisateur a payé mais pas configuré - needsFirstActivity:', status.needsFirstActivity, 'paidPlan:', status.paidPlan);
                    setIsFirstActivity(true);
                    
                    // Ouvrir automatiquement le wizard si pas encore ouvert et pas de paramètres spéciaux dans l'URL
                    const hasSpecialParams = searchParams.get('action') || searchParams.get('success') || searchParams.get('firstPayment') || searchParams.get('signup');
                    console.log('🔍 hasSpecialParams:', hasSpecialParams, 'isWizardOpen:', isWizardOpen);
                    if (!hasSpecialParams && !isWizardOpen) {
                        console.log('🎯 Ouverture automatique du wizard de première activité');
                        setTimeout(() => {
                            setSelectedStore(null);
                            setIsWizardOpen(true);
                        }, 500);
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du statut:', error);
        }
    };

    const handleShowPlanModal = (activityData: any) => {
        setPendingActivityData(activityData);
        setIsWizardOpen(false); // Fermer le wizard
        setShowPlanModal(true); // Ouvrir le modal de plan
    };

    const handlePaymentForNewActivity = async () => {
        if (!selectedPlan) {
            return;
        }

        try {
            setIsPaymentProcessing(true);

            // S'assurer qu'on a les données de l'activité
            if (!pendingActivityData || Object.keys(pendingActivityData).length === 0) {
                toast({
                    title: t({ fr: "Erreur", en: "Error" }),
                    description: t({ fr: "Données de l'activité manquantes", en: "Activity data missing" }),
                    variant: "destructive"
                });
                setIsPaymentProcessing(false);
                return;
            }
            
            console.log('📤 Envoi des données d\'activité:', pendingActivityData);
            
            const response = await fetch('/api/stripe/checkout-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    activityData: pendingActivityData
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la création de la session de paiement');
            }

            const { sessionUrl } = await response.json();
            window.location.href = sessionUrl;

        } catch (error: any) {
            console.error('Error creating payment session:', error);
            setIsPaymentProcessing(false);
        }
    };

    const loadActivities = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/restaurant/activities');
            if (response.ok) {
                const data = await response.json();
                // L'API retourne maintenant { stores: [...], activities: [...] }
                const stores = data.stores || [];
                // Utiliser directement les stores de la réponse
                const storesData = stores.map((store: any) => {
                        // Helper pour gérer settings qui peut être string ou object
                        const getSettings = (settings: any) => {
                            if (!settings) return {};
                            return typeof settings === 'string' ? JSON.parse(settings) : settings;
                        };
                        
                        const settings = getSettings(store.settings);
                        
                        return {
                            id: store.id,
                            name: store.name,
                            address: store.address,
                            phone: store.phone || '',
                            status: store.isActive ? 'active' : 'inactive',
                            stripeStatus: 'disconnected', // À implémenter plus tard
                            currency: settings.currency || 'EUR',
                            taxRates: settings.taxRates || [],
                            printers: settings.printers || [],
                            notifications: settings.notifications || { enabled: false },
                            telnyxConfigured: settings.telnyxConfigured || false,
                            hasProducts: store.hasProducts || true,
                            hasReservations: store.hasReservations || true,
                            hasConsultations: store.hasConsultations || true,
                            schedule: settings.schedule || {},
                            subscription: store.subscription, // ✅ AJOUT DE L'ABONNEMENT
                            isConfigured: settings.isConfigured || false
                        };
                });
                setStores(storesData);
            }
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenWizard = async (store: Store | null = null) => {
        console.log('🚀 handleOpenWizard appelé - store:', store ? 'edition' : 'nouveau', 'isFirstActivity:', isFirstActivity, 'userStatus:', userStatus);
        
        // Si c'est une édition, ouvrir directement le wizard
        if (store) {
            console.log('🔍 Store à éditer:', store);
            setSelectedStore(store);
            setIsWizardOpen(true);
            return;
        }

        // S'assurer que le statut utilisateur est à jour
        if (!userStatus) {
            console.log('🔍 Statut utilisateur non chargé, récupération...');
            await checkUserStatus();
            return; // checkUserStatus déclenchera une nouvelle évaluation
        }

        // Vérifier si l'utilisateur doit créer sa première activité
        const needsFirstActivity = userStatus?.needsFirstActivity;
        console.log('🔍 needsFirstActivity:', needsFirstActivity, 'isFirstActivity:', isFirstActivity);
        
        // Toujours ouvrir le wizard d'abord pour configurer avant paiement
        console.log('🎯 Ouverture du wizard pour nouvelle activité');
        setSelectedStore(null);
        setIsWizardOpen(true);
    };

    const handleSaveStore = async (storeData: Store) => {
        try {
            // Si c'est une modification, appeler l'API PUT
            if (storeData.id) {
                // Vérifier si c'était une boutique en attente de configuration
                const settings = storeData.settings ? JSON.parse(storeData.settings) : {};
                const wasPending = settings.pendingConfiguration || !storeData.isConfigured;
                
                // Retirer le flag pendingConfiguration et marquer comme configurée
                if (wasPending) {
                    delete settings.pendingConfiguration;
                    settings.isConfigured = true;
                }
                
                const response = await fetch('/api/restaurant/activities', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        storeId: storeData.id,
                        name: storeData.name,
                        address: storeData.address,
                        phone: storeData.phone,
                        hasProducts: storeData.hasProducts,
                        hasReservations: storeData.hasReservations,
                        hasConsultations: storeData.hasConsultations,
                        currency: storeData.currency,
                        taxRates: storeData.taxRates,
                        schedule: storeData.schedule,
                        printers: storeData.printers,
                        notifications: storeData.notifications,
                        telnyxConfigured: storeData.telnyxConfigured,
                        isConfigured: true, // Marquer comme configurée
                        isActive: true, // Activer la boutique
                        aiAgent: storeData.aiAgent, // Ajouter les données de l'agent IA
                        settings: JSON.stringify(settings)
                    })
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la mise à jour');
                }
                
                // Si c'était une configuration initiale, afficher un message de succès
                if (wasPending) {
                    toast({
                        title: t({ fr: "✅ Configuration terminée", en: "✅ Configuration complete" }),
                        description: t({ fr: "Votre nouvelle boutique est maintenant active", en: "Your new store is now active" })
                    });
                }
            }
            
            // Recharger les données après sauvegarde
            await loadActivities();
            setIsWizardOpen(false);
        } catch (error) {
            console.error('Error updating store:', error);
            toast({
                title: t({ fr: "Erreur", en: "Error" }),
                description: t({ fr: "Impossible de sauvegarder la configuration", en: "Unable to save configuration" }),
                variant: "destructive"
            });
        }
    };


    // Fonction supprimée - plus besoin de confirmation Telnyx
    
    // Fonction supprimée - configuration dans la page de gestion unifiée
    
    const handleManageService = (store: Store) => {
        // Redirection vers la nouvelle page de gestion unifiée
        router.push(`/restaurant/manage/${store.id}`);
    };

    const handleConfigureCallForwarding = (store: Store) => {
        // Redirection vers l'onglet de renvoi d'appel dans la page de gestion
        router.push(`/restaurant/manage/${store.id}?tab=call-forwarding`);
    };

    const handleConfigure = (store: Store) => {
        setSelectedStore(store);
        setIsAdvancedConfig(true);
        setIsWizardOpen(true);
    };

    const handleToggleStoreStatus = async (storeId: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/restaurant/stores/${storeId}/toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la mise à jour');
            }

            // Recharger les données
            loadActivities();
            
            toast({
                title: t({ fr: "Succès", en: "Success" }),
                description: t({ 
                    fr: isActive ? "Réception IA activée" : "Réception IA désactivée", 
                    en: isActive ? "AI Reception enabled" : "AI Reception disabled" 
                }),
            });
        } catch (error) {
            toast({
                title: t({ fr: "Erreur", en: "Error" }),
                description: t({ fr: "Impossible de modifier le statut", en: "Could not update status" }),
                variant: "destructive"
            });
        }
    };

    const translations = {
        title: { fr: "Gestion des activités", en: "Activity Management" },
        description: { fr: "Gérez vos différents espaces et les services associés.", en: "Manage your different spaces and associated services." },
        addStore: { fr: "Ajouter une activité", en: "Add Activity" },
        name: { fr: "Nom", en: "Name" },
        status: { fr: "Statut", en: "Status" },
        connections: { fr: "Connexions", en: "Connections" },
        actions: { fr: "Actions", en: "Actions" },
        active: { fr: "Actif", en: "Active" },
        inactive: { fr: "Inactif", en: "Inactive" },
        connected: { fr: "Connecté", en: "Connected" },
        notConnected: { fr: "Non connecté", en: "Not connected" },
        configure: { fr: "Configurer", en: "Configure" },
        edit: { fr: "Modifier", en: "Edit" },
        delete: { fr: "Supprimer", en: "Delete" },
        areYouSure: { fr: "Êtes-vous sûr ?", en: "Are you sure?" },
        deleteConfirmation: { fr: "Cette action est irréversible. L'activité et toutes ses données associées seront définitivement supprimées.", en: "This action is irreversible. The activity and all associated data will be permanently deleted." },
        cancel: { fr: "Annuler", en: "Cancel" },
        manage: { fr: "Gérer", en: "Manage" },
        configure: { fr: "Configurer", en: "Configure" },
        configureCallForwarding: { fr: "Configurer renvoie d'appel", en: "Configure call forwarding" },
        callForwardingEnabled: { fr: "Renvoie d'appel active", en: "Call forwarding enabled" },
        callForwardingDisabled: { fr: "Renvoie d'appel desactive", en: "Call forwarding disabled" },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 glass-effect rounded-2xl p-8 shadow-apple">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900">{t(translations.title)}</h1>
                        <p className="text-gray-600 text-lg">{t(translations.description)}</p>
                    </div>
                    <Button 
                        onClick={() => handleOpenWizard()} 
                        className="bg-black hover:bg-gray-800 text-white font-medium shadow-apple transition-smooth hover-lift rounded-xl px-6 py-3"
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t(translations.addStore)}
                    </Button>
                </header>

                {isLoading ? (
                    <div className="text-center py-16 glass-effect rounded-2xl shadow-apple">
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-black mx-auto"></div>
                        <p className="mt-6 text-gray-600 font-medium">{t({ fr: "Chargement des activités...", en: "Loading activities..." })}</p>
                    </div>
                ) : stores.length === 0 ? (
                    <div className="text-center py-16 glass-effect rounded-2xl shadow-apple">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Building className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t({ fr: "Aucune activité", en: "No activities" })}</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">{t({ fr: "Créez votre première activité pour commencer", en: "Create your first activity to get started" })}</p>
                        <Button 
                            onClick={() => handleOpenWizard()}
                            className="bg-black hover:bg-gray-800 text-white font-medium shadow-apple transition-smooth hover-lift rounded-xl px-6 py-3"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t(translations.addStore)}
                        </Button>
                    </div>
            ) : (
                <div className="space-y-4">
                    {stores.map((store) => {
                        // Déterminer l'état de la boutique
                        const isConfigured = (() => {
                            const settings = JSON.parse(store.settings || '{}');
                            const configured = settings.isConfigured || false;
                            console.log(`Store ${store.name}: isConfigured=${configured}, settings:`, settings);
                            return configured;
                        })();
                        
                        const isActive = store.status === 'active';
                        const needsConfig = !isConfigured;
                        
                        // CSS Apple-style moderne
                        const getCardStyle = () => {
                            return "bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-800/80 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 backdrop-blur-sm";
                        };
                        
                        const getStatusIcon = () => {
                            if (needsConfig) {
                                return (
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
                                        <Building className="h-6 w-6 text-white" />
                                    </div>
                                );
                            } else if (isActive) {
                                return (
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25">
                                        <ConciergeBell className="h-6 w-6 text-white" />
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg shadow-gray-400/25">
                                        <Building className="h-6 w-6 text-white" />
                                    </div>
                                );
                            }
                        };
                        
                        return (
                            <Card key={store.id} className="glass-effect shadow-apple hover-lift transition-smooth rounded-2xl border-0 overflow-hidden">
                                <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                                    {/* Section Info Boutique */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {getStatusIcon()}
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <CardTitle className="text-xl font-semibold text-gray-900 truncate">
                                                {store.name}
                                            </CardTitle>
                                            {/* Afficher l'adresse seulement si elle est différente et significative */}
                                            {store.address && store.address !== store.name && store.address.length > 5 && (
                                                <CardDescription className="text-sm text-gray-500 truncate">{store.address}</CardDescription>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section Actions */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {/* Bouton Gérer - style Apple */}
                                        <Button 
                                            size="sm" 
                                            className="bg-black hover:bg-gray-800 text-white font-medium shadow-apple transition-smooth rounded-xl px-4 py-2"
                                            onClick={() => handleManageService(store)}
                                        >
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            <span className="hidden sm:inline">{t({ fr: "Gérer", en: "Manage" })}</span>
                                        </Button>
                                        
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
                )}

                <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
                {isWizardOpen && <StoreWizard store={selectedStore} onSave={handleSaveStore} onCancel={() => { setIsWizardOpen(false); setIsAdvancedConfig(false); }} isFirstActivity={userStatus?.needsFirstActivity || isFirstActivity} userStatus={userStatus} onShowPlanModal={handleShowPlanModal} isAdvancedConfig={isAdvancedConfig} stores={stores} />}
            </Dialog>

            {/* Popup Telnyx supprimé - configuration dans la page de gestion unifiée */}

            {/* Modal de sélection de plan pour nouvelles activités */}
            <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
                <DialogContent className="sm:max-w-3xl glass-effect shadow-apple-lg rounded-3xl border-0">
                    <DialogHeader className="text-center space-y-4 p-6">
                        <DialogTitle className="text-3xl font-bold text-gray-900">Choisissez votre plan d'abonnement</DialogTitle>
                        <DialogDescription className="text-lg text-gray-600">
                            Chaque activité nécessite son propre abonnement
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-8">
                        <Card className={cn("cursor-pointer transition-smooth hover-lift glass-effect rounded-2xl border-2", selectedPlan === 'STARTER' ? "border-green-500 shadow-apple-lg" : "border-gray-200 hover:border-green-300")}>
                            <CardContent className="p-8" onClick={() => setSelectedPlan('STARTER')}>
                                <div className="text-center space-y-4">
                                    <h4 className="font-bold text-xl text-gray-900">STARTER</h4>
                                    <div className="text-4xl font-bold text-gray-900">129€<span className="text-lg font-normal text-gray-600">/mois</span></div>
                                    <p className="text-sm text-gray-500">+ 10% de commission</p>
                                    <p className="text-xs text-gray-400">Idéal pour débuter</p>
                                    {selectedPlan === 'STARTER' && <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className={cn("cursor-pointer transition-smooth hover-lift glass-effect rounded-2xl border-2", selectedPlan === 'PRO' ? "border-blue-500 shadow-apple-lg" : "border-gray-200 hover:border-blue-300")}>
                            <CardContent className="p-8" onClick={() => setSelectedPlan('PRO')}>
                                <div className="text-center space-y-4">
                                    <h4 className="font-bold text-xl text-gray-900">PRO</h4>
                                    <div className="text-4xl font-bold text-gray-900">329€<span className="text-lg font-normal text-gray-600">/mois</span></div>
                                    <p className="text-sm text-gray-500">+ 1€ par commande</p>
                                    <p className="text-xs text-gray-400">Pour les restaurants établis</p>
                                    {selectedPlan === 'PRO' && <CheckCircle className="h-8 w-8 text-blue-500 mx-auto" />}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className={cn("cursor-pointer transition-smooth hover-lift glass-effect rounded-2xl border-2", selectedPlan === 'BUSINESS' ? "border-purple-500 shadow-apple-lg" : "border-gray-200 hover:border-purple-300")}>
                            <CardContent className="p-8" onClick={() => setSelectedPlan('BUSINESS')}>
                                <div className="text-center space-y-4">
                                    <h4 className="font-bold text-xl text-gray-900">BUSINESS</h4>
                                    <div className="text-4xl font-bold text-gray-900">800€<span className="text-lg font-normal text-gray-600">/mois</span></div>
                                    <p className="text-sm text-gray-500">Tout inclus</p>
                                    <p className="text-xs text-gray-400">Pour les gros volumes</p>
                                    {selectedPlan === 'BUSINESS' && <CheckCircle className="h-8 w-8 text-purple-500 mx-auto" />}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <DialogFooter className="flex gap-3 p-6">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowPlanModal(false)}
                            className="rounded-xl border-gray-300 hover:border-gray-400 transition-smooth"
                        >
                            Annuler
                        </Button>
                        <Button 
                            variant="secondary"
                            onClick={() => {
                                setShowPlanModal(false);
                                setSelectedStore(null);
                                setIsWizardOpen(true);
                            }}
                            disabled={!selectedPlan}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl transition-smooth"
                        >
                            Configurer d'abord
                        </Button>
                        <Button 
                            onClick={handlePaymentForNewActivity}
                            disabled={!selectedPlan || isPaymentProcessing}
                            className="bg-black hover:bg-gray-800 text-white font-medium shadow-apple transition-smooth rounded-xl px-6"
                        >
                            {isPaymentProcessing ? "Redirection..." : `Payer ${selectedPlan ? (selectedPlan === 'STARTER' ? '129€' : selectedPlan === 'PRO' ? '329€' : '800€') : ''}/mois`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </div>
        </div>
    );
}
