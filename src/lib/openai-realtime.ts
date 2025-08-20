// ============================================================================
// OPENAI REALTIME API - IA conversationnelle temps réel
// ============================================================================

import WebSocket from 'ws';
import { redisService } from './redis';
import { prisma } from './prisma';

export interface RealtimeConfig {
  model: 'gpt-4o-realtime-preview' | 'gpt-4o-realtime-preview-2024-10-01';
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions: string;
  modalities: ('text' | 'audio')[];
  temperature: number;
  max_response_output_tokens: number;
  turn_detection: {
    type: 'server_vad';
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  };
}

export interface RealtimeSession {
  sessionId: string;
  callId: string;
  businessId: string;
  storeId: string;
  websocket?: WebSocket;
  config: RealtimeConfig;
  status: 'connecting' | 'connected' | 'active' | 'ended' | 'error';
  startedAt: Date;
  endedAt?: Date;
  conversationItems: Array<{
    id: string;
    type: 'message' | 'function_call' | 'function_call_output';
    role?: 'user' | 'assistant' | 'system';
    content?: Array<{
      type: 'input_text' | 'input_audio' | 'text' | 'audio';
      text?: string;
      audio?: string;
      transcript?: string;
    }>;
    status?: 'completed' | 'incomplete' | 'failed';
    createdAt: Date;
  }>;
  tools?: Array<{
    type: 'function';
    name: string;
    description: string;
    parameters: any;
  }>;
  errorCount: number;
  lastActivity: Date;
}

export class RealtimeManager {
  private static sessions = new Map<string, RealtimeSession>();
  private static websockets = new Map<string, WebSocket>();

  // Démarrer une nouvelle session Realtime
  static async startSession(config: {
    callControlId: string;
    callId: string;
    businessId: string;
    storeId: string;
    voice: string;
    language: string;
    personality: string;
    storeContext: any;
  }): Promise<RealtimeSession> {
    const sessionId = `realtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: RealtimeSession = {
      sessionId,
      callId: config.callId,
      businessId: config.businessId,
      storeId: config.storeId,
      config: {
        model: 'gpt-4o-realtime-preview',
        voice: config.voice as any,
        instructions: this.buildInstructions(config.storeContext, config.personality, config.language),
        modalities: ['text', 'audio'],
        temperature: 0.7,
        max_response_output_tokens: 1000,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      },
      status: 'connecting',
      startedAt: new Date(),
      conversationItems: []
    };

    // Créer connexion WebSocket vers OpenAI
    const ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    // Gérer les événements WebSocket
    ws.on('open', () => {
      console.log(`🔗 Connexion OpenAI Realtime établie: ${sessionId}`);
      session.status = 'connected';
      
      // Envoyer configuration initiale
      ws.send(JSON.stringify({
        type: 'session.update',
        session: session.config
      }));
    });

    ws.on('message', (data) => {
      this.handleOpenAIEvent(sessionId, JSON.parse(data.toString()));
    });

    ws.on('error', (error) => {
      console.error(`❌ Erreur WebSocket OpenAI: ${sessionId}`, error);
      session.status = 'error';
    });

    ws.on('close', () => {
      console.log(`🔌 Connexion fermée: ${sessionId}`);
      session.status = 'ended';
      session.endedAt = new Date();
      this.sessions.delete(sessionId);
      this.websockets.delete(sessionId);
    });

    this.sessions.set(sessionId, session);
    this.websockets.set(sessionId, ws);
    session.websocket = ws;

    return session;
  }

  // Gérer l'audio entrant depuis Telnyx
  static async handleAudioInput(callControlId: string, audioData: string) {
    // Trouver la session correspondante
    const session = Array.from(this.sessions.values()).find(s => 
      s.callId.includes(callControlId) // Match approximatif
    );

    if (!session || !session.websocket) {
      console.warn(`⚠️ Session non trouvée pour: ${callControlId}`);
      return;
    }

    // Envoyer l'audio à OpenAI
    session.websocket.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: audioData
    }));
  }

  // Construire les instructions système personnalisées avec prompts métier
  private static buildInstructions(storeContext: any, personality: string, language: string): string {
    if (!storeContext) {
      return language === 'fr' 
        ? "⏰ MAX 3 MINUTES. Tu es un assistant vocal amical. Aide les clients rapidement."
        : "⏰ MAX 3 MINUTES. You are a friendly voice assistant. Help customers quickly.";
    }

    // Utiliser les prompts générés par StoreCacheService si disponibles
    if (storeContext.aiPrompts) {
      let instructions = storeContext.aiPrompts.systemPrompt;
      
      // Ajouter les contextes
      if (storeContext.aiPrompts.businessContext) {
        instructions += '\n\n' + storeContext.aiPrompts.businessContext;
      }
      
      if (storeContext.aiPrompts.productsContext) {
        instructions += '\n\n' + storeContext.aiPrompts.productsContext;
      }
      
      if (storeContext.aiPrompts.servicesContext) {
        instructions += '\n\n' + storeContext.aiPrompts.servicesContext;
      }
      
      if (storeContext.aiPrompts.consultationsContext) {
        instructions += '\n\n' + storeContext.aiPrompts.consultationsContext;
      }
      
      if (storeContext.aiPrompts.businessRules) {
        instructions += '\n\n' + storeContext.aiPrompts.businessRules;
      }
      
      return instructions;
    }

    const personalityPrompts = {
      friendly: {
        fr: "Tu es chaleureux(se) et accueillant(e). Utilise un ton amical et convivial.",
        en: "You are warm and welcoming. Use a friendly and convivial tone."
      },
      professional: {
        fr: "Tu es professionnel(le) et courtois(e). Maintiens un ton formel mais aimable.",
        en: "You are professional and courteous. Maintain a formal but friendly tone."
      },
      casual: {
        fr: "Tu es décontracté(e) et moderne. Parle naturellement comme un ami.",
        en: "You are casual and modern. Speak naturally like a friend."
      },
      enthusiastic: {
        fr: "Tu es enthousiaste et dynamique. Montre de l'énergie positive.",
        en: "You are enthusiastic and dynamic. Show positive energy."
      }
    };

    const personalityText = personalityPrompts[personality as keyof typeof personalityPrompts]?.[language as keyof typeof personalityPrompts.friendly] || 
                           personalityPrompts.friendly[language as keyof typeof personalityPrompts.friendly];

    // Fallback si pas de prompts générés
    if (language === 'fr') {
      return `⏰ LIMITE STRICTE: MAX 3 MINUTES PAR APPEL
Tu es l'assistant vocal de ${storeContext.businessName} - ${storeContext.storeName}.

${personalityText}

⚡ IMPÉRATIF TEMPOREL:
- 0-30s: Accueil + identification besoin
- 30s-2min: Traitement demande rapidement
- 2-3min: Confirmation + clôture
- Si >3min: "Je vous transfère à un collègue"

INFORMATIONS BOUTIQUE:
- Nom: ${storeContext.businessName}
- Boutique: ${storeContext.storeName}
- Type: ${storeContext.businessCategory}

PRODUITS DISPONIBLES:
${storeContext.products?.map((p: any) => `- ${p.name} (${p.price}€${p.description ? ` - ${p.description}` : ''})`).join('\n') || 'Aucun produit'}

SERVICES DISPONIBLES:
${storeContext.services?.map((s: any) => `- ${s.name} (${s.price}€, ${s.duration}min${s.description ? ` - ${s.description}` : ''})`).join('\n') || 'Aucun service'}

CONSULTATIONS DISPONIBLES:
${storeContext.consultations?.map((c: any) => `- ${c.name} (${c.price}€, ${c.duration}min${c.description ? ` - ${c.description}` : ''})`).join('\n') || 'Aucune consultation'}

INSTRUCTIONS IMPORTANTES:
- Sois naturel(le) et conversationnel(le) comme au téléphone
- Concentre-toi sur: commandes, réservations, informations produits
- Évite les sujets hors contexte (météo sauf pour suggestions)
- Demande toujours nom et téléphone pour confirmation
- Si tu ne peux pas aider, propose de transférer vers un humain
- Maximum 2-3 phrases par réponse pour rester naturel
- Confirme tous les détails importants
- NEVER dépasser 3 minutes`;
    } else {
      return `⏰ STRICT LIMIT: MAX 3 MINUTES PER CALL
You are the voice assistant for ${storeContext.businessName} - ${storeContext.storeName}.

${personalityText}

⚡ TIME IMPERATIVE:
- 0-30s: Greeting + identify need
- 30s-2min: Process request quickly
- 2-3min: Confirmation + close
- If >3min: "I'll transfer you to a colleague"

STORE INFORMATION:
- Name: ${storeContext.businessName}
- Store: ${storeContext.storeName}
- Type: ${storeContext.businessCategory}

AVAILABLE PRODUCTS:
${storeContext.products?.map((p: any) => `- ${p.name} (€${p.price}${p.description ? ` - ${p.description}` : ''})`).join('\n') || 'No products'}

AVAILABLE SERVICES:
${storeContext.services?.map((s: any) => `- ${s.name} (€${s.price}, ${s.duration}min${s.description ? ` - ${s.description}` : ''})`).join('\n') || 'No services'}

AVAILABLE CONSULTATIONS:
${storeContext.consultations?.map((c: any) => `- ${c.name} (€${c.price}, ${c.duration}min${c.description ? ` - ${c.description}` : ''})`).join('\n') || 'No consultations'}

IMPORTANT INSTRUCTIONS:
- Be natural and conversational like on the phone
- Focus on: orders, reservations, product information
- Avoid off-topic subjects (weather except for suggestions)
- Always ask for name and phone for confirmation
- If you can't help, offer to transfer to a human
- Maximum 2-3 sentences per response to stay natural
- Confirm all important details
- NEVER exceed 3 minutes`;
    }
  }

  // Gérer les événements depuis OpenAI
  private static handleOpenAIEvent(sessionId: string, event: any) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log(`🤖 Événement OpenAI: ${event.type}`);

    switch (event.type) {
      case 'session.created':
        session.status = 'active';
        console.log(`✅ Session OpenAI active: ${sessionId}`);
        break;

      case 'conversation.item.created':
        session.conversationItems.push({
          id: event.item.id,
          type: event.item.type,
          role: event.item.role,
          content: event.item.content,
          status: event.item.status,
          createdAt: new Date()
        });
        break;

      case 'response.audio.delta':
        // Transférer l'audio vers Telnyx
        this.sendAudioToTelnyx(session, event.delta);
        break;

      case 'response.done':
        console.log(`✅ Réponse complétée: ${sessionId}`);
        break;

      case 'error':
        console.error(`❌ Erreur OpenAI Realtime: ${sessionId}`, event.error);
        break;
    }
  }

  // Envoyer l'audio généré vers Telnyx
  private static async sendAudioToTelnyx(session: RealtimeSession, audioData: string) {
    try {
      // TODO: Implémenter l'envoi vers Telnyx
      // Pour l'instant, log que l'audio est reçu
      console.log(`🔊 Audio généré pour envoi vers Telnyx: ${session.callId}`);
    } catch (error) {
      console.error('❌ Erreur envoi audio vers Telnyx:', error);
    }
  }

  // Terminer une session
  static async endSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    const ws = this.websockets.get(sessionId);

    if (ws) {
      ws.close();
    }

    if (session) {
      session.status = 'ended';
      session.endedAt = new Date();
      
      // Sauvegarder en base si nécessaire
      await this.saveSessionToDatabase(session);
    }

    this.sessions.delete(sessionId);
    this.websockets.delete(sessionId);

    console.log(`🔚 Session terminée: ${sessionId}`);
  }

  // Sauvegarder la session en base
  private static async saveSessionToDatabase(session: RealtimeSession) {
    try {
      // TODO: Implémenter sauvegarde en base
      console.log(`💾 Sauvegarde session: ${session.sessionId}`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde session:', error);
    }
  }
}

export class OpenAIRealtimeService {
  private static sessions = new Map<string, RealtimeSession>();
  private static readonly OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime';
  
  /**
   * Démarre une session temps réel pour un appel
   */
  static async startRealtimeSession(
    callId: string,
    businessId: string,
    storeId: string,
    customInstructions?: string
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    
    try {
      // Vérifier si une session existe déjà pour cet appel
      const existingSession = Array.from(this.sessions.values())
        .find(session => session.callId === callId && session.status !== 'ended');
        
      if (existingSession) {
        return {
          success: true,
          sessionId: existingSession.sessionId
        };
      }
      
      // Récupérer la configuration de la boutique
      const storeContext = await this.getStoreContext(storeId);
      if (!storeContext) {
        return {
          success: false,
          error: 'Configuration boutique introuvable'
        };
      }
      
      // Créer la configuration Realtime
      const config: RealtimeConfig = {
        model: 'gpt-4o-realtime-preview',
        voice: storeContext.aiConfig?.voice || 'nova',
        instructions: this.buildSystemPrompt(storeContext, customInstructions),
        modalities: ['text', 'audio'],
        temperature: 0.8,
        max_response_output_tokens: 4096,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      };
      
      // Créer la session
      const sessionId = `realtime_${callId}_${Date.now()}`;
      const session: RealtimeSession = {
        sessionId,
        callId,
        businessId,
        storeId,
        config,
        status: 'connecting',
        startedAt: new Date(),
        conversationItems: [],
        tools: this.buildTools(storeContext),
        errorCount: 0,
        lastActivity: new Date()
      };
      
      // Établir la connexion WebSocket
      const wsResult = await this.establishWebSocketConnection(session);
      if (!wsResult.success) {
        return {
          success: false,
          error: wsResult.error
        };
      }
      
      session.websocket = wsResult.websocket;
      session.status = 'connected';
      
      // Sauvegarder la session
      this.sessions.set(sessionId, session);
      
      // Mettre en cache dans Redis
      await this.cacheSession(session);
      
      console.log(`🎙️ Session OpenAI Realtime démarrée: ${sessionId} pour call ${callId}`);
      
      return {
        success: true,
        sessionId
      };
      
    } catch (error) {
      console.error('❌ Erreur démarrage session Realtime:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne'
      };
    }
  }
  
  /**
   * Envoie de l'audio à la session temps réel
   */
  static async sendAudioChunk(
    sessionId: string,
    audioData: string, // Base64 encoded audio
    format: 'pcm16' | 'g711_ulaw' | 'g711_alaw' = 'pcm16'
  ): Promise<{ success: boolean; error?: string }> {
    
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'connected') {
      return {
        success: false,
        error: 'Session non trouvée ou non connectée'
      };
    }
    
    try {
      const message = {
        type: 'input_audio_buffer.append',
        audio: audioData
      };
      
      session.websocket!.send(JSON.stringify(message));
      session.lastActivity = new Date();
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur envoi audio chunk:', error);
      session.errorCount++;
      
      return {
        success: false,
        error: 'Erreur envoi audio'
      };
    }
  }
  
  /**
   * Démarre la génération de réponse
   */
  static async generateResponse(
    sessionId: string,
    commitAudio: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'connected') {
      return {
        success: false,
        error: 'Session non trouvée ou non connectée'
      };
    }
    
    try {
      if (commitAudio) {
        // Valider l'audio buffer
        session.websocket!.send(JSON.stringify({
          type: 'input_audio_buffer.commit'
        }));
      }
      
      // Démarrer la génération de réponse
      session.websocket!.send(JSON.stringify({
        type: 'response.create',
        response: {
          modalities: session.config.modalities,
          instructions: session.config.instructions,
          voice: session.config.voice,
          output_audio_format: 'pcm16',
          tools: session.tools || []
        }
      }));
      
      session.status = 'active';
      session.lastActivity = new Date();
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur génération réponse:', error);
      return {
        success: false,
        error: 'Erreur génération réponse'
      };
    }
  }
  
  /**
   * Termine une session temps réel
   */
  static async endRealtimeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    try {
      if (session.websocket && session.websocket.readyState === WebSocket.OPEN) {
        session.websocket.close();
      }
      
      session.status = 'ended';
      session.endedAt = new Date();
      
      // Sauvegarder la conversation dans la base
      await this.saveConversationToDB(session);
      
      // Nettoyer la session
      this.sessions.delete(sessionId);
      
      console.log(`🎙️ Session OpenAI Realtime terminée: ${sessionId}`);
      
    } catch (error) {
      console.error('❌ Erreur fin session Realtime:', error);
    }
  }
  
  /**
   * Établit la connexion WebSocket avec OpenAI
   */
  private static async establishWebSocketConnection(
    session: RealtimeSession
  ): Promise<{ success: boolean; websocket?: WebSocket; error?: string }> {
    
    return new Promise((resolve) => {
      try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          resolve({
            success: false,
            error: 'Clé API OpenAI manquante'
          });
          return;
        }
        
        const websocket = new WebSocket(this.OPENAI_REALTIME_URL, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'realtime=v1'
          }
        });
        
        websocket.on('open', () => {
          console.log('✅ Connexion WebSocket OpenAI établie');
          
          // Configurer la session
          websocket.send(JSON.stringify({
            type: 'session.update',
            session: {
              model: session.config.model,
              voice: session.config.voice,
              instructions: session.config.instructions,
              modalities: session.config.modalities,
              temperature: session.config.temperature,
              max_response_output_tokens: session.config.max_response_output_tokens,
              turn_detection: session.config.turn_detection,
              tools: session.tools || []
            }
          }));
          
          resolve({
            success: true,
            websocket
          });
        });
        
        websocket.on('message', (data) => {
          this.handleWebSocketMessage(session, data.toString());
        });
        
        websocket.on('error', (error) => {
          console.error('❌ Erreur WebSocket OpenAI:', error);
          session.errorCount++;
          
          if (session.errorCount >= 3) {
            session.status = 'error';
          }
        });
        
        websocket.on('close', () => {
          console.log('🔌 Connexion WebSocket OpenAI fermée');
          session.status = 'ended';
        });
        
        // Timeout de connexion
        setTimeout(() => {
          if (websocket.readyState !== WebSocket.OPEN) {
            websocket.close();
            resolve({
              success: false,
              error: 'Timeout connexion WebSocket'
            });
          }
        }, 10000);
        
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur connexion WebSocket'
        });
      }
    });
  }
  
  /**
   * Gère les messages WebSocket reçus d'OpenAI
   */
  private static handleWebSocketMessage(session: RealtimeSession, message: string): void {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'session.created':
          console.log('🎙️ Session OpenAI créée:', data.session.id);
          break;
          
        case 'session.updated':
          console.log('🔄 Session OpenAI mise à jour');
          break;
          
        case 'input_audio_buffer.speech_started':
          console.log('🎤 Début détection parole utilisateur');
          break;
          
        case 'input_audio_buffer.speech_stopped':
          console.log('🔇 Fin détection parole utilisateur');
          // Auto-générer la réponse
          this.generateResponse(session.sessionId, true);
          break;
          
        case 'response.created':
          console.log('🤖 Réponse IA créée:', data.response.id);
          break;
          
        case 'response.output_item.added':
          // Nouvel élément de réponse
          const item = {
            id: data.item.id,
            type: data.item.type,
            role: data.item.role,
            content: data.item.content,
            status: 'incomplete',
            createdAt: new Date()
          };
          session.conversationItems.push(item);
          break;
          
        case 'response.output_item.done':
          // Élément de réponse terminé
          const doneItemIndex = session.conversationItems.findIndex(
            item => item.id === data.item.id
          );
          if (doneItemIndex !== -1) {
            session.conversationItems[doneItemIndex].status = 'completed';
            session.conversationItems[doneItemIndex].content = data.item.content;
          }
          break;
          
        case 'response.audio.delta':
          // Chunk audio de la réponse
          this.handleAudioResponse(session, data.delta);
          break;
          
        case 'response.audio.done':
          console.log('🔊 Audio de réponse terminé');
          break;
          
        case 'response.text.delta':
          // Chunk texte de la réponse
          this.handleTextResponse(session, data.delta);
          break;
          
        case 'response.done':
          console.log('✅ Réponse IA complète');
          session.status = 'connected'; // Retour en attente
          break;
          
        case 'error':
          console.error('❌ Erreur OpenAI Realtime:', data.error);
          session.errorCount++;
          break;
          
        default:
          console.log('📨 Message OpenAI non géré:', data.type);
      }
      
      session.lastActivity = new Date();
      
    } catch (error) {
      console.error('❌ Erreur parsing message WebSocket:', error);
    }
  }
  
  /**
   * Gère la réponse audio
   */
  private static handleAudioResponse(session: RealtimeSession, audioDelta: string): void {
    // Envoyer l'audio à Telnyx pour diffusion
    // TODO: Implémenter l'envoi vers Telnyx
    console.log('🔊 Audio chunk reçu:', audioDelta.length, 'caractères');
  }
  
  /**
   * Gère la réponse textuelle
   */
  private static handleTextResponse(session: RealtimeSession, textDelta: string): void {
    console.log('📝 Texte reçu:', textDelta);
  }
  
  /**
   * Récupère le contexte de la boutique
   */
  private static async getStoreContext(storeId: string): Promise<any> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        business: true,
        products: {
          where: { status: 'ACTIVE' },
          take: 50
        },
        universalServices: {
          where: { isActive: true },
          take: 20
        }
      }
    });
    
    return store;
  }
  
  /**
   * Construit le prompt système personnalisé
   */
  private static buildSystemPrompt(storeContext: any, customInstructions?: string): string {
    const businessName = storeContext.business.name;
    const storeName = storeContext.name;
    
    let prompt = `Tu es l'assistant vocal intelligent de ${businessName} - ${storeName}. 

PERSONNALITÉ: Professionnel, amical et efficace.

CONTEXTE ENTREPRISE:
- Type: ${storeContext.business.type}
- Nom boutique: ${storeName}

PRODUITS DISPONIBLES:
${storeContext.products.map(p => `- ${p.name}: ${p.description || ''} (${p.price}€)`).join('\n')}

SERVICES DISPONIBLES:
${storeContext.universalServices.map(s => `- ${s.name}: ${s.description || ''}`).join('\n')}

INSTRUCTIONS:
1. Réponds en français de manière naturelle et conversationnelle
2. Aide les clients à passer commande, réserver ou poser des questions
3. Si une demande est complexe ou nécessite un humain, propose de transférer l'appel
4. Sois courtois et professionnel en toutes circonstances
5. Confirme toujours les détails importants (commandes, réservations)`;

    if (customInstructions) {
      prompt += `\n\nINSTRUCTIONS SPÉCIFIQUES:\n${customInstructions}`;
    }
    
    return prompt;
  }
  
  /**
   * Construit les outils disponibles pour l'IA
   */
  private static buildTools(storeContext: any): Array<any> {
    return [
      {
        type: 'function',
        name: 'create_order',
        description: 'Créer une nouvelle commande avec les produits sélectionnés',
        parameters: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'number' },
                  customizations: { type: 'string' }
                }
              }
            },
            deliveryType: { 
              type: 'string',
              enum: ['dine_in', 'takeaway', 'delivery']
            },
            customerInfo: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'string' }
              }
            }
          }
        }
      },
      {
        type: 'function',
        name: 'transfer_to_human',
        description: 'Transférer l\'appel vers un agent humain',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string' },
            urgency: { 
              type: 'string',
              enum: ['low', 'normal', 'high', 'urgent']
            }
          }
        }
      }
    ];
  }
  
  /**
   * Met en cache la session dans Redis
   */
  private static async cacheSession(session: RealtimeSession): Promise<void> {
    await redisService.connect();
    const key = `realtime_session:${session.sessionId}`;
    
    const cacheData = {
      ...session,
      websocket: undefined // Ne pas sérialiser le WebSocket
    };
    
    await redisService.client.setEx(key, 7200, JSON.stringify(cacheData)); // 2h TTL
  }
  
  /**
   * Sauvegarde la conversation en base de données
   */
  private static async saveConversationToDB(session: RealtimeSession): Promise<void> {
    try {
      await prisma.aIConversationSession.create({
        data: {
          callId: session.callId,
          businessId: session.businessId,
          sessionType: 'realtime',
          messages: session.conversationItems,
          totalCost: 0, // À calculer selon l'usage
          startedAt: session.startedAt,
          endedAt: session.endedAt || new Date(),
          isActive: false
        }
      });
      
      console.log(`💾 Conversation Realtime sauvegardée: ${session.sessionId}`);
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde conversation:', error);
    }
  }
  
  /**
   * Nettoie les sessions inactives
   */
  static async cleanupInactiveSessions(): Promise<void> {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const [sessionId, session] of this.sessions) {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      
      if (timeSinceLastActivity > inactiveThreshold) {
        console.log(`🧹 Nettoyage session inactive: ${sessionId}`);
        await this.endRealtimeSession(sessionId);
      }
    }
  }
  
  /**
   * Obtient les statistiques des sessions actives
   */
  static getActiveSessionsStats(): {
    total: number;
    connecting: number;
    connected: number;
    active: number;
    error: number;
  } {
    const sessions = Array.from(this.sessions.values());
    
    return {
      total: sessions.length,
      connecting: sessions.filter(s => s.status === 'connecting').length,
      connected: sessions.filter(s => s.status === 'connected').length,
      active: sessions.filter(s => s.status === 'active').length,
      error: sessions.filter(s => s.status === 'error').length
    };
  }
}

// Nettoyage automatique toutes les 5 minutes
setInterval(() => {
  OpenAIRealtimeService.cleanupInactiveSessions();
}, 5 * 60 * 1000);