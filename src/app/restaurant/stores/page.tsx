

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Clock, Upload, Utensils, Zap, Link as LinkIcon, CheckCircle, XCircle, BadgeEuro, X, Printer, Cog, TestTube2, Network, MessageCircle, TabletSmartphone, Copy, FileText, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

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

type KDSConnection = {
    id: string;
    name: string;
    connectionCode: string;
    lastSeen: string;
}

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
    kdsConnections?: KDSConnection[];
};

const initialStores: Store[] = [
    { 
        id: "store-1", name: "Le Gourmet Parisien - Centre", address: "12 Rue de la Paix, 75002 Paris", phone: "01 23 45 67 89", status: 'active', stripeStatus: 'connected', currency: 'EUR', 
        whatsappNumber: '+33612345678',
        taxRates: [
            { id: 'tax-1-1', name: 'Réduit', rate: 5.5, isDefault: false },
            { id: 'tax-1-2', name: 'Intermédiaire', rate: 10, isDefault: true },
            { id: 'tax-1-3', name: 'Normal', rate: 20, isDefault: false },
        ],
        printers: [
            { id: 'p1', name: 'Imprimante Caisse', role: 'receipt', width: '80mm', connectionType: 'network', ipAddress: '192.168.1.50', port: '9100' },
            { id: 'p2', name: 'Imprimante Cuisine', role: 'kitchen', width: '58mm', connectionType: 'usb' },
        ],
        kdsConnections: [
            { id: 'kds-1', name: 'Tablette Cuisine 1', connectionCode: 'AB12-CD34', lastSeen: 'il y a 5 minutes'}
        ]
    },
    { 
        id: "store-2", name: "Le Gourmet Parisien - Montmartre", address: "5 Place du Tertre, 75018 Paris", phone: "01 98 76 54 32", status: 'active', stripeStatus: 'disconnected', currency: 'EUR', 
        taxRates: [
            { id: 'tax-2-1', name: 'Réduit', rate: 5.5, isDefault: false },
            { id: 'tax-2-2', name: 'Intermédiaire', rate: 10, isDefault: true },
            { id: 'tax-2-3', name: 'Normal', rate: 20, isDefault: false },
        ],
        printers: [],
        kdsConnections: []
    },
    { 
        id: "store-3", name: "Pizzeria Bella - Bastille", address: "3 Rue de la Roquette, 75011 Paris", phone: "01 44 55 66 77", status: 'inactive', stripeStatus: 'disconnected', currency: 'EUR', 
        taxRates: [
             { id: 'tax-3-1', name: 'À emporter', rate: 5.5, isDefault: true },
             { id: 'tax-3-2', name: 'Sur place', rate: 10, isDefault: false },
        ],
        printers: [],
        kdsConnections: []
    },
];

const daysOfWeekEn = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const daysOfWeekFr = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];


const WIZARD_STEPS = [
    { id: 'welcome', title: { fr: 'Bienvenue', en: 'Welcome' } },
    { id: 'general', title: { fr: 'Infos Générales', en: 'General Info' }, description: { fr: 'Donnez un nom et une adresse à votre boutique.', en: 'Give your store a name and address.' } },
    { id: 'opening', title: { fr: 'Horaires', en: 'Opening Hours' }, description: { fr: 'Définissez vos heures d\'ouverture.', en: 'Set your opening hours.' } },
    { id: 'taxes', title: { fr: 'Taxes & Connexions', en: 'Taxes & Connections' }, description: { fr: 'Configurez la TVA et les services externes.', en: 'Configure VAT and external services.' } },
    { id: 'peripherals', title: { fr: 'Périphériques', en: 'Peripherals' }, description: { fr: 'Connectez imprimantes et tablettes de cuisine.', en: 'Connect printers and kitchen tablets.' } },
    { id: 'finish', title: { fr: 'Finalisation', en: 'Finalization' } },
];

const currentUserPlan = 'pro'; // Should be dynamic in a real app

export default function StoresPage() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useLanguage();
    const [stores, setStores] = useState<Store[]>(initialStores);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [editableTaxRates, setEditableTaxRates] = useState<TaxRate[]>([]);
    const [editablePrinters, setEditablePrinters] = useState<PrinterDevice[]>([]);
    const [editableKDS, setEditableKDS] = useState<KDSConnection[]>([]);
    const [wizardStep, setWizardStep] = useState(0);

    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            handleOpenFormDialog();
        }
    }, [searchParams]);

    const daysOfWeek = language === 'fr' ? daysOfWeekFr : daysOfWeekEn;

    const handleOpenFormDialog = (store: Store | null = null) => {
        setSelectedStore(store);
        setWizardStep(store ? 1 : 0); // Skip welcome if editing
        setEditableTaxRates(store ? [...store.taxRates] : [{ id: `tax_${Date.now()}`, name: t({fr: 'TVA par défaut', en: 'Default VAT'}), rate: 0, isDefault: true }]);
        setEditablePrinters(store ? [...(store.printers || [])] : []);
        setEditableKDS(store ? [...(store.kdsConnections || [])] : []);
        setIsFormDialogOpen(true);
    };

    const handleSaveStore = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const storeData = {
            ...selectedStore,
            id: selectedStore ? selectedStore.id : `store-${Date.now()}`,
            name: formData.get('name') as string,
            address: formData.get('address') as string,
            phone: formData.get('phone') as string,
            whatsappNumber: (formData.get('whatsapp-number') as string) || selectedStore?.whatsappNumber,
            status: selectedStore?.status || 'active',
            stripeStatus: selectedStore?.stripeStatus || 'disconnected',
            currency: (formData.get('currency') as Store['currency']) || 'EUR',
            taxRates: editableTaxRates,
            printers: editablePrinters,
            kdsConnections: editableKDS
        } as Store;

        if (selectedStore) {
            setStores(stores.map(s => s.id === storeData.id ? storeData : s));
        } else {
            setStores([...stores, storeData]);
        }
        setIsFormDialogOpen(false);
        router.push('/restaurant/menu'); // Redirect to menu page
    };
    
    const toggleStoreStatus = (id: string) => {
        setStores(stores.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s));
    };

    const deleteStore = (id: string) => {
        setStores(stores.filter(s => s.id !== id));
    };
    
    const handleTaxRateChange = (index: number, field: keyof TaxRate, value: string | number | boolean) => {
        const newTaxRates = [...editableTaxRates];
        if (field === 'isDefault' && value === true) {
            newTaxRates.forEach((rate, i) => {
                rate.isDefault = i === index;
            });
        } else {
            (newTaxRates[index] as any)[field] = value;
        }
        setEditableTaxRates(newTaxRates);
    };

    const addTaxRate = () => {
        setEditableTaxRates([...editableTaxRates, { id: `tax_${Date.now()}`, name: '', rate: 0, isDefault: false }]);
    };
    
    const removeTaxRate = (index: number) => {
        const newTaxRates = editableTaxRates.filter((_, i) => i !== index);
        if (newTaxRates.length > 0 && !newTaxRates.some(r => r.isDefault)) {
            newTaxRates[0].isDefault = true;
        }
        setEditableTaxRates(newTaxRates);
    };

    const handlePrinterChange = (index: number, field: keyof PrinterDevice, value: string) => {
        const newPrinters = [...editablePrinters];
        (newPrinters[index] as any)[field] = value;
        setEditablePrinters(newPrinters);
    };

    const addPrinter = () => {
        setEditablePrinters([...editablePrinters, { id: `printer_${Date.now()}`, name: t({fr: 'Nouvelle imprimante', en: 'New Printer'}), role: 'receipt', width: '80mm', connectionType: 'network' }]);
    };
    
    const removePrinter = (index: number) => {
        const newPrinters = editablePrinters.filter((_, i) => i !== index);
        setEditablePrinters(newPrinters);
    };

    const handleKDSChange = (index: number, field: keyof KDSConnection, value: string) => {
        const newKDS = [...editableKDS];
        (newKDS[index] as any)[field] = value;
        setEditableKDS(newKDS);
    };

    const addKDS = () => {
        const newCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        setEditableKDS([...editableKDS, { id: `kds_${Date.now()}`, name: t({fr: 'Nouvelle tablette', en: 'New Tablet'}), connectionCode: newCode, lastSeen: t({fr: 'Jamais vu', en: 'Never seen'})}]);
    }
    
    const removeKDS = (index: number) => {
        setEditableKDS(editableKDS.filter((_, i) => i !== index));
    }
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: t({fr: "Copié !", en: "Copied!"}),
            description: t({fr: "Le code de connexion a été copié dans le presse-papiers.", en: "The connection code has been copied to the clipboard."}),
        });
    }

    const nextStep = () => setWizardStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    const prevStep = () => setWizardStep(prev => Math.max(prev - 1, 0));
    
    const translations = {
        title: { fr: "Gestion des Boutiques", en: "Store Management" },
        description: { fr: "Gérez vos points de vente et les menus associés.", en: "Manage your points of sale and associated menus." },
        addStore: { fr: "Ajouter une boutique", en: "Add store" },
        storeList: { fr: "Liste de vos boutiques", en: "List of your stores" },
        name: { fr: "Nom", en: "Name" },
        address: { fr: "Adresse", en: "Address" },
        phone: { fr: "Téléphone", en: "Phone" },
        status: { fr: "Statut", en: "Status" },
        actions: { fr: "Actions", en: "Actions" },
        active: { fr: "Actif", en: "Active" },
        inactive: { fr: "Inactif", en: "Inactive" },
        openMenu: { fr: "Ouvrir le menu", en: "Open menu" },
        editInfo: { fr: "Modifier les informations", en: "Edit information" },
        connections: { fr: "Connexions", en: "Connections" },
        delete: { fr: "Supprimer", en: "Delete" },
        areYouSure: { fr: "Êtes-vous sûr ?", en: "Are you sure?" },
        deleteConfirmation: { fr: "Cette action est irréversible. La boutique, son menu et toutes ses données associées seront définitivement supprimés.", en: "This action is irreversible. The store, its menu, and all associated data will be permanently deleted." },
        cancel: { fr: "Annuler", en: "Cancel" },
        editStore: { fr: "Modifier la boutique", en: "Edit store" },
        addNewStore: { fr: "Assistant de création de boutique", en: "Store Creation Wizard" },
        formDescription: { fr: "Suivez les étapes pour configurer votre nouveau point de vente.", en: "Follow the steps to set up your new point of sale." },
        
        // Wizard Steps
        welcomeTitle: { fr: 'Bienvenue chez Kalliky.ai !', en: 'Welcome to Kalliky.ai!' },
        welcomeDescription: { fr: 'Prêt à transformer la gestion de votre restaurant ? Cet assistant va vous guider pour configurer votre premier point de vente en quelques minutes.', en: 'Ready to transform your restaurant management? This wizard will guide you to set up your first point of sale in minutes.' },
        welcomeVideoSub: { fr: 'Découvrez comment notre IA peut vous aider :', en: 'See how our AI can help you:' },
        startConfig: { fr: 'Commencer la configuration', en: 'Start Configuration' },

        general: { fr: "Général", en: "General" },
        openingHours: { fr: "Horaires", en: "Hours" },
        taxes: { fr: "Taxes", en: "Taxes" },
        peripherals: { fr: "Périphériques", en: "Peripherals" },
        generalInfo: { fr: "Informations générales", en: "General information" },
        restaurantName: { fr: "Nom du restaurant", en: "Restaurant Name" },
        cuisineType: { fr: "Type de cuisine", en: "Cuisine Type" },
        fullAddress: { fr: "Adresse complète", en: "Full address" },
        landline: { fr: "Téléphone fixe", en: "Landline phone" },
        contactEmail: { fr: "Email de contact", en: "Contact email" },
        logoVisual: { fr: "Logo / Visuel", en: "Logo / Visual" },
        logoRecommendation: { fr: "Recommandé pour une meilleure présentation.", en: "Recommended for a better presentation." },
        openingDaysHours: { fr: "Jours et horaires d’ouverture", en: "Opening days and hours" },
        openingHoursDesc: { fr: "Utilisé pour accepter ou refuser les commandes automatiquement.", en: "Used to automatically accept or refuse orders." },
        defaultCurrency: { fr: "Devise par défaut", en: "Default currency" },
        vatRates: { fr: "Taux de TVA applicables", en: "Applicable VAT rates" },
        taxNamePlaceholder: { fr: "Nom (ex: Normal)", en: "Name (e.g. Standard)" },
        rate: { fr: "Taux", en: "Rate" },
        default: { fr: "Défaut", en: "Default" },
        addVatRate: { fr: "Ajouter un taux de TVA", en: "Add a VAT rate" },
        printerManagement: { fr: "Gestion des imprimantes", en: "Printer Management" },
        role: { fr: "Rôle", en: "Role" },
        receipt: { fr: "Ticket de caisse", en: "Receipt" },
        kitchenTicket: { fr: "Ticket de cuisine", en: "Kitchen ticket" },
        width: { fr: "Largeur", en: "Width" },
        connectionType: { fr: "Type de connexion", en: "Connection Type" },
        networkIp: { fr: "Réseau (IP)", en: "Network (IP)" },
        usbOther: { fr: "USB / Autre", en: "USB / Other" },
        ipAddress: { fr: "Adresse IP", en: "IP Address" },
        port: { fr: "Port", en: "Port" },
        testPage: { fr: "Lancer une page de test", en: "Run a test page" },
        addPrinter: { fr: "Ajouter une imprimante", en: "Add a printer" },
        saveStore: { fr: "Enregistrer la boutique", en: "Save store" },
        
        connectionsTitle: { fr: 'Connexions & Services', en: 'Connections & Services' },
        endCustomerPayments: { fr: "Paiements des clients finaux", en: "End-customer payments" },
        connected: { fr: "Connecté", en: "Connected" },
        notConnected: { fr: "Non connecté", en: "Not connected" },
        stripeDescription: { fr: "Permet à vos clients de payer leurs commandes en ligne. L'argent est directement versé sur votre compte Stripe.", en: "Allows your customers to pay for their orders online. The money is paid directly into your Stripe account." },
        connectStripe: { fr: "Connecter mon compte Stripe", en: "Connect my Stripe account" },
        planProRequired: { fr: 'Plan Pro requis', en: 'Pro Plan required' },
        messaging: { fr: "Messagerie", en: "Messaging" },
        messagingDescription: { fr: "Utilisé pour les demandes de preuve (Plan Pro et +).", en: "Used for proof requests (Pro Plan and up)." },
        whatsappNumber: { fr: "Numéro WhatsApp de la boutique", en: "Store's WhatsApp number" },
        
        kdsConnections: { fr: 'Connexions KDS', en: 'KDS Connections' },
        kdsDescription: { fr: "Connectez vos tablettes de cuisine (KDS) pour recevoir les commandes en temps réel.", en: "Connect your kitchen display systems (KDS) to receive orders in real time." },
        deviceName: { fr: "Nom de l'appareil", en: "Device Name" },
        connectionCode: { fr: "Code de connexion", en: "Connection Code" },
        lastSeen: { fr: "Dernière connexion", en: "Last seen" },
        addKDS: { fr: "Ajouter un KDS", en: "Add a KDS" },
        
        finishTitle: { fr: 'Votre boutique est prête !', en: 'Your store is ready!' },
        finishDescription: { fr: "Il ne reste plus qu'à créer votre menu. C'est simple et rapide.", en: "All that's left is to create your menu. It's quick and easy." },
        menuCreationMethod: { fr: 'Méthodes de création de menu', en: 'Menu Creation Methods' },
        method1Title: { fr: 'Import de fichier', en: 'File Import' },
        method1Desc: { fr: 'Importez votre menu depuis un fichier Excel ou une simple photo.', en: 'Import your menu from an Excel file or a simple photo.' },
        method2Title: { fr: 'Création IA', en: 'AI Creation' },
        method2Desc: { fr: "Décrivez vos plats et laissez notre IA générer les descriptions et les images.", en: "Describe your dishes and let our AI generate descriptions and images." },
        method3Title: { fr: 'Création manuelle', en: 'Manual Creation' },
        method3Desc: { fr: 'Utilisez notre éditeur complet pour créer vos articles et menus pas à pas.', en: 'Use our comprehensive editor to create your items and menus step-by-step.' },

        previous: { fr: 'Précédent', en: 'Previous' },
        next: { fr: 'Suivant', en: 'Next' },
        finishAndCreateMenu: { fr: 'Terminer et créer ma carte', en: 'Finish and Create Menu' },
    };


    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t(translations.title)}</h1>
                    <p className="text-muted-foreground">{t(translations.description)}</p>
                </div>
                <Button onClick={() => handleOpenFormDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t(translations.addStore)}
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>{t(translations.storeList)}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t(translations.name)}</TableHead>
                                <TableHead>{t(translations.address)}</TableHead>
                                <TableHead>{t(translations.phone)}</TableHead>
                                <TableHead>{t(translations.status)}</TableHead>
                                <TableHead className="text-right">{t(translations.actions)}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stores.map((store) => (
                                <TableRow key={store.id}>
                                    <TableCell className="font-medium">{store.name}</TableCell>
                                    <TableCell>{store.address}</TableCell>
                                    <TableCell>{store.phone}</TableCell>
                                    <TableCell>
                                        <Badge variant={store.status === 'active' ? 'default' : 'secondary'} className={store.status === 'active' ? 'bg-green-100 text-green-700' : ''}>
                                            {store.status === 'active' ? t(translations.active) : t(translations.inactive)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Switch
                                                checked={store.status === 'active'}
                                                onCheckedChange={() => toggleStoreStatus(store.id)}
                                                aria-label={t({fr: "Activer/Désactiver la boutique", en: "Activate/Deactivate store"})}
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">{t(translations.openMenu)}</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenFormDialog(store)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        {t(translations.editInfo)}
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
                                                                <AlertDialogDescription>
                                                                    {t(translations.deleteConfirmation)}
                                                                </AlertDialogDescription>
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
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-center font-headline text-2xl">{selectedStore ? t(translations.editStore) : t(translations.addNewStore)}</DialogTitle>
                         {WIZARD_STEPS[wizardStep].id !== 'welcome' && WIZARD_STEPS[wizardStep].id !== 'finish' && (
                             <DialogDescription className="text-center">
                                {t({fr: `Étape ${wizardStep} sur ${WIZARD_STEPS.length - 2}`, en: `Step ${wizardStep} of ${WIZARD_STEPS.length - 2}`})} - {t(WIZARD_STEPS[wizardStep].title)}
                             </DialogDescription>
                         )}
                    </DialogHeader>
                    
                    {WIZARD_STEPS[wizardStep].id !== 'welcome' && WIZARD_STEPS[wizardStep].id !== 'finish' &&
                      <div className="px-1 py-2">
                        <Progress value={(wizardStep / (WIZARD_STEPS.length - 2)) * 100} className="h-2" />
                      </div>
                    }


                    <form onSubmit={handleSaveStore} className="flex-1 overflow-y-auto space-y-6 p-1 -mx-2 px-2">
                       {wizardStep === 0 && (
                            <div className="grid md:grid-cols-2 gap-8 items-center py-8">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-bold font-headline">{t(translations.welcomeTitle)}</h2>
                                    <p className="text-muted-foreground">{t(translations.welcomeDescription)}</p>
                                    <p className="text-sm font-semibold">{t(translations.welcomeVideoSub)}</p>
                                </div>
                                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                    <video src="https://www.w3schools.com/html/mov_bbb.mp4" controls className="w-full h-full rounded-lg object-cover"></video>
                                </div>
                            </div>
                        )}
                      
                      {wizardStep === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t(translations.restaurantName)}</Label>
                                    <Input id="name" name="name" defaultValue={selectedStore?.name || ''} placeholder={t({fr: "Ex: Le Gourmet Parisien", en: "E.g.: The Parisian Gourmet"})} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cuisine-type">{t(translations.cuisineType)}</Label>
                                    <Input id="cuisine-type" name="cuisine-type" placeholder={t({fr: "Ex: Pizza, Sushi, Burger...", en: "E.g.: Pizza, Sushi, Burger..."})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">{t(translations.fullAddress)}</Label>
                                <Input id="address" name="address" defaultValue={selectedStore?.address || ''} placeholder={t({fr: "123 Rue Principale, 75000 Ville", en: "123 Main Street, 10001 City"})} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t(translations.landline)}</Label>
                                    <Input id="phone" name="phone" type="tel" defaultValue={selectedStore?.phone || ''} placeholder="01 23 45 67 89" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t(translations.contactEmail)}</Label>
                                    <Input id="email" name="email" type="email" placeholder="contact@exemple.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t(translations.logoVisual)}</Label>
                                <Input id="logo" name="logo" type="file" className="h-auto"/>
                                <p className="text-xs text-muted-foreground">{t(translations.logoRecommendation)}</p>
                            </div>
                        </div>
                      )}

                      {wizardStep === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {daysOfWeek.map(day => (
                                    <div key={day} className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor={`hours-${day}`} className="col-span-1">{day}</Label>
                                        <div className="col-span-2 grid grid-cols-2 gap-2">
                                             <Input id={`hours-${day}-open`} name={`hours-${day}-open`} type="time" />
                                             <Input id={`hours-${day}-close`} name={`hours-${day}-close`} type="time" />
                                        </div>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{t(translations.openingHoursDesc)}</span>
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
                                        <select name="currency" id="currency" defaultValue={selectedStore?.currency || 'EUR'} className="mt-2 flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                            <option value="EUR">Euro (€)</option>
                                            <option value="USD">Dollar ($)</option>
                                            <option value="TND">Dinar (DT)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>{t(translations.vatRates)}</Label>
                                        <div className="mt-2 space-y-2 p-3 border rounded-md">
                                            {editableTaxRates.map((taxRate, index) => (
                                                <div key={taxRate.id} className="grid grid-cols-12 gap-2 items-center">
                                                    <div className="col-span-5">
                                                        <Input placeholder={t(translations.taxNamePlaceholder)} value={taxRate.name} onChange={(e) => handleTaxRateChange(index, 'name', e.target.value)} />
                                                    </div>
                                                    <div className="col-span-3 relative">
                                                        <Input placeholder={t(translations.rate)} type="number" value={taxRate.rate} onChange={(e) => handleTaxRateChange(index, 'rate', parseFloat(e.target.value))} step="0.1" />
                                                         <span className="absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">%</span>
                                                    </div>
                                                    <div className="col-span-3 flex items-center gap-2">
                                                        <input type="radio" id={`default-tax-${index}`} name="default-tax" checked={taxRate.isDefault} onChange={(e) => handleTaxRateChange(index, 'isDefault', e.target.checked)} />
                                                        <Label htmlFor={`default-tax-${index}`} className="text-xs font-normal">{t(translations.default)}</Label>
                                                    </div>
                                                    {editableTaxRates.length > 1 &&
                                                        <div className="col-span-1">
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
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4"/> {t(translations.connectionsTitle)}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <div className={cn("p-4 rounded-md", currentUserPlan === 'starter' ? "bg-muted/50" : "")}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-semibold text-sm">{t(translations.endCustomerPayments)} (Stripe)</h4>
                                                <p className="text-xs text-muted-foreground">{t(translations.stripeDescription)}</p>
                                            </div>
                                             <Button variant="outline" size="sm" disabled={currentUserPlan === 'starter'}>{t(translations.connectStripe)}</Button>
                                        </div>
                                        {currentUserPlan === 'starter' && <Badge variant="secondary" className="mt-2">{t(translations.planProRequired)}</Badge>}
                                    </div>
                                    <div className={cn("p-4 rounded-md", currentUserPlan === 'starter' ? "bg-muted/50" : "")}>
                                        <h4 className="font-semibold text-sm">{t(translations.messaging)} (WhatsApp)</h4>
                                        <p className="text-xs text-muted-foreground mb-2">{t(translations.messagingDescription)}</p>
                                        <Input disabled={currentUserPlan === 'starter'} placeholder={t(translations.whatsappNumber)} />
                                        {currentUserPlan === 'starter' && <Badge variant="secondary" className="mt-2">{t(translations.planProRequired)}</Badge>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                      )}

                      {wizardStep === 4 && (
                        <div className="space-y-4">
                           <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2"><Printer className="h-4 w-4"/> {t(translations.printerManagement)}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {editablePrinters.map((printer, index) => (
                                    <Card key={printer.id} className="bg-muted/50">
                                      <CardHeader className="py-3 px-4 flex-row items-center justify-between">
                                          <CardTitle className="text-base flex items-center gap-2">
                                              <Input 
                                                  value={printer.name} 
                                                  onChange={(e) => handlePrinterChange(index, 'name', e.target.value)} 
                                                  className="border-none shadow-none focus-visible:ring-1 p-1 h-auto w-auto font-semibold bg-transparent"
                                              />
                                          </CardTitle>
                                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePrinter(index)}>
                                              <X className="h-4 w-4"/>
                                          </Button>
                                      </CardHeader>
                                      <CardContent className="p-4 pt-0 space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <Label className="text-xs">{t(translations.role)}</Label>
                                                   <Select value={printer.role} onValueChange={(value) => handlePrinterChange(index, 'role', value)}>
                                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="receipt">{t(translations.receipt)}</SelectItem>
                                                        <SelectItem value="kitchen">{t(translations.kitchenTicket)}</SelectItem>
                                                      </SelectContent>
                                                  </Select>
                                              </div>
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
                                          {printer.connectionType === 'network' && (
                                              <div className="grid grid-cols-2 gap-4">
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
                                    <CardTitle className="text-base flex items-center gap-2"><TabletSmartphone className="h-4 w-4"/> {t(translations.kdsConnections)}</CardTitle>
                                    <CardDescription>{t(translations.kdsDescription)}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {editableKDS.map((kds, index) => (
                                        <Card key={kds.id} className="bg-muted/50 p-3">
                                            <div className="grid grid-cols-12 gap-2 items-center">
                                                <div className="col-span-5 space-y-1">
                                                    <Label className="text-xs">{t(translations.deviceName)}</Label>
                                                    <Input className="h-8 bg-background" value={kds.name} onChange={(e) => handleKDSChange(index, 'name', e.target.value)} />
                                                </div>
                                                <div className="col-span-5 space-y-1">
                                                    <Label className="text-xs">{t(translations.connectionCode)}</Label>
                                                    <div className="flex">
                                                        <Input className="h-8 rounded-r-none font-mono bg-background" value={kds.connectionCode} readOnly />
                                                        <Button type="button" size="icon" className="h-8 w-8 rounded-l-none" onClick={() => copyToClipboard(kds.connectionCode)}>
                                                            <Copy className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                     <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeKDS(index)}>
                                                        <X className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{t(translations.lastSeen)}: {kds.lastSeen}</p>
                                        </Card>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={addKDS}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> {t(translations.addKDS)}
                                    </Button>
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
                                    <CardContent className="grid md:grid-cols-3 gap-4 text-left">
                                        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                            <FileText className="h-6 w-6 text-primary" />
                                            <h3 className="font-semibold">{t(translations.method1Title)}</h3>
                                            <p className="text-xs text-muted-foreground">{t(translations.method1Desc)}</p>
                                        </div>
                                         <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                            <Bot className="h-6 w-6 text-primary" />
                                            <h3 className="font-semibold">{t(translations.method2Title)}</h3>
                                            <p className="text-xs text-muted-foreground">{t(translations.method2Desc)}</p>
                                        </div>
                                         <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                            <Pencil className="h-6 w-6 text-primary" />
                                            <h3 className="font-semibold">{t(translations.method3Title)}</h3>
                                            <p className="text-xs text-muted-foreground">{t(translations.method3Desc)}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                      <DialogFooter className="pt-4 border-t sticky bottom-0 bg-background pb-0 -mx-2 -mb-6 px-6">
                          <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>{t(translations.cancel)}</Button>
                          <div className="flex-grow" />
                          {wizardStep > 0 && (
                            <Button type="button" variant="ghost" onClick={prevStep}>{t(translations.previous)}</Button>
                          )}
                          {wizardStep === 0 && (
                            <Button type="button" onClick={nextStep}>{t(translations.startConfig)}</Button>
                          )}
                          {wizardStep > 0 && wizardStep < WIZARD_STEPS.length - 1 && (
                            <Button type="button" onClick={nextStep}>{t(translations.next)}</Button>
                          )}
                          {wizardStep === WIZARD_STEPS.length - 1 && (
                             <Button type="submit">{t(translations.finishAndCreateMenu)}</Button>
                          )}
                      </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
