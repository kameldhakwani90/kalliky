// ============================================================================
// REDIS SERVICE - Gestion des sessions d'appels et cache IA
// ============================================================================

import { createClient, RedisClientType } from 'redis';

export interface CallSession {
  callId: string;
  telnyxCallId: string;
  businessId: string;
  storeId: string;
  customerId?: string;
  phoneNumber: string;
  fromNumber: string;
  toNumber: string;
  status: 'active' | 'ended' | 'failed';
  startTime: string;
  endTime?: string;
  
  // Contexte IA
  aiContext: {
    businessType: string;
    businessName: string;
    services: any[];
    conversation: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: string;
    }>;
    language: string;
    sentiment?: string;
  };
  
  // Audio processing
  audioChunks: string[];
  currentTranscription?: string;
  
  // Métadonnées
  metadata: Record<string, any>;
}

export interface AIContext {
  businessId: string;
  businessName: string;
  businessType: string;
  services: any[];
  currentConversation: any[];
  customerHistory?: any[];
  systemPrompt: string;
}

class RedisService {
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB || '0'),
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('❌ Redis disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  // ============================================================================
  // CALL SESSION MANAGEMENT
  // ============================================================================

  async createCallSession(session: CallSession): Promise<void> {
    await this.connect();
    const key = `call:session:${session.callId}`;
    await this.client.setEx(key, 3600 * 2, JSON.stringify(session)); // 2h TTL
    console.log(`📞 Session créée: ${session.callId}`);
  }

  async getCallSession(callId: string): Promise<CallSession | null> {
    await this.connect();
    const key = `call:session:${callId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateCallSession(callId: string, updates: Partial<CallSession>): Promise<void> {
    await this.connect();
    const session = await this.getCallSession(callId);
    if (session) {
      const updatedSession = { ...session, ...updates };
      await this.createCallSession(updatedSession);
    }
  }

  async endCallSession(callId: string): Promise<void> {
    await this.connect();
    await this.updateCallSession(callId, {
      status: 'ended',
      endTime: new Date().toISOString(),
    });
    
    // Garder en cache 1h après la fin pour analytics
    const key = `call:session:${callId}`;
    await this.client.expire(key, 3600);
  }

  async deleteCallSession(callId: string): Promise<void> {
    await this.connect();
    const key = `call:session:${callId}`;
    await this.client.del(key);
  }

  // ============================================================================
  // AUDIO CHUNKS MANAGEMENT
  // ============================================================================

  async addAudioChunk(callId: string, audioUrl: string): Promise<void> {
    await this.connect();
    const key = `call:audio:${callId}`;
    await this.client.lPush(key, audioUrl);
    await this.client.expire(key, 3600 * 4); // 4h TTL
  }

  async getAudioChunks(callId: string): Promise<string[]> {
    await this.connect();
    const key = `call:audio:${callId}`;
    return await this.client.lRange(key, 0, -1);
  }

  async clearAudioChunks(callId: string): Promise<void> {
    await this.connect();
    const key = `call:audio:${callId}`;
    await this.client.del(key);
  }

  // ============================================================================
  // AI CONTEXT MANAGEMENT
  // ============================================================================

  async setAIContext(businessId: string, context: AIContext): Promise<void> {
    await this.connect();
    const key = `ai:context:${businessId}`;
    await this.client.setEx(key, 3600 * 24, JSON.stringify(context)); // 24h TTL
  }

  async getAIContext(businessId: string): Promise<AIContext | null> {
    await this.connect();
    const key = `ai:context:${businessId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateConversation(callId: string, message: { role: string; content: string }): Promise<void> {
    await this.connect();
    const session = await this.getCallSession(callId);
    if (session) {
      session.aiContext.conversation.push({
        ...message,
        timestamp: new Date().toISOString(),
      });
      await this.updateCallSession(callId, session);
    }
  }

  // ============================================================================
  // STORE DATA OPTIMIZATION - Cache complet par storeId
  // ============================================================================

  async cacheStoreData(storeId: string, storeData: {
    storeInfo: any;
    catalog: any[];
    services: any[];
    consultations: any[];
    serviceResources?: any[];
    scheduleConfigs?: any[];
    activeReservations?: any[];
    settings: any;
    aiConfig: any;
    businessInfo: any;
  }): Promise<void> {
    await this.connect();
    const key = `store:cache:${storeId}`;
    
    // Cache optimisé pour l'IA - données structurées
    const optimizedData = {
      storeId,
      businessId: storeData.storeInfo.businessId,
      storeName: storeData.storeInfo.name,
      storeAddress: storeData.storeInfo.address,
      businessName: storeData.businessInfo.name,
      businessCategory: storeData.businessInfo.businessCategory,
      
      // Configuration IA
      aiPersonality: storeData.aiConfig?.personality || 'professionnel',
      aiInstructions: storeData.aiConfig?.instructions || '',
      aiLanguage: storeData.aiConfig?.language || 'fr',
      
      // Catalogue produits pour l'IA
      products: storeData.catalog.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        available: product.available,
        ingredients: product.ingredients,
        allergens: product.allergens
      })),
      
      // Services pour l'IA
      services: storeData.services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        available: service.available,
        bookingRequired: service.requiresBooking
      })),
      
      // Consultations pour l'IA
      consultations: storeData.consultations.map(consultation => ({
        id: consultation.id,
        name: consultation.name,
        description: consultation.description,
        duration: consultation.duration,
        price: consultation.price,
        available: consultation.available,
        expertiseLevel: consultation.expertiseLevel
      })),
      
      // Ressources de services pour l'IA
      serviceResources: (storeData.serviceResources || []).map(resource => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        capacity: resource.capacity,
        isAvailable: resource.isAvailable,
        scheduleSettings: resource.scheduleSettings
      })),
      
      // Configurations de planning pour l'IA
      scheduleConfigs: (storeData.scheduleConfigs || []).map(config => ({
        id: config.id,
        name: config.name,
        type: config.type,
        workingHours: config.workingHours,
        slotConfig: config.slotConfig,
        bookingRules: config.bookingRules,
        exceptions: config.exceptions,
        serviceZones: config.serviceZones,
        isActive: config.isActive
      })),
      
      // Réservations actives pour l'IA
      activeReservations: (storeData.activeReservations || []).map(reservation => ({
        id: reservation.id,
        customerName: reservation.customerName,
        date: reservation.date,
        time: reservation.time,
        serviceName: reservation.serviceName,
        title: reservation.title,
        status: reservation.status
      })),
      
      // Horaires et paramètres
      businessHours: storeData.settings?.businessHours || {},
      timezone: storeData.settings?.timezone || 'Europe/Paris',
      currency: storeData.settings?.currency || 'EUR',
      taxRate: storeData.settings?.taxSettings?.rate || 0.20,
      
      // Paramètres de renvoi d'appel
      callForwarding: storeData.settings?.callForwarding || {},
      
      // Instructions spécifiques par type d'activité
      orderInstructions: storeData.settings?.orderInstructions || '',
      serviceInstructions: storeData.settings?.serviceInstructions || '',
      consultationInstructions: storeData.settings?.consultationInstructions || '',
      
      // Métadonnées pour la performance
      lastUpdated: new Date().toISOString(),
      version: Date.now() // Pour invalidation cache
    };

    await this.client.setEx(key, 3600 * 6, JSON.stringify(optimizedData)); // 6h TTL
    console.log(`🏪 Cache boutique mis à jour: ${storeId}`);
  }

  async getCachedStoreData(storeId: string): Promise<any | null> {
    await this.connect();
    const key = `store:cache:${storeId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidateStoreCache(storeId: string): Promise<void> {
    await this.connect();
    const key = `store:cache:${storeId}`;
    await this.client.del(key);
    console.log(`🗑️ Cache boutique invalidé: ${storeId}`);
  }

  // Cache rapide pour données IA - structure optimisée pour les prompts
  async cacheStoreAIPrompt(storeId: string, promptData: {
    systemPrompt: string;
    businessContext: string;
    productsContext: string;
    servicesContext: string;
    consultationsContext: string;
  }): Promise<void> {
    await this.connect();
    const key = `store:ai_prompt:${storeId}`;
    await this.client.setEx(key, 3600 * 3, JSON.stringify(promptData)); // 3h TTL
  }

  async getCachedStoreAIPrompt(storeId: string): Promise<any | null> {
    await this.connect();
    const key = `store:ai_prompt:${storeId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ============================================================================
  // BUSINESS CACHE (legacy - gardé pour compatibilité)
  // ============================================================================

  async cacheBusinessData(businessId: string, data: any): Promise<void> {
    await this.connect();
    const key = `business:cache:${businessId}`;
    await this.client.setEx(key, 3600 * 12, JSON.stringify(data)); // 12h TTL
  }

  async getCachedBusinessData(businessId: string): Promise<any | null> {
    await this.connect();
    const key = `business:cache:${businessId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ============================================================================
  // ACTIVE CALLS TRACKING
  // ============================================================================

  async addActiveCall(businessId: string, callId: string): Promise<void> {
    await this.connect();
    const key = `business:active_calls:${businessId}`;
    await this.client.sAdd(key, callId);
    await this.client.expire(key, 3600 * 6); // 6h TTL
  }

  async removeActiveCall(businessId: string, callId: string): Promise<void> {
    await this.connect();
    const key = `business:active_calls:${businessId}`;
    await this.client.sRem(key, callId);
  }

  async getActiveCallsCount(businessId: string): Promise<number> {
    await this.connect();
    const key = `business:active_calls:${businessId}`;
    return await this.client.sCard(key);
  }

  async getActiveCalls(businessId: string): Promise<string[]> {
    await this.connect();
    const key = `business:active_calls:${businessId}`;
    return await this.client.sMembers(key);
  }

  async getActiveCallsCount(businessId: string): Promise<number> {
    await this.connect();
    const key = `business:active_calls:${businessId}`;
    return await this.client.sCard(key);
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  async checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    await this.connect();
    const count = await this.client.incr(`rate_limit:${key}`);
    
    if (count === 1) {
      await this.client.expire(`rate_limit:${key}`, Math.ceil(windowMs / 1000));
    }
    
    return count <= limit;
  }

  // ============================================================================
  // ANALYTICS CACHE
  // ============================================================================

  async incrementCallStats(businessId: string, date: string): Promise<void> {
    await this.connect();
    const key = `stats:calls:${businessId}:${date}`;
    await this.client.incr(key);
    await this.client.expire(key, 3600 * 24 * 7); // 7 jours
  }

  async getCallStats(businessId: string, dateRange: string[]): Promise<Record<string, number>> {
    await this.connect();
    const pipeline = this.client.multi();
    
    dateRange.forEach(date => {
      pipeline.get(`stats:calls:${businessId}:${date}`);
    });
    
    const results = await pipeline.exec();
    const stats: Record<string, number> = {};
    
    dateRange.forEach((date, index) => {
      stats[date] = parseInt(results?.[index] as string || '0') || 0;
    });
    
    return stats;
  }

  // ============================================================================
  // CLEANUP UTILITIES
  // ============================================================================

  async cleanupExpiredSessions(): Promise<void> {
    await this.connect();
    
    // Nettoyer les sessions expirées (plus de 4h)
    const pattern = 'call:session:*';
    const keys = await this.client.keys(pattern);
    
    for (const key of keys) {
      const ttl = await this.client.ttl(key);
      if (ttl < 0) { // TTL expiré
        await this.client.del(key);
      }
    }
    
    console.log(`🧹 Nettoyé ${keys.length} sessions expirées`);
  }
}

// Export singleton
export const redisService = new RedisService();

// Helper pour initialiser Redis au démarrage
export async function initializeRedis(): Promise<void> {
  try {
    await redisService.connect();
    console.log('✅ Redis service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
    // Ne pas faire planter l'app si Redis est down
  }
}

// Helper pour gérer les sessions d'appel
export class CallSessionManager {
  static async startCall(callData: {
    callId: string;
    telnyxCallId: string;
    businessId: string;
    storeId: string;
    fromNumber: string;
    toNumber: string;
    businessData: any;
  }): Promise<CallSession> {
    const session: CallSession = {
      callId: callData.callId,
      telnyxCallId: callData.telnyxCallId,
      businessId: callData.businessId,
      storeId: callData.storeId,
      phoneNumber: callData.toNumber,
      fromNumber: callData.fromNumber,
      toNumber: callData.toNumber,
      status: 'active',
      startTime: new Date().toISOString(),
      
      aiContext: {
        businessType: callData.businessData.businessCategory || 'RESTAURANT',
        businessName: callData.businessData.name || 'Ma Boutique',
        services: callData.businessData.services || [],
        conversation: [],
        language: 'fr',
      },
      
      audioChunks: [],
      metadata: {},
    };

    await redisService.createCallSession(session);
    await redisService.addActiveCall(callData.businessId, callData.callId);
    
    return session;
  }

  static async endCall(callId: string, businessId: string): Promise<void> {
    await redisService.endCallSession(callId);
    await redisService.removeActiveCall(businessId, callId);
  }
}