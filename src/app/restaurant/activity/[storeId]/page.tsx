
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';


export default function StoreActivityPage() {
    const params = useParams();
    const router = useRouter();
    const storeId = params.storeId as string;

    return (
        <div className="space-y-4">
             <header className="mb-4">
                <Button variant="ghost" onClick={() => router.push('/restaurant/activity')} className="-ml-4 mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la sélection
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Activité de la boutique {storeId}</h1>
                <p className="text-muted-foreground">Liste des dernières demandes.</p>
             </header>

            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">Prochaine étape</h3>
                <p className="text-muted-foreground">
                    La liste des commandes, réservations ou consultations pour cette boutique sera affichée ici.
                </p>
            </div>

        </div>
    );
}
