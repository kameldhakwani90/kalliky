'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import NotificationsTab from '../NotificationsTabNew';

interface StoreData {
  id: string;
  name: string;
  address: string;
  business: {
    id: string;
    name: string;
  };
}

export default function NotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-semibold mb-2">Erreur</p>
          <p className="text-gray-400 mb-4">{error || 'Boutique introuvable'}</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/app/stores')}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux boutiques
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <header className="backdrop-blur-xl bg-white/10 border-white/20 rounded-3xl p-6 border">
          <div className="flex items-center gap-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/app/manage/${storeId}`)}
              className="flex items-center gap-2 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la configuration
            </Button>
            
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔔</div>
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
              </div>
              <p className="text-gray-400">
                {store.name} • Alertes email, SMS et WhatsApp
              </p>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <div className="backdrop-blur-xl bg-white/10 border-white/20 rounded-3xl p-6 border min-h-[70vh]">
          <NotificationsTab
            storeId={storeId}
            storeName={store.name}
            businessId={store.business.id}
          />
        </div>
      </div>
    </div>
  );
}