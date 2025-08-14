
'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function MenuPage() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get('storeId');
    const action = searchParams.get('action');

    return (
        <div className="space-y-8">
             <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion du Catalogue</h1>
                    <p className="text-muted-foreground">Boutique ID: {storeId || "N/A"}</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un article
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Catalogue de la boutique</CardTitle>
                    <CardDescription>
                        C'est ici que vous gérerez les produits et services de votre boutique.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <h3 className="text-lg font-semibold">Prochaine étape</h3>
                        <p className="text-muted-foreground">L'éditeur de catalogue sera implémenté ici.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
