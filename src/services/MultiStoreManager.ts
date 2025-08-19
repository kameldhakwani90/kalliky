import { PrismaClient } from '@prisma/client';
import { SimpleStoreQueueManager } from '@/lib/queue/SimpleStoreQueueManager';
import { Phase1CacheManager } from '@/lib/cache/Phase1CacheManager';
import { WebhookRouter } from '@/lib/routing/WebhookRouter';

interface StoreQuota {
  maxConcurrentCalls: number;
  maxQueueSize: number;
  plan: 'STARTER' | 'PRO' | 'BUSINESS';
}

interface StoreConfiguration {
  storeId: string;
  businessId: string;
  quota: StoreQuota;
  redirectionRules: any[];
  isActive: boolean;
}

export class MultiStoreManager {
  private prisma: PrismaClient;
  private queueManager: SimpleStoreQueueManager;
  private cacheManager: Phase1CacheManager;
  private webhookRouter: WebhookRouter;
  private initializedStores: Set<string> = new Set();

  constructor(
    prisma: PrismaClient,
    queueManager: SimpleStoreQueueManager,
    cacheManager: Phase1CacheManager,
    webhookRouter: WebhookRouter
  ) {
    this.prisma = prisma;
    this.queueManager = queueManager;
    this.cacheManager = cacheManager;
    this.webhookRouter = webhookRouter;
  }

  async initializeStore(storeId: string): Promise<boolean> {
    try {
      if (this.initializedStores.has(storeId)) {
        return true; // Déjà initialisé
      }

      // Récupérer la configuration du store
      const config = await this.getStoreConfiguration(storeId);
      if (!config) {
        throw new Error(`Store configuration not found for ${storeId}`);
      }

      // Initialiser la queue du store
      await this.queueManager.initializeStoreQueue(storeId, config.quota);

      // Configurer les règles de redirection
      if (config.redirectionRules.length > 0) {
        await this.queueManager.setRedirectionRules(storeId, config.redirectionRules);
      }

      // Marquer comme initialisé
      this.initializedStores.add(storeId);

      console.log(`Store ${storeId} initialized successfully`);
      return true;

    } catch (error) {
      console.error(`Failed to initialize store ${storeId}:`, error);
      return false;
    }
  }

  async initializeAllActiveStores(): Promise<{ success: number; failed: number; total: number }> {
    console.log('Initializing all active stores...');

    const activeStores = await this.prisma.store.findMany({
      where: { isActive: true },
      include: {
        subscription: true,
        business: true
      }
    });

    let success = 0;
    let failed = 0;

    for (const store of activeStores) {
      const initialized = await this.initializeStore(store.id);
      if (initialized) {
        success++;
      } else {
        failed++;
      }
    }

    console.log(`Store initialization complete: ${success} success, ${failed} failed, ${activeStores.length} total`);

    return {
      success,
      failed,
      total: activeStores.length
    };
  }

  private async getStoreConfiguration(storeId: string): Promise<StoreConfiguration | null> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        subscription: true,
        business: true
      }
    });

    if (!store || !store.subscription) {
      return null;
    }

    // Récupérer les règles de redirection depuis le cache/DB
    const redirectionRules = await this.getStoredRedirectionRules(storeId);

    return {
      storeId: store.id,
      businessId: store.businessId,
      quota: this.getQuotaByPlan(store.subscription.plan),
      redirectionRules,
      isActive: store.isActive
    };
  }

  private getQuotaByPlan(plan: string): StoreQuota {
    switch (plan) {
      case 'PRO':
        return {
          maxConcurrentCalls: 3,
          maxQueueSize: 20,
          plan: 'PRO'
        };
      case 'BUSINESS':
        return {
          maxConcurrentCalls: 5,
          maxQueueSize: 50,
          plan: 'BUSINESS'
        };
      case 'STARTER':
      default:
        return {
          maxConcurrentCalls: 1,
          maxQueueSize: 10,
          plan: 'STARTER'
        };
    }
  }

  private async getStoredRedirectionRules(storeId: string): Promise<any[]> {
    try {
      // Essayer d'abord le cache
      const cachedRules = await this.cacheManager.getStoreData(storeId, 'redirection_rules');
      if (cachedRules) {
        return cachedRules;
      }

      // Sinon, récupérer depuis la base de données (si on a une table pour ça)
      // Pour l'instant, retourner des règles par défaut
      const defaultRules = [
        {
          condition: "intent === 'ORDER' && totalAmount > 100",
          action: 'REDIRECT_MANAGER',
          value: 'manager@business.com'
        },
        {
          condition: "intent === 'RESERVATION' && groupSize > 8",
          action: 'REDIRECT_SERVICE',
          value: 'events@business.com'
        },
        {
          condition: "intent === 'COMPLAINT'",
          action: 'QUEUE_PRIORITY',
          value: '1'
        }
      ];

      // Mettre en cache
      await this.cacheManager.setStoreData(storeId, 'redirection_rules', defaultRules, 3600);

      return defaultRules;
    } catch (error) {
      console.error(`Error getting redirection rules for store ${storeId}:`, error);
      return [];
    }
  }

  async getStoreStatus(storeId: string): Promise<any> {
    if (!this.initializedStores.has(storeId)) {
      return {
        storeId,
        initialized: false,
        error: 'Store not initialized'
      };
    }

    try {
      const queueStatus = await this.queueManager.getStoreStatus(storeId);
      const cacheInfo = await this.cacheManager.getStoreInfo(storeId);

      return {
        storeId,
        initialized: true,
        queue: queueStatus,
        cache: cacheInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting status for store ${storeId}:`, error);
      return {
        storeId,
        initialized: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAllStoresStatus(): Promise<any[]> {
    const statuses = [];

    for (const storeId of this.initializedStores) {
      const status = await this.getStoreStatus(storeId);
      statuses.push(status);
    }

    return statuses;
  }

  async updateStoreConfiguration(storeId: string, updates: Partial<StoreConfiguration>): Promise<boolean> {
    try {
      // Mettre à jour les règles de redirection si fournies
      if (updates.redirectionRules) {
        await this.queueManager.setRedirectionRules(storeId, updates.redirectionRules);
        await this.cacheManager.setStoreData(storeId, 'redirection_rules', updates.redirectionRules, 3600);
      }

      // Si le quota change, il faudrait redémarrer la queue (pour simplifier, on log juste)
      if (updates.quota) {
        console.warn(`Quota update for store ${storeId} requires queue restart`);
      }

      return true;
    } catch (error) {
      console.error(`Error updating configuration for store ${storeId}:`, error);
      return false;
    }
  }

  async deactivateStore(storeId: string): Promise<boolean> {
    try {
      // Marquer comme non initialisé
      this.initializedStores.delete(storeId);

      // Nettoyer le cache du store
      await this.cacheManager.clearStoreCache(storeId);

      console.log(`Store ${storeId} deactivated`);
      return true;
    } catch (error) {
      console.error(`Error deactivating store ${storeId}:`, error);
      return false;
    }
  }

  async getMetrics(storeId?: string, date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    if (storeId) {
      // Métriques pour un store spécifique
      const metrics = await this.prisma.storeMetrics.findUnique({
        where: {
          storeId_date: {
            storeId,
            date: targetDate
          }
        }
      });

      return metrics || this.getEmptyMetrics(storeId, targetDate);
    } else {
      // Métriques pour tous les stores
      const allMetrics = await this.prisma.storeMetrics.findMany({
        where: { date: targetDate },
        include: {
          store: {
            select: {
              name: true,
              business: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      return allMetrics;
    }
  }

  private getEmptyMetrics(storeId: string, date: string): any {
    return {
      storeId,
      date,
      totalCalls: 0,
      orderCompleted: 0,
      orderFailed: 0,
      reservationCompleted: 0,
      reservationFailed: 0,
      complaintCompleted: 0,
      complaintFailed: 0,
      infoCompleted: 0,
      infoFailed: 0,
      averageWaitTime: null,
      maxConcurrentCalls: 1,
      queueOverflows: 0,
      redirectionCount: 0
    };
  }

  async generateDailyReport(date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const metrics = await this.getMetrics(undefined, targetDate);

    const summary = {
      date: targetDate,
      totalStores: metrics.length,
      totalCalls: metrics.reduce((sum: number, m: any) => sum + m.totalCalls, 0),
      totalOrders: metrics.reduce((sum: number, m: any) => sum + m.orderCompleted, 0),
      totalReservations: metrics.reduce((sum: number, m: any) => sum + m.reservationCompleted, 0),
      totalComplaints: metrics.reduce((sum: number, m: any) => sum + m.complaintCompleted, 0),
      totalOverflows: metrics.reduce((sum: number, m: any) => sum + m.queueOverflows, 0),
      averageWaitTime: this.calculateAverageWaitTime(metrics),
      topPerformingStores: this.getTopPerformingStores(metrics, 5),
      storesWithIssues: this.getStoresWithIssues(metrics)
    };

    return summary;
  }

  private calculateAverageWaitTime(metrics: any[]): number {
    const validTimes = metrics
      .filter(m => m.averageWaitTime !== null)
      .map(m => m.averageWaitTime);

    if (validTimes.length === 0) return 0;

    return validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
  }

  private getTopPerformingStores(metrics: any[], limit: number): any[] {
    return metrics
      .sort((a, b) => b.totalCalls - a.totalCalls)
      .slice(0, limit)
      .map(m => ({
        storeId: m.storeId,
        storeName: m.store?.name,
        businessName: m.store?.business?.name,
        totalCalls: m.totalCalls,
        successRate: this.calculateSuccessRate(m)
      }));
  }

  private getStoresWithIssues(metrics: any[]): any[] {
    return metrics
      .filter(m => m.queueOverflows > 0 || this.calculateSuccessRate(m) < 0.8)
      .map(m => ({
        storeId: m.storeId,
        storeName: m.store?.name,
        businessName: m.store?.business?.name,
        queueOverflows: m.queueOverflows,
        successRate: this.calculateSuccessRate(m),
        issues: this.identifyIssues(m)
      }));
  }

  private calculateSuccessRate(metrics: any): number {
    const total = metrics.totalCalls;
    if (total === 0) return 1;

    const failed = metrics.orderFailed + metrics.reservationFailed + 
                  metrics.complaintFailed + metrics.infoFailed;
    
    return (total - failed) / total;
  }

  private identifyIssues(metrics: any): string[] {
    const issues = [];

    if (metrics.queueOverflows > 0) {
      issues.push(`${metrics.queueOverflows} queue overflows`);
    }

    const successRate = this.calculateSuccessRate(metrics);
    if (successRate < 0.8) {
      issues.push(`Low success rate: ${(successRate * 100).toFixed(1)}%`);
    }

    if (metrics.averageWaitTime && metrics.averageWaitTime > 30) {
      issues.push(`High wait time: ${metrics.averageWaitTime.toFixed(1)}s`);
    }

    return issues;
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up MultiStoreManager...');
    
    try {
      await this.queueManager.cleanup();
      await this.cacheManager.disconnect();
      
      this.initializedStores.clear();
      
      console.log('MultiStoreManager cleanup complete');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}