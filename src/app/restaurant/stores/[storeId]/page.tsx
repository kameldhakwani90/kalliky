'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Settings, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import StoreServiceTabs from '@/components/StoreServiceTabs';

interface StoreData {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  hasProducts: boolean;
  hasReservations: boolean;
  hasConsultations: boolean;
  productsConfig?: any;
  reservationsConfig?: any;
  consultationsConfig?: any;
  createdAt: string;
  business: {
    id: string;
    name: string;
  };
}

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStoreData();
  }, [storeId]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${storeId}`);
      
      if (!response.ok) {
        throw new Error('Store not found');
      }
      
      const data = await response.json();
      setStore(data);
    } catch (error) {
      console.error('Error fetching store:', error);
      setError(error instanceof Error ? error.message : 'Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = async (config: any) => {
    try {
      setUpdating(true);
      
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasProducts: config.hasProducts,
          hasReservations: config.hasReservations,
          hasConsultations: config.hasConsultations,
          productsConfig: config.productsConfig,
          reservationsConfig: config.reservationsConfig,
          consultationsConfig: config.consultationsConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update store configuration');
      }

      const updatedStore = await response.json();
      setStore(updatedStore);
      toast.success('Configuration mise à jour avec succès');
    } catch (error) {
      console.error('Error updating store config:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <div>
                <p className="font-semibold">Erreur</p>
                <p className="text-sm text-muted-foreground">
                  {error || 'Boutique introuvable'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/restaurant/stores')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux boutiques
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const enabledServicesCount = [
    store.hasProducts,
    store.hasReservations,
    store.hasConsultations
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/restaurant/stores')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{store.name}</h1>
              <Badge variant={store.isActive ? "default" : "secondary"}>
                {store.isActive ? "Actif" : "Inactif"}
              </Badge>
              {updating && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Mise à jour...
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {store.address} • {enabledServicesCount} service{enabledServicesCount > 1 ? 's' : ''} activé{enabledServicesCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Services actifs summary */}
      {enabledServicesCount === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">Aucun service activé</p>
                <p className="text-sm text-amber-700">
                  Cette boutique n'a aucun service activé. Activez au moins un service dans l'onglet Configuration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs des services */}
      <StoreServiceTabs
        storeId={store.id}
        storeName={store.name}
        config={{
          hasProducts: store.hasProducts,
          hasReservations: store.hasReservations,
          hasConsultations: store.hasConsultations,
          productsConfig: store.productsConfig,
          reservationsConfig: store.reservationsConfig,
          consultationsConfig: store.consultationsConfig,
        }}
        onConfigUpdate={handleConfigUpdate}
      />
    </div>
  );
}