// ============================================================================
// CALL FORWARDING SERVICE - Transfert d'appels vers humains
// ============================================================================

import { TelnyxService } from './telnyx';
import { redisService } from './redis';
import { prisma } from './prisma';

export interface CallForwardingConfig {
  enabled: boolean;
  forwardToNumbers: string[]; // Numéros de téléphone vers lesquels transférer
  maxRingTime: number; // Temps de sonnerie max avant abandon (secondes)
  workingHours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      [key: string]: { start: string; end: string } | null; // lundi, mardi, etc.
    };
  };
  escalationRules: {
    enabled: boolean;
    triggerKeywords: string[]; // Mots-clés qui déclenchent le transfert
    maxAIAttempts: number; // Nombre de tentatives IA avant transfert forcé
  };
  queueSettings: {
    enabled: boolean;
    maxWaitTime: number; // Temps d'attente max en queue (secondes)
    queueMusic?: string; // URL du fichier audio de queue
    announcementInterval: number; // Interval annonces position queue (secondes)
  };
}

export interface CallTransferRequest {
  callId: string;
  telnyxCallId: string;
  businessId: string;
  storeId: string;
  reason: 'user_request' | 'ai_escalation' | 'keyword_trigger' | 'manual';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  context?: string; // Contexte de la conversation
  customerInfo?: {
    name?: string;
    phone?: string;
    previousInteractions?: number;
  };
}

export interface CallQueueItem {
  callId: string;
  telnyxCallId: string;
  businessId: string;
  queuedAt: Date;
  priority: number; // Plus élevé = plus prioritaire
  estimatedWaitTime: number;
  position: number;
  context: string;
}

export class CallForwardingService {
  
  /**
   * Configure le call forwarding pour une boutique
   */
  static async configureCallForwarding(
    storeId: string,
    config: CallForwardingConfig
  ): Promise<void> {
    
    // Valider la configuration
    if (config.enabled && config.forwardToNumbers.length === 0) {
      throw new Error('Au moins un numéro de transfert requis');
    }
    
    // Valider les numéros de téléphone
    for (const number of config.forwardToNumbers) {
      if (!this.isValidPhoneNumber(number)) {
        throw new Error(`Numéro invalide: ${number}`);
      }
    }
    
    // Sauvegarder la configuration
    await prisma.store.update({
      where: { id: storeId },
      data: {
        settings: {
          ...(await this.getStoreSettings(storeId)),
          callForwarding: config
        }
      }
    });
    
    // Mettre en cache pour performance
    await redisService.connect();
    const cacheKey = `call_forwarding_config:${storeId}`;
    await redisService.client.setEx(cacheKey, 3600, JSON.stringify(config));
    
    console.log(`📞 Configuration call forwarding mise à jour pour store: ${storeId}`);
  }
  
  /**
   * Initie un transfert d'appel vers un humain
   */
  static async transferCallToHuman(request: CallTransferRequest): Promise<{
    success: boolean;
    transferId?: string;
    queuePosition?: number;
    estimatedWaitTime?: number;
    error?: string;
  }> {
    
    try {
      // Récupérer la configuration de transfert
      const config = await this.getCallForwardingConfig(request.storeId);
      
      if (!config.enabled) {
        return {
          success: false,
          error: 'Call forwarding désactivé pour cette boutique'
        };
      }
      
      // Vérifier les heures d'ouverture si configurées
      if (config.workingHours.enabled && !this.isWithinWorkingHours(config.workingHours)) {
        return await this.handleAfterHoursCall(request, config);
      }
      
      // Vérifier la disponibilité des agents
      const availableAgents = await this.getAvailableAgents(request.businessId);
      
      if (availableAgents.length === 0) {
        // Mettre en queue si activé
        if (config.queueSettings.enabled) {
          return await this.addCallToQueue(request, config);
        } else {
          return await this.handleNoAgentAvailable(request, config);
        }
      }
      
      // Effectuer le transfert vers un agent disponible
      const transferResult = await this.executeCallTransfer(
        request,
        availableAgents[0],
        config
      );
      
      return transferResult;
      
    } catch (error) {
      console.error('❌ Erreur lors du transfert d\'appel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne'
      };
    }
  }
  
  /**
   * Ajoute un appel à la file d'attente
   */
  static async addCallToQueue(
    request: CallTransferRequest,
    config: CallForwardingConfig
  ): Promise<{
    success: boolean;
    queuePosition: number;
    estimatedWaitTime: number;
    error?: string;
  }> {
    
    await redisService.connect();
    
    const queueKey = `call_queue:${request.businessId}`;
    const priority = this.calculatePriority(request);
    const position = await redisService.client.zCard(queueKey) + 1;
    
    const queueItem: CallQueueItem = {
      callId: request.callId,
      telnyxCallId: request.telnyxCallId,
      businessId: request.businessId,
      queuedAt: new Date(),
      priority,
      estimatedWaitTime: this.calculateEstimatedWaitTime(position),
      position,
      context: request.context || 'Transfert demandé'
    };
    
    // Ajouter à la queue Redis avec score de priorité + timestamp
    const score = priority * 1000000 + Date.now(); // Priorité puis FIFO
    await redisService.client.zAdd(queueKey, {
      score,
      value: JSON.stringify(queueItem)
    });
    
    // Jouer la musique d'attente
    await this.playQueueMusic(request.telnyxCallId, config);
    
    // Logger l'événement
    await this.logCallEvent(request.callId, 'queued', {
      position,
      estimatedWaitTime: queueItem.estimatedWaitTime
    });
    
    console.log(`📞 Appel mis en queue: ${request.callId} (position ${position})`);
    
    return {
      success: true,
      queuePosition: position,
      estimatedWaitTime: queueItem.estimatedWaitTime
    };
  }
  
  /**
   * Effectue le transfert réel vers un agent
   */
  private static async executeCallTransfer(
    request: CallTransferRequest,
    agentNumber: string,
    config: CallForwardingConfig
  ): Promise<{
    success: boolean;
    transferId?: string;
    error?: string;
  }> {
    
    try {
      // Créer un appel vers l'agent
      const transferCall = await TelnyxService.createCall({
        to: agentNumber,
        from: request.telnyxCallId, // Utiliser le numéro de la boutique
        timeoutSecs: config.maxRingTime || 30
      });
      
      if (!transferCall.success) {
        return {
          success: false,
          error: `Impossible de joindre l'agent: ${transferCall.error}`
        };
      }
      
      // Attendre que l'agent réponde
      const bridgeResult = await this.waitForAgentAnswer(
        request.telnyxCallId,
        transferCall.callId!,
        config.maxRingTime || 30
      );
      
      if (bridgeResult.success) {
        // Mettre les appels en conférence (bridge)
        await TelnyxService.bridgeCalls(request.telnyxCallId, transferCall.callId!);
        
        // Logger le succès du transfert
        await this.logCallEvent(request.callId, 'transferred', {
          agentNumber,
          transferId: transferCall.callId
        });
        
        // Supprimer de la queue si il y était
        await this.removeFromQueue(request.businessId, request.callId);
        
        console.log(`✅ Appel transféré avec succès: ${request.callId} → ${agentNumber}`);
        
        return {
          success: true,
          transferId: transferCall.callId
        };
        
      } else {
        // L'agent n'a pas répondu, essayer le suivant
        return await this.tryNextAgent(request, config);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du transfert:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de transfert'
      };
    }
  }
  
  /**
   * Gère les appels en dehors des heures d'ouverture
   */
  private static async handleAfterHoursCall(
    request: CallTransferRequest,
    config: CallForwardingConfig
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    
    // Jouer un message d'heures d'ouverture
    await TelnyxService.playAudio(request.telnyxCallId, {
      mediaUrl: 'https://example.com/after-hours-message.mp3'
    });
    
    // Proposer de laisser un message vocal
    const voicemailResult = await this.offerVoicemail(request);
    
    await this.logCallEvent(request.callId, 'after_hours', {
      voicemailOffered: true,
      voicemailAccepted: voicemailResult.accepted
    });
    
    return {
      success: false,
      error: 'En dehors des heures d\'ouverture'
    };
  }
  
  /**
   * Récupère la liste des agents disponibles
   */
  private static async getAvailableAgents(businessId: string): Promise<string[]> {
    const config = await this.getCallForwardingConfigByBusinessId(businessId);
    return config?.forwardToNumbers || [];
  }
  
  /**
   * Vérifie si on est dans les heures d'ouverture
   */
  private static isWithinWorkingHours(workingHours: CallForwardingConfig['workingHours']): boolean {
    if (!workingHours.enabled) return true;
    
    const now = new Date();
    const timezone = workingHours.timezone || 'Europe/Paris';
    
    // Convertir l'heure actuelle dans le timezone de la boutique
    const localTime = new Intl.DateTimeFormat('fr-FR', {
      timeZone: timezone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now);
    
    const dayName = localTime.find(part => part.type === 'weekday')?.value;
    const currentTime = `${localTime.find(part => part.type === 'hour')?.value}:${localTime.find(part => part.type === 'minute')?.value}`;
    
    if (!dayName) return false;
    
    const daySchedule = workingHours.schedule[dayName.toLowerCase()];
    if (!daySchedule) return false; // Pas d'horaires = fermé
    
    return currentTime >= daySchedule.start && currentTime <= daySchedule.end;
  }
  
  /**
   * Calcule la priorité d'un appel
   */
  private static calculatePriority(request: CallTransferRequest): number {
    const basePriority = {
      'urgent': 4,
      'high': 3,
      'normal': 2,
      'low': 1
    }[request.priority] || 2;
    
    // Bonus pour les clients existants
    const customerBonus = request.customerInfo?.previousInteractions || 0 > 0 ? 1 : 0;
    
    return basePriority + customerBonus;
  }
  
  /**
   * Calcule le temps d'attente estimé
   */
  private static calculateEstimatedWaitTime(position: number): number {
    const avgCallDuration = 180; // 3 minutes moyenne
    return position * avgCallDuration;
  }
  
  /**
   * Helper methods
   */
  private static async getCallForwardingConfig(storeId: string): Promise<CallForwardingConfig> {
    const cacheKey = `call_forwarding_config:${storeId}`;
    await redisService.connect();
    
    const cached = await redisService.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }
    
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true }
    });
    
    const config = (store?.settings as any)?.callForwarding as CallForwardingConfig;
    
    if (config) {
      await redisService.client.setEx(cacheKey, 3600, JSON.stringify(config));
    }
    
    return config || this.getDefaultConfig();
  }
  
  private static async getCallForwardingConfigByBusinessId(businessId: string): Promise<CallForwardingConfig | null> {
    const store = await prisma.store.findFirst({
      where: { businessId },
      select: { id: true, settings: true }
    });
    
    if (!store) return null;
    
    return (store.settings as any)?.callForwarding || null;
  }
  
  private static getDefaultConfig(): CallForwardingConfig {
    return {
      enabled: false,
      forwardToNumbers: [],
      maxRingTime: 30,
      workingHours: {
        enabled: false,
        timezone: 'Europe/Paris',
        schedule: {}
      },
      escalationRules: {
        enabled: false,
        triggerKeywords: [],
        maxAIAttempts: 3
      },
      queueSettings: {
        enabled: false,
        maxWaitTime: 300,
        announcementInterval: 60
      }
    };
  }
  
  private static async getStoreSettings(storeId: string): Promise<any> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true }
    });
    
    return store?.settings || {};
  }
  
  private static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }
  
  private static async playQueueMusic(callId: string, config: CallForwardingConfig): Promise<void> {
    if (config.queueSettings.queueMusic) {
      await TelnyxService.playAudio(callId, {
        mediaUrl: config.queueSettings.queueMusic,
        loop: true
      });
    }
  }
  
  private static async logCallEvent(callId: string, event: string, data: any): Promise<void> {
    // Implémenter le logging des événements d'appel
    console.log(`📞 Call Event [${callId}]: ${event}`, data);
  }
  
  private static async removeFromQueue(businessId: string, callId: string): Promise<void> {
    await redisService.connect();
    const queueKey = `call_queue:${businessId}`;
    
    const queueItems = await redisService.client.zRange(queueKey, 0, -1);
    
    for (const item of queueItems) {
      try {
        const queueItem: CallQueueItem = JSON.parse(item);
        if (queueItem.callId === callId) {
          await redisService.client.zRem(queueKey, item);
          break;
        }
      } catch (error) {
        console.error('Erreur parsing queue item:', error);
      }
    }
  }
  
  private static async waitForAgentAnswer(
    customerCallId: string,
    agentCallId: string,
    timeoutSeconds: number
  ): Promise<{ success: boolean; error?: string }> {
    
    // Simuler l'attente de réponse de l'agent
    // Dans une vraie implémentation, on écouterait les webhooks Telnyx
    return new Promise((resolve) => {
      setTimeout(() => {
        // 70% de chance que l'agent réponde
        const answered = Math.random() > 0.3;
        resolve({
          success: answered,
          error: answered ? undefined : 'Agent non disponible'
        });
      }, 5000);
    });
  }
  
  private static async tryNextAgent(
    request: CallTransferRequest,
    config: CallForwardingConfig
  ): Promise<{ success: boolean; transferId?: string; error?: string }> {
    
    // Essayer le prochain agent dans la liste
    const agents = config.forwardToNumbers;
    // Logique pour essayer le prochain agent...
    
    return {
      success: false,
      error: 'Tous les agents sont occupés'
    };
  }
  
  private static async offerVoicemail(request: CallTransferRequest): Promise<{ accepted: boolean }> {
    // Proposer de laisser un message vocal
    return { accepted: false }; // Simplifié pour l'exemple
  }
}

// ============================================================================
// CALL QUEUE MANAGEMENT
// ============================================================================

export class CallQueueManager {
  
  /**
   * Traite la file d'attente des appels
   */
  static async processCallQueue(businessId: string): Promise<void> {
    await redisService.connect();
    const queueKey = `call_queue:${businessId}`;
    
    // Récupérer le premier appel en attente (plus prioritaire + plus ancien)
    const nextCall = await redisService.client.zRange(queueKey, -1, -1);
    
    if (nextCall.length === 0) return;
    
    try {
      const queueItem: CallQueueItem = JSON.parse(nextCall[0]);
      
      // Vérifier si des agents sont maintenant disponibles
      const availableAgents = await CallForwardingService['getAvailableAgents'](businessId);
      
      if (availableAgents.length > 0) {
        // Transférer l'appel
        const transferRequest: CallTransferRequest = {
          callId: queueItem.callId,
          telnyxCallId: queueItem.telnyxCallId,
          businessId: queueItem.businessId,
          storeId: '', // À récupérer
          reason: 'user_request',
          priority: 'normal',
          context: queueItem.context
        };
        
        const result = await CallForwardingService.transferCallToHuman(transferRequest);
        
        if (result.success) {
          // Supprimer de la queue
          await redisService.client.zRem(queueKey, nextCall[0]);
          console.log(`✅ Appel transféré depuis la queue: ${queueItem.callId}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur traitement queue:', error);
    }
  }
  
  /**
   * Nettoie les appels expirés de la queue
   */
  static async cleanupExpiredCalls(businessId: string, maxWaitTime: number = 300): Promise<void> {
    await redisService.connect();
    const queueKey = `call_queue:${businessId}`;
    
    const allCalls = await redisService.client.zRange(queueKey, 0, -1);
    const now = Date.now();
    
    for (const call of allCalls) {
      try {
        const queueItem: CallQueueItem = JSON.parse(call);
        const waitTime = (now - queueItem.queuedAt.getTime()) / 1000;
        
        if (waitTime > maxWaitTime) {
          // Appel expiré, le supprimer et raccrocher
          await redisService.client.zRem(queueKey, call);
          await TelnyxService.hangupCall(queueItem.telnyxCallId);
          
          console.log(`⏰ Appel expiré supprimé de la queue: ${queueItem.callId}`);
        }
      } catch (error) {
        console.error('Erreur cleanup queue item:', error);
      }
    }
  }
}