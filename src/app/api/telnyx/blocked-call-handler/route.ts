import { NextRequest, NextResponse } from 'next/server';
import { handleBlockedCall } from '@/lib/telnyx-blocking';

export async function POST(request: NextRequest) {
  try {
    console.log('📞 Webhook appel bloqué reçu');

    const body = await request.json();
    const response = await handleBlockedCall(body);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erreur handler appel bloqué:', error);
    return NextResponse.json(
      {
        actions: [
          {
            type: 'answer'
          },
          {
            type: 'speak',
            text: "Service temporairement indisponible.",
            voice: 'alice',
            language: 'fr-FR'
          },
          {
            type: 'hangup'
          }
        ]
      },
      { status: 200 }
    );
  }
}