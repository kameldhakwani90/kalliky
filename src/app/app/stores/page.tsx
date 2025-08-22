

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
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
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Clock, Upload, Utensils, Zap, Link as LinkIcon, CheckCircle, XCircle, BadgeEuro, X, Printer, Cog, TestTube2, Network, MessageCircle, TabletSmartphone, Copy, FileText, Bot, PhoneCall, PhoneForwarded, Car, Coffee, Building, Sparkles, BookOpen, BrainCircuit, ConciergeBell, Mail, Plus, Download } from 'lucide-react';
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
import { TELNYX_COUNTRIES, POPULAR_COUNTRIES, OTHER_COUNTRIES, getTelnyxCountry, formatCountryPrice } from '@/lib/constants/countries';

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
    country?: string;
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
    { id: 'finish', title: { fr: 'Finalisation', en: 'Finalization' } },            // 4
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
            country: 'FR',
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
    const [showOperatorsPopup, setShowOperatorsPopup] = useState(false);

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
                country: editableStore.country,
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
                country: editableStore.country,
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
                    country: editableStore.country,
                    businessCategory: editableStore.businessCategory || 'RESTAURANT',
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
            router.push(`/app/services/${createdActivity.stores[0]?.id || createdActivity.id}`);

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
        landline: { fr: "Numéro de téléphone", en: "Phone number" },
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
        <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col backdrop-blur-3xl bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
            <DialogHeader className="border-b border-white/10 pb-8 pt-2">
                <div className="flex items-center justify-between">
                    <DialogTitle className="text-center text-3xl font-bold text-white/95 tracking-tight">
                        {store ? t(translations.editStore) : t(translations.addNewStore)}
                    </DialogTitle>
                    {store && (
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
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

            <div className="flex-1 overflow-y-auto">
                <div className="px-8 py-6">
                    {wizardStep === 0 && (
                        <div className="text-center space-y-10 py-16">
                            {/* Apple-style Hero Icon */}
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl shadow-white/10 mb-8">
                                <Sparkles className="h-12 w-12 text-white" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-5xl font-bold text-white/95 tracking-tight leading-tight">
                                    {t(translations.welcomeTitle)}
                                </h2>
                                <p className="text-white/70 max-w-2xl mx-auto text-xl leading-relaxed font-light">
                                    {t(translations.welcomeDescription)}
                                </p>
                            </div>
                            
                            {/* Features Preview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
                                <div className="p-8 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent rounded-3xl border border-blue-400/20 backdrop-blur-sm hover:bg-blue-500/20 transition-all duration-500 hover:border-blue-400/40">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                                        <BrainCircuit className="h-8 w-8 text-blue-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-3">{t({ fr: "IA Avancée", en: "Advanced AI" })}</h3>
                                    <p className="text-white/70 leading-relaxed">{t({ fr: "Réception intelligente des appels", en: "Intelligent call reception" })}</p>
                                </div>
                                <div className="p-8 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent rounded-3xl border border-purple-400/20 backdrop-blur-sm hover:bg-purple-500/20 transition-all duration-500 hover:border-purple-400/40">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                                        <Zap className="h-8 w-8 text-purple-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-3">{t({ fr: "Configuration Rapide", en: "Quick Setup" })}</h3>
                                    <p className="text-white/70 leading-relaxed">{t({ fr: "Prêt en quelques minutes", en: "Ready in minutes" })}</p>
                                </div>
                                <div className="p-8 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent rounded-3xl border border-green-400/20 backdrop-blur-sm hover:bg-green-500/20 transition-all duration-500 hover:border-green-400/40">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                                        <ConciergeBell className="h-8 w-8 text-green-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-3">{t({ fr: "Service Premium", en: "Premium Service" })}</h3>
                                    <p className="text-white/70 leading-relaxed">{t({ fr: "Expérience client exceptionnelle", en: "Exceptional customer experience" })}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Étape de sélection du type de service supprimée - tous les services sont inclus par défaut */}
                    {wizardStep === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="businessCategory" className="text-white flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    Type d'activité
                                </Label>
                                <Select value={editableStore.businessCategory || 'RESTAURANT'} onValueChange={(value) => handleInputChange('businessCategory', value)}>
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                        <SelectValue placeholder="Choisissez votre type d'activité" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businessCategories.map((category) => (
                                            <SelectItem key={category.category} value={category.category}>
                                                <div className="flex items-center gap-2">
                                                    <span>{getCategoryEmoji(category.category)}</span>
                                                    <span>{category.displayName}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-white">{t(translations.posName)}</Label>
                                <Input id="name" name="name" value={editableStore.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} required className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 focus:border-white/40" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-white">{t(translations.fullAddress)}</Label>
                                <Input id="address" name="address" value={editableStore.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} required className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 focus:border-white/40" />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-white flex items-center gap-2">
                                    <PhoneCall className="h-4 w-4" />
                                    Pays pour numéro virtuel
                                </Label>
                                <Select 
                                    value={editableStore.country || 'FR'} 
                                    onValueChange={(value) => handleInputChange('country', value)}
                                >
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                        <SelectValue placeholder="Choisir un pays" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Pays populaires */}
                                        {POPULAR_COUNTRIES.map((country) => (
                                            <SelectItem key={country.code} value={country.code}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{country.flag}</span>
                                                    <span>{country.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                        <div className="border-t my-1"></div>
                                        {/* Autres pays */}
                                        {OTHER_COUNTRIES.map((country) => (
                                            <SelectItem key={country.code} value={country.code}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{country.flag}</span>
                                                    <span>{country.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                             <div className="space-y-2">
                                <Label htmlFor="phone" className="text-white">Votre numéro de téléphone</Label>
                                <Input id="phone" name="phone" type="tel" value={editableStore.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} required className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 focus:border-white/40" />
                            </div>
                            
                            {/* Info sur le numéro virtuel */}
                            {editableStore.country && (
                                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <PhoneCall className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-green-100 font-medium">
                                                    📞 Numéro virtuel {getTelnyxCountry(editableStore.country)?.name} {getTelnyxCountry(editableStore.country)?.flag}
                                                </p>
                                                <Button 
                                                    type="button"
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => setShowOperatorsPopup(true)}
                                                    className="text-green-300 hover:text-green-200 hover:bg-green-500/20 text-xs px-2 py-1 h-auto"
                                                >
                                                    Voir opérateurs
                                                </Button>
                                            </div>
                                            <p className="text-green-200 text-sm mb-2">
                                                Un numéro de téléphone virtuel sera automatiquement attribué. <strong>Les appels ne sont généralement pas facturés</strong> car inclus dans la plupart des abonnements.
                                            </p>
                                            <div className="bg-green-600/20 rounded-lg p-3 border border-green-500/30">
                                                <p className="text-green-100 text-xs leading-relaxed">
                                                    ⚠️ <strong>Important :</strong> Vérifiez que votre pays/opérateur choisi correspond bien à celui de vos clients. En cas d'erreur, des frais pourraient s'appliquer. La plupart des opérateurs incluent les appels vers les numéros locaux, sauf certaines lignes prépayées.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                     {wizardStep === 2 && (
                        <div className="space-y-8">
                            {/* Header Apple-style épuré */}
                            <div className="text-center space-y-3">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 backdrop-blur-xl mb-4">
                                    <Clock className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">
                                    {t(translations.openingHours)}
                                </h2>
                                <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
                                    {t(translations.openingHoursDesc)}
                                </p>
                            </div>

                            {/* Layout Apple moderne */}
                            <div className="max-w-4xl mx-auto space-y-8">
                                {/* Jours de semaine */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <h3 className="text-lg font-semibold text-white">
                                            {t({ fr: "Jours de semaine", en: "Weekdays" })}
                                        </h3>
                                        <div className="px-2 py-1 bg-blue-500/20 rounded-full text-xs text-blue-400 font-medium">
                                            5 jours
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
                                        {daysOfWeek.slice(0, 5).map((dayName, dayIndex) => {
                                            const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'][dayIndex];
                                            const currentSchedule = editableStore.schedule || defaultSchedule;
                                            const daySchedule = currentSchedule[dayKey as keyof typeof currentSchedule] || defaultSchedule[dayKey as keyof typeof defaultSchedule];
                                            
                                            return (
                                                <div key={dayKey} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                                        <div className="w-12 text-left">
                                                            <span className="text-white font-medium text-sm">{dayName.slice(0, 3)}</span>
                                                        </div>
                                                        
                                                        {daySchedule?.enabled ? (
                                                            <div className="flex items-center gap-3 flex-1">
                                                                {daySchedule?.periods?.map((period, periodIndex) => (
                                                                    <div key={periodIndex} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 border border-white/20">
                                                                        <Input 
                                                                            type="time" 
                                                                            value={period.start}
                                                                            onChange={(e) => handlePeriodChange(dayKey, periodIndex, 'start', e.target.value)}
                                                                            className="w-20 h-8 text-sm border-0 bg-transparent text-white focus:bg-white/20 rounded-md px-2"
                                                                        />
                                                                        <span className="text-gray-400 text-sm">–</span>
                                                                        <Input 
                                                                            type="time" 
                                                                            value={period.end}
                                                                            onChange={(e) => handlePeriodChange(dayKey, periodIndex, 'end', e.target.value)}
                                                                            className="w-20 h-8 text-sm border-0 bg-transparent text-white focus:bg-white/20 rounded-md px-2"
                                                                        />
                                                                        {(daySchedule?.periods?.length || 0) > 1 && (
                                                                            <Button 
                                                                                type="button" 
                                                                                variant="ghost" 
                                                                                size="icon" 
                                                                                className="h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-full"
                                                                                onClick={() => removePeriod(dayKey, periodIndex)}
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                <Button 
                                                                    type="button" 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="h-8 px-3 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 border-dashed"
                                                                    onClick={() => addPeriod(dayKey)}
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 text-sm flex-1">Fermé</span>
                                                        )}
                                                    </div>
                                                    
                                                    <Switch 
                                                        checked={daySchedule?.enabled || false}
                                                        onCheckedChange={(checked) => handleScheduleChange(dayKey, 'enabled', checked)}
                                                        className="data-[state=checked]:bg-blue-500"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Weekend */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                        <h3 className="text-lg font-semibold text-white">
                                            {t({ fr: "Weekend", en: "Weekend" })}
                                        </h3>
                                        <div className="px-2 py-1 bg-purple-500/20 rounded-full text-xs text-purple-400 font-medium">
                                            2 jours
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
                                        {daysOfWeek.slice(5, 7).map((dayName, dayIndex) => {
                                            const dayKey = ['saturday', 'sunday'][dayIndex];
                                            const currentSchedule = editableStore.schedule || defaultSchedule;
                                            const daySchedule = currentSchedule[dayKey as keyof typeof currentSchedule] || defaultSchedule[dayKey as keyof typeof defaultSchedule];
                                            
                                            return (
                                                <div key={dayKey} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                                        <div className="w-16 text-left">
                                                            <span className="text-white font-medium text-sm">{dayName}</span>
                                                        </div>
                                                        
                                                        {daySchedule?.enabled ? (
                                                            <div className="flex items-center gap-3 flex-1">
                                                                {daySchedule?.periods?.map((period, periodIndex) => (
                                                                    <div key={periodIndex} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 border border-white/20">
                                                                        <Input 
                                                                            type="time" 
                                                                            value={period.start}
                                                                            onChange={(e) => handlePeriodChange(dayKey, periodIndex, 'start', e.target.value)}
                                                                            className="w-20 h-8 text-sm border-0 bg-transparent text-white focus:bg-white/20 rounded-md px-2"
                                                                        />
                                                                        <span className="text-gray-400 text-sm">–</span>
                                                                        <Input 
                                                                            type="time" 
                                                                            value={period.end}
                                                                            onChange={(e) => handlePeriodChange(dayKey, periodIndex, 'end', e.target.value)}
                                                                            className="w-20 h-8 text-sm border-0 bg-transparent text-white focus:bg-white/20 rounded-md px-2"
                                                                        />
                                                                        {(daySchedule?.periods?.length || 0) > 1 && (
                                                                            <Button 
                                                                                type="button" 
                                                                                variant="ghost" 
                                                                                size="icon" 
                                                                                className="h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-full"
                                                                                onClick={() => removePeriod(dayKey, periodIndex)}
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                <Button 
                                                                    type="button" 
                                                                    variant="ghost" 
                                                                    size="sm" 
                                                                    className="h-8 px-3 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg border border-purple-500/30 border-dashed"
                                                                    onClick={() => addPeriod(dayKey)}
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 text-sm flex-1">Fermé</span>
                                                        )}
                                                    </div>
                                                    
                                                    <Switch 
                                                        checked={daySchedule?.enabled || false}
                                                        onCheckedChange={(checked) => handleScheduleChange(dayKey, 'enabled', checked)}
                                                        className="data-[state=checked]:bg-purple-500"
                                                    />
                                                </div>
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
                        <div className="text-center space-y-8 py-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-400/30 mx-auto">
                                <CheckCircle className="h-10 w-10 text-green-400" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold text-white tracking-tight">{t(translations.finishTitle)}</h2>
                                <p className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed">{t(translations.finishDescription)}</p>
                            </div>
                            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-white text-center">{t(translations.menuCreationMethod)}</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3 hover:bg-white/10 transition-all duration-300">
                                        <FileText className="h-8 w-8 text-blue-400" />
                                        <h3 className="font-semibold text-white">{t(translations.method1Title)}</h3>
                                        <p className="text-sm text-white/70 leading-relaxed">{t(translations.method1Desc)}</p>
                                    </div>
                                     <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3 hover:bg-white/10 transition-all duration-300">
                                        <Bot className="h-8 w-8 text-purple-400" />
                                        <h3 className="font-semibold text-white">{t({fr: "Création via IA", en: "AI Creation"})}</h3>
                                        <p className="text-sm text-white/70 leading-relaxed">{t({fr: "Laissez notre IA créer votre menu à partir de simples descriptions.", en: "Let our AI create your menu from simple descriptions."})}</p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3 hover:bg-white/10 transition-all duration-300">
                                        <Download className="h-8 w-8 text-green-400" />
                                        <h3 className="font-semibold text-white">{t(translations.method2Title)}</h3>
                                        <p className="text-sm text-white/70 leading-relaxed">{t(translations.method2Desc)}</p>
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
             <DialogFooter className="pt-6 pb-2 border-t border-white/10 flex flex-col sm:flex-row gap-3 backdrop-blur-xl bg-white/5">
                    {store ? (
                        // Mode Édition : Boutons simples
                        <>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onCancel} 
                                className="w-full sm:w-auto bg-white/10 border-white/40 text-white hover:bg-white/20 hover:border-white/60 transition-all duration-200 rounded-2xl px-6 py-3"
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
                                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto bg-white/10 border-white/40 text-white hover:bg-white/20 hover:border-white/60 transition-all duration-200 rounded-2xl px-6 py-3">{t(translations.cancel)}</Button>
                            )}
                            <div className="flex-grow" />
                            {wizardStep > 0 && wizardStep < WIZARD_STEPS.length - 1 && (
                                <Button type="button" variant="ghost" onClick={prevStep} className="text-white/90 hover:bg-white/10 transition-all duration-200 rounded-2xl px-6">{t(translations.previous)}</Button>
                            )}
                            
                            {wizardStep === 0 && (
                                <Button type="button" onClick={nextStep} className="w-full sm:w-auto bg-white/95 text-black hover:bg-white font-semibold transition-all duration-300 rounded-2xl px-8 py-3 shadow-lg shadow-white/25">{t(translations.startConfig)}</Button>
                            )}

                            {wizardStep > 0 && wizardStep < WIZARD_STEPS.length - 1 && (
                                <Button type="button" onClick={nextStep} className="bg-white/95 text-black hover:bg-white font-semibold transition-all duration-300 rounded-2xl px-8 py-3 shadow-lg shadow-white/25">{t(translations.next)}</Button>
                            )}

                            {wizardStep === WIZARD_STEPS.length - 1 && (
                                <Button onClick={handleFinalize} className="bg-white/95 text-black hover:bg-white font-semibold transition-all duration-300 rounded-2xl px-8 py-3 shadow-lg shadow-white/25">{t(translations.finishAndCreateMenu)}</Button>
                            )}
                        </>
                    )}
                </DialogFooter>
                
                {/* Popup des opérateurs - Style Apple */}
                <Dialog open={showOperatorsPopup} onOpenChange={setShowOperatorsPopup}>
                    <DialogContent className="max-w-lg mx-auto bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl">
                        <DialogHeader className="text-center pb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 backdrop-blur-xl mx-auto mb-4">
                                <span className="text-3xl">📱</span>
                            </div>
                            <DialogTitle className="text-xl font-bold text-white">
                                Opérateurs {editableStore.country && getTelnyxCountry(editableStore.country)?.name}
                            </DialogTitle>
                            <p className="text-gray-400 text-sm mt-2">
                                Compatibilité avec votre opérateur • Mise à jour aujourd'hui
                            </p>
                        </DialogHeader>
                        
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                            {editableStore.country && getTelnyxCountry(editableStore.country)?.operators?.map((operator, index) => (
                                <div 
                                    key={index} 
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm transition-all duration-200",
                                        operator.includedInPlan 
                                            ? "bg-green-500/10 border-green-500/20 hover:bg-green-500/15" 
                                            : "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">
                                            {operator.type === 'mobile' ? '📱' :
                                             operator.type === 'fixe' ? '☎️' : '📞'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-semibold text-sm">{operator.name}</span>
                                            </div>
                                            {operator.note && (
                                                <p className="text-xs text-gray-400 mt-1 max-w-48">{operator.note}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        {operator.includedInPlan ? (
                                            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                                                <span className="text-lg">✅</span>
                                                <span className="text-green-300 text-sm font-medium">Inclus</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-orange-500/20 px-3 py-1 rounded-full">
                                                <span className="text-lg">⚠️</span>
                                                <span className="text-orange-300 text-sm font-medium">Payant</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl backdrop-blur-sm">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">💡</span>
                                <div>
                                    <p className="text-white font-medium text-sm mb-1">À savoir</p>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                        La majorité des opérateurs incluent les appels vers les numéros virtuels locaux. Seules certaines offres prépayées peuvent les facturer.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
        </DialogContent>
    )
}

// Composant TelnyxPopup supprimé - configuration dans la page de gestion unifiée

function StoresContent() {
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
    const [businessCategories, setBusinessCategories] = useState<any[]>([]);

    // Fonction pour récupérer les catégories métiers
    const fetchBusinessCategories = async () => {
        try {
            const response = await fetch('/api/business-categories');
            if (response.ok) {
                const data = await response.json();
                setBusinessCategories(data);
            }
        } catch (error) {
            console.error('Erreur chargement catégories:', error);
        }
    };

    // Fonction pour obtenir l'emoji selon la catégorie
    const getCategoryEmoji = (category: string): string => {
        const emojis: Record<string, string> = {
            RESTAURANT: '🍕',
            BEAUTY: '💇‍♀️',
            HAIRDRESSER: '✂️',
            AUTOMOTIVE: '🔧',
            MEDICAL: '🏥',
            LEGAL: '⚖️',
            RETAIL: '🏪',
            FITNESS: '🏋️',
            EDUCATION: '📚',
            TRANSPORT: '🚚',
            IMMOBILIER: '🏠',
            PROFESSIONAL: '💼',
            ENTERTAINMENT: '🎉',
            HEALTH: '🏥',
            SERVICES: '🛠️'
        };
        return emojis[category] || '🏢';
    };

    useEffect(() => {
        fetchBusinessCategories();
    }, []);

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
                    window.history.replaceState({}, '', '/app/stores?firstActivity=true');
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
                    window.history.replaceState({}, '', '/app/stores');
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
                                window.history.replaceState({}, '', '/app/stores');
                            } else {
                                console.log('⚠️ Boutique en attente non trouvée');
                                toast({
                                    title: t({ fr: "⚠️ Boutique non trouvée", en: "⚠️ Store not found" }),
                                    description: t({ fr: "La nouvelle boutique n'a pas été créée automatiquement", en: "The new store was not created automatically" }),
                                    variant: "destructive"
                                });
                                // Nettoyer l'URL pour éviter la boucle
                                window.history.replaceState({}, '', '/app/stores');
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
                router.replace('/app/stores', { scroll: false });
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
        router.push(`/app/manage/${store.id}`);
    };

    const handleConfigureCallForwarding = (store: Store) => {
        // Redirection vers l'onglet de renvoi d'appel dans la page de gestion
        router.push(`/app/manage/${store.id}?tab=call-forwarding`);
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
        <div className="min-h-screen bg-black text-white">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <div className="container mx-auto px-4 py-6 space-y-8 relative z-10">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">{t(translations.title)}</h1>
                        <p className="text-gray-400 text-lg">{t(translations.description)}</p>
                    </div>
                    <Button 
                        onClick={() => handleOpenWizard()} 
                        className="bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-2xl px-6 py-3"
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t(translations.addStore)}
                    </Button>
                </header>

                {isLoading ? (
                    <div className="text-center py-16 backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-white mx-auto"></div>
                        <p className="mt-6 text-gray-400 font-medium">{t({ fr: "Chargement des activités...", en: "Loading activities..." })}</p>
                    </div>
                ) : stores.length === 0 ? (
                    <div className="text-center py-16 backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Building className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">{t({ fr: "Aucune activité", en: "No activities" })}</h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">{t({ fr: "Créez votre première activité pour commencer", en: "Create your first activity to get started" })}</p>
                        <Button 
                            onClick={() => handleOpenWizard()}
                            className="bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-2xl px-6 py-3"
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
                            <Card key={store.id} className="backdrop-blur-sm bg-white/10 border-white/20 rounded-2xl overflow-hidden">
                                <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                                    {/* Section Info Boutique */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {getStatusIcon()}
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <CardTitle className="text-xl font-semibold text-white truncate">
                                                {store.name}
                                            </CardTitle>
                                            {/* Afficher l'adresse seulement si elle est différente et significative */}
                                            {store.address && store.address !== store.name && store.address.length > 5 && (
                                                <CardDescription className="text-sm text-gray-400 truncate">{store.address}</CardDescription>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section Actions */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {/* Bouton Gérer - style Apple */}
                                        <Button 
                                            size="sm" 
                                            className="bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-2xl px-4 py-2"
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
                <DialogContent className="sm:max-w-3xl backdrop-blur-sm bg-black/95 border border-white/20 rounded-3xl">
                    <DialogHeader className="text-center space-y-4 p-6">
                        <DialogTitle className="text-3xl font-bold text-white">Choisissez votre plan d'abonnement</DialogTitle>
                        <DialogDescription className="text-lg text-gray-400">
                            Chaque activité nécessite son propre abonnement
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-8">
                        <Card className={cn("cursor-pointer backdrop-blur-sm bg-white/10 rounded-2xl border-2", selectedPlan === 'STARTER' ? "border-green-500" : "border-white/20 hover:border-green-300")}>
                            <CardContent className="p-8" onClick={() => setSelectedPlan('STARTER')}>
                                <div className="text-center space-y-4">
                                    <h4 className="font-bold text-xl text-white">STARTER</h4>
                                    <div className="text-4xl font-bold text-white">129€<span className="text-lg font-normal text-gray-400">/mois</span></div>
                                    <p className="text-sm text-gray-500">+ 10% de commission</p>
                                    <p className="text-xs text-gray-400">Idéal pour débuter</p>
                                    {selectedPlan === 'STARTER' && <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className={cn("cursor-pointer backdrop-blur-sm bg-white/10 rounded-2xl border-2", selectedPlan === 'PRO' ? "border-blue-500" : "border-white/20 hover:border-blue-300")}>
                            <CardContent className="p-8" onClick={() => setSelectedPlan('PRO')}>
                                <div className="text-center space-y-4">
                                    <h4 className="font-bold text-xl text-white">PRO</h4>
                                    <div className="text-4xl font-bold text-white">329€<span className="text-lg font-normal text-gray-400">/mois</span></div>
                                    <p className="text-sm text-gray-400">+ 1€ par commande</p>
                                    <p className="text-xs text-gray-500">Pour les restaurants établis</p>
                                    {selectedPlan === 'PRO' && <CheckCircle className="h-8 w-8 text-blue-500 mx-auto" />}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className={cn("cursor-pointer backdrop-blur-sm bg-white/10 rounded-2xl border-2", selectedPlan === 'BUSINESS' ? "border-purple-500" : "border-white/20 hover:border-purple-300")}>
                            <CardContent className="p-8" onClick={() => setSelectedPlan('BUSINESS')}>
                                <div className="text-center space-y-4">
                                    <h4 className="font-bold text-xl text-white">BUSINESS</h4>
                                    <div className="text-4xl font-bold text-white">800€<span className="text-lg font-normal text-gray-400">/mois</span></div>
                                    <p className="text-sm text-gray-400">Tout inclus</p>
                                    <p className="text-xs text-gray-500">Pour les gros volumes</p>
                                    {selectedPlan === 'BUSINESS' && <CheckCircle className="h-8 w-8 text-purple-500 mx-auto" />}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <DialogFooter className="flex gap-3 p-6">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowPlanModal(false)}
                            className="rounded-xl border-white/20 text-white hover:bg-white/10"
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
                            className="bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20"
                        >
                            Configurer d'abord
                        </Button>
                        <Button 
                            onClick={handlePaymentForNewActivity}
                            disabled={!selectedPlan || isPaymentProcessing}
                            className="bg-white hover:bg-gray-200 text-black font-medium rounded-xl px-6"
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

export default function StoresPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <StoresContent />
        </Suspense>
    );
}
