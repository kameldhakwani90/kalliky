// ============================================================================
// API CSRF TOKEN - Fournir des tokens CSRF aux clients
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    const token = generateCSRFToken();
    
    const response = NextResponse.json({
      success: true,
      data: { token }
    });

    // Définir le token dans un cookie sécurisé
    return setCSRFToken(response);
    
  } catch (error) {
    console.error('❌ Erreur génération token CSRF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du token CSRF' },
      { status: 500 }
    );
  }
}