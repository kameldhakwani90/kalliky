
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { PlusCircle, Utensils, CalendarCheck, MoreHorizontal, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/language-context';

type ServiceType = 'products' | 'reservations';

type Service = {
  id: string;
  storeId: string;
  name: string;
  description: string;
  type: ServiceType;
};

const availableStores = [
    { id: "store-1", name: "Le Gourmet Parisien - Centre" },
    { id: "store-2", name: "Le Gourmet Parisien - Montmartre"},
    { id: "store-3", name: "Pizzeria Bella - Bastille" },
];

const initialServices: Service[] = [
    { id: 'service-1', storeId: 'store-1', name: 'Restauration sur place', description: 'Le catalogue de tous les produits servis à table.', type: 'products' },
    { id: 'service-2', storeId: 'store-1', name: 'Vente à emporter', description: 'Le catalogue des produits disponibles à la vente à emporter.', type: 'products' },
    { id: 'service-3', storeId: 'store-2', name: 'Location de la salle de réception', description: 'Service de réservation pour les événements privés.', type: 'reservations' },
];

export default function ServicesPage() {
    const { t } = useLanguage();
    const [services, setServices] = useState<Service[]>(initialServices);
    const [selectedStore, setSelectedStore] = useState<string>(availableStores[0]?.id || 'all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editedService, setEditedService] = useState<Partial<Service> | null>(null);

    const handleOpenDialog = (service: Service | null = null) => {
        const newService: Partial<Service> = service ? {...service} : { storeId: selectedStore, type: 'products' };
        setEditedService(newService);
        setIsDialogOpen(true);
    };

    const handleSaveService = () => {
        if (!editedService?.name || !editedService.storeId) return;
        const finalService: Service = {
            id: editedService.id || `service-${Date.now()}`,
            name: editedService.name,
            description: editedService.description || '',
            storeId: editedService.storeId,
            type: editedService.type || 'products',
        };

        setServices(prev => {
            const exists = prev.some(s => s.id === finalService.id);
            if (exists) {
                return prev.map(s => s.id === finalService.id ? finalService : s);
            }
            return [...prev, finalService];
        });
        setIsDialogOpen(false);
        setEditedService(null);
    };

    const handleDeleteService = (serviceId: string) => {
        setServices(prev => prev.filter(s => s.id !== serviceId));
    };

    const filteredServices = services.filter(service => selectedStore === 'all' || service.storeId === selectedStore);

    const translations = {
        title: { fr: "Mes Services", en: "My Services" },
        description: { fr: "Définissez les différentes offres de votre commerce : catalogues de produits, services de réservation, etc.", en: "Define your business's various offerings: product catalogs, reservation services, etc." },
        selectStore: { fr: "Sélectionner une boutique", en: "Select a store" },
        allStores: { fr: "Toutes les boutiques", en: "All stores" },
        createService: { fr: "Créer un service", en: "Create a service" },
        manageCatalog: { fr: "Gérer le catalogue", en: "Manage Catalog" },
        manageReservations: { fr: "Gérer les réservations", en: "Manage Reservations" },
        products: { fr: "Produits", en: "Products" },
        reservations: { fr: "Réservations", en: "Reservations" },
        delete: { fr: "Supprimer", en: "Delete" },
        edit: { fr: "Modifier", en: "Edit" },
        confirmDelete: { fr: "Êtes-vous sûr de vouloir supprimer ce service ?", en: "Are you sure you want to delete this service?" },
        irreversible: { fr: "Cette action est irréversible et supprimera tout le catalogue associé.", en: "This action is irreversible and will delete the entire associated catalog." },
        cancel: { fr: "Annuler", en: "Cancel" },
        save: { fr: "Enregistrer", en: "Save" },
        newServiceTitle: { fr: "Créer un nouveau service", en: "Create a new service" },
        editServiceTitle: { fr: "Modifier le service", en: "Edit the service" },
        serviceName: { fr: "Nom du service", en: "Service name" },
        serviceDesc: { fr: "Description (facultatif)", en: "Description (optional)" },
        serviceType: { fr: "Type de service", en: "Service type" },
        productManagement: { fr: "Gestion de produits (stock, prix, etc.)", en: "Product management (stock, prices, etc.)" },
        reservationManagement: { fr: "Gestion de réservations (calendrier, disponibilités)", en: "Reservation management (calendar, availability)" },
        noServices: { fr: "Aucun service défini pour cette boutique.", en: "No services defined for this store." },
        createFirstService: { fr: "Créez votre premier service pour commencer.", en: "Create your first service to get started." },
    };

    const serviceIcons: Record<ServiceType, React.ElementType> = {
        products: Utensils,
        reservations: CalendarCheck,
    };
    
    return(
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">{t(translations.title)}</h1>
                <p className="text-muted-foreground">{t(translations.description)}</p>
            </header>

            <div className="flex items-center justify-between">
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                    <SelectTrigger className="w-72">
                        <SelectValue placeholder={t(translations.selectStore)} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t(translations.allStores)}</SelectItem>
                        {availableStores.map(store => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button onClick={() => handleOpenDialog()} disabled={selectedStore === 'all'}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t(translations.createService)}
                </Button>
            </div>
            
            {filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map(service => {
                        const Icon = serviceIcons[service.type];
                        return (
                            <Card key={service.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-6 w-6 text-primary" />
                                            <CardTitle className="text-xl">{service.name}</CardTitle>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenDialog(service)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> {t(translations.edit)}
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />{t(translations.delete)}
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t(translations.confirmDelete)}</AlertDialogTitle>
                                                            <AlertDialogDescription>{t(translations.irreversible)}</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t(translations.cancel)}</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteService(service.id)}>{t(translations.delete)}</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <Badge variant="outline" className="mt-2 w-fit">
                                        {service.type === 'products' ? t(translations.products) : t(translations.reservations)}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <CardDescription>{service.description}</CardDescription>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href={`/restaurant/services/${service.id}`}>
                                            {service.type === 'products' ? t(translations.manageCatalog) : t(translations.manageReservations)}
                                            <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="text-center py-12">
                    <CardContent>
                        <h3 className="text-lg font-semibold">{t(translations.noServices)}</h3>
                        <p className="text-muted-foreground mt-2">{t(translations.createFirstService)}</p>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editedService?.id ? t(translations.editServiceTitle) : t(translations.newServiceTitle)}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="service-name">{t(translations.serviceName)}</Label>
                            <Input
                                id="service-name"
                                value={editedService?.name || ''}
                                onChange={(e) => setEditedService(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="service-desc">{t(translations.serviceDesc)}</Label>
                            <Textarea
                                id="service-desc"
                                value={editedService?.description || ''}
                                onChange={(e) => setEditedService(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="service-type">{t(translations.serviceType)}</Label>
                            <Select
                                value={editedService?.type || 'products'}
                                onValueChange={(value: ServiceType) => setEditedService(prev => ({ ...prev, type: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="products">
                                        <div className="flex flex-col">
                                            <span>{t(translations.products)}</span>
                                            <span className="text-xs text-muted-foreground">{t(translations.productManagement)}</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="reservations">
                                        <div className="flex flex-col">
                                            <span>{t(translations.reservations)}</span>
                                            <span className="text-xs text-muted-foreground">{t(translations.reservationManagement)}</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t(translations.cancel)}</Button>
                        <Button onClick={handleSaveService}>{t(translations.save)}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    