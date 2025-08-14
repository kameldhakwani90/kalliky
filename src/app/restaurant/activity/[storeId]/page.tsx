
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, BrainCircuit, Calendar, Car, ConciergeBell, Eye, Phone, Receipt, Sparkles, User, Utensils } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

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
    date: string;
    amount: string;
};

const mockActivities: Record<string, ActivityLog[]> = {
    "store-1": [
        { id: "#1025", type: 'Commande', customer: 'Alice Martin', customerId: 'cust-1', phone: '0612345678', date: 'il y a 5 min', amount: '24,50€' },
        { id: "#1024", type: 'Commande', customer: 'Bob Dupont', customerId: 'cust-2', phone: '0787654321', date: 'il y a 1h', amount: '18,00€' },
        { id: "#1023", type: 'Commande', customer: 'Anonyme', customerId: 'cust-4', phone: '0699887766', date: 'hier', amount: '55,20€' },
    ],
    "store-loc": [
        { id: "#R87", type: 'Réservation', customer: 'Carlos Sainz', customerId: 'cust-5', phone: '0611223344', date: 'aujourd\'hui', amount: '1900,00€' },
        { id: "#R86", type: 'Réservation', customer: 'Lando Norris', customerId: 'cust-6', phone: '0688776655', date: 'demain', amount: '950,00€' },
    ],
    "store-4": [
        { id: "#C12", type: 'Consultation', customer: 'Mme. Lefevre', customerId: 'cust-7', phone: '0123456789', date: 'il y a 2h', amount: 'N/A' },
        { id: "#C11", type: "Consultation", customer: 'M. Bernard', customerId: 'cust-8', phone: '0198765432', date: 'hier', amount: 'N/A' },
    ],
    "store-spa": [
         { id: "#S33", type: 'Réservation', customer: 'Claire Chazal', customerId: 'cust-9', phone: '0755667788', date: 'demain', amount: '250,00€' },
    ]
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

export default function StoreActivityPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useLanguage();
    const storeId = params.storeId as string;
    const store = initialStores.find(s => s.id === storeId);
    const activities = mockActivities[storeId] || [];

    if (!store) {
        return <div>Boutique non trouvée.</div>;
    }

    const Icon = getServiceIcon(store.serviceType, store.name);

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
    };

    return (
        <div className="space-y-8">
             <header className="mb-4">
                <Button variant="ghost" onClick={() => router.push('/restaurant/activity')} className="-ml-4 mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t(translations.back)}
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{t(translations.activityTitle)}: {store.name}</h1>
                <p className="text-muted-foreground">{t(translations.requestsList)}</p>
             </header>

             <Card>
                <CardHeader>
                    <CardTitle>Dernières activités</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t(translations.type)}</TableHead>
                                    <TableHead>{t(translations.customer)}</TableHead>
                                    <TableHead className="hidden sm:table-cell">{t(translations.date)}</TableHead>
                                    <TableHead className="hidden md:table-cell">{t(translations.amount)}</TableHead>
                                    <TableHead className="text-right">{t(translations.actions)}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activities.map((activity) => (
                                    <TableRow key={activity.id} className="cursor-pointer" onClick={() => router.push(`/restaurant/clients/${activity.customerId}`)}>
                                        <TableCell>
                                            <Badge variant="outline" className="flex items-center gap-2 w-fit">
                                                <Icon className="h-4 w-4" />
                                                <span>{activity.type}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">{activity.customer}</p>
                                            <p className="text-xs text-muted-foreground">{activity.phone}</p>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">{activity.date}</TableCell>
                                        <TableCell className="hidden md:table-cell">{activity.amount}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={(e) => {e.stopPropagation(); router.push(`/restaurant/clients/${activity.customerId}`)}}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                {t(translations.view)}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
             </Card>

        </div>
    );
}
