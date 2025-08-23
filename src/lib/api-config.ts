export const API_CONFIG = {
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      
      // Messages d'erreur plus spécifiques selon le statut
      let message = error.message;
      if (!message) {
        switch (response.status) {
          case 400:
            message = 'Données envoyées invalides. Vérifiez vos informations.';
            break;
          case 401:
            message = error.error || 'Identifiants incorrects. Vérifiez votre email et mot de passe.';
            break;
          case 403:
            message = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
            break;
          case 404:
            message = 'Service non trouvé. Veuillez contacter le support.';
            break;
          case 429:
            message = 'Trop de tentatives. Veuillez patienter avant de réessayer.';
            break;
          case 500:
            message = 'Erreur du serveur. Nos équipes ont été notifiées.';
            break;
          case 502:
          case 503:
            message = 'Service temporairement indisponible. Veuillez réessayer dans quelques instants.';
            break;
          case 504:
            message = 'Le service met du temps à répondre. Veuillez réessayer.';
            break;
          default:
            message = `Erreur inattendue (${response.status}). Veuillez contacter le support si le problème persiste.`;
        }
      }
      
      throw new ApiError(message, response.status, error);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, error);
  }
}