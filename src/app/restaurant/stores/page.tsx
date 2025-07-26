

'use client';

import { useState } from 'react';
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
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Clock, Upload, Utensils, Zap, Link as LinkIcon, CheckCircle, XCircle, BadgeEuro, X, Printer, Cog, TestTube2, Network, MessageCircle, TabletSmartphone, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';


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


export default function StoresPage() {
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const [stores, setStores] = useState<Store[]>(initialStores);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [editableTaxRates, setEditableTaxRates] = useState<TaxRate[]>([]);
    const [editablePrinters, setEditablePrinters] = useState<PrinterDevice[]>([]);
    const [editableKDS, setEditableKDS] = useState<KDSConnection[]>([]);

    const daysOfWeek = language === 'fr' ? daysOfWeekFr : daysOfWeekEn;

    const handleOpenFormDialog = (store: Store | null = null) => {
        setSelectedStore(store);
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
        addNewStore: { fr: "Ajouter une nouvelle boutique", en: "Add a new store" },
        formDescription: { fr: "Renseignez toutes les informations de votre point de vente pour une configuration optimale.", en: "Enter all your point of sale information for optimal configuration." },
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
        manageConnections: { fr: "Gérer les connexions", en: "Manage connections" },
        connectionsDescription: { fr: "Connectez des services externes à votre boutique {storeName} pour étendre ses fonctionnalités.", en: "Connect external services to your store {storeName} to extend its functionality." },
        endCustomerPayments: { fr: "Paiements des clients finaux", en: "End-customer payments" },
        connected: { fr: "Connecté", en: "Connected" },
        notConnected: { fr: "Non connecté", en: "Not connected" },
        stripeDescription: { fr: "Permet à vos clients de payer leurs commandes en ligne. L'argent est directement versé sur votre compte Stripe.", en: "Allows your customers to pay for their orders online. The money is paid directly into your Stripe account." },
        stripeConnectedInfo: { fr: "Cette boutique est correctement connectée à Stripe.", en: "This store is correctly connected to Stripe." },
        redirectToStripe: { fr: "Redirection vers Stripe", en: "Redirect to Stripe" },
        stripeRedirectDesc: { fr: "Vous allez être redirigé vers le site de Stripe pour connecter votre compte en toute sécurité. Une fois l'opération terminée, vous reviendrez automatiquement ici.", en: "You will be redirected to the Stripe website to connect your account securely. Once the operation is complete, you will automatically return here." },
        learnMoreStripe: { fr: "En savoir plus sur Stripe Connect", en: "Learn more about Stripe Connect" },
        continueToStripe: { fr: "Continuer vers Stripe", en: "Continue to Stripe" },
        connectStripe: { fr: "Connecter mon compte Stripe", en: "Connect my Stripe account" },
        messaging: { fr: "Messagerie", en: "Messaging" },
        configured: { fr: "Configuré", en: "Configured" },
        notConfigured: { fr: "Non configuré", en: "Not configured" },
        messagingDescription: { fr: "Utilisé pour les demandes de preuve (Plan Pro et +).", en: "Used for proof requests (Pro Plan and up)." },
        whatsappNumber: { fr: "Numéro WhatsApp de la boutique", en: "Store's WhatsApp number" },
        twilioNumberInfo: { fr: "Doit être un numéro activé sur la plateforme Twilio.", en: "Must be a number activated on the Twilio platform." },
        saveConnections: { fr: "Enregistrer les connexions", en: "Save connections" },
        kdsConnections: { fr: 'Connexions KDS', en: 'KDS Connections' },
        kdsDescription: { fr: "Connectez vos tablettes de cuisine (KDS) pour recevoir les commandes en temps réel.", en: "Connect your kitchen display systems (KDS) to receive orders in real time." },
        deviceName: { fr: "Nom de l'appareil", en: "Device Name" },
        connectionCode: { fr: "Code de connexion", en: "Connection Code" },
        lastSeen: { fr: "Dernière connexion", en: "Last seen" },
        addKDS: { fr: "Ajouter un KDS", en: "Add a KDS" },
        kdsSync: { fr: "Synchronisation KDS", en: "KDS Sync" },
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
                        <DialogTitle>{selectedStore ? t(translations.editStore) : t(translations.addNewStore)}</DialogTitle>
                        <DialogDescription>
                            {t(translations.formDescription)}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveStore} className="flex-1 overflow-y-auto">
                      <Tabs defaultValue="general" className="p-1">
                          <TabsList className="grid w-full grid-cols-5">
                              <TabsTrigger value="general">{t(translations.general)}</TabsTrigger>
                              <TabsTrigger value="opening">{t(translations.openingHours)}</TabsTrigger>
                              <TabsTrigger value="taxes">{t(translations.taxes)}</TabsTrigger>
                              <TabsTrigger value="peripherals">{t(translations.peripherals)}</TabsTrigger>
                              <TabsTrigger value="connections">{t(translations.connections)}</TabsTrigger>
                          </TabsList>
                          <TabsContent value="general" className="space-y-6 pt-4">
                              <div className="space-y-4">
                                <h4 className="font-medium">{t(translations.generalInfo)}</h4>
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
                          </TabsContent>
                          <TabsContent value="opening" className="space-y-4 pt-4">
                              <h4 className="font-medium">{t(translations.openingDaysHours)}</h4>
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
                          </TabsContent>
                           <TabsContent value="taxes" className="space-y-6 pt-4">
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
                          </TabsContent>
                          <TabsContent value="peripherals" className="space-y-4 pt-4">
                               <h4 className="font-medium">{t(translations.printerManagement)}</h4>
                               <div className="space-y-3">
                                  {editablePrinters.map((printer, index) => (
                                    <Card key={printer.id} className="bg-muted/50">
                                      <CardHeader className="py-3 px-4 flex-row items-center justify-between">
                                          <CardTitle className="text-base flex items-center gap-2">
                                              <Printer className="h-4 w-4" />
                                              <Input 
                                                  value={printer.name} 
                                                  onChange={(e) => handlePrinterChange(index, 'name', e.target.value)} 
                                                  className="border-none shadow-none focus-visible:ring-1 p-1 h-auto w-auto font-semibold"
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
                                          <Button type="button" variant="ghost" className="w-full text-muted-foreground" disabled>
                                              <TestTube2 className="mr-2 h-4 w-4" /> {t(translations.testPage)}
                                          </Button>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={addPrinter}>
                                      <Printer className="mr-2 h-4 w-4"/> {t(translations.addPrinter)}
                                  </Button>
                               </div>
                          </TabsContent>
                          <TabsContent value="connections" className="space-y-6 pt-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">{t(translations.kdsSync)}</h3>
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
                                                        <Input className="h-8" value={kds.name} />
                                                    </div>
                                                    <div className="col-span-5 space-y-1">
                                                        <Label className="text-xs">{t(translations.connectionCode)}</Label>
                                                        <div className="flex">
                                                            <Input className="h-8 rounded-r-none font-mono" value={kds.connectionCode} readOnly />
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
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">{t(translations.endCustomerPayments)}</h3>
                                <Card>
                                    <CardHeader>
                                         <CardTitle className="flex items-center gap-3">
                                            <svg role="img" viewBox="0 0 48 48" className="h-8 w-8"><path d="M43.013 13.062c.328-.18.72-.038.898.292.18.328.038.72-.29.898l-2.91 1.593c.318.92.483 1.88.483 2.864v.002c0 2.14-.52 4.19-1.48 5.968l-4.223 2.152a.634.634 0 0 1-.87-.303l-1.05-2.05c-.06-.118-.08-.25-.062-.378.017-.128.072-.244.158-.33l3.525-3.524a.632.632 0 0 1 .894 0 .632.632 0 0 1 0 .894l-3.525-3.523c-.34.34-.798.53-1.27.53-.47 0-.928-.19-1.27-.53l-2.028-2.027a1.796 1.796 0 1 1 2.54-2.54l3.525 3.525a.632.632 0 0 0 .894 0 .632.632 0 0 0 0-.894l-3.525-3.524a1.8 1.8 0 0 0-1.27-.527c-.47 0-.928.188-1.27.527L28.12 25.1a1.796 1.796 0 0 1-2.54 0 1.796 1.796 0 0 1 0-2.54l2.028-2.027a1.795 1.795 0 0 1 1.27-.53c.47 0 .93.19 1.27.53l1.05 1.05c.06.06.136.09.213.09s.154-.03-.213-.09l-4.223-2.152A7.26 7.26 0 0 0 37.3 13.44l2.91-1.593a.633.633 0 0 1 .802-.286Zm-25.04 18.59c-.328.18-.72.038-.898-.29-.18-.328-.038-.72.29-.898l2.91-1.594c-.318-.92-.483-1.88-.483-2.863 0-2.14.52-4.19 1.48-5.968l4.223-2.152a.634.634 0 0 1 .87.303l1.05 2.05c.06.118.08.25.062-.378-.017.128-.072-.244-.158-.33l-3.525 3.525a.632.632 0 0 1-.894 0 .632.632 0 0 1 0-.894l3.525-3.525c.34-.34.798-.53-1.27-.53.47 0 .928.19 1.27.53l2.028 2.027a1.796 1.796 0 1 1-2.54 2.54l-3.525-3.525a.632.632 0 0 0-.894 0 .632.632 0 0 0 0 .894l3.525 3.525c.34.34.798.528 1.27.528.47 0 .928-.188 1.27-.528l2.028-2.027a1.796 1.796 0 0 1 2.54 0c.7.7.7 1.84 0 2.54l-2.028 2.027a1.795 1.795 0 0 1-1.27.53c-.47 0-.93-.19-1.27-.53l-1.05-1.05c-.06-.06-.136-.09-.213-.09s.154-.03-.213-.09l-4.223 2.152c-1.428.73-3.033 1.15-4.708 1.15l-2.91 1.593a.633.633 0 0 1-.803.285ZM13.442 4.986c0 2.705-2.22 4.9-4.95 4.9s-4.95-2.195-4.95-4.9c0-2.705 2.22-4.9 4.95-4.9s4.95 2.195 4.95 4.9Z" fill="#635bff"></path></svg>
                                            <span>Stripe Connect</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xs text-muted-foreground pt-1">
                                            {t(translations.stripeDescription)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">{t(translations.messaging)}</h3>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24"><path fill="#25D366" d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91c0-2.73-1.11-5.2-2.9-7.01zm-7.01 15.26c-1.53 0-3.01-.47-4.29-1.36l-.3-.18l-3.18.83l.85-3.1l-.2-.31a8.084 8.084 0 0 1-1.23-4.38c0-4.54 3.7-8.24 8.24-8.24c2.2 0 4.23.86 5.82 2.45c1.59 1.59 2.45 3.62 2.45 5.82c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81c-.23-.08-.39-.12-.56.12c-.17.25-.64.81-.79.97c-.15.17-.29.19-.54.06c-.25-.12-1.06-.39-2.02-1.25c-.75-.67-1.25-1.5-1.4-1.75c-.14-.25-.02-.38.11-.51c.11-.11.25-.29.37-.43s.17-.25.25-.41c.08-.17.04-.31-.02-.43c-.06-.12-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.42c-.14,0-.3,0-.46,0s-.39.06-.6.3c-.2.25-.79.76-.79,1.85s.81,2.15.93,2.3c.12.17 1.58,2.41 3.83,3.39c.54.24.97.38,1.3.48c.55.17,1.05.14,1.44.09c.44-.06 1.47-.6 1.68-1.18c.21-.58.21-1.07.14-1.18c-.05-.12-.19-.19-.43-.31z"/></svg>
                                            <span>WhatsApp (via Twilio)</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Label htmlFor="whatsapp-number">{t(translations.whatsappNumber)}</Label>
                                        <Input
                                            id="whatsapp-number"
                                            name="whatsapp-number"
                                            placeholder="+33612345678"
                                            defaultValue={selectedStore?.whatsappNumber || ''}
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">{t(translations.twilioNumberInfo)}</p>
                                    </CardContent>
                                </Card>
                            </div>
                          </TabsContent>
                      </Tabs>

                      <DialogFooter className="mt-6 pt-4 border-t">
                          <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>{t(translations.cancel)}</Button>
                          <Button type="submit">{t(translations.saveStore)}</Button>
                      </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
