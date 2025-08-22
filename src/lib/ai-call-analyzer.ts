// ============================================================================
// AI CALL ANALYZER - Analyse IA complète des transcripts d'appels
// ============================================================================

import { openaiService } from './openai';
import { redisService } from './redis';
import { loadCompleteStoreData, buildAIContext, CompleteStoreData } from './store-data-loader';
import { openaiTracking } from './openai-tracking';

export interface CallAnalysisResult {
  // COMMANDES DÉTECTÉES
  orders: Array<{
    items: Array<{
      productId?: string;
      name: string;
      quantity: number;
      size?: string;
      customizations?: Array<{
        type: 'add' | 'remove';
        name: string;
        price: number;
      }>;
      finalPrice: number;
      notes?: string;
    }>;
    deliveryType: 'dine-in' | 'takeaway' | 'delivery' | 'pickup';
    total: number;
    notes?: string;
    urgency: 'normal' | 'high' | 'emergency';
  }>;

  // SERVICES DEMANDÉS
  services: Array<{
    serviceId?: string;
    name: string;
    requestedDate?: string;
    requestedTime?: string;
    duration?: number;
    price: number;
    notes?: string;
    urgency: 'normal' | 'high' | 'emergency';
  }>;

  // CONSULTATIONS
  consultations: Array<{
    consultationId?: string;
    name: string;
    problem: string;
    urgency: 'normal' | 'high' | 'emergency';
    aiScore: number;
    recommendation: string;
    expertiseRequired?: string;
  }>;

  // SIGNALEMENTS
  signalements: Array<{
    type: 'complaint';
    category: 'produit_defectueux' | 'service_insatisfaisant' | 'erreur_facturation' | 'autre';
    title: string;
    description: string;
    urgency: 'faible' | 'moyen' | 'eleve' | 'critique';
    requestedActions: string[];
    proposedCompensation?: string;
    refundAmount?: number;
  }>;

  // CONVERSATION
  conversation: {
    sentiment: 'positive' | 'neutral' | 'negative';
    satisfaction: number; // 1-10
    summary: string;
    keyTopics: string[];
    followUpRequired: boolean;
    language: string;
  };

  // MÉTADONNÉES
  audioFiles: string[];
  metadata: {
    duration?: string;
    confidence: number;
    processingTime: string;
    storeId: string;
    businessId: string;
  };
}

/**
 * Analyse un transcript d'appel complet avec contexte boutique
 */
export async function analyzeCallRecording(
  callId: string,
  recordingUrl: string,
  transcript: string
): Promise<CallAnalysisResult> {
  try {
    console.log(`🤖 Analyse IA appel: ${callId}`);
    
    // 1. RÉCUPÉRER SESSION D'APPEL
    const callSession = await redisService.getCallSession(callId);
    if (!callSession) {
      throw new Error(`Session d'appel ${callId} non trouvée`);
    }

    // 2. CHARGER DONNÉES BOUTIQUE COMPLÈTES
    let storeData: CompleteStoreData & any;
    
    // Vérifier cache Redis d'abord
    const cachedData = await redisService.getCachedStoreData(callSession.storeId);
    
    if (cachedData && cachedData.lastUpdated) {
      // Vérifier si cache pas trop vieux (6h)
      const cacheAge = Date.now() - new Date(cachedData.lastUpdated).getTime();
      if (cacheAge < 6 * 60 * 60 * 1000) { // 6 heures
        storeData = cachedData;
        console.log(`📦 Utilisation cache Redis: ${callSession.storeId}`);
      }
    }
    
    // Si pas de cache valide, charger depuis base
    if (!storeData) {
      console.log(`📊 Chargement données fraîches: ${callSession.storeId}`);
      const freshData = await loadCompleteStoreData(callSession.storeId);
      const aiContext = buildAIContext(freshData);
      
      storeData = {
        ...freshData,
        ...aiContext
      };
      
      // Mettre en cache pour les prochains appels
      await redisService.cacheStoreData(callSession.storeId, storeData);
    }

    // 3. CONSTRUIRE PROMPT D'ANALYSE COMPLET
    const analysisPrompt = buildAnalysisPrompt(storeData, transcript, recordingUrl);

    // 4. APPEL OPENAI POUR ANALYSE
    const startTime = Date.now();
    const completion = await openaiService.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: analysisPrompt
        },
        {
          role: 'user',
          content: `Analyse ce transcript complet d'appel:\n\n"${transcript}"`
        }
      ],
      max_tokens: 1500,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    const duration = (Date.now() - startTime) / 1000;

    // TRACKING OPENAI - Enregistrer l'utilisation
    if (completion.usage) {
      try {
        await openaiTracking.trackUsage({
          storeId: callSession.storeId,
          businessId: callSession.businessId,
          customerId: callSession.customerId,
          callId: callId,
          operation: 'call_analysis',
          model: 'gpt-4o-mini',
          tokensInput: completion.usage.prompt_tokens || 0,
          tokensOutput: completion.usage.completion_tokens || 0,
          duration,
          success: true,
          metadata: {
            transcript_length: transcript.length,
            confidence: 0.8, // sera mis à jour plus tard
            max_tokens: 1500,
            temperature: 0.2
          }
        });
      } catch (trackingError) {
        console.error('❌ Erreur tracking OpenAI:', trackingError);
      }
    }

    const analysisResult = completion.choices[0]?.message?.content;
    if (!analysisResult) {
      throw new Error('Pas de réponse de l\'IA');
    }

    // 5. PARSER ET VALIDER RÉSULTAT
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON IA:', parseError);
      throw new Error('Résultat IA invalide');
    }

    // 6. ENRICHIR ET VALIDER DONNÉES
    const enrichedResult: CallAnalysisResult = {
      orders: (parsedResult.orders || []).map((order: any) => ({
        items: (order.items || []).map((item: any) => ({
          productId: findProductId(item.name, storeData.products),
          name: item.name || 'Article non spécifié',
          quantity: Math.max(1, parseInt(item.quantity) || 1),
          size: item.size || undefined,
          customizations: item.customizations || [],
          finalPrice: parseFloat(item.finalPrice) || 0,
          notes: item.notes || undefined
        })),
        deliveryType: order.deliveryType || 'dine-in',
        total: parseFloat(order.total) || 0,
        notes: order.notes || undefined,
        urgency: order.urgency || 'normal'
      })),

      services: (parsedResult.services || []).map((service: any) => ({
        serviceId: findServiceId(service.name, storeData.services),
        name: service.name || 'Service non spécifié',
        requestedDate: service.requestedDate || undefined,
        requestedTime: service.requestedTime || undefined,
        duration: parseInt(service.duration) || undefined,
        price: parseFloat(service.price) || 0,
        notes: service.notes || undefined,
        urgency: service.urgency || 'normal'
      })),

      consultations: (parsedResult.consultations || []).map((consultation: any) => ({
        consultationId: findConsultationId(consultation.name, storeData.consultations),
        name: consultation.name || 'Consultation générale',
        problem: consultation.problem || 'Problème non spécifié',
        urgency: consultation.urgency || 'normal',
        aiScore: Math.min(100, Math.max(0, parseInt(consultation.aiScore) || 50)),
        recommendation: consultation.recommendation || 'Consultation recommandée',
        expertiseRequired: consultation.expertiseRequired || undefined
      })),

      signalements: (parsedResult.signalements || []).map((signalement: any) => ({
        type: 'complaint',
        category: signalement.category || 'autre',
        title: signalement.title || 'Signalement client',
        description: signalement.description || 'Description non fournie',
        urgency: signalement.urgency || 'moyen',
        requestedActions: Array.isArray(signalement.requestedActions) 
          ? signalement.requestedActions 
          : [signalement.requestedActions || 'Traitement requis'],
        proposedCompensation: signalement.proposedCompensation || undefined,
        refundAmount: signalement.refundAmount ? parseFloat(signalement.refundAmount) : undefined
      })),

      conversation: {
        sentiment: parsedResult.conversation?.sentiment || 'neutral',
        satisfaction: Math.min(10, Math.max(1, parseInt(parsedResult.conversation?.satisfaction) || 5)),
        summary: parsedResult.conversation?.summary || 'Résumé non disponible',
        keyTopics: Array.isArray(parsedResult.conversation?.keyTopics) 
          ? parsedResult.conversation.keyTopics 
          : ['conversation'],
        followUpRequired: parsedResult.conversation?.followUpRequired || false,
        language: parsedResult.conversation?.language || 'fr'
      },

      audioFiles: [recordingUrl],
      metadata: {
        duration: callSession.endTime && callSession.startTime 
          ? calculateDuration(callSession.startTime, callSession.endTime)
          : undefined,
        confidence: Math.min(1, Math.max(0, parseFloat(parsedResult.metadata?.confidence) || 0.8)),
        processingTime: new Date().toISOString(),
        storeId: callSession.storeId,
        businessId: callSession.businessId
      }
    };

    console.log(`✅ Analyse IA terminée: ${enrichedResult.orders.length} commandes, ${enrichedResult.services.length} services, ${enrichedResult.signalements.length} signalements`);
    
    return enrichedResult;

  } catch (error) {
    console.error(`❌ Erreur analyse IA appel ${callId}:`, error);
    
    // TRACKING OPENAI - Enregistrer l'erreur
    const callSession = await redisService.getCallSession(callId);
    if (callSession) {
      try {
        await openaiTracking.trackUsage({
          storeId: callSession.storeId,
          businessId: callSession.businessId,
          customerId: callSession.customerId,
          callId: callId,
          operation: 'call_analysis',
          model: 'gpt-4o-mini',
          tokensInput: 0,
          tokensOutput: 0,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            transcript_length: transcript?.length || 0,
            error_type: 'analysis_failed'
          }
        });
      } catch (trackingError) {
        console.error('❌ Erreur tracking OpenAI error:', trackingError);
      }
    }
    
    // Retourner résultat minimal en cas d'erreur
    return {
      orders: [],
      services: [],
      consultations: [],
      signalements: [],
      conversation: {
        sentiment: 'neutral',
        satisfaction: 5,
        summary: 'Erreur lors de l\'analyse automatique',
        keyTopics: ['erreur'],
        followUpRequired: true,
        language: 'fr'
      },
      audioFiles: [recordingUrl],
      metadata: {
        confidence: 0,
        processingTime: new Date().toISOString(),
        storeId: callSession?.storeId || '',
        businessId: callSession?.businessId || ''
      }
    };
  }
}

/**
 * Construit le prompt d'analyse personnalisé pour la boutique
 */
function buildAnalysisPrompt(storeData: CompleteStoreData & any, transcript: string, recordingUrl: string): string {
  const currentTime = new Date().toLocaleString('fr-FR', { 
    timeZone: storeData.timezone || 'Europe/Paris' 
  });

  return `Tu es un expert en analyse de conversations téléphoniques pour ${storeData.businessName} - ${storeData.storeName}.

CONTEXTE BOUTIQUE COMPLET:
${storeData.businessContext}

CONFIGURATION IA PERSONNALISÉE:
- Personnalité: ${storeData.aiPersonality}
- Type de voix: ${storeData.voiceType}
- Style: ${storeData.voiceStyle}
- Niveau automation: ${storeData.automationLevel}%

CATALOGUE PRODUITS DISPONIBLES:
${storeData.productsContext}

SERVICES DISPONIBLES:
${storeData.servicesContext}

CONSULTATIONS DISPONIBLES:
${storeData.consultationsContext}

CONTEXTE TEMPOREL:
- Heure actuelle: ${currentTime}
- Timezone: ${storeData.timezone}
- Devise: ${storeData.currency}

INSTRUCTIONS D'ANALYSE:
1. Identifie TOUTES les commandes mentionnées avec produits exacts du catalogue
2. Détecte TOUS les services demandés avec référence au catalogue services
3. Repère TOUTES les consultations souhaitées
4. Identifie TOUS les signalements, plaintes, problèmes mentionnés
5. Analyse le sentiment général et satisfaction client
6. Utilise UNIQUEMENT les prix et informations du contexte fourni
7. Respecte les disponibilités indiquées (DISPONIBLE/INDISPONIBLE)
8. Détecte l'urgence selon le ton et les mots utilisés

RETOURNE UN JSON STRUCTURÉ COMPLET:
{
  "orders": [
    {
      "items": [
        {
          "name": "nom_exact_du_catalogue",
          "quantity": 2,
          "size": "M|L|XL_si_mentionné",
          "customizations": [
            {
              "type": "add|remove",
              "name": "nom_customisation",
              "price": 2.50
            }
          ],
          "finalPrice": 13.50,
          "notes": "commentaires_spéciaux"
        }
      ],
      "deliveryType": "dine-in|takeaway|delivery|pickup",
      "total": 27.00,
      "notes": "instructions_livraison_ou_préparation",
      "urgency": "normal|high|emergency"
    }
  ],
  "services": [
    {
      "name": "nom_exact_du_catalogue_services",
      "requestedDate": "2024-01-15",
      "requestedTime": "14:30",
      "duration": 60,
      "price": 45.00,
      "notes": "demandes_spéciales",
      "urgency": "normal|high|emergency"
    }
  ],
  "consultations": [
    {
      "name": "type_consultation_du_catalogue",
      "problem": "description_problème_exposé",
      "urgency": "normal|high|emergency",
      "aiScore": 85,
      "recommendation": "action_recommandée",
      "expertiseRequired": "niveau_expertise_requis"
    }
  ],
  "signalements": [
    {
      "category": "produit_defectueux|service_insatisfaisant|erreur_facturation|autre",
      "title": "titre_court_du_problème",
      "description": "description_détaillée_du_signalement",
      "urgency": "faible|moyen|eleve|critique",
      "requestedActions": ["action1", "action2"],
      "proposedCompensation": "compensation_suggérée",
      "refundAmount": 15.50
    }
  ],
  "conversation": {
    "sentiment": "positive|neutral|negative",
    "satisfaction": 8,
    "summary": "résumé_concis_de_la_conversation",
    "keyTopics": ["commande", "livraison", "satisfaction"],
    "followUpRequired": true,
    "language": "fr"
  },
  "metadata": {
    "confidence": 0.95
  }
}

IMPORTANT:
- Utilise UNIQUEMENT les produits, services et consultations listés dans le contexte
- Respecte les prix exacts du catalogue (pas d'invention)
- Détecte l'urgence selon les mots-clés: "urgent", "rapidement", "problème grave", etc.
- Si informations manquantes, mets des valeurs par défaut logiques
- Sois précis sur les quantités et montants`;
}

// HELPERS POUR ENRICHISSEMENT DES DONNÉES

function findProductId(productName: string, products: any[]): string | undefined {
  const found = products.find(p => 
    p.name.toLowerCase().includes(productName.toLowerCase()) ||
    productName.toLowerCase().includes(p.name.toLowerCase())
  );
  return found?.id;
}

function findServiceId(serviceName: string, services: any[]): string | undefined {
  const found = services.find(s => 
    s.name.toLowerCase().includes(serviceName.toLowerCase()) ||
    serviceName.toLowerCase().includes(s.name.toLowerCase())
  );
  return found?.id;
}

function findConsultationId(consultationName: string, consultations: any[]): string | undefined {
  const found = consultations.find(c => 
    c.name.toLowerCase().includes(consultationName.toLowerCase()) ||
    consultationName.toLowerCase().includes(c.name.toLowerCase())
  );
  return found?.id;
}

function calculateDuration(startTime: string, endTime: string): string {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffSec / 60);
    const seconds = diffSec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } catch {
    return '0:00';
  }
}