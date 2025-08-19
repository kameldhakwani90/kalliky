import { PrismaClient } from '@prisma/client';
import { SimpleStoreQueueManager } from '../queue/SimpleStoreQueueManager';

interface WebhookPayload {
  from: string; // Numéro de téléphone du client
  to: string;   // Numéro de téléphone du business
  body?: string;
  timestamp?: string;
  type: 'call' | 'sms' | 'whatsapp';
  metadata?: any;
}

interface RouteResult {
  success: boolean;
  storeId?: string;
  businessId?: string;
  error?: string;
  action?: string;
}

export class WebhookRouter {
  private prisma: PrismaClient;
  private queueManager: SimpleStoreQueueManager;
  private phoneNumberCache: Map<string, { storeId: string; businessId: string }> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(prisma: PrismaClient, queueManager: SimpleStoreQueueManager) {
    this.prisma = prisma;
    this.queueManager = queueManager;
  }

  async routeWebhook(payload: WebhookPayload): Promise<RouteResult> {
    try {
      // 1. Identifier le business par numéro de téléphone
      const businessInfo = await this.identifyBusiness(payload.to);
      
      if (!businessInfo) {
        return {
          success: false,
          error: 'Business not found for phone number',
          action: 'log_unknown_number'
        };
      }

      // 2. Vérifier si le business/store est actif
      const isActive = await this.checkBusinessStatus(businessInfo.businessId, businessInfo.storeId);
      
      if (!isActive) {
        return {
          success: false,
          error: 'Business or store is inactive',
          action: 'send_service_unavailable'
        };
      }

      // 3. Enrichir les données du payload
      const enrichedPayload = await this.enrichPayload(payload, businessInfo);

      // 4. Ajouter à la file d'attente spécifique du store
      const queueResult = await this.queueManager.addCallToQueue(
        businessInfo.storeId,
        enrichedPayload
      );

      if (!queueResult.success) {
        // Gérer les débordements de capacité
        return await this.handleCapacityOverflow(businessInfo, queueResult.reason || '');
      }

      return {
        success: true,
        storeId: businessInfo.storeId,
        businessId: businessInfo.businessId,
        action: 'queued_for_processing'
      };

    } catch (error) {
      console.error('Error routing webhook:', error);
      return {
        success: false,
        error: 'Internal routing error',
        action: 'log_error'
      };
    }
  }

  private async identifyBusiness(phoneNumber: string): Promise<{ storeId: string; businessId: string } | null> {
    // Vérifier le cache d'abord
    const cached = this.getCachedBusinessInfo(phoneNumber);
    if (cached) {
      return cached;
    }

    // Rechercher dans la base de données
    const phoneRecord = await this.prisma.phoneNumber.findFirst({
      where: { number: phoneNumber },
      include: {
        business: {
          include: {
            stores: {
              where: { isActive: true },
              take: 1 // Prendre le premier store actif
            }
          }
        }
      }
    });

    if (!phoneRecord || !phoneRecord.business.stores.length) {
      return null;
    }

    const businessInfo = {
      storeId: phoneRecord.business.stores[0].id,
      businessId: phoneRecord.businessId
    };

    // Mettre en cache
    this.setCachedBusinessInfo(phoneNumber, businessInfo);

    return businessInfo;
  }

  private async checkBusinessStatus(businessId: string, storeId: string): Promise<boolean> {
    try {
      const business = await this.prisma.business.findUnique({
        where: { id: businessId },
        include: {
          stores: {
            where: { id: storeId }
          },
          subscriptions: {
            where: { isActive: true }
          }
        }
      });

      return !!(
        business && 
        business.stores.length > 0 && 
        business.stores[0].isActive &&
        business.subscriptions.length > 0
      );
    } catch {
      return false;
    }
  }

  private async enrichPayload(payload: WebhookPayload, businessInfo: { storeId: string; businessId: string }): Promise<any> {
    // Rechercher ou créer le client
    const customer = await this.findOrCreateCustomer(payload.from, businessInfo.businessId);

    // Enrichir avec des informations contextuelles
    return {
      ...payload,
      storeId: businessInfo.storeId,
      businessId: businessInfo.businessId,
      customer: {
        id: customer.id,
        phone: customer.phone,
        firstName: customer.firstName,
        lastName: customer.lastName,
        status: customer.status,
        orderCount: customer.orderCount,
        totalSpent: customer.totalSpent
      },
      enrichedAt: new Date().toISOString(),
      routingInfo: {
        routedBy: 'WebhookRouter',
        routingTimestamp: new Date().toISOString(),
        businessInfo
      }
    };
  }

  private async findOrCreateCustomer(phoneNumber: string, businessId: string) {
    let customer = await this.prisma.customer.findFirst({
      where: {
        phone: phoneNumber,
        businessId: businessId
      }
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          phone: phoneNumber,
          businessId: businessId,
          status: 'NEW'
        }
      });
    } else {
      // Mettre à jour lastSeen
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { lastSeen: new Date() }
      });
    }

    return customer;
  }

  private async handleCapacityOverflow(businessInfo: { storeId: string; businessId: string }, reason: string): Promise<RouteResult> {
    // Incrémenter le compteur de débordement
    await this.incrementOverflowMetrics(businessInfo.storeId);

    // Déterminer l'action en fonction de la raison
    switch (reason) {
      case 'Store capacity exceeded':
        return {
          success: false,
          storeId: businessInfo.storeId,
          businessId: businessInfo.businessId,
          error: reason,
          action: 'send_busy_message'
        };
      
      case 'Store queue not initialized':
        return {
          success: false,
          storeId: businessInfo.storeId,
          businessId: businessInfo.businessId,
          error: reason,
          action: 'initialize_queue_and_retry'
        };
      
      default:
        return {
          success: false,
          storeId: businessInfo.storeId,
          businessId: businessInfo.businessId,
          error: reason,
          action: 'send_error_message'
        };
    }
  }

  private async incrementOverflowMetrics(storeId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await this.prisma.storeMetrics.upsert({
        where: {
          storeId_date: {
            storeId: storeId,
            date: today
          }
        },
        update: {
          queueOverflows: { increment: 1 }
        },
        create: {
          storeId: storeId,
          date: today,
          queueOverflows: 1
        }
      });
    } catch (error) {
      console.error('Error updating overflow metrics:', error);
    }
  }

  // Cache management
  private getCachedBusinessInfo(phoneNumber: string): { storeId: string; businessId: string } | null {
    const cached = this.phoneNumberCache.get(phoneNumber);
    const expiry = this.cacheExpiry.get(phoneNumber);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    // Nettoyer les entrées expirées
    this.phoneNumberCache.delete(phoneNumber);
    this.cacheExpiry.delete(phoneNumber);
    
    return null;
  }

  private setCachedBusinessInfo(phoneNumber: string, info: { storeId: string; businessId: string }): void {
    this.phoneNumberCache.set(phoneNumber, info);
    this.cacheExpiry.set(phoneNumber, Date.now() + this.CACHE_TTL);
  }

  // Méthodes utilitaires pour le monitoring
  async getRoutingStats(): Promise<any> {
    return {
      cacheSize: this.phoneNumberCache.size,
      cacheHitRatio: this.calculateCacheHitRatio(),
      lastActivity: new Date().toISOString()
    };
  }

  private calculateCacheHitRatio(): number {
    // Implémenter le calcul du ratio de cache hits
    // Pour simplifier, retourner une valeur par défaut
    return 0.85;
  }

  async clearCache(): Promise<void> {
    this.phoneNumberCache.clear();
    this.cacheExpiry.clear();
  }

  async warmupCache(): Promise<void> {
    // Pré-charger les numéros de téléphone les plus utilisés
    const activePhoneNumbers = await this.prisma.phoneNumber.findMany({
      include: {
        business: {
          include: {
            stores: {
              where: { isActive: true },
              take: 1
            }
          }
        }
      }
    });

    for (const phoneRecord of activePhoneNumbers) {
      if (phoneRecord.business.stores.length > 0) {
        this.setCachedBusinessInfo(phoneRecord.number, {
          storeId: phoneRecord.business.stores[0].id,
          businessId: phoneRecord.businessId
        });
      }
    }
  }
}