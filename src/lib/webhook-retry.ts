// ============================================================================
// WEBHOOK RETRY MECHANISM - Gestion des échecs et retry automatique
// ============================================================================

import { redisService } from './redis';
import { prisma } from './prisma';

export interface WebhookEvent {
  id: string;
  source: 'telnyx' | 'stripe';
  eventType: string;
  payload: any;
  originalUrl: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date;
  createdAt: Date;
  lastError?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export class WebhookRetryService {
  
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 5,
    initialDelayMs: 1000, // 1 seconde
    backoffMultiplier: 2,
    maxDelayMs: 300000 // 5 minutes max
  };
  
  /**
   * Enregistre un webhook pour retry en cas d'échec
   */
  static async scheduleWebhookForRetry(
    source: 'telnyx' | 'stripe',
    eventType: string,
    payload: any,
    originalUrl: string,
    error?: string,
    config: Partial<RetryConfig> = {}
  ): Promise<string> {
    
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const webhookId = `webhook_${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const webhookEvent: WebhookEvent = {
      id: webhookId,
      source,
      eventType,
      payload,
      originalUrl,
      attempts: 1,
      maxAttempts: finalConfig.maxAttempts,
      nextRetryAt: new Date(Date.now() + finalConfig.initialDelayMs),
      createdAt: new Date(),
      lastError: error
    };
    
    // Stocker dans Redis avec TTL de 24h
    await redisService.connect();
    const key = `webhook_retry:${webhookId}`;
    await redisService.client.setEx(key, 86400, JSON.stringify(webhookEvent));
    
    // Ajouter à la queue de retry
    const queueKey = `webhook_retry_queue:${source}`;
    await redisService.client.zAdd(queueKey, {
      score: webhookEvent.nextRetryAt.getTime(),
      value: webhookId
    });
    
    console.log(`📋 Webhook ${source} programmé pour retry: ${webhookId} (tentative 1/${finalConfig.maxAttempts})`);
    
    return webhookId;
  }
  
  /**
   * Marque un webhook comme traité avec succès
   */
  static async markWebhookSuccess(webhookId: string): Promise<void> {
    await redisService.connect();
    
    const key = `webhook_retry:${webhookId}`;
    const webhookData = await redisService.client.get(key);
    
    if (webhookData) {
      const webhook: WebhookEvent = JSON.parse(webhookData as string);
      
      // Supprimer de Redis et de la queue
      await redisService.client.del(key);
      const queueKey = `webhook_retry_queue:${webhook.source}`;
      await redisService.client.zRem(queueKey, webhookId);
      
      console.log(`✅ Webhook ${webhook.source} traité avec succès: ${webhookId}`);
    }
  }
  
  /**
   * Marque un webhook comme échoué et programme le prochain retry
   */
  static async markWebhookFailure(
    webhookId: string, 
    error: string,
    config: Partial<RetryConfig> = {}
  ): Promise<boolean> {
    
    await redisService.connect();
    const key = `webhook_retry:${webhookId}`;
    const webhookData = await redisService.client.get(key);
    
    if (!webhookData) {
      console.error(`❌ Webhook non trouvé pour retry: ${webhookId}`);
      return false;
    }
    
    const webhook: WebhookEvent = JSON.parse(webhookData as string);
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    webhook.attempts++;
    webhook.lastError = error;
    
    // Vérifier si on a dépassé le nombre max de tentatives
    if (webhook.attempts >= webhook.maxAttempts) {
      // Déplacer vers les échecs définitifs
      await this.moveToDeadLetterQueue(webhook);
      
      // Supprimer de la queue active
      const queueKey = `webhook_retry_queue:${webhook.source}`;
      await redisService.client.zRem(queueKey, webhookId);
      await redisService.client.del(key);
      
      console.error(`💀 Webhook ${webhook.source} abandonné après ${webhook.attempts} tentatives: ${webhookId}`);
      return false;
    }
    
    // Calculer le délai du prochain retry (exponential backoff)
    const delay = Math.min(
      finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, webhook.attempts - 1),
      finalConfig.maxDelayMs
    );
    
    webhook.nextRetryAt = new Date(Date.now() + delay);
    
    // Mettre à jour dans Redis
    await redisService.client.setEx(key, 86400, JSON.stringify(webhook));
    
    // Mettre à jour la queue avec le nouveau timestamp
    const queueKey = `webhook_retry_queue:${webhook.source}`;
    await redisService.client.zAdd(queueKey, {
      score: webhook.nextRetryAt.getTime(),
      value: webhookId
    });
    
    console.log(`🔄 Webhook ${webhook.source} programmé pour retry ${webhook.attempts}/${webhook.maxAttempts} dans ${delay}ms: ${webhookId}`);
    
    return true;
  }
  
  /**
   * Récupère les webhooks prêts à être retraités
   */
  static async getWebhooksReadyForRetry(
    source: 'telnyx' | 'stripe',
    limit: number = 10
  ): Promise<WebhookEvent[]> {
    
    await redisService.connect();
    const queueKey = `webhook_retry_queue:${source}`;
    const now = Date.now();
    
    // Récupérer les webhooks dont le nextRetryAt est passé
    const webhookIds = await redisService.client.zRangeByScore(
      queueKey,
      0,
      now,
      { LIMIT: { offset: 0, count: limit } }
    );
    
    const webhooks: WebhookEvent[] = [];
    
    for (const webhookId of webhookIds) {
      const key = `webhook_retry:${webhookId}`;
      const webhookData = await redisService.client.get(key);
      
      if (webhookData) {
        try {
          const webhook: WebhookEvent = JSON.parse(webhookData as string);
          webhooks.push(webhook);
        } catch (error) {
          console.error(`❌ Erreur parsing webhook retry ${webhookId}:`, error);
          // Supprimer les données corrompues
          await redisService.client.del(key);
          await redisService.client.zRem(queueKey, webhookId);
        }
      } else {
        // Supprimer de la queue si les données n'existent plus
        await redisService.client.zRem(queueKey, webhookId);
      }
    }
    
    return webhooks;
  }
  
  /**
   * Déplace un webhook vers la dead letter queue
   */
  private static async moveToDeadLetterQueue(webhook: WebhookEvent): Promise<void> {
    await redisService.connect();
    
    const dlqKey = `webhook_dead_letter:${webhook.source}`;
    const dlqItem = {
      ...webhook,
      failedAt: new Date(),
      reason: `Max attempts (${webhook.maxAttempts}) exceeded`
    };
    
    // Stocker dans la DLQ avec TTL de 7 jours
    await redisService.client.setEx(
      `${dlqKey}:${webhook.id}`,
      604800, // 7 jours
      JSON.stringify(dlqItem)
    );
    
    // Ajouter à l'index DLQ
    await redisService.client.zAdd(dlqKey, {
      score: Date.now(),
      value: webhook.id
    });
    
    console.error(`💀 Webhook ${webhook.source} déplacé vers DLQ: ${webhook.id}`);
  }
  
  /**
   * Récupère les webhooks de la dead letter queue
   */
  static async getDeadLetterWebhooks(
    source: 'telnyx' | 'stripe',
    limit: number = 50
  ): Promise<any[]> {
    
    await redisService.connect();
    const dlqKey = `webhook_dead_letter:${source}`;
    
    const webhookIds = await redisService.client.zRevRange(dlqKey, 0, limit - 1);
    const deadWebhooks: any[] = [];
    
    for (const webhookId of webhookIds) {
      const key = `${dlqKey}:${webhookId}`;
      const webhookData = await redisService.client.get(key);
      
      if (webhookData) {
        try {
          const webhook = JSON.parse(webhookData as string);
          deadWebhooks.push(webhook);
        } catch (error) {
          console.error(`❌ Erreur parsing DLQ webhook ${webhookId}:`, error);
        }
      }
    }
    
    return deadWebhooks;
  }
  
  /**
   * Nettoyage périodique des webhooks expirés
   */
  static async cleanupExpiredWebhooks(): Promise<void> {
    await redisService.connect();
    
    const sources = ['telnyx', 'stripe'] as const;
    let totalCleaned = 0;
    
    for (const source of sources) {
      // Nettoyer la queue active
      const queueKey = `webhook_retry_queue:${source}`;
      const pattern = `webhook_retry:*`;
      const keys = await redisService.client.keys(pattern);
      
      let sourceCleaned = 0;
      for (const key of keys) {
        const ttl = await redisService.client.ttl(key);
        if (ttl <= 0) {
          const webhookId = key.replace('webhook_retry:', '');
          await redisService.client.del(key);
          await redisService.client.zRem(queueKey, webhookId);
          sourceCleaned++;
        }
      }
      
      totalCleaned += sourceCleaned;
      if (sourceCleaned > 0) {
        console.log(`🧹 Nettoyé ${sourceCleaned} webhooks ${source} expirés`);
      }
    }
    
    if (totalCleaned > 0) {
      console.log(`🧹 Nettoyage webhook retry terminé: ${totalCleaned} éléments supprimés`);
    }
  }
  
  /**
   * Statistiques des webhooks retry
   */
  static async getRetryStats(source: 'telnyx' | 'stripe'): Promise<{
    pending: number;
    deadLetter: number;
    oldestPending?: Date;
    newestPending?: Date;
  }> {
    
    await redisService.connect();
    
    const queueKey = `webhook_retry_queue:${source}`;
    const dlqKey = `webhook_dead_letter:${source}`;
    
    const [pending, deadLetter, oldestScore, newestScore] = await Promise.all([
      redisService.client.zCard(queueKey),
      redisService.client.zCard(dlqKey),
      redisService.client.zRange(queueKey, 0, 0, { withScores: true }),
      redisService.client.zRange(queueKey, -1, -1, { withScores: true })
    ]);
    
    return {
      pending,
      deadLetter,
      oldestPending: oldestScore.length > 0 ? new Date(Number(oldestScore[0].score)) : undefined,
      newestPending: newestScore.length > 0 ? new Date(Number(newestScore[0].score)) : undefined
    };
  }
}

// ============================================================================
// WEBHOOK PROCESSOR - Traitement des webhooks avec retry automatique
// ============================================================================

export class WebhookProcessor {
  
  /**
   * Traite un webhook avec gestion automatique des retries
   */
  static async processWebhookSafely(
    source: 'telnyx' | 'stripe',
    eventType: string,
    payload: any,
    originalUrl: string,
    handler: (payload: any) => Promise<void>
  ): Promise<{ success: boolean; error?: string }> {
    
    try {
      // Tenter de traiter le webhook
      await handler(payload);
      
      console.log(`✅ Webhook ${source} traité avec succès: ${eventType}`);
      return { success: true };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Erreur traitement webhook ${source} ${eventType}:`, errorMessage);
      
      // Programmer pour retry
      await WebhookRetryService.scheduleWebhookForRetry(
        source,
        eventType,
        payload,
        originalUrl,
        errorMessage
      );
      
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Worker pour traiter les webhooks en attente de retry
   */
  static async processRetryQueue(
    source: 'telnyx' | 'stripe',
    handlers: Record<string, (payload: any) => Promise<void>>
  ): Promise<void> {
    
    const webhooks = await WebhookRetryService.getWebhooksReadyForRetry(source, 5);
    
    if (webhooks.length === 0) {
      return;
    }
    
    console.log(`🔄 Traitement de ${webhooks.length} webhooks ${source} en retry`);
    
    for (const webhook of webhooks) {
      const handler = handlers[webhook.eventType];
      
      if (!handler) {
        console.error(`❌ Aucun handler trouvé pour ${webhook.eventType}`);
        await WebhookRetryService.markWebhookFailure(
          webhook.id, 
          `No handler found for event type: ${webhook.eventType}`
        );
        continue;
      }
      
      try {
        await handler(webhook.payload);
        await WebhookRetryService.markWebhookSuccess(webhook.id);
        console.log(`✅ Webhook retry ${source} réussi: ${webhook.id}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown retry error';
        await WebhookRetryService.markWebhookFailure(webhook.id, errorMessage);
        console.error(`❌ Webhook retry ${source} échoué: ${webhook.id} - ${errorMessage}`);
      }
    }
  }
}