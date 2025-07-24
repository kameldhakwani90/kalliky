
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Clock, Upload, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

type Store = {
    id: number;
    name: string;
    address: string;
    phone: string;
    status: 'active' | 'inactive';
};

const initialStores: Store[] = [
    { id: 1, name: "Le Gourmet Parisien - Centre", address: "12 Rue de la Paix, 75002 Paris", phone: "01 23 45 67 89", status: 'active' },
    { id: 2, name: "Le Gourmet Parisien - Montmartre", address: "5 Place du Tertre, 75018 Paris", phone: "01 98 76 54 32", status: 'active' },
    { id: 3, name: "Pizzeria Bella - Bastille", address: "3 Rue de la Roquette, 75011 Paris", phone: "01 44 55 66 77", status: 'inactive' },
];

const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];


export default function StoresPage() {
    const [stores, setStores] = useState<Store[]>(initialStores);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    const handleOpenDialog = (store: Store | null = null) => {
        setSelectedStore(store);
        setIsDialogOpen(true);
    };

    const handleSaveStore = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const storeData = {
            id: selectedStore ? selectedStore.id : Date.now(),
            name: formData.get('name') as string,
            address: formData.get('address') as string,
            phone: formData.get('phone') as string,
            status: selectedStore?.status || 'active', // keep status on edit
        } as Store;

        if (selectedStore) {
            setStores(stores.map(s => s.id === storeData.id ? storeData : s));
        } else {
            setStores([...stores, storeData]);
        }
        setIsDialogOpen(false);
    };

    const toggleStoreStatus = (id: number) => {
        setStores(stores.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s));
    };

    const deleteStore = (id: number) => {
        setStores(stores.filter(s => s.id !== id));
    };


    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Boutiques</h1>
                    <p className="text-muted-foreground">Gérez vos points de vente et les menus associés.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
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
                                        <Badge variant={store.status === 'active' ? 'default' : 'secondary'} className={store.status === 'active' ? 'bg-green-500/20 text-green-700' : ''}>
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
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(store)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Modifier
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => deleteStore(store.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Supprimer
                                                    </DropdownMenuItem>
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                            <Button type="submit">Enregistrer la boutique</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
