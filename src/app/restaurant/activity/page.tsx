
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { BookOpen, Utensils, ConciergeBell, BrainCircuit, Car, Sparkles, Loader2, Filter, Eye, Phone, MessageSquare, FileText, Edit3 } from 'lucide-react';
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
    type: 'ORDER' | 'RESERVATION' | 'CONSULTATION' | 'CALL' | 'VISIT' | 'COMPLAINT' | 'PAYMENT';
    entityId: string;
    customerId?: string;
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
    customer?: {
        id: string;
        firstName?: string;
        lastName?: string;
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
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const translations = {
        pageTitle: { fr: "Activité globale", en: "Global Activity" },
        description: { fr: "Toutes les activités de vos boutiques en temps réel.", en: "All activities from your stores in real-time." },
        loading: { fr: "Chargement...", en: "Loading..." },
        noActivities: { fr: "Aucune activité récente", en: "No recent activity" },
        error: { fr: "Erreur lors du chargement", en: "Error loading" },
        filterAllStores: { fr: "Toutes les boutiques", en: "All stores" },
        filterAllTypes: { fr: "Tous les types", en: "All types" },
        typeOrder: { fr: "Commande", en: "Order" },
        typeReservation: { fr: "Réservation", en: "Reservation" },
        typeConsultation: { fr: "Consultation", en: "Consultation" },
        typeCall: { fr: "Appel", en: "Call" },
        typeVisit: { fr: "Visite", en: "Visit" },
        typeComplaint: { fr: "Réclamation", en: "Complaint" },
        typePayment: { fr: "Paiement", en: "Payment" },
        store: { fr: "Boutique", en: "Store" },
        type: { fr: "Type", en: "Type" },
        status: { fr: "Statut", en: "Status" },
        title: { fr: "Titre", en: "Title" },
        urgency: { fr: "Urgence", en: "Urgency" },
        date: { fr: "Date", en: "Date" },
        actions: { fr: "Actions", en: "Actions" },
        viewDetails: { fr: "Voir détails", en: "View details" },
        quickView: { fr: "Aperçu rapide", en: "Quick view" },
        statusChange: { fr: "Changer statut", en: "Change status" },
        updateStatus: { fr: "Mettre à jour le statut", en: "Update status" },
        statusPending: { fr: "En attente", en: "Pending" },
        statusInProgress: { fr: "En cours", en: "In Progress" },
        statusCompleted: { fr: "Terminé", en: "Completed" },
        statusCancelled: { fr: "Annulé", en: "Cancelled" },
        save: { fr: "Enregistrer", en: "Save" },
        cancel: { fr: "Annuler", en: "Cancel" },
        activityDetails: { fr: "Détails de l'activité", en: "Activity Details" },
        customer: { fr: "Client", en: "Customer" },
        amount: { fr: "Montant", en: "Amount" },
        description: { fr: "Description", en: "Description" },
        noStores: { fr: "Aucune boutique configurée", en: "No stores configured" },
        createFirstStore: { fr: "Créer ma première boutique", en: "Create my first store" },
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
            case 'RESERVATION': return t(translations.typeReservation);
            case 'CONSULTATION': return t(translations.typeConsultation);
            case 'CALL': return t(translations.typeCall);
            case 'VISIT': return t(translations.typeVisit);
            case 'COMPLAINT': return t(translations.typeComplaint);
            case 'PAYMENT': return t(translations.typePayment);
            default: return type;
        }
    };

    const getUrgencyColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'bg-gray-500/20 text-gray-300';
            case 'NORMAL': return 'bg-blue-500/20 text-blue-400';
            case 'HIGH': return 'bg-orange-500/20 text-orange-400';
            case 'URGENT': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-300';
        }
    };

    const handleViewDetails = (activityId: string) => {
        const activity = filteredActivities.find(a => a.id === activityId);
        if (activity) {
            // Rediriger vers la page ticket avec les bons paramètres
            // On utilise l'entityId comme ticketId et le customerId réel de l'activity
            const customerId = activity.metadata?.customerId || activity.customerId || activity.entityId;
            router.push(`/restaurant/tickets/${activity.entityId}?customerId=${customerId}&from=activity`);
        }
    };

    const handleQuickView = (activity: ActivityItem) => {
        setSelectedActivity(activity);
        setIsPopupOpen(true);
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedActivity) return;
        
        setUpdatingStatus(true);
        try {
            const response = await fetch(`/api/restaurant/activity-status/${selectedActivity.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Mettre à jour l'activité dans la liste locale
                setActivities(prev => prev.map(activity => 
                    activity.id === selectedActivity.id 
                        ? { ...activity, status: newStatus }
                        : activity
                ));
                setIsPopupOpen(false);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
            case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
            case 'COMPLETED': return 'bg-green-500/20 text-green-400 border-green-400/30';
            case 'CANCELLED': return 'bg-red-500/20 text-red-400 border-red-400/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return t(translations.statusPending);
            case 'IN_PROGRESS': return t(translations.statusInProgress);
            case 'COMPLETED': return t(translations.statusCompleted);
            case 'CANCELLED': return t(translations.statusCancelled);
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
                </div>
                <div className="container mx-auto px-4 py-6 space-y-8 relative z-10">
                    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">{t(translations.pageTitle)}</h1>
                            <p className="text-gray-400 text-lg">{t(translations.description)}</p>
                        </div>
                    </header>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                        <span className="ml-2 text-white">{t(translations.loading)}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
                </div>
                <div className="container mx-auto px-4 py-6 space-y-8 relative z-10">
                    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">{t(translations.pageTitle)}</h1>
                            <p className="text-gray-400 text-lg">{t(translations.description)}</p>
                        </div>
                    </header>
                    <div className="text-center py-12">
                        <p className="text-red-400">{t(translations.error)}: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (stores.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
                </div>
                <div className="container mx-auto px-4 py-6 space-y-8 relative z-10">
                    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">{t(translations.pageTitle)}</h1>
                            <p className="text-gray-400 text-lg">{t(translations.description)}</p>
                        </div>
                    </header>
                    <div className="text-center py-12">
                        <p className="text-gray-400 mb-4">{t(translations.noStores)}</p>
                        <Button onClick={() => router.push('/restaurant/stores?action=new')} className="bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-2xl">
                            {t(translations.createFirstStore)}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="container mx-auto px-4 py-6 space-y-8 relative z-10"
            >
                <motion.header variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">{t(translations.pageTitle)}</h1>
                        <p className="text-gray-400 text-lg">{t(translations.description)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <Select value={selectedStore} onValueChange={setSelectedStore}>
                                <SelectTrigger className="w-[200px] rounded-2xl bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="Filtrer par boutique" />
                                </SelectTrigger>
                                <SelectContent className="bg-black/95 backdrop-blur-xl border-white/20">
                                    <SelectItem value="all" className="text-white hover:bg-white/10">{t(translations.filterAllStores)}</SelectItem>
                                    {stores.map((store) => (
                                        <SelectItem key={store.id} value={store.id} className="text-white hover:bg-white/10">
                                            {store.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="w-[180px] rounded-2xl bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="Filtrer par type" />
                                </SelectTrigger>
                                <SelectContent className="bg-black/95 backdrop-blur-xl border-white/20">
                                    <SelectItem value="all" className="text-white hover:bg-white/10">{t(translations.filterAllTypes)}</SelectItem>
                                    <SelectItem value="ORDER" className="text-white hover:bg-white/10">{t(translations.typeOrder)}</SelectItem>
                                    <SelectItem value="RESERVATION" className="text-white hover:bg-white/10">{t(translations.typeReservation)}</SelectItem>
                                    <SelectItem value="CONSULTATION" className="text-white hover:bg-white/10">{t(translations.typeConsultation)}</SelectItem>
                                    <SelectItem value="CALL" className="text-white hover:bg-white/10">{t(translations.typeCall)}</SelectItem>
                                    <SelectItem value="VISIT" className="text-white hover:bg-white/10">{t(translations.typeVisit)}</SelectItem>
                                    <SelectItem value="COMPLAINT" className="text-white hover:bg-white/10">{t(translations.typeComplaint)}</SelectItem>
                                    <SelectItem value="PAYMENT" className="text-white hover:bg-white/10">{t(translations.typePayment)}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </motion.header>

                {filteredActivities.length === 0 ? (
                    <motion.div variants={itemVariants} className="text-center py-12">
                        <p className="text-gray-400 mb-4">{t(translations.noActivities)}</p>
                        {(selectedStore !== 'all' || selectedType !== 'all') && (
                            <div className="flex gap-2 justify-center">
                                <Button variant="outline" onClick={() => setSelectedStore('all')} className="rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20">
                                    Toutes les boutiques
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedType('all')} className="rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20">
                                    Tous les types
                                </Button>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div variants={itemVariants}>
                        <Card className="backdrop-blur-sm bg-white/10 border-white/20 rounded-2xl overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/20">
                                        <TableHead className="text-gray-300">{t(translations.store)}</TableHead>
                                        <TableHead className="text-gray-300">{t(translations.type)}</TableHead>
                                        <TableHead className="text-gray-300">{t(translations.status)}</TableHead>
                                        <TableHead className="text-gray-300">{t(translations.title)}</TableHead>
                                        <TableHead className="text-gray-300">{t(translations.date)}</TableHead>
                                        <TableHead className="text-gray-300">{t(translations.actions)}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredActivities.map((activity) => (
                                        <TableRow key={activity.id} className="border-white/20 hover:bg-white/5">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 bg-blue-400 rounded-full" />
                                                    <span className="font-medium text-white">{activity.store?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                                                    {activity.type === 'ORDER' && <Utensils className="mr-1 h-3 w-3" />}
                                                    {activity.type === 'RESERVATION' && <ConciergeBell className="mr-1 h-3 w-3" />}
                                                    {activity.type === 'CONSULTATION' && <BrainCircuit className="mr-1 h-3 w-3" />}
                                                    {activity.type === 'CALL' && <Phone className="mr-1 h-3 w-3" />}
                                                    {activity.type === 'VISIT' && <Eye className="mr-1 h-3 w-3" />}
                                                    {activity.type === 'COMPLAINT' && <MessageSquare className="mr-1 h-3 w-3" />}
                                                    {activity.type === 'PAYMENT' && <BookOpen className="mr-1 h-3 w-3" />}
                                                    {getActivityTypeLabel(activity.type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(activity.status)}>
                                                    {getStatusLabel(activity.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-white">{activity.title}</p>
                                                    {activity.description && (
                                                        <p className="text-sm text-gray-400 truncate max-w-[200px]">
                                                            {activity.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-400">
                                                    {formatDistanceToNow(new Date(activity.createdAt), { 
                                                        addSuffix: true, 
                                                        locale: fr 
                                                    })}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleQuickView(activity)}
                                                        className="rounded-2xl hover:bg-white/20 text-white border border-white/20"
                                                        title={t(translations.quickView)}
                                                    >
                                                        <span className="text-lg">👀</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(activity.id)}
                                                        className="rounded-2xl hover:bg-white/20 text-white border border-white/20"
                                                        title={t(translations.viewDetails)}
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </motion.div>
                )}
            </motion.div>

            {/* Popup pour aperçu rapide et changement de statut */}
            <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
                <DialogContent className="bg-black/95 backdrop-blur-xl border-white/20 rounded-2xl text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <span className="text-2xl">
                                {selectedActivity?.type === 'ORDER' ? '🛒' :
                                 selectedActivity?.type === 'SERVICE' ? '🔧' :
                                 selectedActivity?.type === 'CONSULTATION' ? '🤖' :
                                 selectedActivity?.type === 'SIGNALEMENT' ? '🚨' : '📊'}
                            </span>
                            {t(translations.activityDetails)}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedActivity && (
                        <div className="space-y-6">
                            {/* Informations principales */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-400">{t(translations.title)}</label>
                                    <p className="text-white font-medium">{selectedActivity.title}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">{t(translations.store)}</label>
                                    <p className="text-white">{selectedActivity.store?.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">{t(translations.type)}</label>
                                    <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                                        {getActivityTypeLabel(selectedActivity.type)}
                                    </Badge>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400">{t(translations.urgency)}</label>
                                    <Badge className={`${getUrgencyColor(selectedActivity.urgencyLevel)} border-0`}>
                                        {selectedActivity.urgencyLevel}
                                    </Badge>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedActivity.description && (
                                <div>
                                    <label className="text-sm font-medium text-gray-400">{t(translations.description)}</label>
                                    <p className="text-white mt-1 p-3 bg-white/5 rounded-lg border border-white/10">
                                        {selectedActivity.description}
                                    </p>
                                </div>
                            )}

                            {/* Montant si disponible */}
                            {selectedActivity.metadata?.amount && (
                                <div>
                                    <label className="text-sm font-medium text-gray-400">{t(translations.amount)}</label>
                                    <p className="text-white font-bold text-lg">
                                        €{selectedActivity.metadata.amount.toFixed(2)}
                                    </p>
                                </div>
                            )}

                            {/* Client si disponible */}
                            {selectedActivity.metadata?.customerName && (
                                <div>
                                    <label className="text-sm font-medium text-gray-400">{t(translations.customer)}</label>
                                    <p className="text-white">{selectedActivity.metadata.customerName}</p>
                                </div>
                            )}

                            {/* Changement de statut */}
                            <div className="border-t border-white/20 pt-4">
                                <label className="text-sm font-medium text-gray-400 block mb-3">{t(translations.statusChange)}</label>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-400">Statut actuel:</span>
                                    <Badge className={getStatusColor(selectedActivity.status)}>
                                        {getStatusLabel(selectedActivity.status)}
                                    </Badge>
                                </div>
                                
                                <div className="flex gap-2 mt-4">
                                    {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => {
                                        const isActive = selectedActivity.status === status;
                                        return (
                                            <Button
                                                key={status}
                                                size="sm"
                                                onClick={() => handleStatusChange(status)}
                                                disabled={updatingStatus || isActive}
                                                className={`rounded-2xl border text-sm font-medium transition-all ${
                                                    isActive 
                                                        ? 'bg-gray-600 text-white border-gray-500 cursor-not-allowed opacity-80' 
                                                        : 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700 hover:text-white'
                                                }`}
                                                style={{ minWidth: '80px' }}
                                            >
                                                {updatingStatus && isActive ? (
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                ) : null}
                                                {getStatusLabel(status)}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            onClick={() => setIsPopupOpen(false)}
                            className="rounded-2xl bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 hover:text-white transition-all"
                        >
                            {t(translations.cancel)}
                        </Button>
                        
                        <Button
                            onClick={() => selectedActivity && handleViewDetails(selectedActivity.id)}
                            className="rounded-2xl bg-gray-600 text-white border border-gray-500 hover:bg-gray-500 transition-all"
                        >
                            <FileText className="h-4 w-4 mr-1" />
                            {t(translations.viewDetails)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

