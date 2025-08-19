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