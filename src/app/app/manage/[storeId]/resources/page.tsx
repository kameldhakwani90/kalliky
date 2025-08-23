'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import ResourcesTab from '../ResourcesTab';

interface StoreData {
  id: string;
  name: string;
  address: string;
  business: {
    id: string;
    name: string;
  };
}

export default function ResourcesPage() {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          <span className="text-lg">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-semibold mb-2">Erreur</p>
          <p className="text-slate-300 mb-4">{error || 'Boutique introuvable'}</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/app/stores')}
            className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux boutiques
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-3xl p-6">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/app/manage/${storeId}`)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la configuration
            </Button>
            
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔧</div>
                <h1 className="text-2xl font-bold text-white">
                  Ressources
                </h1>
              </div>
              <p className="text-gray-400">
                {store.name} • Gérez vos équipements et outils
              </p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="bg-gray-800 rounded-3xl min-h-[70vh]">
          <ResourcesTab
            storeId={storeId}
            storeName={store.name}
          />
        </div>
      </div>
    </div>
  );
}