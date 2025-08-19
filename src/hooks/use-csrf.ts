// ============================================================================
// HOOK CSRF - React hook pour la protection CSRF côté client
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { csrfClient } from '@/lib/csrf';

interface UseCSRFReturn {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  secureRequest: (url: string, options?: RequestInit) => Promise<Response>;
}

export function useCSRF(): UseCSRFReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer le token initial
  useEffect(() => {
    const initToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Essayer d'abord de récupérer depuis les cookies
        const existingToken = csrfClient.getToken();
        
        if (existingToken) {
          setToken(existingToken);
        } else {
          // Sinon, demander un nouveau token au serveur
          await refreshToken();
        }
      } catch (err) {
        setError('Erreur lors de l\'initialisation du token CSRF');
        console.error('CSRF init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initToken();
  }, []);

  // Fonction pour rafraîchir le token
  const refreshToken = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/csrf');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.data.token) {
        setToken(data.data.token);
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (err) {
      const errorMessage = 'Erreur lors du rafraîchissement du token CSRF';
      setError(errorMessage);
      console.error('CSRF refresh error:', err);
      throw new Error(errorMessage);
    }
  }, []);

  // Fonction pour effectuer des requêtes sécurisées
  const secureRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('Token CSRF non disponible');
    }

    const headers = csrfClient.addTokenToHeaders(options.headers as Record<string, string> || {});
    
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Si le token CSRF est invalide, essayer de le rafraîchir une fois
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.code === 'CSRF_INVALID') {
        console.warn('Token CSRF invalide, tentative de rafraîchissement...');
        await refreshToken();
        
        // Retry avec le nouveau token
        const newHeaders = csrfClient.addTokenToHeaders(options.headers as Record<string, string> || {});
        return fetch(url, {
          ...options,
          headers: newHeaders
        });
      }
    }

    return response;
  }, [token, refreshToken]);

  return {
    token,
    isLoading,
    error,
    refreshToken,
    secureRequest
  };
}

// Hook simplifié pour les cas d'usage basiques
export function useSecureRequest() {
  const { secureRequest, isLoading, error } = useCSRF();
  
  return {
    secureRequest,
    isLoading,
    error
  };
}