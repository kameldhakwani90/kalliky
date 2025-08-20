// ============================================================================
// API PROCESS CALL - Traitement post-appel avec analyse IA complète
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeCallRecording, CallAnalysisResult } from '@/lib/ai-call-analyzer';
import { TrialLimitsMiddleware } from '@/lib/middleware/trial-limits';

interface SavedEntity {
  type: 'order' | 'consultation' | 'signalement' | 'conversation';
  id: string;
  data: any;
}

// POST - Traiter un appel avec analyse IA
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;
    console.log(`🤖 Démarrage traitement post-appel: ${callId}`);

    // 1. RÉCUPÉRER DONNÉES APPEL
    const call = await prisma.call.findFirst({
      where: {
        metadata: {
          path: ['callControlId'],
          equals: callId
        }
      },
      include: {
        customer: true,
        business: {
          include: {
            stores: true
          }
        }
      }
    });

    if (!call) {
      return NextResponse.json(
        { error: 'Appel non trouvé' },
        { status: 404 }
      );
    }

    // 2. VÉRIFIER LIMITES TRIAL AVANT TRAITEMENT IA
    console.log(`🔍 Vérification limites trial pour business: ${call.businessId}`);
    const trialCheck = await TrialLimitsMiddleware.checkBeforeTelnyxCall(call.businessId);
    
    if (!trialCheck.canProceed) {
      console.log('❌ Traitement bloqué par limites trial:', trialCheck.error);
      return NextResponse.json(
        { 
          error: 'Trial limits exceeded', 
          details: trialCheck.error,
          shouldUpgrade: true
        },
        { status: 402 } // Payment Required
      );
    }

    // Vérifier qu'on a un recordingUrl et transcript
    if (!call.recordingUrl) {
      return NextResponse.json(
        { error: 'Pas d\'enregistrement audio disponible' },
        { status: 400 }
      );
    }

    // Pour l'instant, si pas de transcript, on simule avec contenu par défaut
    const transcript = call.transcript || 'Transcript non disponible - analyse limitée';

    // 2. ANALYSER AVEC IA
    console.log(`🧠 Analyse IA en cours...`);
    const analysis: CallAnalysisResult = await analyzeCallRecording(
      callId,
      call.recordingUrl,
      transcript
    );

    // 3. SAUVEGARDER RÉSULTATS EN BASE
    const savedEntities: SavedEntity[] = [];

    // SAUVEGARDER COMMANDES
    for (const orderData of analysis.orders) {
      try {
        const order = await prisma.order.create({
          data: {
            orderNumber: `AI-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            customerId: call.customerId,
            businessId: call.businessId,
            storeId: analysis.metadata.storeId,
            status: 'PENDING_CONFIRMATION',
            type: 'PHONE_ORDER',
            totalAmount: orderData.total,
            items: orderData.items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.finalPrice,
              size: item.size,
              customizations: item.customizations,
              notes: item.notes
            })),
            notes: orderData.notes || '',
            metadata: {
              source: 'ai_call_analysis',
              callId: call.id,
              aiConfidence: analysis.metadata.confidence,
              deliveryType: orderData.deliveryType,
              urgency: orderData.urgency,
              analysisTimestamp: analysis.metadata.processingTime
            }
          }
        });

        savedEntities.push({
          type: 'order',
          id: order.id,
          data: order
        });

        console.log(`📦 Commande créée: ${order.orderNumber}`);

      } catch (error) {
        console.error('❌ Erreur création commande:', error);
      }
    }

    // SAUVEGARDER CONSULTATIONS
    for (const consultData of analysis.consultations) {
      try {
        const consultation = await prisma.consultation.create({
          data: {
            customerId: call.customerId,
            businessId: call.businessId,
            storeId: analysis.metadata.storeId,
            status: 'PENDING_CONFIRMATION',
            type: consultData.name,
            description: consultData.problem,
            requestedDate: consultData.requestedDate ? new Date(consultData.requestedDate) : null,
            notes: consultData.recommendation,
            metadata: {
              source: 'ai_call_analysis',
              callId: call.id,
              aiScore: consultData.aiScore,
              urgency: consultData.urgency,
              expertiseRequired: consultData.expertiseRequired,
              analysisTimestamp: analysis.metadata.processingTime
            }
          }
        });

        savedEntities.push({
          type: 'consultation',
          id: consultation.id,
          data: consultation
        });

        console.log(`💬 Consultation créée: ${consultation.id}`);

      } catch (error) {
        console.error('❌ Erreur création consultation:', error);
      }
    }

    // SAUVEGARDER SIGNALEMENTS
    for (const signalement of analysis.signalements) {
      try {
        const complaint = await prisma.customerExchange.create({
          data: {
            customerId: call.customerId,
            businessId: call.businessId,
            storeId: analysis.metadata.storeId,
            type: 'COMPLAINT',
            title: signalement.title,
            description: signalement.description,
            status: 'OPEN',
            priority: signalement.urgency === 'critique' || signalement.urgency === 'eleve' ? 'HIGH' : 'NORMAL',
            metadata: {
              source: 'ai_call_analysis',
              callId: call.id,
              category: signalement.category,
              urgency: signalement.urgency,
              requestedActions: signalement.requestedActions,
              proposedCompensation: signalement.proposedCompensation,
              refundAmount: signalement.refundAmount,
              analysisTimestamp: analysis.metadata.processingTime
            }
          }
        });

        savedEntities.push({
          type: 'signalement',
          id: complaint.id,
          data: complaint
        });

        console.log(`⚠️ Signalement créé: ${complaint.id}`);

      } catch (error) {
        console.error('❌ Erreur création signalement:', error);
      }
    }

    // SAUVEGARDER SESSION CONVERSATION IA
    try {
      const conversationSession = await prisma.aIConversationSession.create({
        data: {
          id: `ai_call_${call.id}`,
          customerId: call.customerId,
          businessId: call.businessId,
          callId: call.id,
          conversationData: [], // Sera rempli par les données Redis si disponibles
          extractedData: {
            sentiment: analysis.conversation.sentiment,
            satisfaction: analysis.conversation.satisfaction,
            summary: analysis.conversation.summary,
            keyTopics: analysis.conversation.keyTopics,
            followUpRequired: analysis.conversation.followUpRequired,
            analysisResult: analysis
          },
          language: analysis.conversation.language,
          status: 'COMPLETED',
          metadata: {
            source: 'ai_call_analysis',
            confidence: analysis.metadata.confidence,
            processingTime: analysis.metadata.processingTime,
            audioUrl: call.recordingUrl,
            transcriptLength: transcript.length
          }
        }
      });

      savedEntities.push({
        type: 'conversation',
        id: conversationSession.id,
        data: conversationSession
      });

      console.log(`🗣️ Session conversation IA créée: ${conversationSession.id}`);

    } catch (error) {
      console.error('❌ Erreur création session conversation:', error);
    }

    // 4. CRÉER ACTIVITY LOGS
    await createActivityLogs(savedEntities, call);

    // 5. DÉCLENCHER NOTIFICATIONS AUTOMATIQUES
    await triggerAutomaticNotifications(savedEntities, analysis, call);

    // 6. METTRE À JOUR CALL AVEC STATUT TRAITÉ
    await prisma.call.update({
      where: { id: call.id },
      data: {
        metadata: {
          ...(call.metadata as any || {}),
          aiProcessed: true,
          aiProcessingTime: analysis.metadata.processingTime,
          entitiesCreated: savedEntities.length,
          analysisConfidence: analysis.metadata.confidence
        }
      }
    });

    console.log(`✅ Traitement terminé: ${savedEntities.length} entités créées`);

    // 8. ENREGISTRER L'UTILISATION TRIAL APRÈS SUCCÈS
    try {
      const recordResult = await TrialLimitsMiddleware.recordSuccessfulCall(call.businessId);
      if (recordResult) {
        console.log('📊 Usage trial enregistré avec succès');
      }
    } catch (error) {
      console.error('⚠️ Erreur enregistrement usage trial (non-bloquant):', error);
    }

    return NextResponse.json({
      success: true,
      callId: call.id,
      entitiesCreated: savedEntities.length,
      entities: savedEntities.map(e => ({ type: e.type, id: e.id })),
      analysis: {
        orders: analysis.orders.length,
        services: analysis.services.length,
        consultations: analysis.consultations.length,
        signalements: analysis.signalements.length,
        sentiment: analysis.conversation.sentiment,
        satisfaction: analysis.conversation.satisfaction,
        confidence: analysis.metadata.confidence
      }
    });

  } catch (error) {
    console.error(`❌ Erreur traitement appel ${callId}:`, error);
    
    return NextResponse.json(
      { 
        error: 'Erreur traitement appel',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// Créer des logs d'activité pour traçabilité
async function createActivityLogs(entities: SavedEntity[], call: any): Promise<void> {
  try {
    for (const entity of entities) {
      await prisma.activityLog.create({
        data: {
          storeId: call.business.stores[0]?.id,
          type: entity.type.toUpperCase(),
          entityId: entity.id,
          title: `${entity.type} créé automatiquement`,
          description: `${entity.type} généré par analyse IA d'appel`,
          metadata: {
            source: 'ai_call_analysis',
            callId: call.id,
            customerId: call.customerId,
            autoGenerated: true
          }
        }
      });
    }

    console.log(`📝 ${entities.length} activity logs créés`);

  } catch (error) {
    console.error('❌ Erreur création activity logs:', error);
  }
}

// Déclencher notifications automatiques selon templates configurés
async function triggerAutomaticNotifications(
  entities: SavedEntity[], 
  analysis: CallAnalysisResult, 
  call: any
): Promise<void> {
  try {
    // Pour chaque entité créée, vérifier s'il y a des templates de notification
    for (const entity of entities) {
      let activityType = '';
      
      switch (entity.type) {
        case 'order':
          activityType = 'ORDER_CONFIRMED';
          break;
        case 'consultation':
          activityType = 'CONSULTATION_BOOKED';
          break;
        case 'signalement':
          activityType = 'COMPLAINT_RECEIVED';
          break;
        default:
          continue;
      }

      // Récupérer templates configurés pour ce type
      const templates = await prisma.notificationTemplate.findMany({
        where: {
          storeId: analysis.metadata.storeId,
          activityType: activityType,
          isDefault: true
        }
      });

      // Envoyer notifications selon templates
      for (const template of templates) {
        try {
          await sendNotificationFromTemplate(template, entity, analysis, call);
        } catch (notifError) {
          console.error(`❌ Erreur envoi notification ${template.id}:`, notifError);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur notifications automatiques:', error);
  }
}

// Envoyer notification selon template configuré
async function sendNotificationFromTemplate(
  template: any, 
  entity: SavedEntity, 
  analysis: CallAnalysisResult, 
  call: any
): Promise<void> {
  try {
    // Variables pour remplacement dans template
    const variables = {
      customerName: call.customer?.firstName || call.customer?.name || 'Client',
      customerPhone: call.customer?.phone || 'Non fourni',
      businessName: call.business?.name || 'Boutique',
      entityId: entity.id,
      entityType: entity.type,
      callDate: new Date(call.createdAt).toLocaleDateString('fr-FR'),
      sentiment: analysis.conversation.sentiment,
      satisfaction: analysis.conversation.satisfaction,
      summary: analysis.conversation.summary
    };

    // Remplacer variables dans le body du template
    let processedBody = template.body;
    Object.entries(variables).forEach(([key, value]) => {
      processedBody = processedBody.replace(
        new RegExp(`{{${key}}}`, 'g'), 
        String(value)
      );
    });

    // Selon le type d'action, envoyer notification
    switch (template.actionType) {
      case 'EMAIL':
        if (call.customer?.email) {
          // Ici on pourrait intégrer avec le service email existant
          console.log(`📧 Email notification prévu: ${template.subject} → ${call.customer.email}`);
        }
        break;
        
      case 'SMS':
        if (call.customer?.phone) {
          // Ici on pourrait intégrer avec un service SMS
          console.log(`💬 SMS notification prévu: ${processedBody} → ${call.customer.phone}`);
        }
        break;
        
      case 'WEBHOOK':
        // Ici on pourrait faire un call webhook
        console.log(`🔗 Webhook notification prévu: ${template.name}`);
        break;
    }

    console.log(`🔔 Notification traitée: ${template.name} (${template.actionType})`);

  } catch (error) {
    console.error('❌ Erreur envoi notification template:', error);
  }
}