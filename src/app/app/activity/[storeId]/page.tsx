

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, BrainCircuit, Calendar as CalendarIcon, Car, ConciergeBell, Eye, Phone, Receipt, Search, Sparkles, User, Utensils, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

type ServiceType = 'products' | 'reservations' | 'consultation';

type Store = {
    id: string;
    name: string;
    address: string;
    serviceType: ServiceType;
};

const initialStores: Store[] = [
    { id: "store-1", name: "Le Gourmet Parisien - Centre", address: "12 Rue de la Paix, 75002 Paris", serviceType: 'products' },
    { id: "store-loc", name: "Prestige Cars - Location", address: "25 Avenue Montaigne, 75008 Paris", serviceType: 'reservations' },
    { id: "store-4", name: "Cabinet d'Avocats", address: "1 Avenue des Champs-Élysées, 75008 Paris", serviceType: 'consultation' },
    { id: "store-spa", name: "Spa & Bien-être 'Zen'", address: "7 Rue du Faubourg Saint-Honoré, 75008 Paris", serviceType: 'reservations' },
];

type ActivityType = 'Commande' | 'Réservation' | 'Consultation';

type ActivityLog = {
    id: string;
    type: ActivityType;
    customer: string;
    customerId: string;
    phone: string;
    date: Date;
    amount: string;
};

const mockActivities: Record<string, ActivityLog[]> = {
    "store-1": Array.from({ length: 25 }, (_, i) => ({ id: `#${1025 - i}`, type: 'Commande', customer: `Alice Martin ${i}`, customerId: `cust-${i+1}`, phone: `06123456${78-i}`, date: new Date(2024, 4, 30 - Math.floor(i/2)), amount: `${(24.50 + i * 2).toFixed(2)}€` })),
    "store-loc": Array.from({ length: 8 }, (_, i) => ({ id: `#R${87 - i}`, type: 'Réservation', customer: `Carlos Sainz ${i}`, customerId: `cust-${30+i}`, phone: `06112233${44-i}`, date: new Date(2024, 4, 30 - i*2), amount: `${(1900 - i * 150).toFixed(2)}€` })),
    "store-4": Array.from({ length: 12 }, (_, i) => ({ id: `#C${12 - i}`, type: 'Consultation', customer: `Mme. Lefevre ${i}`, customerId: `cust-${40+i}`, phone: `01234567${89-i}`, date: new Date(2024, 4, 30 - i*3), amount: 'N/A' })),
    "store-spa": Array.from({ length: 5 }, (_, i) => ({ id: `#S${33-i}`, type: 'Réservation', customer: `Claire Chazal ${i}`, customerId: `cust-${55+i}`, phone: `07556677${88-i}`, date: new Date(2024, 4, 30 - i*5), amount: `${(250 + i * 10).toFixed(2)}€` })),
};

const serviceTypeInfo: Record<ServiceType, { icon: React.ElementType, label: Record<'fr'|'en', string>, activityLabel: ActivityType }> = {
    products: { icon: Utensils, label: { fr: 'Vente de Produits', en: 'Product Sales' }, activityLabel: 'Commande' },
    reservations: { icon: ConciergeBell, label: { fr: 'Réservations', en: 'Reservations' }, activityLabel: 'Réservation' },
    consultation: { icon: BrainCircuit, label: { fr: 'Consultations', en: 'Consultations' }, activityLabel: 'Consultation' },
};

const getServiceIcon = (serviceType: ServiceType, storeName: string) => {
    if (storeName.toLowerCase().includes('car') || storeName.toLowerCase().includes('location')) return Car;
    if (storeName.toLowerCase().includes('spa')) return Sparkles;
    return serviceTypeInfo[serviceType].icon;
};

const ITEMS_PER_PAGE = 10;

export default function StoreActivityPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const storeId = params.storeId as string;
    const [store, setStore] = useState<Store | null>(null);
    const [storeLoading, setStoreLoading] = useState(true);
    
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalActivities, setTotalActivities] = useState(0);

    const translations = {
        back: { fr: "Retour à la sélection", en: "Back to selection" },
        activityTitle: { fr: "Activité de la boutique", en: "Store Activity" },
        requestsList: { fr: "Liste des dernières demandes.", en: "List of the latest requests." },
        type: { fr: "Type", en: "Type" },
        customer: { fr: "Client", en: "Customer" },
        date: { fr: "Date", en: "Date" },
        amount: { fr: "Montant", en: "Amount" },
        actions: { fr: "Actions", en: "Actions" },
        view: { fr: "Voir", en: "View" },
        searchPlaceholder: { fr: "Rechercher...", en: "Search..." },
        chooseDate: { fr: "Filtrer par date", en: "Filter by date" },
        previous: { fr: "Précédent", en: "Previous" },
        next: { fr: "Suivant", en: "Next" },
        pageOf: { fr: "Page {current} sur {total}", en: "Page {current} of {total}" },
    };

    // Charger les informations du store
    useEffect(() => {
        const fetchStore = async () => {
            try {
                setStoreLoading(true);
                const response = await fetch('/api/restaurant/activities');
                if (response.ok) {
                    const data = await response.json();
                    // Trouver le store dans les données de l'API
                    if (Array.isArray(data)) {
                        for (const business of data) {
                            if (business.stores && Array.isArray(business.stores)) {
                                const foundStore = business.stores.find((s: any) => s.id === storeId);
                                if (foundStore) {
                                    let settings: any = {};
                                    try {
                                        settings = foundStore.settings ? 
                                            (typeof foundStore.settings === 'string' ? JSON.parse(foundStore.settings) : foundStore.settings) 
                                            : {};
                                    } catch (e) {
                                        settings = {};
                                    }
                                    
                                    setStore({
                                        id: foundStore.id,
                                        name: business.name || foundStore.name || 'Boutique',
                                        address: foundStore.address || 'Adresse non définie',
                                        serviceType: settings.serviceType || 'products'
                                    });
                                    break;
                                }
                            }
                        }
                    }
                }
                
                // Si pas trouvé dans l'API, utiliser les données mockées
                if (!store) {
                    const mockStore = initialStores.find(s => s.id === storeId);
                    if (mockStore) {
                        setStore(mockStore);
                    }
                }
            } catch (error) {
                console.error('Error fetching store:', error);
                // Fallback vers les données mockées
                const mockStore = initialStores.find(s => s.id === storeId);
                if (mockStore) {
                    setStore(mockStore);
                }
            } finally {
                setStoreLoading(false);
            }
        };
        
        fetchStore();
    }, [storeId]);

    const totalPages = Math.ceil(totalActivities / ITEMS_PER_PAGE);

    // Charger les activités depuis l'API
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: ITEMS_PER_PAGE.toString()
                });
                
                if (date) {
                    params.append('date', format(date, 'yyyy-MM-dd'));
                }
                
                if (searchTerm) {
                    params.append('search', searchTerm);
                }
                
                const response = await fetch(`/api/restaurant/activities/${storeId}?${params}`);
                
                if (!response.ok) {
                    // En cas d'erreur, utiliser les données mockées pour ce store
                    console.warn('API activities non disponible, utilisation des données mockées');
                    const mockData = mockActivities[storeId] || [];
                    
                    const transformedActivities: ActivityLog[] = mockData.map((activity: any, index: number) => ({
                        id: activity.id || `mock-${index}`,
                        type: activity.type,
                        customer: activity.customer,
                        customerId: activity.customerId,
                        phone: activity.phone,
                        date: activity.date,
                        amount: activity.amount
                    }));
                    
                    setActivities(transformedActivities);
                    setTotalActivities(mockData.length);
                    setLoading(false);
                    return;
                }
                
                const data = await response.json();
                
                const transformedActivities: ActivityLog[] = data.activities.map((activity: any, index: number) => ({
                    id: activity.orderNumber || activity.id || `activity-${index}`,
                    type: activity.type === 'ORDER' ? 'Commande' as ActivityType : 
                          activity.type === 'RESERVATION' ? 'Réservation' as ActivityType : 
                          'Consultation' as ActivityType,
                    customer: activity.customerName || 'Client Anonyme',
                    customerId: activity.customerId,
                    phone: activity.phone || 'N/A',
                    date: new Date(activity.createdAt),
                    amount: activity.amount || 'N/A'
                }));
                
                setActivities(transformedActivities);
                setTotalActivities(data.pagination.total);
                
            } catch (error: any) {
                console.error('Error fetching activities:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (storeId) {
            fetchActivities();
        }
    }, [storeId, currentPage, date, searchTerm]);


    if (storeLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Chargement...</span>
                </div>
            </div>
        );
    }

    if (!store) {
        return <div>Boutique non trouvée.</div>;
    }

    if (loading) {
        return (
            <div className="space-y-8">
                <header className="mb-4">
                    <Button variant="ghost" onClick={() => router.push('/app/activity')} className="-ml-4 mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t(translations.back)}
                    </Button>
                    <div className="flex items-center gap-4">
                        <Utensils className="h-8 w-8"/>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{t(translations.activityTitle)}: {store?.name || 'Boutique'}</h1>
                            <p className="text-muted-foreground">{t(translations.requestsList)}</p>
                        </div>
                    </div>
                </header>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Chargement des activités...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-8">
                <header className="mb-4">
                    <Button variant="ghost" onClick={() => router.push('/app/activity')} className="-ml-4 mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t(translations.back)}
                    </Button>
                    <div className="flex items-center gap-4">
                        <Utensils className="h-8 w-8"/>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{t(translations.activityTitle)}: {store?.name || 'Boutique'}</h1>
                            <p className="text-muted-foreground">{t(translations.requestsList)}</p>
                        </div>
                    </div>
                </header>
                <div className="text-center py-12">
                    <p className="text-red-500">Erreur: {error}</p>
                    <Button className="mt-4" onClick={() => window.location.reload()}>
                        Réessayer
                    </Button>
                </div>
            </div>
        );
    }

    const Icon = getServiceIcon(store.serviceType, store.name);

    return (
        <div className="space-y-8">
             <header className="mb-4">
                <Button variant="ghost" onClick={() => router.push('/app/activity')} className="-ml-4 mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t(translations.back)}
                </Button>
                <div className="flex items-center gap-4">
                    <Icon className="h-8 w-8"/>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t(translations.activityTitle)}: {store.name}</h1>
                        <p className="text-muted-foreground">{t(translations.requestsList)}</p>
                    </div>
                </div>
             </header>

             <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle>Dernières activités</CardTitle>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                           <div className="relative flex-1 w-full">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input placeholder={t(translations.searchPlaceholder)} className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                           </div>
                           <Popover>
                               <PopoverTrigger asChild>
                                   <Button variant={"outline"} className="w-full sm:w-[240px] justify-start text-left font-normal">
                                       <CalendarIcon className="mr-2 h-4 w-4" />
                                       {date ? format(date, "PPP") : <span>{t(translations.chooseDate)}</span>}
                                   </Button>
                               </PopoverTrigger>
                               <PopoverContent className="w-auto p-0" align="start">
                                   <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                               </PopoverContent>
                           </Popover>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Demande</TableHead>
                                    <TableHead>{t(translations.customer)}</TableHead>
                                    <TableHead className="hidden sm:table-cell">{t(translations.date)}</TableHead>
                                    <TableHead className="hidden md:table-cell">{t(translations.amount)}</TableHead>
                                    <TableHead className="text-right">{t(translations.actions)}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <p className="text-muted-foreground">Aucune activité trouvée</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activities.map((activity) => (
                                        <TableRow key={activity.id}>
                                        <TableCell>
                                            <p className="font-mono text-sm">{activity.id}</p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">{activity.customer}</p>
                                            <p className="text-xs text-muted-foreground">{activity.phone}</p>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            {activity.date && !isNaN(new Date(activity.date).getTime()) 
                                                ? format(new Date(activity.date), "dd/MM/yyyy HH:mm")
                                                : 'Date invalide'
                                            }
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{activity.amount}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={(e) => {
                                                e.stopPropagation();
                                                const url = `/app/clients/${activity.customerId}?historyId=${encodeURIComponent(activity.id)}`;
                                                router.push(url);
                                            }}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                {t(translations.view)}
                                            </Button>
                                        </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                 <CardFooter>
                    <div className="flex items-center justify-between w-full">
                        <div className="text-xs text-muted-foreground">
                            {t(translations.pageOf).replace('{current}', currentPage.toString()).replace('{total}', totalPages.toString())}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                {t(translations.previous)}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                {t(translations.next)}
                            </Button>
                        </div>
                    </div>
                </CardFooter>
             </Card>

        </div>
    );
}
