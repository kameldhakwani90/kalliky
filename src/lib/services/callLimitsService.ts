import { prisma } from '@/lib/prisma';
import { redisService } from '@/lib/redis';

// Configuration des limites par plan
export const CALL_LIMITS_BY_PLAN = {
  STARTER: {
    maxConcurrentCalls: 1,
    maxQueueSize: 1,
    maxWaitTime: 120, // 2 minutes
    upgradeMessage: 'Passez au plan PRO pour gérer plus d\'appels simultanés'
  },
  PRO: {
    maxConcurrentCalls: 6,
    maxQueueSize: 10,
    maxWaitTime: 180, // 3 minutes
    upgradeMessage: 'Passez au plan Business pour une capacité supérieure'
  },
  BUSINESS: {
    maxConcurrentCalls: 10,
    maxQueueSize: 15,
    maxWaitTime: 300, // 5 minutes
    upgradeMessage: 'Contactez-nous pour une solution entreprise personnalisée'
  },
  ENTERPRISE: {
    maxConcurrentCalls: 999, // Pratiquement illimité
    maxQueueSize: 50,
    maxWaitTime: 600, // 10 minutes
    upgradeMessage: null
  }
} as const;

export class CallLimitsService {
  
  // Obtenir les limites pour un store/business
  static async getCallLimitsForStore(storeId: string): Promise<typeof CALL_LIMITS_BY_PLAN.STARTER> {
    try {
      // Récupérer l'abonnement actif du store
      const subscription = await prisma.subscription.findFirst({
        where: {
          storeId: storeId,
          isActive: true,
          status: 'active'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!subscription) {
        console.warn(`⚠️ Aucun abonnement actif trouvé pour store ${storeId}, utilisation des limites STARTER`);
        return CALL_LIMITS_BY_PLAN.STARTER;
      }

      const plan = subscription.plan as keyof typeof CALL_LIMITS_BY_PLAN;
      const limits = CALL_LIMITS_BY_PLAN[plan] || CALL_LIMITS_BY_PLAN.STARTER;

      console.log(`📊 Limites d'appels pour store ${storeId} (plan ${plan}):`, limits);
      return limits;

    } catch (error) {
      console.error('❌ Erreur récupération limites d\'appels:', error);
      return CALL_LIMITS_BY_PLAN.STARTER; // Fallback sécurisé
    }
  }

  // Vérifier si un nouvel appel peut être accepté
  static async canAcceptNewCall(storeId: string, businessId: string): Promise<{
    canAccept: boolean;
    reason?: string;
    queuePosition?: number;
    estimatedWaitTime?: number;
    upgradeMessage?: string;
  }> {
    try {
      // Obtenir les limites pour ce store
      const limits = await this.getCallLimitsForStore(storeId);
      
      // Compter les appels actifs
      const activeCalls = await redisService.getActiveCalls(businessId);
      const activeCallsCount = activeCalls.length;

      // Compter les appels en queue
      const queueSize = await this.getQueueSize(storeId);

      console.log(`📞 Store ${storeId}: ${activeCallsCount}/${limits.maxConcurrentCalls} appels actifs, ${queueSize}/${limits.maxQueueSize} en queue`);

      // Vérifier si on peut accepter directement
      if (activeCallsCount < limits.maxConcurrentCalls) {
        return {
          canAccept: true
        };
      }

      // Vérifier si on peut mettre en queue
      if (queueSize < limits.maxQueueSize) {
        const estimatedWaitTime = this.calculateEstimatedWaitTime(activeCallsCount, queueSize);
        
        return {
          canAccept: false,
          reason: 'queue',
          queuePosition: queueSize + 1,
          estimatedWaitTime: estimatedWaitTime
        };
      }

      // Queue pleine - refuser avec message d'upgrade
      return {
        canAccept: false,
        reason: 'queue_full',
        upgradeMessage: limits.upgradeMessage || 'Toutes nos lignes sont occupées. Veuillez rappeler plus tard.'
      };

    } catch (error) {
      console.error('❌ Erreur vérification capacité d\'appel:', error);
      return {
        canAccept: false,
        reason: 'error'
      };
    }
  }

  // Calculer le temps d'attente estimé
  private static calculateEstimatedWaitTime(activeCalls: number, queuePosition: number): number {
    // Estimation basée sur durée moyenne d'appel (3 minutes) et position dans la queue
    const averageCallDuration = 180; // 3 minutes en secondes
    const estimatedWait = Math.ceil((queuePosition * averageCallDuration) / Math.max(activeCalls, 1));
    
    return Math.min(estimatedWait, 300); // Max 5 minutes estimées
  }

  // Obtenir la taille actuelle de la queue
  private static async getQueueSize(storeId: string): Promise<number> {
    try {
      const queueKey = `call:queue:${storeId}`;
      return await redisService.client.lLen(queueKey);
    } catch (error) {
      console.error('❌ Erreur récupération taille queue:', error);
      return 0;
    }
  }

  // Ajouter un appel à la queue
  static async addToQueue(storeId: string, callData: {
    callId: string;
    telnyxCallId: string;
    fromNumber: string;
    toNumber: string;
    queuedAt: string;
  }): Promise<{ position: number; estimatedWait: number }> {
    try {
      const queueKey = `call:queue:${storeId}`;
      
      // Ajouter à la fin de la queue
      await redisService.client.rPush(queueKey, JSON.stringify(callData));
      
      // Définir TTL pour éviter les queues infinies (1 heure)
      await redisService.client.expire(queueKey, 3600);
      
      // Obtenir la position
      const position = await redisService.client.lLen(queueKey);
      
      // Calculer temps d'attente estimé
      const activeCalls = await redisService.getActiveCallsCount(storeId);
      const estimatedWait = this.calculateEstimatedWaitTime(activeCalls, position);
      
      console.log(`📋 Appel ${callData.callId} ajouté à la queue position ${position}`);
      
      return { position, estimatedWait };
    } catch (error) {
      console.error('❌ Erreur ajout queue:', error);
      throw error;
    }
  }

  // Retirer le prochain appel de la queue
  static async getNextFromQueue(storeId: string): Promise<any | null> {
    try {
      const queueKey = `call:queue:${storeId}`;
      
      // Retirer le premier élément (FIFO)
      const nextCallData = await redisService.client.lPop(queueKey);
      
      if (nextCallData) {
        const callData = JSON.parse(nextCallData);
        console.log(`📤 Appel ${callData.callId} retiré de la queue`);
        return callData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erreur récupération queue:', error);
      return null;
    }
  }

  // Retirer un appel spécifique de la queue (abandon)
  static async removeFromQueue(storeId: string, callId: string): Promise<boolean> {
    try {
      const queueKey = `call:queue:${storeId}`;
      
      // Récupérer tous les éléments de la queue
      const queueItems = await redisService.client.lRange(queueKey, 0, -1);
      
      // Chercher et retirer l'appel spécifique
      for (let i = 0; i < queueItems.length; i++) {
        const callData = JSON.parse(queueItems[i]);
        if (callData.callId === callId) {
          // Retirer cet élément par valeur
          await redisService.client.lRem(queueKey, 1, queueItems[i]);
          console.log(`🗑️ Appel ${callId} retiré de la queue (abandon)`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erreur suppression queue:', error);
      return false;
    }
  }

  // Obtenir l'état complet de la queue pour monitoring
  static async getQueueStatus(storeId: string): Promise<{
    queueSize: number;
    activeCalls: number;
    maxConcurrent: number;
    maxQueue: number;
    plan: string;
    queueItems: any[];
  }> {
    try {
      const limits = await this.getCallLimitsForStore(storeId);
      const queueKey = `call:queue:${storeId}`;
      
      // Récupérer les informations du business pour les appels actifs
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { businessId: true }
      });
      
      const activeCalls = store ? await redisService.getActiveCallsCount(store.businessId) : 0;
      const queueItems = await redisService.client.lRange(queueKey, 0, -1);
      const queueSize = queueItems.length;
      
      // Parser les éléments de la queue
      const parsedQueueItems = queueItems.map(item => {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      }).filter(Boolean);

      return {
        queueSize,
        activeCalls,
        maxConcurrent: limits.maxConcurrentCalls,
        maxQueue: limits.maxQueueSize,
        plan: 'STARTER', // À améliorer en récupérant le vrai plan
        queueItems: parsedQueueItems
      };
    } catch (error) {
      console.error('❌ Erreur statut queue:', error);
      return {
        queueSize: 0,
        activeCalls: 0,
        maxConcurrent: 3,
        maxQueue: 5,
        plan: 'STARTER',
        queueItems: []
      };
    }
  }

  // Nettoyer les queues expirées (cron job)
  static async cleanupExpiredQueues(): Promise<void> {
    try {
      console.log('🧹 Nettoyage des queues expirées...');
      
      // Cette méthode peut être appelée périodiquement pour nettoyer
      // les queues de stores inactifs ou les appels abandonnés
      
      // Pour l'instant, le TTL Redis s'en charge automatiquement
      console.log('✅ Nettoyage queues terminé');
    } catch (error) {
      console.error('❌ Erreur nettoyage queues:', error);
    }
  }
}

// Export des constantes pour usage externe
export { CALL_LIMITS_BY_PLAN as CallLimits };