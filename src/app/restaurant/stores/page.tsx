

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
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Clock, Upload, Utensils, Zap, Link as LinkIcon, CheckCircle, XCircle, BadgeEuro, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

type TaxRate = {
    id: string;
    name: string;
    rate: number;
    isDefault: boolean;
};

type Store = {
    id: string;
    name: string;
    address: string;
    phone: string;
    status: 'active' | 'inactive';
    stripeStatus: 'connected' | 'disconnected';
    currency: 'EUR' | 'USD' | 'TND';
    taxRates: TaxRate[];
};

const initialStores: Store[] = [
    { 
        id: "store-1", name: "Le Gourmet Parisien - Centre", address: "12 Rue de la Paix, 75002 Paris", phone: "01 23 45 67 89", status: 'active', stripeStatus: 'connected', currency: 'EUR', 
        taxRates: [
            { id: 'tax-1-1', name: 'Réduit', rate: 5.5, isDefault: false },
            { id: 'tax-1-2', name: 'Intermédiaire', rate: 10, isDefault: true },
            { id: 'tax-1-3', name: 'Normal', rate: 20, isDefault: false },
        ]
    },
    { 
        id: "store-2", name: "Le Gourmet Parisien - Montmartre", address: "5 Place du Tertre, 75018 Paris", phone: "01 98 76 54 32", status: 'active', stripeStatus: 'disconnected', currency: 'EUR', 
        taxRates: [
            { id: 'tax-2-1', name: 'Réduit', rate: 5.5, isDefault: false },
            { id: 'tax-2-2', name: 'Intermédiaire', rate: 10, isDefault: true },
            { id: 'tax-2-3', name: 'Normal', rate: 20, isDefault: false },
        ]
    },
    { 
        id: "store-3", name: "Pizzeria Bella - Bastille", address: "3 Rue de la Roquette, 75011 Paris", phone: "01 44 55 66 77", status: 'inactive', stripeStatus: 'disconnected', currency: 'EUR', 
        taxRates: [
             { id: 'tax-3-1', name: 'À emporter', rate: 5.5, isDefault: true },
             { id: 'tax-3-2', name: 'Sur place', rate: 10, isDefault: false },
        ]
    },
];

const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];


export default function StoresPage() {
    const [stores, setStores] = useState<Store[]>(initialStores);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [isConnectionsDialogOpen, setIsConnectionsDialogOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [editableTaxRates, setEditableTaxRates] = useState<TaxRate[]>([]);


    const handleOpenFormDialog = (store: Store | null = null) => {
        setSelectedStore(store);
        setEditableTaxRates(store ? [...store.taxRates] : [{ id: `tax_${Date.now()}`, name: 'TVA par défaut', rate: 0, isDefault: true }]);
        setIsFormDialogOpen(true);
    };

    const handleOpenConnectionsDialog = (store: Store) => {
        setSelectedStore(store);
        setIsConnectionsDialogOpen(true);
    }

    const handleSaveStore = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const storeData = {
            ...selectedStore,
            id: selectedStore ? selectedStore.id : `store-${Date.now()}`,
            name: formData.get('name') as string,
            address: formData.get('address') as string,
            phone: formData.get('phone') as string,
            status: selectedStore?.status || 'active',
            stripeStatus: selectedStore?.stripeStatus || 'disconnected',
            currency: (formData.get('currency') as Store['currency']) || 'EUR',
            taxRates: editableTaxRates,
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
    
    const handleStripeConnect = () => {
        if (!selectedStore) return;
        setStores(stores.map(s => s.id === selectedStore.id ? { ...s, stripeStatus: 'connected' } : s));
        setSelectedStore(prev => prev ? {...prev, stripeStatus: 'connected'} : null);
    }
    
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
        // Ensure there's always at least one rate and one default
        if (newTaxRates.length > 0 && !newTaxRates.some(r => r.isDefault)) {
            newTaxRates[0].isDefault = true;
        }
        setEditableTaxRates(newTaxRates);
    };


    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Boutiques</h1>
                    <p className="text-muted-foreground">Gérez vos points de vente et les menus associés.</p>
                </div>
                <Button onClick={() => handleOpenFormDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter une boutique
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Liste de vos boutiques</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Adresse</TableHead>
                                <TableHead>Téléphone</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                            {store.status === 'active' ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Switch
                                                checked={store.status === 'active'}
                                                onCheckedChange={() => toggleStoreStatus(store.id)}
                                                aria-label="Activer/Désactiver la boutique"
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Ouvrir le menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenFormDialog(store)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Modifier les informations
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenConnectionsDialog(store)}>
                                                        <Zap className="mr-2 h-4 w-4" />
                                                        Connexions
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Cette action est irréversible. La boutique, son menu et toutes ses données associées seront définitivement supprimés.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => deleteStore(store.id)}>Supprimer</AlertDialogAction>
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
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedStore ? 'Modifier la boutique' : 'Ajouter une nouvelle boutique'}</DialogTitle>
                        <DialogDescription>
                            Renseignez toutes les informations de votre point de vente pour une configuration optimale.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveStore}>
                        <div className="space-y-6 py-4 px-1">
                             <div className="space-y-4">
                                <h4 className="font-medium">🏪 Informations générales</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nom du restaurant</Label>
                                        <Input id="name" name="name" defaultValue={selectedStore?.name || ''} placeholder="Ex: Le Gourmet Parisien" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cuisine-type">Type de cuisine</Label>
                                        <Input id="cuisine-type" name="cuisine-type" placeholder="Ex: Pizza, Sushi, Burger..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Adresse complète</Label>
                                    <Input id="address" name="address" defaultValue={selectedStore?.address || ''} placeholder="123 Rue Principale, 75000 Ville" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Téléphone fixe</Label>
                                        <Input id="phone" name="phone" type="tel" defaultValue={selectedStore?.phone || ''} placeholder="01 23 45 67 89" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email de contact</Label>
                                        <Input id="email" name="email" type="email" placeholder="contact@exemple.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Logo / Visuel</Label>
                                    <Input id="logo" name="logo" type="file" className="h-auto"/>
                                    <p className="text-xs text-muted-foreground">Recommandé pour une meilleure présentation.</p>
                                </div>
                             </div>
                            
                            <Separator />

                             <div className="space-y-4">
                                <h4 className="font-medium text-lg flex items-center gap-2"><BadgeEuro/>Devise & Taxes</h4>
                                <div>
                                    <Label htmlFor="currency">Devise par défaut</Label>
                                    <select name="currency" id="currency" defaultValue={selectedStore?.currency || 'EUR'} className="mt-2 flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                        <option value="EUR">Euro (€)</option>
                                        <option value="USD">Dollar ($)</option>
                                        <option value="TND">Dinar (DT)</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Taux de TVA applicables</Label>
                                    <div className="mt-2 space-y-2 p-3 border rounded-md">
                                        {editableTaxRates.map((taxRate, index) => (
                                            <div key={taxRate.id} className="grid grid-cols-12 gap-2 items-center">
                                                <div className="col-span-5">
                                                    <Input placeholder="Nom (ex: Normal)" value={taxRate.name} onChange={(e) => handleTaxRateChange(index, 'name', e.target.value)} />
                                                </div>
                                                <div className="col-span-3 relative">
                                                    <Input placeholder="Taux" type="number" value={taxRate.rate} onChange={(e) => handleTaxRateChange(index, 'rate', parseFloat(e.target.value))} step="0.1" />
                                                     <span className="absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">%</span>
                                                </div>
                                                <div className="col-span-3 flex items-center gap-2">
                                                    <input type="radio" id={`default-tax-${index}`} name="default-tax" checked={taxRate.isDefault} onChange={(e) => handleTaxRateChange(index, 'isDefault', e.target.checked)} />
                                                    <Label htmlFor={`default-tax-${index}`} className="text-xs font-normal">Défaut</Label>
                                                </div>
                                                {editableTaxRates.length > 1 &&
                                                    <div className="col-span-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTaxRate(index)}>
                                                            <X className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                }
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={addTaxRate}>
                                            <PlusCircle className="mr-2 h-4 w-4"/> Ajouter un taux de TVA
                                        </Button>
                                    </div>
                                </div>
                             </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-medium">Jours et horaires d’ouverture</h4>
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
                                        <span>Utilisé pour accepter ou refuser les commandes automatiquement.</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Annuler</Button>
                            <Button type="submit">Enregistrer la boutique</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

             <Dialog open={isConnectionsDialogOpen} onOpenChange={setIsConnectionsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Gérer les connexions</DialogTitle>
                        <DialogDescription>
                            Connectez des applications tierces à votre boutique <span className="font-semibold">{selectedStore?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Paiements</h3>
                        <Card>
                             <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-3">
                                        <svg role="img" viewBox="0 0 48 48" className="h-8 w-8"><path d="M43.013 13.062c.328-.18.72-.038.898.292.18.328.038.72-.29.898l-2.91 1.593c.318.92.483 1.88.483 2.864v.002c0 2.14-.52 4.19-1.48 5.968l-4.223 2.152a.634.634 0 0 1-.87-.303l-1.05-2.05c-.06-.118-.08-.25-.062-.378.017-.128.072-.244.158-.33l3.525-3.524a.632.632 0 0 1 .894 0 .632.632 0 0 1 0 .894l-3.525-3.523c-.34.34-.798.53-1.27.53-.47 0-.928-.19-1.27-.53l-2.028-2.027a1.796 1.796 0 1 1 2.54-2.54l3.525 3.525a.632.632 0 0 0 .894 0 .632.632 0 0 0 0-.894l-3.525-3.524a1.8 1.8 0 0 0-1.27-.527c-.47 0-.928.188-1.27.527L28.12 25.1a1.796 1.796 0 0 1-2.54 0 1.796 1.796 0 0 1 0-2.54l2.028-2.027a1.795 1.795 0 0 1 1.27-.53c.47 0 .93.19 1.27.53l1.05 1.05c.06.06.136.09.213.09s.154-.03.213-.09l4.223-2.152A7.26 7.26 0 0 0 37.3 13.44l2.91-1.593a.633.633 0 0 1 .802-.286Zm-25.04 18.59c-.328.18-.72.038-.898-.29-.18-.328-.038-.72.29-.898l2.91-1.594c-.318-.92-.483-1.88-.483-2.863 0-2.14.52-4.19 1.48-5.968l4.223-2.152a.634.634 0 0 1 .87.303l1.05 2.05c.06.118.08.25.062-.378-.017.128-.072-.244-.158-.33l-3.525 3.525a.632.632 0 0 1-.894 0 .632.632 0 0 1 0-.894l3.525-3.525c.34-.34.798-.53-1.27-.53.47 0 .928.19 1.27.53l2.028 2.027a1.796 1.796 0 1 1-2.54 2.54l-3.525-3.525a.632.632 0 0 0-.894 0 .632.632 0 0 0 0 .894l3.525 3.525c.34.34.798.528 1.27.528.47 0 .928-.188 1.27-.528l2.028-2.027a1.796 1.796 0 0 1 2.54 0c.7.7.7 1.84 0 2.54l-2.028 2.027a1.795 1.795 0 0 1-1.27.53c-.47 0-.93-.19-1.27-.53l-1.05-1.05c-.06-.06-.136-.09-.213-.09s.154-.03-.213-.09l-4.223 2.152c-1.428.73-3.033 1.15-4.708 1.15l-2.91 1.593a.633.633 0 0 1-.803.285ZM13.442 4.986c0 2.705-2.22 4.9-4.95 4.9s-4.95-2.195-4.95-4.9c0-2.705 2.22-4.9 4.95-4.9s4.95 2.195 4.95 4.9Z" fill="#635bff"></path></svg>
                                        <span>Stripe</span>
                                    </CardTitle>
                                </div>
                                {selectedStore?.stripeStatus === 'connected' ? (
                                    <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100/90">
                                        <CheckCircle className="mr-1 h-3 w-3" /> Connecté
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">Non connecté</Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                {selectedStore?.stripeStatus === 'connected' ? (
                                    <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
                                        Cette boutique est correctement connectée à Stripe.
                                    </div>
                                ) : (
                                    <Button onClick={handleStripeConnect}>
                                        <LinkIcon className="mr-2 h-4 w-4" />
                                        Connecter avec Stripe
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsConnectionsDialogOpen(false)}>Fermer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
