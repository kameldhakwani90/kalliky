// ============================================================================
// OPENAI SERVICE - IA conversationnelle pour appels vocaux
// ============================================================================

import OpenAI from 'openai';
import { redisService, CallSession } from './redis';
import { prisma } from './prisma';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface BusinessContext {
  id: string;
  name: string;
  businessCategory: string;
  description?: string;
  services: any[];
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: any;
}

export interface AIResponse {
  response: string;
  emotion?: 'neutral' | 'happy' | 'concerned' | 'excited';
  nextAction?: 'continue' | 'transfer' | 'schedule' | 'end';
  intent?: string;
  extractedInfo?: Record<string, any>;
}

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY not configured');
    }
  }

  // ============================================================================
  // SYSTEM PROMPTS PAR TYPE DE BUSINESS
  // ============================================================================

  private getSystemPrompt(businessContext: BusinessContext, language = 'fr'): string {
    const prompts = {
      RESTAURANT: {
        fr: `Tu es l'assistant IA de ${businessContext.name}, un restaurant ${businessContext.description || ''}. 
Tu réponds au téléphone pour prendre les réservations, informer sur les menus, et aider les clients.

INFORMATIONS DU RESTAURANT:
- Nom: ${businessContext.name}
- Services: ${businessContext.services.map(s => s.name).join(', ')}
- Adresse: ${businessContext.address || 'Non spécifiée'}
- Téléphone: ${businessContext.phone || 'Non spécifié'}

DIRECTIVES:
- Sois chaleureux(se), professionnel(le) et serviable
- Prends les réservations avec: nom, nombre de personnes, date, heure, contact
- Informe sur les menus, prix, allergènes si demandé
- Si tu ne sais pas quelque chose, propose de rappeler ou de transférer à un humain
- Parle naturellement, comme un vrai employé du restaurant
- Maximum 2-3 phrases par réponse pour rester naturel au téléphone`,

        en: `You are the AI assistant for ${businessContext.name}, a restaurant ${businessContext.description || ''}. 
You answer phone calls to take reservations, provide menu information, and help customers.

RESTAURANT INFO:
- Name: ${businessContext.name}
- Services: ${businessContext.services.map(s => s.name).join(', ')}
- Address: ${businessContext.address || 'Not specified'}
- Phone: ${businessContext.phone || 'Not specified'}

GUIDELINES:
- Be warm, professional and helpful
- Take reservations with: name, party size, date, time, contact
- Provide menu, pricing, allergen information when asked
- If unsure, offer to call back or transfer to human staff
- Speak naturally like a real restaurant employee
- Keep responses to 2-3 sentences for natural phone conversation`
      },

      RETAIL: {
        fr: `Tu es l'assistant IA de ${businessContext.name}, une boutique ${businessContext.description || ''}. 
Tu réponds aux questions clients sur les produits, stock, horaires et services.

INFORMATIONS BOUTIQUE:
- Nom: ${businessContext.name}
- Services: ${businessContext.services.map(s => s.name).join(', ')}
- Adresse: ${businessContext.address || 'Non spécifiée'}

DIRECTIVES:
- Sois professionnel(le) et informatif(ve)
- Renseigne sur les produits, disponibilités, prix si possible
- Donne les horaires d'ouverture et informations pratiques
- Pour les commandes spéciales, propose de rappeler
- Reste concis et efficace au téléphone`,

        en: `You are the AI assistant for ${businessContext.name}, a store ${businessContext.description || ''}. 
You answer customer questions about products, inventory, hours and services.

STORE INFO:
- Name: ${businessContext.name}
- Services: ${businessContext.services.map(s => s.name).join(', ')}
- Address: ${businessContext.address || 'Not specified'}

GUIDELINES:
- Be professional and informative
- Provide product info, availability, pricing when possible
- Give opening hours and practical information
- For special orders, offer to call back
- Keep responses concise and efficient`
      },

      MEDICAL: {
        fr: `Tu es l'assistant IA de ${businessContext.name}, un cabinet médical ${businessContext.description || ''}. 
Tu prends les rendez-vous et donnes des informations générales (NON médicales).

INFORMATIONS CABINET:
- Nom: ${businessContext.name}
- Services: ${businessContext.services.map(s => s.name).join(', ')}
- Adresse: ${businessContext.address || 'Non spécifiée'}

DIRECTIVES IMPORTANTES:
- NE DONNE JAMAIS de conseils médicaux
- Prends seulement les RDV: nom, téléphone, type de consultation souhaitée
- Pour urgences, dirige vers le 15 ou urgences
- Reste professionnel et rassurant
- Si question médicale, dirige vers le médecin`,

        en: `You are the AI assistant for ${businessContext.name}, a medical practice ${businessContext.description || ''}. 
You schedule appointments and provide general (NON-medical) information only.

PRACTICE INFO:
- Name: ${businessContext.name}
- Services: ${businessContext.services.map(s => s.name).join(', ')}
- Address: ${businessContext.address || 'Not specified'}

IMPORTANT GUIDELINES:
- NEVER give medical advice
- Only schedule appointments: name, phone, consultation type
- For emergencies, direct to emergency services
- Stay professional and reassuring
- For medical questions, direct to the doctor`
      },

      BEAUTY: {
        fr: `Tu es l'assistant IA de ${businessContext.name}, un salon de beauté ${businessContext.description || ''}. 
Tu prends les rendez-vous et informes sur les services.

SALON INFO:
- Nom: ${businessContext.name}
- Services: ${businessContext.services.map(s => s.name).join(', ')}
- Adresse: ${businessContext.address || 'Non spécifiée'}

DIRECTIVES:
- Sois accueillant(e) et professionnel(le)
- Prends RDV avec: service souhaité, date/heure préférée, nom, contact
- Informe sur les tarifs et durées des soins
- Propose des créneaux alternatifs si indisponible`,

        en: `You are the AI assistant for ${businessContext.name}, a beauty salon ${businessContext.description || ''}. 
You schedule appointments and provide service information.

SALON INFO:
- Name: ${businessContext.name}
- Services: ${businessContext.services.map(s => s.name).join(', ')}
- Address: ${businessContext.address || 'Not specified'}

GUIDELINES:
- Be welcoming and professional
- Schedule appointments with: desired service, preferred date/time, name, contact
- Provide pricing and treatment duration info
- Suggest alternative time slots if unavailable`
      }
    };

    const category = businessContext.businessCategory as keyof typeof prompts;
    const lang = language as keyof typeof prompts.RESTAURANT;
    
    return prompts[category]?.[lang] || prompts.RESTAURANT[lang];
  }

  // ============================================================================
  // CONVERSATION AVEC L'IA
  // ============================================================================

  // Nouvelle méthode utilisant le contexte optimisé en cache
  async processConversationWithCachedContext(
    callId: string,
    userMessage: string, 
    cachedContext: any,
    language = 'fr'
  ): Promise<AIResponse> {
    try {
      console.log(`🤖 Traitement conversation avec cache optimisé: ${callId}`);
      
      // Récupérer la session d'appel
      const session = await redisService.getCallSession(callId);
      if (!session) {
        throw new Error('Session d\'appel non trouvée');
      }

      // Construire le prompt système optimisé avec les données cachées
      const systemPrompt = this.buildOptimizedSystemPrompt(cachedContext, language);

      // Construire l'historique de conversation
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      // Ajouter l'historique existant
      session.aiContext.conversation.forEach(msg => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      });

      // Ajouter le nouveau message utilisateur
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Appel à OpenAI avec modèle optimisé
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 150,
        temperature: 0.7,
        frequency_penalty: 0.3,
        presence_penalty: 0.3,
      });

      const response = completion.choices[0]?.message?.content || 'Je ne comprends pas, pouvez-vous répéter ?';

      // Analyser l'intent avec le contexte optimisé
      const analysis = await this.analyzeUserIntentWithCache(userMessage, cachedContext);

      // Mettre à jour la conversation dans Redis
      await redisService.updateConversation(callId, {
        role: 'user',
        content: userMessage
      });

      await redisService.updateConversation(callId, {
        role: 'assistant',
        content: response
      });

      // Sauvegarder en base si information importante
      if (analysis.extractedInfo && Object.keys(analysis.extractedInfo).length > 0) {
        await this.saveConversationData(callId, analysis.extractedInfo);
      }

      return {
        response,
        emotion: 'neutral',
        nextAction: analysis.nextAction,
        intent: analysis.intent,
        extractedInfo: analysis.extractedInfo,
      };

    } catch (error) {
      console.error('❌ Erreur OpenAI conversation avec cache:', error);
      
      return {
        response: language === 'fr' 
          ? 'Excusez-moi, je rencontre un problème technique. Puis-je vous rappeler ?'
          : 'Sorry, I\'m experiencing technical difficulties. Can I call you back?',
        emotion: 'concerned',
        nextAction: 'transfer'
      };
    }
  }

  async processConversation(
    callId: string, 
    userMessage: string, 
    businessContext: BusinessContext,
    language = 'fr'
  ): Promise<AIResponse> {
    try {
      // Récupérer la session d'appel
      const session = await redisService.getCallSession(callId);
      if (!session) {
        throw new Error('Session d\'appel non trouvée');
      }

      // Construire l'historique de conversation
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(businessContext, language)
        }
      ];

      // Ajouter l'historique existant
      session.aiContext.conversation.forEach(msg => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      });

      // Ajouter le nouveau message utilisateur
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Appel à OpenAI
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 150,
        temperature: 0.7,
        frequency_penalty: 0.3,
        presence_penalty: 0.3,
      });

      const response = completion.choices[0]?.message?.content || 'Je ne comprends pas, pouvez-vous répéter ?';

      // Analyser l'intent et les informations
      const analysis = await this.analyzeUserIntent(userMessage, businessContext.businessCategory);

      // Mettre à jour la conversation dans Redis
      await redisService.updateConversation(callId, {
        role: 'user',
        content: userMessage
      });

      await redisService.updateConversation(callId, {
        role: 'assistant',
        content: response
      });

      // Sauvegarder en base si information importante
      if (analysis.extractedInfo && Object.keys(analysis.extractedInfo).length > 0) {
        await this.saveConversationData(callId, analysis.extractedInfo);
      }

      return {
        response,
        emotion: 'neutral',
        nextAction: analysis.nextAction,
        intent: analysis.intent,
        extractedInfo: analysis.extractedInfo,
      };

    } catch (error) {
      console.error('❌ Erreur OpenAI conversation:', error);
      
      return {
        response: language === 'fr' 
          ? 'Excusez-moi, je rencontre un problème technique. Puis-je vous rappeler ?'
          : 'Sorry, I\'m experiencing technical difficulties. Can I call you back?',
        emotion: 'concerned',
        nextAction: 'transfer'
      };
    }
  }

  // ============================================================================
  // HELPER METHODS POUR CONTEXTE OPTIMISÉ
  // ============================================================================

  private buildOptimizedSystemPrompt(cachedContext: any, language = 'fr'): string {
    if (language === 'fr') {
      return `Tu es l'assistant IA de ${cachedContext.businessName} (${cachedContext.storeName}).
${cachedContext.systemPrompt}

CONTEXTE ENTREPRISE:
${cachedContext.businessContext}

PRODUITS DISPONIBLES:
${cachedContext.productsContext}

SERVICES DISPONIBLES:
${cachedContext.servicesContext}

CONSULTATIONS DISPONIBLES:
${cachedContext.consultationsContext}

DIRECTIVES IMPORTANTES:
- Utilise les informations exactes fournies ci-dessus
- Sois précis sur les prix et disponibilités
- Maximum 2-3 phrases par réponse pour rester naturel au téléphone
- Si demande de transfert, dis "Je vous transfère vers un conseiller"
- Confirme toujours les détails importants (nom, téléphone, quantités, dates)
- Respecte la personnalité définie: ${cachedContext.aiPersonality || 'professionnel'}`;
    } else {
      return `You are the AI assistant for ${cachedContext.businessName} (${cachedContext.storeName}).
${cachedContext.systemPrompt}

BUSINESS CONTEXT:
${cachedContext.businessContext}

AVAILABLE PRODUCTS:
${cachedContext.productsContext}

AVAILABLE SERVICES:
${cachedContext.servicesContext}

AVAILABLE CONSULTATIONS:
${cachedContext.consultationsContext}

IMPORTANT GUIDELINES:
- Use the exact information provided above
- Be precise about prices and availability
- Maximum 2-3 sentences per response for natural phone conversation
- If transfer requested, say "I'm transferring you to an advisor"
- Always confirm important details (name, phone, quantities, dates)
- Respect defined personality: ${cachedContext.aiPersonality || 'professional'}`;
    }
  }

  private async analyzeUserIntentWithCache(
    message: string, 
    cachedContext: any
  ): Promise<{
    intent: string;
    nextAction: 'continue' | 'transfer' | 'schedule' | 'end';
    extractedInfo: Record<string, any>;
  }> {
    try {
      // Construire le contexte détaillé avec prix et descriptions
      const productsContext = cachedContext.products?.map((p: any) => 
        `${p.name} (${p.price}€${p.description ? ` - ${p.description}` : ''}${!p.available ? ' - INDISPONIBLE' : ''})`
      ).join('\n- ') || 'Aucun produit';

      const servicesContext = cachedContext.services?.map((s: any) => 
        `${s.name} (${s.price}€, ${s.duration}min${s.description ? ` - ${s.description}` : ''}${!s.available ? ' - INDISPONIBLE' : ''})`
      ).join('\n- ') || 'Aucun service';

      const consultationsContext = cachedContext.consultations?.map((c: any) => 
        `${c.name} (${c.price}€, ${c.duration}min${c.description ? ` - ${c.description}` : ''}${!c.available ? ' - INDISPONIBLE' : ''})`
      ).join('\n- ') || 'Aucune consultation';

      const currentTime = new Date().toLocaleString('fr-FR');
      const businessHours = cachedContext.businessHours ? JSON.stringify(cachedContext.businessHours) : 'Non défini';

      const prompt = `Analyse ce message client pour ${cachedContext.businessName} - ${cachedContext.storeName}:
"${message}"

CONTEXTE BOUTIQUE:
Heure actuelle: ${currentTime}
Horaires: ${businessHours}
Devise: ${cachedContext.currency || 'EUR'}
Taux de taxe: ${cachedContext.taxRate || 0.20}

PRODUITS DISPONIBLES:
- ${productsContext}

SERVICES DISPONIBLES:
- ${servicesContext}

CONSULTATIONS DISPONIBLES:
- ${consultationsContext}

INSTRUCTIONS D'EXTRACTION:
1. Identifie l'intention principale parmi: order, reservation, consultation, information, complaint, hours_inquiry, price_inquiry, availability_inquiry, callback_request, transfer_request, emergency
2. Extrais TOUTES les informations mentionnées: nom, prénom, téléphone, email, produits/services souhaités, quantités, dates, heures, commentaires spéciaux
3. Pour les prix, utilise ceux du contexte (pas d'invention)
4. Pour les disponibilités, respecte le statut "available"
5. Détecte les urgences ou demandes de transfert

RETOURNE UN JSON STRUCTURÉ:
{
  "intent": "intention_principale",
  "confidence": 0.95,
  "nextAction": "continue|transfer|schedule|end",
  "extractedInfo": {
    "customer": {
      "name": "nom_complet_si_donné",
      "firstName": "prénom_si_donné", 
      "lastName": "nom_si_donné",
      "phone": "téléphone_si_donné",
      "email": "email_si_donné"
    },
    "request": {
      "type": "order|reservation|consultation|information",
      "items": [
        {
          "name": "nom_produit_service",
          "quantity": 1,
          "price": 15.50,
          "notes": "commentaires_spéciaux"
        }
      ],
      "preferredDate": "date_si_mentionnée",
      "preferredTime": "heure_si_mentionnée",
      "urgency": "normal|high|emergency",
      "specialRequests": "demandes_spéciales"
    },
    "context": {
      "isBusinessHours": true,
      "estimatedTotal": 15.50,
      "needsFollowUp": true
    }
  }
}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.2,
      });

      const result = response.choices[0]?.message?.content;
      if (result) {
        try {
          const parsedResult = JSON.parse(result);
          
          // Validation et nettoyage du résultat
          return {
            intent: parsedResult.intent || 'general',
            nextAction: parsedResult.nextAction || 'continue',
            extractedInfo: parsedResult.extractedInfo || {}
          };
        } catch (parseError) {
          console.warn('⚠️ Erreur parsing JSON intent enrichi:', parseError);
        }
      }
    } catch (error) {
      console.error('❌ Erreur analyse intent enrichie:', error);
    }

    return {
      intent: 'general',
      nextAction: 'continue',
      extractedInfo: {}
    };
  }

  // ============================================================================
  // ANALYSE D'INTENT ET EXTRACTION D'INFORMATIONS
  // ============================================================================

  private async analyzeUserIntent(
    message: string, 
    businessType: string
  ): Promise<{
    intent: string;
    nextAction: 'continue' | 'transfer' | 'schedule' | 'end';
    extractedInfo: Record<string, any>;
  }> {
    try {
      const prompt = `Analyse ce message client pour un ${businessType}:
"${message}"

Retourne un JSON avec:
- intent: l'intention principale (reservation, information, complaint, etc.)
- nextAction: continue/transfer/schedule/end
- extractedInfo: informations importantes extraites (nom, téléphone, date, nombre personnes, etc.)

Exemple: {"intent": "reservation", "nextAction": "continue", "extractedInfo": {"name": "Martin", "guests": 4, "date": "vendredi soir"}}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      });

      const result = response.choices[0]?.message?.content;
      if (result) {
        try {
          return JSON.parse(result);
        } catch {
          console.warn('⚠️ Erreur parsing JSON intent');
        }
      }
    } catch (error) {
      console.error('❌ Erreur analyse intent:', error);
    }

    return {
      intent: 'general',
      nextAction: 'continue',
      extractedInfo: {}
    };
  }

  // ============================================================================
  // SAUVEGARDE DES DONNÉES DE CONVERSATION AVEC ACTIONS INTELLIGENTES
  // ============================================================================

  private async saveConversationData(callId: string, extractedInfo: Record<string, any>): Promise<void> {
    try {
      const session = await redisService.getCallSession(callId);
      if (!session) return;

      // Créer ou mettre à jour la session IA en base
      const conversationSession = await prisma.aIConversationSession.upsert({
        where: { callId },
        update: {
          extractedData: {
            ...extractedInfo,
            lastUpdate: new Date().toISOString(),
          },
        },
        create: {
          id: `ai_${callId}`,
          callId,
          businessId: session.businessId,
          customerId: session.customerId,
          conversationData: session.aiContext.conversation,
          extractedData: extractedInfo,
          language: session.aiContext.language,
          status: 'ACTIVE',
        },
      });

      // Actions intelligentes selon l'intent et les données extraites
      await this.processIntelligentActions(session, extractedInfo, conversationSession.id);

      console.log(`💾 Données conversation sauvegardées avec actions intelligentes: ${callId}`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde conversation enrichie:', error);
    }
  }

  // Traitement des actions intelligentes post-conversation
  private async processIntelligentActions(
    session: any, 
    extractedInfo: Record<string, any>, 
    conversationId: string
  ): Promise<void> {
    try {
      const intent = extractedInfo.intent;
      const customerData = extractedInfo.customer;
      const requestData = extractedInfo.request;

      // 1. Gestion du client - créer ou mettre à jour
      let customerId = session.customerId;
      if (customerData?.phone && !customerId) {
        customerId = await this.createOrUpdateCustomer(session.businessId, customerData);
      }

      // 2. Actions spécifiques selon l'intent
      switch (intent) {
        case 'order':
          await this.processOrderIntent(session, requestData, customerId, conversationId);
          break;
          
        case 'reservation':
          await this.processReservationIntent(session, requestData, customerId, conversationId);
          break;
          
        case 'consultation':
          await this.processConsultationIntent(session, requestData, customerId, conversationId);
          break;
          
        case 'callback_request':
          await this.processCallbackRequest(session, customerData, requestData, conversationId);
          break;
          
        case 'complaint':
          await this.processComplaintIntent(session, requestData, customerId, conversationId);
          break;
          
        case 'information':
        case 'price_inquiry':
        case 'hours_inquiry':
          await this.processInformationIntent(session, requestData, customerId, conversationId);
          break;
      }

      // 3. Déclencher les notifications automatiques si nécessaire
      if (this.shouldTriggerNotifications(intent, extractedInfo)) {
        await this.triggerIntelligentNotifications(session, intent, extractedInfo);
      }

    } catch (error) {
      console.error('❌ Erreur traitement actions intelligentes:', error);
    }
  }

  // Créer ou mettre à jour un client
  private async createOrUpdateCustomer(businessId: string, customerData: any): Promise<string | undefined> {
    try {
      const customer = await prisma.customer.upsert({
        where: {
          phone_businessId: {
            phone: customerData.phone,
            businessId: businessId
          }
        },
        update: {
          firstName: customerData.firstName || undefined,
          lastName: customerData.lastName || undefined,
          name: customerData.name || undefined,
          email: customerData.email || undefined,
          lastSeen: new Date(),
        },
        create: {
          phone: customerData.phone,
          businessId: businessId,
          firstName: customerData.firstName || undefined,
          lastName: customerData.lastName || undefined,
          name: customerData.name || undefined,
          email: customerData.email || undefined,
          firstSeen: new Date(),
          lastSeen: new Date(),
        }
      });

      console.log(`👤 Client traité: ${customer.id}`);
      return customer.id;
    } catch (error) {
      console.error('❌ Erreur gestion client:', error);
      return undefined;
    }
  }

  // Traitement commande
  private async processOrderIntent(session: any, requestData: any, customerId: string | undefined, conversationId: string): Promise<void> {
    try {
      if (!requestData?.items?.length) return;

      // Créer une commande en attente de confirmation
      const order = await prisma.order.create({
        data: {
          businessId: session.businessId,
          customerId: customerId,
          storeId: session.storeId,
          status: 'PENDING_CONFIRMATION',
          type: 'PHONE_ORDER',
          totalAmount: requestData.estimatedTotal || 0,
          items: requestData.items,
          notes: requestData.specialRequests || '',
          metadata: {
            conversationId,
            extractedFromCall: true,
            callId: session.callId,
            urgency: requestData.urgency || 'normal'
          }
        }
      });

      console.log(`📦 Commande créée en attente: ${order.id}`);
    } catch (error) {
      console.error('❌ Erreur création commande:', error);
    }
  }

  // Traitement réservation
  private async processReservationIntent(session: any, requestData: any, customerId: string | undefined, conversationId: string): Promise<void> {
    try {
      if (!requestData?.items?.length) return;

      const reservation = await prisma.reservation.create({
        data: {
          businessId: session.businessId,
          customerId: customerId,
          storeId: session.storeId,
          status: 'PENDING_CONFIRMATION',
          serviceId: requestData.items[0]?.id || null,
          requestedDate: requestData.preferredDate ? new Date(requestData.preferredDate) : null,
          requestedTime: requestData.preferredTime || null,
          notes: requestData.specialRequests || '',
          metadata: {
            conversationId,
            extractedFromCall: true,
            callId: session.callId,
            urgency: requestData.urgency || 'normal'
          }
        }
      });

      console.log(`📅 Réservation créée en attente: ${reservation.id}`);
    } catch (error) {
      console.error('❌ Erreur création réservation:', error);
    }
  }

  // Traitement consultation
  private async processConsultationIntent(session: any, requestData: any, customerId: string | undefined, conversationId: string): Promise<void> {
    try {
      const consultation = await prisma.consultation.create({
        data: {
          businessId: session.businessId,
          customerId: customerId,
          storeId: session.storeId,
          status: 'PENDING_CONFIRMATION',
          type: requestData.items?.[0]?.name || 'GENERAL',
          requestedDate: requestData.preferredDate ? new Date(requestData.preferredDate) : null,
          requestedTime: requestData.preferredTime || null,
          notes: requestData.specialRequests || '',
          metadata: {
            conversationId,
            extractedFromCall: true,
            callId: session.callId,
            urgency: requestData.urgency || 'normal'
          }
        }
      });

      console.log(`💬 Consultation créée en attente: ${consultation.id}`);
    } catch (error) {
      console.error('❌ Erreur création consultation:', error);
    }
  }

  // Traitement demande de rappel
  private async processCallbackRequest(session: any, customerData: any, requestData: any, conversationId: string): Promise<void> {
    try {
      await prisma.callbackRequest.create({
        data: {
          businessId: session.businessId,
          customerId: session.customerId,
          phone: customerData?.phone || 'Non fourni',
          preferredTime: requestData?.preferredTime || null,
          reason: requestData?.specialRequests || 'Demande de rappel',
          status: 'PENDING',
          priority: requestData?.urgency === 'emergency' ? 'HIGH' : 'NORMAL',
          metadata: {
            conversationId,
            extractedFromCall: true,
            callId: session.callId
          }
        }
      });

      console.log(`📞 Demande de rappel créée: ${session.callId}`);
    } catch (error) {
      console.error('❌ Erreur création demande rappel:', error);
    }
  }

  // Traitement plainte
  private async processComplaintIntent(session: any, requestData: any, customerId: string | undefined, conversationId: string): Promise<void> {
    try {
      await prisma.complaint.create({
        data: {
          businessId: session.businessId,
          customerId: customerId,
          storeId: session.storeId,
          type: 'PHONE_COMPLAINT',
          description: requestData?.specialRequests || 'Plainte reçue par téléphone',
          status: 'OPEN',
          priority: requestData?.urgency === 'emergency' ? 'HIGH' : 'NORMAL',
          metadata: {
            conversationId,
            extractedFromCall: true,
            callId: session.callId
          }
        }
      });

      console.log(`⚠️ Plainte créée: ${session.callId}`);
    } catch (error) {
      console.error('❌ Erreur création plainte:', error);
    }
  }

  // Traitement demande d'information
  private async processInformationIntent(session: any, requestData: any, customerId: string | undefined, conversationId: string): Promise<void> {
    try {
      // Log de la demande d'information pour analytics
      await prisma.informationRequest.create({
        data: {
          businessId: session.businessId,
          customerId: customerId,
          storeId: session.storeId,
          type: requestData?.type || 'GENERAL_INFO',
          question: requestData?.specialRequests || 'Demande d\'information',
          metadata: {
            conversationId,
            extractedFromCall: true,
            callId: session.callId
          }
        }
      });

      console.log(`ℹ️ Demande d'information loggée: ${session.callId}`);
    } catch (error) {
      console.error('❌ Erreur log information:', error);
    }
  }

  // Vérifier si on doit déclencher des notifications
  private shouldTriggerNotifications(intent: string, extractedInfo: any): boolean {
    const urgentIntents = ['emergency', 'complaint', 'callback_request'];
    const urgentRequests = extractedInfo.request?.urgency === 'emergency';
    
    return urgentIntents.includes(intent) || urgentRequests;
  }

  // Déclencher notifications intelligentes
  private async triggerIntelligentNotifications(session: any, intent: string, extractedInfo: any): Promise<void> {
    try {
      const activityType = this.mapIntentToActivityType(intent);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/notifications/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: session.storeId,
          businessId: session.businessId,
          activityType: activityType,
          activityData: {
            title: `${intent.toUpperCase()}: ${extractedInfo.customer?.name || 'Client'}`,
            description: extractedInfo.request?.specialRequests || `Nouveau ${intent} par téléphone`,
            urgency: extractedInfo.request?.urgency || 'normal',
            phoneNumber: extractedInfo.customer?.phone || 'Non fourni',
            callId: session.callId,
            timestamp: new Date().toISOString(),
            priority: extractedInfo.request?.urgency === 'emergency' ? 'HIGH' : 'NORMAL'
          }
        })
      });

      if (response.ok) {
        console.log(`🔔 Notifications intelligentes déclenchées pour: ${intent}`);
      }
    } catch (error) {
      console.error('❌ Erreur notifications intelligentes:', error);
    }
  }

  // Mapper intent vers type d'activité
  private mapIntentToActivityType(intent: string): string {
    const mapping: Record<string, string> = {
      'order': 'ORDER',
      'reservation': 'SERVICE',
      'consultation': 'CONSULTATION',
      'complaint': 'SIGNALEMENT',
      'emergency': 'SIGNALEMENT',
      'callback_request': 'SIGNALEMENT'
    };
    
    return mapping[intent] || 'SIGNALEMENT';
  }

  // ============================================================================
  // SYNTHÈSE VOCALE (TTS) POUR TELNYX
  // ============================================================================

  async generateSpeech(text: string, language = 'fr'): Promise<string> {
    try {
      // Pour l'instant, retourner le texte brut
      // À implémenter: conversion TTS avec Telnyx ou service externe
      return text;
    } catch (error) {
      console.error('❌ Erreur TTS:', error);
      return text;
    }
  }

  // ============================================================================
  // RÉCUPÉRATION DU CONTEXTE BUSINESS
  // ============================================================================

  async getBusinessContext(businessId: string): Promise<BusinessContext | null> {
    try {
      // Vérifier le cache Redis d'abord
      const cached = await redisService.getCachedBusinessData(businessId);
      if (cached) {
        return cached;
      }

      // Récupérer depuis la base de données
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          stores: {
            include: {
              services: true,
            },
          },
        },
      });

      if (!business) return null;

      const context: BusinessContext = {
        id: business.id,
        name: business.name,
        businessCategory: business.businessCategory,
        description: business.description || undefined,
        services: business.stores.flatMap(store => store.services),
        address: business.stores[0]?.address || undefined,
        phone: business.stores[0]?.phone || undefined,
        website: business.website || undefined,
      };

      // Mettre en cache pour 12h
      await redisService.cacheBusinessData(businessId, context);

      return context;
    } catch (error) {
      console.error('❌ Erreur récupération context business:', error);
      return null;
    }
  }
}

// Export singleton
export const openaiService = new OpenAIService();

// Helper pour démarrer une conversation avec contexte optimisé
export async function startAIConversation(
  callId: string, 
  businessId: string, 
  language = 'fr'
): Promise<string> {
  // Récupérer la session d'appel pour obtenir le storeId
  const callSession = await redisService.getCallSession(callId);
  let storeContext = null;
  
  if (callSession?.storeId) {
    try {
      const { StoreCacheService } = await import('./services/storeCacheService');
      storeContext = await StoreCacheService.getCachedStoreData(callSession.storeId);
    } catch (error) {
      console.error('❌ Erreur chargement contexte boutique pour bienvenue:', error);
    }
  }

  // Utiliser le contexte optimisé si disponible
  if (storeContext) {
    return generatePersonalizedWelcome(storeContext, language, callId);
  }

  // Fallback vers l'ancien système
  const businessContext = await openaiService.getBusinessContext(businessId);
  if (!businessContext) {
    return language === 'fr' 
      ? 'Bonjour, merci d\'appeler. Un moment s\'il vous plaît...'
      : 'Hello, thank you for calling. One moment please...';
  }

  const welcomeMessages = {
    RESTAURANT: {
      fr: `Bonjour et merci d'appeler ${businessContext.name}. Je suis votre assistante virtuelle. Comment puis-je vous aider aujourd'hui ?`,
      en: `Hello and thank you for calling ${businessContext.name}. I'm your virtual assistant. How can I help you today?`
    },
    RETAIL: {
      fr: `Bonjour, vous êtes bien chez ${businessContext.name}. Comment puis-je vous renseigner ?`,
      en: `Hello, you've reached ${businessContext.name}. How can I help you?`
    },
    MEDICAL: {
      fr: `Bonjour, cabinet ${businessContext.name}. Souhaitez-vous prendre un rendez-vous ?`,
      en: `Hello, ${businessContext.name} practice. Would you like to schedule an appointment?`
    },
    BEAUTY: {
      fr: `Bonjour et bienvenue chez ${businessContext.name}. Puis-je vous aider à prendre rendez-vous ?`,
      en: `Hello and welcome to ${businessContext.name}. Can I help you schedule an appointment?`
    }
  };

  const category = businessContext.businessCategory as keyof typeof welcomeMessages;
  const lang = language as keyof typeof welcomeMessages.RESTAURANT;
  
  const welcome = welcomeMessages[category]?.[lang] || welcomeMessages.RESTAURANT[lang];

  // Sauvegarder le message de bienvenue
  await redisService.updateConversation(callId, {
    role: 'assistant',
    content: welcome
  });

  return welcome;
}

// Génération de message de bienvenue ultra-personnalisé
async function generatePersonalizedWelcome(
  storeContext: any, 
  language = 'fr',
  callId: string
): Promise<string> {
  const currentHour = new Date().getHours();
  const isBusinessHours = checkBusinessHours(storeContext.businessHours, currentHour);
  
  let welcome = '';

  if (language === 'fr') {
    // Salutation selon l'heure
    const greeting = currentHour < 12 ? 'Bonjour' : 
                    currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';
    
    // Message personnalisé selon le type d'activité et ce qui est disponible
    const services = [];
    if (storeContext.products?.length > 0) services.push('nos produits');
    if (storeContext.services?.length > 0) services.push('nos services');
    if (storeContext.consultations?.length > 0) services.push('nos consultations');
    
    const serviceText = services.length > 0 
      ? ` Je peux vous renseigner sur ${services.join(', ')}.`
      : '';

    if (!isBusinessHours) {
      welcome = `${greeting}, vous appelez ${storeContext.businessName} - ${storeContext.storeName}. ` +
                `Nous sommes actuellement fermés, mais je peux prendre votre message ou vous donner des informations.${serviceText}`;
    } else {
      welcome = `${greeting} et merci d'appeler ${storeContext.businessName} - ${storeContext.storeName}. ` +
                `Je suis votre assistante IA.${serviceText} Comment puis-je vous aider ?`;
    }
  } else {
    // Version anglaise
    const greeting = currentHour < 12 ? 'Good morning' : 
                    currentHour < 18 ? 'Good afternoon' : 'Good evening';
    
    const services = [];
    if (storeContext.products?.length > 0) services.push('our products');
    if (storeContext.services?.length > 0) services.push('our services');
    if (storeContext.consultations?.length > 0) services.push('our consultations');
    
    const serviceText = services.length > 0 
      ? ` I can help you with ${services.join(', ')}.`
      : '';

    if (!isBusinessHours) {
      welcome = `${greeting}, you've reached ${storeContext.businessName} - ${storeContext.storeName}. ` +
                `We're currently closed, but I can take your message or provide information.${serviceText}`;
    } else {
      welcome = `${greeting} and thank you for calling ${storeContext.businessName} - ${storeContext.storeName}. ` +
                `I'm your AI assistant.${serviceText} How can I help you?`;
    }
  }

  // Sauvegarder le message de bienvenue personnalisé
  await redisService.updateConversation(callId, {
    role: 'assistant',
    content: welcome
  });

  return welcome;
}

// Helper pour vérifier les horaires d'ouverture
function checkBusinessHours(businessHours: any, currentHour: number): boolean {
  if (!businessHours || typeof businessHours !== 'object') return true;
  
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
  const todayHours = businessHours[dayOfWeek];
  
  if (!todayHours || !todayHours.open || !todayHours.close) return true;
  
  const openHour = parseInt(todayHours.open.split(':')[0]);
  const closeHour = parseInt(todayHours.close.split(':')[0]);
  
  return currentHour >= openHour && currentHour < closeHour;
}