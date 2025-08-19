
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Utensils, ConciergeBell, BrainCircuit, Car, Sparkles, Loader2, Filter, Eye, Phone, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type ServiceType = 'products' | 'reservations' | 'consultation';

type Store = {
    id: string;
    name: string;
    address: string;
    serviceType: ServiceType;
};

type ActivityItem = {
    id: string;
    type: 'ORDER' | 'SERVICE' | 'CONSULTATION' | 'SIGNALEMENT';
    entityId: string;
    status: string;
    title: string;
    description: string;
    urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    createdAt: string;
    metadata?: any;
    store?: {
        id: string;
        name: string;
    };
};

const serviceTypeInfo: Record<ServiceType, { icon: React.ElementType, label: Record<'fr'|'en', string> }> = {
    products: { icon: Utensils, label: { fr: 'Vente de Produits', en: 'Product Sales' } },
    reservations: { icon: ConciergeBell, label: { fr: 'Réservations', en: 'Reservations' } },
    consultation: { icon: BrainCircuit, label: { fr: 'Consultations', en: 'Consultations' } },
};


const getServiceIcon = (serviceType: ServiceType, storeName: string) => {
    if (storeName.toLowerCase().includes('car') || storeName.toLowerCase().includes('location')) {
        return Car;
    }
    if (storeName.toLowerCase().includes('spa')) {
        return Sparkles;
    }
    return serviceTypeInfo[serviceType].icon;
};


export default function ActivityPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [stores, setStores] = useState<Store[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStore, setSelectedStore] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');

    const translations = {
        pageTitle: { fr: "Activité globale", en: "Global Activity" },
        description: { fr: "Toutes les activités de vos boutiques en temps réel.", en: "All activities from your stores in real-time." },
        loading: { fr: "Chargement...", en: "Loading..." },
        noActivities: { fr: "Aucune activité récente", en: "No recent activity" },
        error: { fr: "Erreur lors du chargement", en: "Error loading" },
        filterAllStores: { fr: "Toutes les boutiques", en: "All stores" },
        filterAllTypes: { fr: "Tous les types", en: "All types" },
        typeOrder: { fr: "Commande", en: "Order" },
        typeService: { fr: "Service", en: "Service" },
        typeConsultation: { fr: "Consultation", en: "Consultation" },
        typeSignalement: { fr: "Signalement", en: "Report" },
        store: { fr: "Boutique", en: "Store" },
        type: { fr: "Type", en: "Type" },
        status: { fr: "Statut", en: "Status" },
        title: { fr: "Titre", en: "Title" },
        urgency: { fr: "Urgence", en: "Urgency" },
        date: { fr: "Date", en: "Date" },
        actions: { fr: "Actions", en: "Actions" },
        viewDetails: { fr: "Voir détails", en: "View details" },
    };

    // Charger les activités de toutes les boutiques
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/restaurant/activities');
                
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des activités');
                }
                
                const data = await response.json();
                
                // L'API retourne maintenant { stores, activities }
                const transformedStores: Store[] = data.stores || [];
                const allActivities: ActivityItem[] = data.activities || [];
                
                // Trier les activités par date (plus récentes en premier)
                allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                console.log('Stores transformés:', transformedStores);
                console.log('Activités chargées:', allActivities.length);
                
                setStores(transformedStores);
                setActivities(allActivities);
                setFilteredActivities(allActivities);
                
            } catch (error: any) {
                console.error('Error fetching activities:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    // Filtrer les activités par boutique et type
    useEffect(() => {
        let filtered = activities;
        
        // Filtrer par boutique
        if (selectedStore !== 'all') {
            filtered = filtered.filter(activity => activity.store?.id === selectedStore);
        }
        
        // Filtrer par type
        if (selectedType !== 'all') {
            filtered = filtered.filter(activity => activity.type === selectedType);
        }
        
        setFilteredActivities(filtered);
    }, [activities, selectedStore, selectedType]);

    const getActivityTypeLabel = (type: string) => {
        switch (type) {
            case 'ORDER': return t(translations.typeOrder);
            case 'SERVICE': return t(translations.typeService);
            case 'CONSULTATION': return t(translations.typeConsultation);
            case 'SIGNALEMENT': return t(translations.typeSignalement);
            default: return type;
        }
    };

    const getUrgencyColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'bg-gray-100 text-gray-800';
            case 'NORMAL': return 'bg-blue-100 text-blue-800';
            case 'HIGH': return 'bg-orange-100 text-orange-800';
            case 'URGENT': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleViewDetails = (activityId: string) => {
        const activity = filteredActivities.find(a => a.id === activityId);
        if (activity) {
            // Rediriger vers la page ticket avec les bons paramètres
            // On utilise l'entityId comme ticketId et on récupère le customerId depuis metadata
            const customerId = activity.metadata?.customerId || activity.entityId;
            router.push(`/restaurant/ticket/${activity.entityId}?customerId=${customerId}&from=activity`);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900">{t(translations.pageTitle)}</h1>
                        <p className="text-muted-foreground text-lg">{t(translations.description)}</p>
                    </div>
                </header>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">{t(translations.loading)}</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-8">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900">{t(translations.pageTitle)}</h1>
                        <p className="text-muted-foreground text-lg">{t(translations.description)}</p>
                    </div>
                </header>
                <div className="text-center py-12">
                    <p className="text-red-500">{t(translations.error)}: {error}</p>
                </div>
            </div>
        );
    }

    if (stores.length === 0) {
        return (
            <div className="space-y-8">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900">{t(translations.pageTitle)}</h1>
                        <p className="text-muted-foreground text-lg">{t(translations.description)}</p>
                    </div>
                </header>
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">{t(translations.noStores)}</p>
                    <Button onClick={() => router.push('/restaurant/stores?action=new')} className="rounded-xl">
                        {t(translations.createFirstStore)}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">{t(translations.title)}</h1>
                    <p className="text-muted-foreground text-lg">{t(translations.description)}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={selectedStore} onValueChange={setSelectedStore}>
                            <SelectTrigger className="w-[200px] rounded-xl border-gray-300">
                                <SelectValue placeholder="Filtrer par boutique" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t(translations.filterAllStores)}</SelectItem>
                                {stores.map((store) => (
                                    <SelectItem key={store.id} value={store.id}>
                                        {store.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filtrer par type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t(translations.filterAllTypes)}</SelectItem>
                                <SelectItem value="ORDER">{t(translations.typeOrder)}</SelectItem>
                                <SelectItem value="SERVICE">{t(translations.typeService)}</SelectItem>
                                <SelectItem value="CONSULTATION">{t(translations.typeConsultation)}</SelectItem>
                                <SelectItem value="SIGNALEMENT">{t(translations.typeSignalement)}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </header>

            {filteredActivities.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">{t(translations.noActivities)}</p>
                    {(selectedStore !== 'all' || selectedType !== 'all') && (
                        <div className="flex gap-2 justify-center">
                            <Button variant="outline" onClick={() => setSelectedStore('all')} className="rounded-xl border-gray-300">
                                Toutes les boutiques
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedType('all')} className="rounded-xl border-gray-300">
                                Tous les types
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <Card className="glass-effect shadow-apple rounded-2xl border-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t(translations.store)}</TableHead>
                                <TableHead>{t(translations.type)}</TableHead>
                                <TableHead>{t(translations.status)}</TableHead>
                                <TableHead>{t(translations.title)}</TableHead>
                                <TableHead>{t(translations.urgency)}</TableHead>
                                <TableHead>{t(translations.date)}</TableHead>
                                <TableHead>{t(translations.actions)}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredActivities.map((activity) => (
                                <TableRow key={activity.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                                            <span className="font-medium">{activity.store?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {activity.type === 'ORDER' && <Phone className="mr-1 h-3 w-3" />}
                                            {activity.type === 'SERVICE' && <ConciergeBell className="mr-1 h-3 w-3" />}
                                            {activity.type === 'CONSULTATION' && <BrainCircuit className="mr-1 h-3 w-3" />}
                                            {activity.type === 'SIGNALEMENT' && <MessageSquare className="mr-1 h-3 w-3" />}
                                            {getActivityTypeLabel(activity.type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={activity.status === 'NEW' ? 'default' : 'secondary'}>
                                            {activity.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{activity.title}</p>
                                            {activity.description && (
                                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                    {activity.description}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getUrgencyColor(activity.urgencyLevel)}>
                                            {activity.urgencyLevel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.createdAt), { 
                                                addSuffix: true, 
                                                locale: fr 
                                            })}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDetails(activity.id)}
                                            className="rounded-xl hover:bg-gray-100"
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">{t(translations.viewDetails)}</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}

