import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

// GET - Prévisualiser l'email de bienvenue
export async function GET() {
  try {
    const emailHtml = await emailService.previewWelcomeEmail();
    
    return new Response(emailHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Erreur preview email:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'aperçu' },
      { status: 500 }
    );
  }
}