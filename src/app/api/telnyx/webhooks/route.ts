import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { redisService, CallSessionManager } from '@/lib/redis';
import { openaiService, startAIConversation } from '@/lib/openai';
import { RealtimeManager } from '@/lib/openai-realtime';
import { StoreCacheService } from '@/lib/services/storeCacheService';
import { CallLimitsService } from '@/lib/services/callLimitsService';

// Fonction de vérification de signature Telnyx
function verifyTelnyxSignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  } catch (error) {
    console.error('❌ Erreur vérification signature:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('telnyx-signature-ed25519');
    const timestamp = request.headers.get('telnyx-timestamp');

    // Vérifier la signature si configurée
    if (process.env.TELNYX_WEBHOOK_SECRET && signature) {
      const isValid = verifyTelnyxSignature(body, signature, process.env.TELNYX_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('❌ Signature Telnyx invalide');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    console.log(`📞 Webhook Telnyx: ${event.data?.event_type || 'unknown'}`);

    switch (event.data?.event_type) {
      case 'call.initiated':
        return handleCallInitiated(event.data);
      
      case 'call.answered':
        return handleCallAnswered(event.data);
      
      case 'call.recording.available':
        return handleRecordingAvailable(event.data);
      
      case 'call.hangup':
        return handleCallHangup(event.data);
      
      case 'call.audio':
        return handleCallAudio(event.data);
      
      case 'call.stream':
        return handleCallStream(event.data);
      
      case 'call.dtmf.received':
        return handleDTMF(event.data);
      
      default:
        console.log(`⚠️ Événement non géré: ${event.data?.event_type}`);
        return NextResponse.json({ status: 'ignored' });
    }

  } catch (error) {
    console.error('❌ Erreur webhook Telnyx:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// GESTIONNAIRE OPENAI REALTIME
// ============================================================================

// Nouveau gestionnaire pour streaming audio vers OpenAI
async function handleCallStream(data: any) {
  try {
    const { call_control_id, stream_id, audio_data } = data;
    console.log(`🔊 Stream audio reçu: ${call_control_id}`);

    // Transférer l'audio vers OpenAI Realtime
    await RealtimeManager.handleAudioInput(call_control_id, audio_data);

    return NextResponse.json({ status: 'streamed' });
  } catch (error) {
    console.error('❌ Erreur handleCallStream:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Démarrer session OpenAI Realtime
async function startOpenAIRealtimeSession(callControlId: string, callId: string, businessId: string) {
  try {
    console.log(`🚀 Démarrage session OpenAI Realtime: ${callId}`);

    // Récupérer le contexte de la boutique
    const callSession = await redisService.getCallSession(callId);
    let storeContext = null;
    
    if (callSession?.storeId) {
      storeContext = await StoreCacheService.getCachedStoreData(callSession.storeId);
    }

    // Récupérer la config IA de la boutique
    const aiConfig = storeContext?.aiAgent || {
      voice: 'nova',
      personality: 'friendly',
      language: 'fr'
    };

    // Démarrer la session Realtime
    const session = await RealtimeManager.startSession({
      callControlId,
      callId,
      businessId,
      storeId: callSession?.storeId || '',
      voice: aiConfig.voice || 'nova',
      language: aiConfig.language || 'fr',
      personality: aiConfig.personality || 'friendly',
      storeContext
    });

    // Connecter l'audio Telnyx avec OpenAI
    await connectTelnyxToOpenAI(callControlId, session.sessionId);

    console.log(`✅ Session OpenAI Realtime démarrée: ${session.sessionId}`);
    return session;

  } catch (error) {
    console.error('❌ Erreur démarrage OpenAI Realtime:', error);
    
    // Fallback vers ancien système Telnyx TTS
    console.log('📞 Fallback vers Telnyx TTS');
    const welcomeMessage = await startAIConversation(callId, businessId, 'fr');
    await playAudio(callControlId, welcomeMessage);
    await startSpeechRecognition(callControlId);
  }
}

// Connecter le flux audio Telnyx → OpenAI Realtime
async function connectTelnyxToOpenAI(callControlId: string, realtimeSessionId: string) {
  try {
    // Démarrer le streaming audio bidirectionnel
    await makeTelnyxRequest(`/calls/${callControlId}/actions/stream_start`, {
      stream_url: `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`,
      stream_track: 'both', // Envoyer et recevoir audio
      enable_bidirectional_streaming: true
    });

    console.log(`🔗 Audio connecté: Telnyx ${callControlId} ↔ OpenAI ${realtimeSessionId}`);
  } catch (error) {
    console.error('❌ Erreur connexion audio:', error);
    throw error;
  }
}

// ============================================================================
// GESTIONNAIRES D'ÉVÉNEMENTS TELNYX
// ============================================================================

// Appel entrant initié
async function handleCallInitiated(data: any) {
  try {
    const { call_control_id, to, from } = data;
    console.log(`📞 Appel initié: ${from} → ${to}`);

    // Trouver le business correspondant au numéro appelé
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: { 
        number: to,
        status: 'ACTIVE'
      },
      include: {
        business: {
          include: {
            stores: true
          }
        }
      }
    });

    if (!phoneNumber || !phoneNumber.business) {
      console.error(`❌ Numéro non trouvé ou business inactif: ${to}`);
      // Raccrocher l'appel
      await hangupCall(call_control_id);
      return NextResponse.json({ status: 'rejected' });
    }

    const storeId = phoneNumber.business.stores[0]?.id;
    if (!storeId) {
      console.error(`❌ Aucun store trouvé pour business: ${phoneNumber.businessId}`);
      await hangupCall(call_control_id);
      return NextResponse.json({ status: 'rejected' });
    }

    // Vérifier les limites d'appels selon le plan d'abonnement
    const capacityCheck = await CallLimitsService.canAcceptNewCall(storeId, phoneNumber.businessId);
    
    if (!capacityCheck.canAccept) {
      console.log(`🚫 Appel refusé/mis en queue: ${capacityCheck.reason}`);
      
      if (capacityCheck.reason === 'queue') {
        // Mettre en queue avec message d'attente
        await acceptCall(call_control_id);
        
        const queueData = await CallLimitsService.addToQueue(storeId, {
          callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          telnyxCallId: call_control_id,
          fromNumber: from,
          toNumber: to,
          queuedAt: new Date().toISOString()
        });

        // Jouer message d'attente personnalisé
        const waitMessage = `Bonjour, tous nos conseillers sont occupés. Vous êtes ${queueData.position}${queueData.position === 1 ? 'er' : 'ème'} dans la file d'attente. Temps d'attente estimé: ${Math.ceil(queueData.estimatedWait / 60)} minute${queueData.estimatedWait > 60 ? 's' : ''}. Merci de patienter.`;
        
        await playAudio(call_control_id, waitMessage);
        
        // Programmer la vérification périodique de la queue
        await scheduleQueueCheck(call_control_id, storeId, queueData.position);
        
        return NextResponse.json({ 
          status: 'queued', 
          position: queueData.position,
          estimatedWait: queueData.estimatedWait 
        });
        
      } else {
        // Queue pleine ou autre problème - rejeter avec message d'upgrade
        await acceptCall(call_control_id);
        
        const rejectMessage = capacityCheck.upgradeMessage || 
          'Toutes nos lignes sont actuellement occupées. Veuillez rappeler dans quelques minutes. Merci de votre compréhension.';
        
        await playAudio(call_control_id, rejectMessage);
        
        // Attendre puis raccrocher
        setTimeout(async () => {
          await hangupCall(call_control_id);
        }, 5000);
        
        return NextResponse.json({ 
          status: 'rejected_capacity', 
          reason: capacityCheck.reason,
          upgradeMessage: capacityCheck.upgradeMessage 
        });
      }
    }

    // Créer l'enregistrement d'appel en base
    const call = await prisma.call.create({
      data: {
        id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        telnyxCallId: call_control_id,
        businessId: phoneNumber.businessId,
        phoneNumberId: phoneNumber.id,
        fromNumber: from,
        toNumber: to,
        status: 'INITIATED',
        startTime: new Date(),
      }
    });

    // Déclencher les notifications automatiques pour un appel entrant
    try {
      console.log('🔔 Déclenchement notifications pour appel entrant');
      
      // Créer un log d'activité pour l'appel
      await prisma.activityLog.create({
        data: {
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          businessId: phoneNumber.businessId,
          type: 'SIGNALEMENT', // Type d'activité pour appels
          status: 'NEW',
          title: `Appel entrant de ${from}`,
          description: `Nouvel appel entrant reçu sur ${to}`,
          urgencyLevel: 'NORMAL',
          metadata: {
            callId: call.id,
            telnyxCallId: call_control_id,
            fromNumber: from,
            toNumber: to,
            timestamp: new Date().toISOString()
          }
        }
      });

      // Déclencher les notifications automatiques via l'API
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app/notifications/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: phoneNumber.business.stores[0]?.id || '',
          businessId: phoneNumber.businessId,
          activityType: 'SIGNALEMENT',
          activityData: {
            title: `Appel entrant de ${from}`,
            description: `Nouvel appel entrant reçu sur ${to}`,
            fromNumber: from,
            toNumber: to,
            callId: call.id,
            timestamp: new Date().toISOString()
          }
        })
      }).catch(notificationError => {
        console.error('❌ Erreur notifications automatiques:', notificationError);
        // On continue même si les notifications échouent
      });

    } catch (notificationError) {
      console.error('❌ Erreur déclenchement notifications:', notificationError);
      // On continue même si les notifications échouent
    }

    // Accepter l'appel et démarrer l'enregistrement
    await acceptCall(call_control_id);
    await startRecording(call_control_id);

    // Récupérer les données optimisées depuis le cache Redis
    const cacheStoreId = phoneNumber.business.stores[0]?.id;
    let storeData = null;
    
    if (cacheStoreId) {
      try {
        storeData = await StoreCacheService.getCachedStoreData(cacheStoreId);
        console.log(`🏪 Données boutique chargées depuis le cache: ${storeData ? 'Oui' : 'Non'}`);
      } catch (error) {
        console.error('❌ Erreur chargement cache boutique:', error);
      }
    }

    // Créer la session Redis avec données optimisées
    await CallSessionManager.startCall({
      callId: call.id,
      telnyxCallId: call_control_id,
      businessId: phoneNumber.businessId,
      storeId: storeId || '',
      fromNumber: from,
      toNumber: to,
      businessData: storeData ? {
        name: storeData.businessName,
        businessCategory: storeData.businessCategory,
        storeName: storeData.storeName,
        services: storeData.services || [],
        products: storeData.products || [],
        consultations: storeData.consultations || [],
        aiConfig: {
          personality: storeData.aiPersonality,
          instructions: storeData.aiInstructions,
          language: storeData.aiLanguage
        }
      } : {
        name: phoneNumber.business.name,
        businessCategory: phoneNumber.business.businessCategory,
        services: []
      }
    });

    console.log(`✅ Appel initié géré: ${call.id}`);
    return NextResponse.json({ status: 'handled', callId: call.id });

  } catch (error) {
    console.error('❌ Erreur handleCallInitiated:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Appel répondu
async function handleCallAnswered(data: any) {
  try {
    const { call_control_id } = data;
    console.log(`📞 Appel répondu: ${call_control_id}`);

    // Mettre à jour le statut en base
    await prisma.call.updateMany({
      where: { telnyxCallId: call_control_id },
      data: { status: 'ANSWERED' }
    });

    // Trouver la session
    const call = await prisma.call.findFirst({
      where: { telnyxCallId: call_control_id }
    });

    if (call) {
      // NOUVEAU: Démarrer OpenAI Realtime au lieu de Telnyx TTS
      await startOpenAIRealtimeSession(call_control_id, call.id, call.businessId);
    }

    return NextResponse.json({ status: 'answered' });
  } catch (error) {
    console.error('❌ Erreur handleCallAnswered:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Enregistrement disponible
async function handleRecordingAvailable(data: any) {
  try {
    const { call_control_id, recording_url, recording_id } = data;
    console.log(`🎙️ Enregistrement disponible: ${recording_id}`);

    // Sauvegarder l'URL de l'enregistrement
    await prisma.call.updateMany({
      where: { telnyxCallId: call_control_id },
      data: { 
        recordingUrl: recording_url,
        recordingId: recording_id
      }
    });

    return NextResponse.json({ status: 'recorded' });
  } catch (error) {
    console.error('❌ Erreur handleRecordingAvailable:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Raccrochage
async function handleCallHangup(data: any) {
  try {
    const { call_control_id, hangup_cause } = data;
    console.log(`📞 Appel terminé: ${call_control_id} - Cause: ${hangup_cause}`);

    // Mettre à jour en base
    const call = await prisma.call.updateMany({
      where: { telnyxCallId: call_control_id },
      data: { 
        status: 'ENDED',
        endTime: new Date(),
        hangupCause: hangup_cause
      }
    });

    // Terminer la session Redis et retirer des appels actifs
    const callRecord = await prisma.call.findFirst({
      where: { telnyxCallId: call_control_id },
      include: {
        business: {
          include: {
            stores: true
          }
        }
      }
    });

    if (callRecord) {
      await CallSessionManager.endCall(callRecord.id, callRecord.businessId);
      
      // Important: Une place s'est libérée ! Vérifier la queue
      const storeId = callRecord.business?.stores[0]?.id;
      if (storeId) {
        await processNextInQueue(storeId);
      }
    }

    return NextResponse.json({ status: 'ended' });
  } catch (error) {
    console.error('❌ Erreur handleCallHangup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Audio reçu (transcription)
async function handleCallAudio(data: any) {
  try {
    const { call_control_id, audio_url, transcription } = data;
    
    if (!transcription || transcription.trim() === '') {
      return NextResponse.json({ status: 'no_transcription' });
    }

    console.log(`🎤 Transcription reçue: "${transcription}"`);

    // Trouver l'appel
    const call = await prisma.call.findFirst({
      where: { telnyxCallId: call_control_id }
    });

    if (!call) {
      return NextResponse.json({ status: 'call_not_found' });
    }

    // Récupérer le contexte optimisé de la boutique depuis le cache
    let storeContext = null;
    const callSession = await redisService.getCallSession(call.id);
    
    if (callSession?.storeId) {
      try {
        storeContext = await StoreCacheService.getCachedStoreAIPrompts(callSession.storeId);
        console.log(`🤖 Contexte IA chargé depuis le cache: ${storeContext ? 'Oui' : 'Non'}`);
      } catch (error) {
        console.error('❌ Erreur chargement contexte IA:', error);
      }
    }

    // Traiter avec l'IA en utilisant le contexte optimisé
    if (storeContext) {
      // Utiliser le nouveau contexte optimisé
      const aiResponse = await openaiService.processConversationWithCachedContext(
        call.id,
        transcription,
        storeContext,
        callSession?.aiContext?.language || 'fr'
      );

      // Jouer la réponse de l'IA
      if (aiResponse.response) {
        await playAudio(call_control_id, aiResponse.response);
      }

      // Actions spéciales selon la réponse
      if (aiResponse.nextAction === 'transfer') {
        await transferCall(call_control_id, call.businessId);
      } else if (aiResponse.nextAction === 'end') {
        await hangupCall(call_control_id);
      }
    } else {
      // Fallback vers l'ancien système si le cache n'est pas disponible
      const businessContext = await openaiService.getBusinessContext(call.businessId);
      if (businessContext) {
        const aiResponse = await openaiService.processConversation(
          call.id,
          transcription,
          businessContext,
          'fr'
        );

        // Jouer la réponse de l'IA
        if (aiResponse.response) {
          await playAudio(call_control_id, aiResponse.response);
        }

        // Actions spéciales selon la réponse
        if (aiResponse.nextAction === 'transfer') {
          await transferCall(call_control_id, call.businessId);
        } else if (aiResponse.nextAction === 'end') {
          await hangupCall(call_control_id);
        }
      }
    }

    return NextResponse.json({ status: 'processed' });
  } catch (error) {
    console.error('❌ Erreur handleCallAudio:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DTMF reçu (touches téléphone)
async function handleDTMF(data: any) {
  try {
    const { call_control_id, digit } = data;
    console.log(`🔢 DTMF reçu: ${digit}`);

    // Logique DTMF personnalisée
    // Par exemple: 0 = transférer à un humain
    if (digit === '0') {
      const call = await prisma.call.findFirst({
        where: { telnyxCallId: call_control_id }
      });
      
      if (call) {
        await transferCall(call_control_id, call.businessId);
      }
    }

    return NextResponse.json({ status: 'dtmf_handled' });
  } catch (error) {
    console.error('❌ Erreur handleDTMF:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES TELNYX
// ============================================================================

async function makeTelnyxRequest(endpoint: string, data: any) {
  const response = await fetch(`https://api.telnyx.com/v2${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telnyx API Error: ${error}`);
  }

  return response.json();
}

async function acceptCall(callControlId: string) {
  return makeTelnyxRequest(`/calls/${callControlId}/actions/answer`, {});
}

async function hangupCall(callControlId: string) {
  return makeTelnyxRequest(`/calls/${callControlId}/actions/hangup`, {});
}

async function startRecording(callControlId: string) {
  return makeTelnyxRequest(`/calls/${callControlId}/actions/record_start`, {
    format: 'wav',
    channels: 'dual',
  });
}

async function playAudio(callControlId: string, text: string) {
  // Utiliser TTS de Telnyx
  return makeTelnyxRequest(`/calls/${callControlId}/actions/speak`, {
    payload: text,
    voice: 'female',
    language: 'fr-FR',
  });
}

async function startSpeechRecognition(callControlId: string) {
  return makeTelnyxRequest(`/calls/${callControlId}/actions/transcription_start`, {
    transcription_engine: 'google',
    language: 'fr-FR',
    interim_results: false,
  });
}

// ============================================================================
// GESTION DE LA QUEUE D'APPELS
// ============================================================================

async function scheduleQueueCheck(callControlId: string, storeId: string, position: number) {
  // Programmer des vérifications périodiques (toutes les 30 secondes)
  const maxChecks = 20; // Maximum 10 minutes d'attente
  let currentCheck = 0;

  const queueChecker = async () => {
    currentCheck++;
    
    try {
      // Vérifier si l'appel peut maintenant être traité
      const capacityCheck = await CallLimitsService.canAcceptNewCall(storeId, '');
      
      if (capacityCheck.canAccept) {
        // Une place s'est libérée ! Retirer de la queue et traiter
        const nextCall = await CallLimitsService.getNextFromQueue(storeId);
        
        if (nextCall && nextCall.telnyxCallId === callControlId) {
          console.log(`✅ Appel ${callControlId} retiré de la queue - traitement en cours`);
          
          // Jouer message de prise en charge
          await playAudio(callControlId, 'Un conseiller est maintenant disponible. Je vous mets en relation.');
          
          // Traiter l'appel normalement (créer session, etc.)
          await processCallFromQueue(nextCall, storeId);
          return;
        }
      }
      
      // Vérifier le timeout ou continuer l'attente
      if (currentCheck >= maxChecks) {
        // Timeout atteint - raccrocher avec message
        await playAudio(callControlId, 'Le temps d\'attente maximal a été dépassé. Merci de rappeler plus tard.');
        
        // Retirer de la queue et raccrocher
        await CallLimitsService.removeFromQueue(storeId, callControlId);
        await hangupCall(callControlId);
        return;
      }
      
      // Programmer la prochaine vérification
      setTimeout(queueChecker, 30000); // 30 secondes
      
      // Optionnel: jouer un message de patience
      if (currentCheck % 4 === 0) { // Toutes les 2 minutes
        await playAudio(callControlId, 'Merci de patienter, vous êtes toujours en file d\'attente.');
      }
      
    } catch (error) {
      console.error('❌ Erreur vérification queue:', error);
      // En cas d'erreur, retirer de la queue et raccrocher
      await CallLimitsService.removeFromQueue(storeId, callControlId);
      await hangupCall(callControlId);
    }
  };

  // Démarrer les vérifications après 30 secondes
  setTimeout(queueChecker, 30000);
}

async function processCallFromQueue(queuedCallData: any, storeId: string) {
  try {
    const { callId, telnyxCallId, fromNumber, toNumber } = queuedCallData;
    
    // Récupérer les données de la boutique
    let storeData = null;
    try {
      storeData = await StoreCacheService.getCachedStoreData(storeId);
    } catch (error) {
      console.error('❌ Erreur chargement cache boutique pour queue:', error);
    }

    // Créer l'enregistrement d'appel en base
    const call = await prisma.call.create({
      data: {
        id: callId,
        telnyxCallId: telnyxCallId,
        businessId: storeData?.businessId || '',
        phoneNumberId: '', // À compléter si nécessaire
        fromNumber: fromNumber,
        toNumber: toNumber,
        status: 'ANSWERED', // Directement answered car déjà accepté
        startTime: new Date(),
      }
    });

    // Créer la session Redis avec données optimisées
    await CallSessionManager.startCall({
      callId: call.id,
      telnyxCallId: telnyxCallId,
      businessId: storeData?.businessId || '',
      storeId: storeId,
      fromNumber: fromNumber,
      toNumber: toNumber,
      businessData: storeData ? {
        name: storeData.businessName,
        businessCategory: storeData.businessCategory,
        storeName: storeData.storeName,
        services: storeData.services || [],
        products: storeData.products || [],
        consultations: storeData.consultations || [],
        aiConfig: {
          personality: storeData.aiPersonality,
          instructions: storeData.aiInstructions,
          language: storeData.aiLanguage
        }
      } : {
        name: 'Boutique',
        businessCategory: 'RETAIL',
        services: []
      }
    });

    // Démarrer l'enregistrement
    await startRecording(telnyxCallId);

    // Démarrer la conversation IA
    const welcomeMessage = await startAIConversation(call.id, storeData?.businessId || '', 'fr');
    
    // Jouer le message de bienvenue
    await playAudio(telnyxCallId, welcomeMessage);
    
    // Activer la détection vocale
    await startSpeechRecognition(telnyxCallId);

    console.log(`✅ Appel de queue traité avec succès: ${call.id}`);
    
  } catch (error) {
    console.error('❌ Erreur traitement appel de queue:', error);
    await hangupCall(queuedCallData.telnyxCallId);
  }
}

// Traiter le prochain appel en queue quand une place se libère
async function processNextInQueue(storeId: string) {
  try {
    console.log(`🔄 Vérification queue pour place libérée - Store: ${storeId}`);
    
    // Vérifier s'il y a de la place et des appels en attente
    const capacityCheck = await CallLimitsService.canAcceptNewCall(storeId, '');
    
    if (capacityCheck.canAccept) {
      // Récupérer le prochain appel de la queue
      const nextCall = await CallLimitsService.getNextFromQueue(storeId);
      
      if (nextCall) {
        console.log(`📤 Traitement du prochain appel de la queue: ${nextCall.telnyxCallId}`);
        
        // Jouer message de prise en charge immédiatement
        await playAudio(nextCall.telnyxCallId, 'Un conseiller est maintenant disponible. Je vous mets en relation immédiatement.');
        
        // Traiter l'appel
        await processCallFromQueue(nextCall, storeId);
      } else {
        console.log(`📋 Aucun appel en queue pour le store: ${storeId}`);
      }
    } else {
      console.log(`🚫 Aucune place disponible pour traiter la queue - Store: ${storeId}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur traitement queue libérée:', error);
  }
}

async function transferCall(callControlId: string, businessId: string) {
  try {
    console.log(`🔄 Transfert d'appel pour business: ${businessId}`);
    
    // Chercher la configuration de renvoi d'appel pour ce business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        stores: {
          include: {
            settings: true
          }
        }
      }
    });

    if (business && business.stores[0]) {
      const settings = business.stores[0].settings as any;
      const callForwarding = settings?.callForwarding;
      
      if (callForwarding?.enabled && callForwarding?.forwardToNumber) {
        // Jouer le message de transfert
        await playAudio(callControlId, 'Je vous transfère vers un conseiller. Veuillez patienter...');
        
        // Faire le transfert vers le numéro configuré
        await makeTelnyxRequest(`/calls/${callControlId}/actions/bridge`, {
          to: callForwarding.forwardToNumber,
          from: business.stores[0].phoneNumbers?.[0]?.number || '+33123456789',
          timeout_secs: callForwarding.noAnswerTimeout || 30
        });
        
        console.log(`✅ Appel transféré vers: ${callForwarding.forwardToNumber}`);
        return;
      }
    }
    
    // Si pas de configuration de transfert, jouer un message et raccrocher
    await playAudio(callControlId, 'Désolé, aucun conseiller n\'est disponible pour le moment. Merci de rappeler plus tard.');
    await hangupCall(callControlId);
    
  } catch (error) {
    console.error('❌ Erreur transfert d\'appel:', error);
    // En cas d'erreur, raccrocher proprement
    await playAudio(callControlId, 'Une erreur technique est survenue. Merci de rappeler plus tard.');
    await hangupCall(callControlId);
  }
}