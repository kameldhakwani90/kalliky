

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
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Clock, Upload, Utensils, Zap, Link as LinkIcon, CheckCircle, XCircle, BadgeEuro, X, Printer, Cog, TestTube2, Network, MessageCircle, TabletSmartphone, Copy, FileText, Bot, PhoneCall, PhoneForwarded, Car, Coffee, Building, Sparkles, BookOpen, BrainCircuit, ConciergeBell, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    notifications: NotificationConfig;
    telnyxNumber?: string;
    telnyxConfigured?: boolean;
    serviceId?: string;
    serviceType: ServiceType;
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
    { id: 'welcome', title: { fr: 'Bienvenue', en: 'Welcome' } },
    { id: 'serviceType', title: { fr: "Type d'activité", en: 'Business Type' } },
    { id: 'general', title: { fr: 'Infos Générales', en: 'General Info' } },
    { id: 'opening', title: { fr: 'Horaires', en: 'Opening Hours' } },
    { id: 'taxes', title: { fr: 'Taxes', en: 'Taxes' } },
    { id: 'peripherals', title: { fr: 'Périphériques & Notifications', en: 'Peripherals & Notifications' } },
    { id: 'voice', title: { fr: 'Configuration Vocale', en: 'Voice Setup' } },
    { id: 'finish', title: { fr: 'Finalisation', en: 'Finalization' } },
];

const currentUserPlan = 'pro'; // Should be dynamic in a real app

function StoreWizard({ store, onSave, onCancel }: { store: Store | null, onSave: (store: Store) => void, onCancel: () => void }) {
    const router = useRouter();
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const [wizardStep, setWizardStep] = useState(store ? 2 : 0); // Start at general info if editing
    const [editableStore, setEditableStore] = useState<Partial<Store>>(
        store || {
            status: 'active',
            stripeStatus: 'disconnected',
            currency: 'EUR',
            taxRates: [],
            printers: [],
            notifications: { enabled: true },
            telnyxConfigured: false,
        }
    );

    const daysOfWeek = language === 'fr' ? daysOfWeekFr : daysOfWeekEn;

    const handleFinalize = () => {
        if (!editableStore.serviceType) return;
        const finalStore = {
            ...editableStore,
            id: editableStore.id || `store-${Date.now()}`,
            telnyxNumber: editableStore.telnyxNumber || `+339${Math.floor(10000000 + Math.random() * 90000000).toString().padStart(8, '0')}`,
        } as Store;
        onSave(finalStore);
        router.push(`/restaurant/services/${finalStore.id}`);
    }

    const handleInputChange = (field: keyof Store, value: any) => {
        setEditableStore(prev => ({ ...prev, [field]: value }));
    };

    const handleNotificationChange = (field: keyof NotificationConfig, value: any) => {
        const currentNotifications = editableStore.notifications || { enabled: false };
        handleInputChange('notifications', { ...currentNotifications, [field]: value });
    }

    const handleServiceTypeSelection = (type: ServiceType) => {
        handleInputChange('serviceType', type);
        nextStep();
    }


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

    const nextStep = () => setWizardStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
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
        finishAndCreateMenu: { fr: 'Terminer et configurer le service', en: 'Finish and Configure Service' },
    };

    return (
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="text-center font-headline text-2xl">{store ? t(translations.editStore) : t(translations.addNewStore)}</DialogTitle>
                {WIZARD_STEPS[wizardStep].id !== 'welcome' && WIZARD_STEPS[wizardStep].id !== 'finish' && (
                    <DialogDescription className="text-center">
                        {t(translations.stepOf).replace('{step}', wizardStep.toString()).replace('{total}', (WIZARD_STEPS.length - 2).toString())} - {t(WIZARD_STEPS[wizardStep].title)}
                    </DialogDescription>
                )}
            </DialogHeader>

            {WIZARD_STEPS[wizardStep].id !== 'welcome' && WIZARD_STEPS[wizardStep].id !== 'finish' &&
                <div className="py-2">
                    <Progress value={(wizardStep / (WIZARD_STEPS.length - 2)) * 100} className="h-2" />
                </div>
            }

            <div className="flex-1 overflow-y-auto space-y-6">
                <div className="px-1">
                    {wizardStep === 0 && (
                        <div className="text-center space-y-6 py-8">
                           <h2 className="text-3xl font-bold font-headline">{t(translations.welcomeTitle)}</h2>
                           <p className="text-muted-foreground max-w-lg mx-auto">{t(translations.welcomeDescription)}</p>
                        </div>
                    )}
                    {wizardStep === 1 && (
                         <div className="space-y-2 py-4">
                            <h3 className="text-center font-semibold text-lg">{t(translations.activityTypeTitle)}</h3>
                            <p className="text-center text-sm text-muted-foreground">{t(translations.activityTypeDescription)}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                <Card onClick={() => handleServiceTypeSelection('products')} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all">
                                    <CardHeader className="items-center text-center">
                                        <Utensils className="h-8 w-8 mb-2 text-primary" />
                                        <CardTitle className="text-base">{t(translations.productsSale)}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center text-xs text-muted-foreground">
                                        {t(translations.productsSaleDesc)}
                                    </CardContent>
                                </Card>
                                <Card onClick={() => handleServiceTypeSelection('reservations')} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all">
                                    <CardHeader className="items-center text-center">
                                        <ConciergeBell className="h-8 w-8 mb-2 text-primary" />
                                        <CardTitle className="text-base">{t(translations.reservationsManagement)}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center text-xs text-muted-foreground">
                                        {t(translations.reservationsManagementDesc)}
                                    </CardContent>
                                </Card>
                                <Card onClick={() => handleServiceTypeSelection('consultation')} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all">
                                    <CardHeader className="items-center text-center">
                                        <BrainCircuit className="h-8 w-8 mb-2 text-primary" />
                                        <CardTitle className="text-base">{t(translations.qualifiedAppointments)}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center text-xs text-muted-foreground">
                                        {t(translations.qualifiedAppointmentsDesc)}
                                    </CardContent>
                                </Card>
                            </div>
                         </div>
                    )}
                    {wizardStep === 2 && (
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
                     {wizardStep === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {daysOfWeek.map(day => (
                                    <div key={day} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-4">
                                        <Label htmlFor={`hours-${day}`} className="col-span-1">{day}</Label>
                                        <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-2">
                                             <Input id={`hours-${day}-open`} name={`hours-${day}-open`} type="time" defaultValue="09:00" />
                                             <Input id={`hours-${day}-close`} name={`hours-${day}-close`} type="time" defaultValue="22:00" />
                                        </div>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{t(translations.openingHoursDesc)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {wizardStep === 4 && (
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
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {wizardStep === 5 && (
                        <div className="space-y-4">
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
                        </div>
                    )}
                     {wizardStep === 6 && (
                        <Card className="bg-amber-50 border-amber-200">
                            <CardHeader>
                                <CardTitle className="text-amber-900 flex items-center gap-3"><PhoneCall className="h-5 w-5"/>{t(translations.telnyxTitle)}</CardTitle>
                                <CardDescription className="text-amber-800">{t(translations.telnyxDescription)}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs">{t(translations.telnyxNumberLabel)}</Label>
                                    <div className="flex items-center gap-2">
                                        <Input readOnly value={editableStore.telnyxNumber || `+339${Math.floor(10000000 + Math.random() * 90000000)}`} className="font-mono text-lg bg-white" />
                                        <Button size="icon" variant="ghost" type="button" onClick={() => copyToClipboard(editableStore.telnyxNumber!)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">{t(translations.telnyxInstructions)}</Label>
                                    <ul className="text-xs text-amber-800 list-none space-y-1 mt-1">
                                        <li>{t(translations.telnyxInstruction1)}</li>
                                        <li>{t(translations.telnyxInstruction2)}</li>
                                        <li>{t(translations.telnyxInstruction3)}</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {wizardStep === 7 && (
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
                                        <Pencil className="h-6 w-6 text-primary" />
                                        <h3 className="font-semibold">{t(translations.method2Title)}</h3>
                                        <p className="text-xs text-muted-foreground">{t(translations.method2Desc)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
             <DialogFooter className="pt-4 border-t flex flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">{t(translations.cancel)}</Button>
                    <div className="flex-grow" />
                    {wizardStep > 0 && wizardStep < WIZARD_STEPS.length - 1 && (
                        <Button type="button" variant="ghost" onClick={prevStep}>{t(translations.previous)}</Button>
                    )}
                    
                    {wizardStep === 0 && (
                        <Button type="button" onClick={nextStep} className="w-full sm:w-auto">{t(translations.startConfig)}</Button>
                    )}

                    {wizardStep > 1 && wizardStep < 6 && wizardStep !== 1 && (
                        <Button type="button" onClick={nextStep}>{t(translations.next)}</Button>
                    )}
                    
                    {wizardStep === 6 && (
                       <>
                        <Button type="button" variant="secondary" onClick={() => { handleInputChange('telnyxConfigured', false); nextStep(); }}>
                            {t(translations.configureLater)}
                        </Button>
                        <Button type="button" onClick={() => { handleInputChange('telnyxConfigured', true); nextStep(); }}>
                            <PhoneForwarded className="mr-2 h-4 w-4" />
                            {t(translations.telnyxConfirm)}
                        </Button>
                       </>
                    )}

                    {wizardStep === WIZARD_STEPS.length - 1 && (
                        <Button onClick={handleFinalize}>{t(translations.finishAndCreateMenu)}</Button>
                    )}
                </DialogFooter>
        </DialogContent>
    )
}

function TelnyxPopup({ store, onConfirm, onCancel }: { store: Store, onConfirm: (storeId: string) => void, onCancel: () => void }) {
    const { t } = useLanguage();
    const { toast } = useToast();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: t({ fr: "Copié !", en: "Copied!" }),
        });
    }

    const translations = {
        telnyxTitle: { fr: "Action requise : activez la réception des appels", en: "Action required: activate call reception" },
        telnyxDescription: { fr: "Pour que notre IA puisse répondre à vos clients, vous devez rediriger les appels de votre ligne principale vers le numéro que nous avons créé pour vous.", en: "For our AI to be able to answer your customers, you must forward calls from your main line to the number we have created for you." },
        telnyxNumberLabel: { fr: "Votre numéro vocal", en: "Your voice number" },
        telnyxInstructions: { fr: "Instructions :", en: "Instructions:" },
        telnyxInstruction1: { fr: "1. Connectez-vous à l'interface de votre opérateur téléphonique (Orange, Free, SFR...).", en: "1. Log in to your telephone operator's interface (Orange, Free, SFR...)." },
        telnyxInstruction2: { fr: "2. Trouvez l'option \"Renvoi d'appel\" ou \"Transfert d'appel\".", en: "2. Find the \"Call Forwarding\" or \"Call Transfer\" option." },
        telnyxInstruction3: { fr: "3. Configurez un renvoi de tous les appels vers votre numéro vocal ci-dessus.", en: "3. Set up forwarding for all calls to your voice number above." },
        telnyxConfirm: { fr: "C'est fait, j'ai configuré le renvoi d'appel", en: "Done, I have configured call forwarding" },
        cancel: { fr: "Annuler", en: "Cancel" },
    };

    return (
        <DialogContent>
            <DialogHeader>
                 <DialogTitle className="text-amber-900 flex items-center gap-3"><PhoneCall className="h-5 w-5"/>{t(translations.telnyxTitle)}</DialogTitle>
                 <DialogDescription className="text-amber-800">{t(translations.telnyxDescription)}</DialogDescription>
            </DialogHeader>
             <div className="space-y-4 py-4">
                <div>
                    <Label className="text-xs">{t(translations.telnyxNumberLabel)}</Label>
                    <div className="flex items-center gap-2">
                        <Input readOnly value={store.telnyxNumber} className="font-mono text-lg bg-white" />
                        <Button size="icon" variant="ghost" type="button" onClick={() => copyToClipboard(store.telnyxNumber!)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div>
                    <Label className="text-xs">{t(translations.telnyxInstructions)}</Label>
                    <ul className="text-xs text-muted-foreground list-none space-y-1 mt-1">
                        <li>{t(translations.telnyxInstruction1)}</li>
                        <li>{t(translations.telnyxInstruction2)}</li>
                        <li>{t(translations.telnyxInstruction3)}</li>
                    </ul>
                </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">{t(translations.cancel)}</Button>
                <Button className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto" onClick={() => onConfirm(store.id)}>
                    <PhoneForwarded className="mr-2 h-4 w-4"/>
                    {t(translations.telnyxConfirm)}
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default function StoresPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const [stores, setStores] = useState<Store[]>(initialStores);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isTelnyxPopupOpen, setIsTelnyxPopupOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            handleOpenWizard();
            router.replace('/restaurant/stores', { scroll: false });
        }
    }, [searchParams, router]);

    const handleOpenWizard = (store: Store | null = null) => {
        setSelectedStore(store);
        setIsWizardOpen(true);
    };

    const handleSaveStore = (storeData: Store) => {
        setStores(prevStores => {
            const exists = prevStores.some(s => s.id === storeData.id);
            if (exists) {
                return prevStores.map(s => s.id === storeData.id ? storeData : s);
            }
            return [...prevStores, storeData];
        });
        setIsWizardOpen(false);
    };

    const deleteStore = (id: string) => {
        setStores(stores.filter(s => s.id !== id));
    };

    const confirmTelnyxSetup = (storeId: string) => {
        setStores(stores.map(s => s.id === storeId ? { ...s, telnyxConfigured: true } : s));
        setIsTelnyxPopupOpen(false);
    }
    
    const handleConfigureTelnyxClick = (store: Store) => {
        setSelectedStore(store);
        setIsTelnyxPopupOpen(true);
    }
    
    const handleManageService = (store: Store) => {
        const path = store.serviceId ? `/restaurant/services/${store.id}` : `/restaurant/services/${store.id}`;
        router.push(path);
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
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t(translations.title)}</h1>
                    <p className="text-muted-foreground">{t(translations.description)}</p>
                </div>
                <Button onClick={() => handleOpenWizard()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t(translations.addStore)}
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                    <Card key={store.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>{store.name}</CardTitle>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenWizard(store)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            {t(translations.edit)}
                                        </DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    {t(translations.delete)}
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t(translations.areYouSure)}</AlertDialogTitle>
                                                    <AlertDialogDescription>{t(translations.deleteConfirmation)}</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t(translations.cancel)}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteStore(store.id)}>{t(translations.delete)}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <CardDescription>{store.address}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <div className="flex items-center gap-2 mb-4">
                                <Badge variant={store.status === 'active' ? 'default' : 'secondary'} className={cn(store.status === 'active' ? 'bg-green-100 text-green-700' : '')}>{store.status === 'active' ? t(translations.active) : t(translations.inactive)}</Badge>
                             </div>
                             <div className="text-sm text-muted-foreground space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("cursor-pointer", !store.telnyxConfigured && "border-amber-400 text-amber-700 hover:bg-amber-50")} onClick={() => !store.telnyxConfigured && handleConfigureTelnyxClick(store)}>
                                        <PhoneCall className="mr-2 h-3 w-3 shrink-0" />
                                        {store.telnyxConfigured ? t(translations.connected) : t(translations.configure)}
                                    </Badge>
                                    <span>Prise de commande vocale</span>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Badge variant="outline" className={cn(store.stripeStatus !== 'connected' && "text-muted-foreground")}>
                                        <svg role="img" viewBox="0 0 48 48" className="mr-2 h-3 w-3 shrink-0"><path d="M43.013 13.062c.328-.18.72-.038.898.292.18.328.038.72-.29.898l-2.91 1.593c.318.92.483 1.88.483 2.864v.002c0 2.14-.52 4.19-1.48 5.968l-4.223 2.152a.634.634 0 0 1-.87-.303l-1.05-2.05c-.06-.118-.08-.25-.062-.378.017-.128.072-.244-.158-.33l3.525-3.524a.632.632 0 0 1 .894 0 .632.632 0 0 1 0 .894l-3.525-3.523c-.34.34-.798.53-1.27.53-.47 0-.928-.19-1.27-.53l-2.028-2.027a1.796 1.796 0 1 1 2.54-2.54l3.525 3.525a.632.632 0 0 0 .894 0 .632.632 0 0 0 0-.894l-3.525-3.524a1.8 1.8 0 0 0-1.27-.527c-.47 0-.928.188-1.27.527L28.12 25.1a1.796 1.796 0 0 1-2.54 0 1.796 1.796 0 0 1 0-2.54l2.028-2.027a1.795 1.795 0 0 1 1.27-.53c.47 0 .93.19 1.27.53l1.05 1.05c.06.06.136.09.213.09s.154-.03-.213-.09l-4.223-2.152A7.26 7.26 0 0 0 37.3 13.44l2.91-1.593a.633.633 0 0 1 .802-.286Zm-25.04 18.59c-.328.18-.72.038-.898-.29-.18-.328-.038-.72.29-.898l2.91-1.594c-.318-.92-.483-1.88-.483-2.863 0-2.14.52-4.19 1.48-5.968l4.223-2.152a.634.634 0 0 1 .87.303l1.05 2.05c.06.118.08.25.062-.378-.017.128-.072-.244-.158-.33l-3.525 3.525a.632.632 0 0 1-.894 0 .632.632 0 0 1 0-.894l3.525-3.525c.34-.34.798-.53-1.27-.53.47 0 .928.19 1.27.53l2.028 2.027a1.796 1.796 0 1 1-2.54 2.54l-3.525-3.525a.632.632 0 0 0-.894 0 .632.632 0 0 0 0 .894l3.525 3.525c.34.34.798.528 1.27.528.47 0 .928-.188 1.27-.528l2.028-2.027a1.796 1.796 0 0 1 2.54 0c.7.7.7 1.84 0 2.54l-2.028 2.027a1.795 1.795 0 0 1-1.27.53c-.47 0-.93-.19-1.27-.53l-1.05-1.05c-.06-.06-.136-.09-.213-.09s.154-.03-.213-.09l-4.223 2.152c-1.428.73-3.033 1.15-4.708 1.15l-2.91 1.593a.633.633 0 0 1-.803.285ZM13.442 4.986c0 2.705-2.22 4.9-4.95 4.9s-4.95-2.195-4.95-4.9c0-2.705 2.22-4.9 4.95-4.9s4.95 2.195 4.95 4.9Z" fill="#635bff"></path></svg>
                                        <span>Paiement en ligne</span>
                                    </Badge>
                                </div>
                             </div>
                        </CardContent>
                         <CardFooter>
                            <Button className="w-full" onClick={() => handleManageService(store)}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                {t(translations.manage)}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>


            <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
                {isWizardOpen && <StoreWizard store={selectedStore} onSave={handleSaveStore} onCancel={() => setIsWizardOpen(false)} />}
            </Dialog>

            <Dialog open={isTelnyxPopupOpen} onOpenChange={setIsTelnyxPopupOpen}>
                {selectedStore && <TelnyxPopup store={selectedStore} onConfirm={confirmTelnyxSetup} onCancel={() => setIsTelnyxPopupOpen(false)} />}
            </Dialog>
        </div>
    );
}
