// ============================================================================
// CSRF Protection - Protection contre les attaques Cross-Site Request Forgery
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Parse cookies de manière compatible Edge Runtime
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  });
  
  return cookies;
}

export class CSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CSRFError';
  }
}

/**
 * Génère un token CSRF cryptographiquement sécurisé
 */
export function generateCSRFToken(): string {
  // Utiliser Web Crypto API pour Edge Runtime compatibility
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback pour les environnements sans Web Crypto API
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Valide un token CSRF de manière sécurisée
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  
  // Vérification de longueur constante
  if (token.length !== expectedToken.length) return false;
  
  // Comparaison à temps constant pour éviter les timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Middleware de protection CSRF pour les requêtes de mutation
 */
export async function csrfProtection(request: NextRequest): Promise<boolean> {
  // Ignorer les requêtes GET, HEAD et OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  // Ignorer les webhooks (ils ont leur propre système de validation)
  if (request.nextUrl.pathname.startsWith('/api/webhooks/')) {
    return true;
  }

  // Récupérer le token depuis l'en-tête
  const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME);
  
  // Récupérer le token depuis les cookies (compatible Edge Runtime)
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies_parsed = parseCookies(cookieHeader);
  const tokenFromCookie = cookies_parsed[CSRF_COOKIE_NAME];

  if (!tokenFromHeader || !tokenFromCookie) {
    console.warn('CSRF: Token manquant', {
      hasHeader: !!tokenFromHeader,
      hasCookie: !!tokenFromCookie,
      path: request.nextUrl.pathname
    });
    return false;
  }

  const isValid = validateCSRFToken(tokenFromHeader, tokenFromCookie);
  
  if (!isValid) {
    console.warn('CSRF: Token invalide', {
      path: request.nextUrl.pathname,
      method: request.method,
      headerToken: tokenFromHeader?.substring(0, 8) + '...',
      cookieToken: tokenFromCookie?.substring(0, 8) + '...'
    });
  }

  return isValid;
}

/**
 * Génère une réponse avec un nouveau token CSRF
 */
export function setCSRFToken(response: NextResponse): NextResponse {
  const token = generateCSRFToken();
  
  // Définir le cookie avec des options sécurisées
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Doit être accessible en JavaScript pour être envoyé dans les headers
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 heures
  });

  // Ajouter aussi dans les headers pour faciliter l'accès côté client
  response.headers.set('X-CSRF-Token', token);
  
  return response;
}

/**
 * API pour récupérer un token CSRF côté client
 */
export async function getCSRFToken(): Promise<{ token: string }> {
  const token = generateCSRFToken();
  return { token };
}

/**
 * Wrapper pour les API routes avec protection CSRF
 */
export function withCSRFProtection(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Vérifier la protection CSRF
    const isCSRFValid = await csrfProtection(request);
    
    if (!isCSRFValid) {
      return NextResponse.json(
        { 
          error: 'CSRF token invalide ou manquant',
          code: 'CSRF_INVALID'
        },
        { status: 403 }
      );
    }

    // Exécuter le handler original
    const response = await handler(request, ...args);
    
    // Renouveler le token CSRF pour les requêtes réussies
    if (response.status < 400) {
      return setCSRFToken(response);
    }
    
    return response;
  };
}

/**
 * Hook côté client pour récupérer et utiliser le token CSRF
 */
export const csrfClient = {
  /**
   * Récupère le token CSRF depuis les cookies
   */
  getToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CSRF_COOKIE_NAME) {
        return decodeURIComponent(value);
      }
    }
    return null;
  },

  /**
   * Ajoute le token CSRF aux headers de requête
   */
  addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers[CSRF_HEADER_NAME] = token;
    }
    return headers;
  },

  /**
   * Wrapper pour fetch avec protection CSRF automatique
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = this.addTokenToHeaders(options.headers as Record<string, string> || {});
    
    return fetch(url, {
      ...options,
      headers
    });
  }
};