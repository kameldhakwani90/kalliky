// ============================================================================
// MIDDLEWARE - Sécurité globale et protection CSRF
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { csrfProtection, setCSRFToken } from '@/lib/csrf';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorer les fichiers statiques
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('.svg') ||
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname.includes('.css') ||
    pathname.includes('.js')
  ) {
    return NextResponse.next();
  }

  // Routes API nécessitant une protection CSRF
  const isAPIRoute = pathname.startsWith('/api/');
  const isMutationMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  
  if (isAPIRoute && isMutationMethod) {
    // Exceptions - routes qui ont leur propre validation
    const exceptions = [
      '/api/webhooks/',     // Webhooks ont leur propre validation
      '/api/auth/login',    // Auth routes ont leur propre sécurité  
      '/api/auth/register',
      '/api/auth/auto-login-signup', // Auto-login après signup
      '/api/csrf',          // Route pour obtenir le token
      '/api/stripe/checkout-signup' // Route publique de signup
    ];

    const isException = exceptions.some(exception => pathname.startsWith(exception));
    
    if (!isException) {
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
    }
  }

  // Créer la réponse et ajouter automatiquement le token CSRF
  const response = NextResponse.next();
  
  // Ajouter le token CSRF à toutes les réponses (API et pages web)
  // Le frontend peut le récupérer depuis les headers ou cookies automatiquement
  return setCSRFToken(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
};