// ============================================================================
// CSRF PROVIDER - Contexte React pour la gestion automatique des tokens CSRF
// ============================================================================

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { csrfClient } from '@/lib/csrf';

interface CSRFContextType {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  secureRequest: (url: string, options?: RequestInit) => Promise<Response>;
}

const CSRFContext = createContext<CSRFContextType | null>(null);

export function useCSRFContext() {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRFContext must be used within a CSRFProvider');
  }
  return context;
}

interface CSRFProviderProps {
  children: ReactNode;
}

export function CSRFProvider({ children }: CSRFProviderProps) {
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

  const refreshToken = async () => {
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
  };

  const secureRequest = async (url: string, options: RequestInit = {}) => {
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
  };

  const value = {
    token,
    isLoading,
    error,
    refreshToken,
    secureRequest
  };

  return (
    <CSRFContext.Provider value={value}>
      {children}
    </CSRFContext.Provider>
  );
}