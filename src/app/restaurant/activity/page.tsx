
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Utensils, ConciergeBell, BrainCircuit, Car, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

type ServiceType = 'products' | 'reservations' | 'consultation';

type Store = {
    id: string;
    name: string;
    address: string;
    serviceType: ServiceType;
};

const initialStores: Store[] = [
    { 
        id: "store-1", 
        name: "Le Gourmet Parisien - Centre", 
        address: "12 Rue de la Paix, 75002 Paris", 
        serviceType: 'products'
    },
    { 
        id: "store-loc", 
        name: "Prestige Cars - Location", 
        address: "25 Avenue Montaigne, 75008 Paris", 
        serviceType: 'reservations'
    },
     { 
        id: "store-4", 
        name: "Cabinet d'Avocats", 
        address: "1 Avenue des Champs-Élysées, 75008 Paris", 
        serviceType: 'consultation'
    },
     { 
        id: "store-spa", 
        name: "Spa & Bien-être 'Zen'", 
        address: "7 Rue du Faubourg Saint-Honoré, 75008 Paris", 
        serviceType: 'reservations'
    },
];

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

    const translations = {
        title: { fr: "Activité des boutiques", en: "Store Activity" },
        description: { fr: "Sélectionnez une boutique pour voir ses commandes, réservations ou consultations.", en: "Select a store to view its orders, reservations, or consultations." },
        viewActivity: { fr: "Voir l'activité", en: "View Activity" },
    };

    const handleViewActivity = (storeId: string) => {
        router.push(`/restaurant/activity/${storeId}`);
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">{t(translations.title)}</h1>
                <p className="text-muted-foreground">{t(translations.description)}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {initialStores.map((store) => {
                    const typeInfo = serviceTypeInfo[store.serviceType];
                    const Icon = getServiceIcon(store.serviceType, store.name);

                    return (
                        <Card key={store.id} className="flex flex-col">
                            <CardHeader className="flex-grow">
                                <CardTitle>{store.name}</CardTitle>
                                <CardDescription>{store.address}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow min-h-[50px]">
                                <Badge variant="outline" className="flex items-center gap-2 w-fit">
                                    <Icon className="h-4 w-4" />
                                    <span>{t(typeInfo.label)}</span>
                                </Badge>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => handleViewActivity(store.id)}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    {t(translations.viewActivity)}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

