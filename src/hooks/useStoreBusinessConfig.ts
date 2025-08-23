'use client';

import { useState, useEffect } from 'react';
import type { StoreBusinessConfig } from '@/lib/services/business-config';

/**
 * Hook React pour récupérer la configuration business d'une boutique
 * 
 * @param storeId ID de la boutique
 * @returns État de chargement et configuration
 */
export function useStoreBusinessConfig(storeId: string) {
  const [config, setConfig] = useState<StoreBusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Appel API pour récupérer la config
    fetch(`/api/stores/${storeId}/business-config`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (mounted) {
          setConfig(data.config);
          setError(null);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message || 'Erreur de chargement');
          setConfig(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [storeId]);

  return { config, loading, error };
}

/**
 * Hook pour récupérer seulement le wording (version légère)
 */
export function useStoreWording(storeId: string) {
  const { config, loading, error } = useStoreBusinessConfig(storeId);
  
  return {
    wording: config?.config?.wording || {
      products: "Quels produits/services ?",
      equipment: "Vos équipements",
      staff: "Votre équipe",
      options: "Options additionnelles"
    },
    businessType: config?.businessType || 'UNKNOWN',
    displayName: config?.config?.displayName || 'Activité',
    loading,
    error
  };
}