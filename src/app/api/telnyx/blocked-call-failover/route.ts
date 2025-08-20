import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📞 Webhook failover appel bloqué');

    return NextResponse.json({
      actions: [
        {
          type: 'answer'
        },
        {
          type: 'speak',
          text: "Ce service est temporairement indisponible. Veuillez rappeler plus tard ou contacter directement l'établissement.",
          voice: 'alice',
          language: 'fr-FR'
        },
        {
          type: 'hangup'
        }
      ]
    });

  } catch (error) {
    console.error('❌ Erreur failover appel bloqué:', error);
    return NextResponse.json(
      {
        actions: [{ type: 'hangup' }]
      },
      { status: 200 }
    );
  }
}