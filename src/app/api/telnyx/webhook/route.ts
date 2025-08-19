import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimitMiddleware } from '@/lib/rate-limiter';

// Types pour les webhooks Telnyx
interface TelnyxWebhookEvent {
  data: {
    event_type: string;
    id: string;
    occurred_at: string;
    payload: {
      call_control_id?: string;
      connection_id?: string;
      direction?: 'incoming' | 'outgoing';
      from?: string;
      to?: string;
      call_session_id?: string;
      state?: string;
      recording_urls?: string[];
      answered_at?: string;
      hangup_cause?: string;
      hangup_source?: string;
    };
  };
}

// POST - Webhook Telnyx pour les événements d'appels
export async function POST(request: NextRequest) {
  try {
    // Rate limiting pour webhooks - 200 requêtes/minute
    const rateLimitResult = await rateLimitMiddleware(request, 'WEBHOOK_TELNYX');
    if (!rateLimitResult.success) {
      console.warn('🚫 Rate limit dépassé pour webhook Telnyx:', rateLimitResult.headers['Retry-After']);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }
    
    // Parse et validation du webhook
    const body = await request.text();
    if (!body) {
      return NextResponse.json(
        { error: 'Empty webhook body' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    let event: TelnyxWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error('❌ Erreur parsing webhook Telnyx:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    // Validation structure webhook
    if (!event?.data?.event_type || !event?.data?.payload) {
      console.error('❌ Structure webhook Telnyx invalide:', event);
      return NextResponse.json(
        { error: 'Invalid webhook structure' },
        { status: 400, headers: rateLimitResult.headers }
      );
    }
    
    console.log('📞 Webhook Telnyx reçu:', event.data.event_type);
    
    const { event_type, payload } = event.data;
    
    switch (event_type) {
      case 'call.initiated':
        await handleCallInitiated(payload);
        break;
        
      case 'call.answered':
        await handleCallAnswered(payload);
        break;
        
      case 'call.hangup':
        await handleCallHangup(payload);
        break;
        
      case 'call.recording.saved':
        await handleRecordingSaved(payload);
        break;
        
      default:
        console.log('📞 Événement non géré:', event_type);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('❌ Erreur webhook Telnyx:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCallInitiated(payload: any) {
  try {
    console.log('📞 Appel initié:', payload.from, '->', payload.to);
    
    // Trouver le business associé au numéro appelé
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: { number: payload.to },
      include: {
        business: {
          include: {
            stores: {
              include: {
                subscription: true
              }
            }
          }
        }
      }
    });
    
    if (!phoneNumber) {
      console.log('❌ Numéro non trouvé:', payload.to);
      return;
    }
    
    // Vérifier si le client existe
    let customer = await prisma.customer.findFirst({
      where: {
        phone: payload.from,
        businessId: phoneNumber.businessId
      }
    });
    
    // Créer le client s'il n'existe pas
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phone: payload.from,
          businessId: phoneNumber.businessId,
          firstSeen: new Date(),
          lastSeen: new Date()
        }
      });
      console.log('👤 Nouveau client créé:', customer.id);
    } else {
      // Mettre à jour lastSeen
      await prisma.customer.update({
        where: { id: customer.id },
        data: { lastSeen: new Date() }
      });
    }
    
    // Créer l'entrée Call
    await prisma.call.create({
      data: {
        type: 'incoming',
        businessId: phoneNumber.businessId,
        customerId: customer.id,
        metadata: {
          callControlId: payload.call_control_id,
          sessionId: payload.call_session_id,
          telnyxPayload: payload
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur handleCallInitiated:', error);
  }
}

async function handleCallAnswered(payload: any) {
  try {
    console.log('📞 Appel répondu:', payload.call_control_id);
    
    // Mettre à jour l'appel avec les informations de réponse
    await prisma.call.updateMany({
      where: {
        metadata: {
          path: ['callControlId'],
          equals: payload.call_control_id
        }
      },
      data: {
        metadata: {
          ...payload,
          answeredAt: payload.answered_at
        }
      }
    });
    
    // Ici on peut déclencher l'IA pour traiter l'appel
    // await triggerAIAgent(payload.call_control_id);
    
  } catch (error) {
    console.error('❌ Erreur handleCallAnswered:', error);
  }
}

async function handleCallHangup(payload: any) {
  try {
    console.log('📞 Appel terminé:', payload.call_control_id, 'Cause:', payload.hangup_cause);
    
    // Calculer la durée de l'appel
    const call = await prisma.call.findFirst({
      where: {
        metadata: {
          path: ['callControlId'],
          equals: payload.call_control_id
        }
      }
    });
    
    if (call) {
      const metadata = call.metadata as any;
      const answeredAt = metadata?.answeredAt;
      let duration = 0;
      
      if (answeredAt) {
        duration = Math.round((new Date().getTime() - new Date(answeredAt).getTime()) / 1000);
      }
      
      await prisma.call.updateMany({
        where: {
          metadata: {
            path: ['callControlId'],
            equals: payload.call_control_id
          }
        },
        data: {
          duration,
          metadata: {
            ...metadata,
            hangupCause: payload.hangup_cause,
            hangupSource: payload.hangup_source,
            endedAt: new Date().toISOString()
          }
        }
      });
      
      console.log('📊 Appel mis à jour - Durée:', duration, 'secondes');
    }
    
  } catch (error) {
    console.error('❌ Erreur handleCallHangup:', error);
  }
}

async function handleRecordingSaved(payload: any) {
  try {
    console.log('🎙️ Enregistrement sauvegardé:', payload.recording_urls);
    
    // Mettre à jour l'appel avec l'URL d'enregistrement
    await prisma.call.updateMany({
      where: {
        metadata: {
          path: ['callControlId'],
          equals: payload.call_control_id
        }
      },
      data: {
        recordingUrl: payload.recording_urls?.[0] || null
      }
    });
    
    // ✅ NOUVEAU : Déclencher analyse IA automatiquement
    try {
      console.log('🤖 Déclenchement analyse IA pour:', payload.call_control_id);
      
      // Déclencher analyse IA en arrière-plan (ne pas attendre)
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      fetch(`${apiUrl}/api/ai/process-call/${payload.call_control_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(response => {
        if (response.ok) {
          console.log('✅ Analyse IA déclenchée avec succès');
        } else {
          console.error('❌ Erreur déclenchement analyse IA:', response.status);
        }
      }).catch(error => {
        console.error('❌ Erreur call API analyse IA:', error);
      });
      
    } catch (error) {
      console.error('❌ Erreur déclenchement analyse IA:', error);
      // Ne pas faire planter le webhook si problème analyse
    }
    
  } catch (error) {
    console.error('❌ Erreur handleRecordingSaved:', error);
  }
}

// GET - Endpoint de test pour vérifier que le webhook fonctionne
export async function GET() {
  return NextResponse.json({ 
    status: 'Telnyx webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}