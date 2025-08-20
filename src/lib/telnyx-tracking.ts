// ============================================================================
// SERVICE TRACKING TELNYX - Suivi automatique des coûts téléphonie
// ============================================================================

import { prisma } from './prisma';

// Prix Telnyx par pays (estimation basée sur la documentation)
const TELNYX_PRICING = {
  'FR': {
    monthly: 1.00,      // €1.00 par mois par numéro  
    inboundPerMinute: 0.0085,  // €0.0085 par minute entrant
    outboundPerMinute: 0.02    // €0.02 par minute sortant
  },
  'US': {
    monthly: 1.00,
    inboundPerMinute: 0.0085,
    outboundPerMinute: 0.01
  },
  'GB': {
    monthly: 1.20,
    inboundPerMinute: 0.01,
    outboundPerMinute: 0.025
  },
  'DE': {
    monthly: 1.50,
    inboundPerMinute: 0.01,
    outboundPerMinute: 0.03
  },
  'ES': {
    monthly: 1.50,
    inboundPerMinute: 0.01,
    outboundPerMinute: 0.025
  },
  'IT': {
    monthly: 1.50,
    inboundPerMinute: 0.01,
    outboundPerMinute: 0.025
  },
  'CA': {
    monthly: 1.00,
    inboundPerMinute: 0.0085,
    outboundPerMinute: 0.01
  },
  'AU': {
    monthly: 1.50,
    inboundPerMinute: 0.015,
    outboundPerMinute: 0.035
  }
};

interface TelnyxCallUsageData {
  storeId: string;
  businessId: string;
  phoneNumberId: string;
  callId?: string;
  duration: number; // en secondes
  direction: 'inbound' | 'outbound';
  fromNumber: string;
  toNumber: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: any;
}

interface TelnyxNumberUsageData {
  storeId: string;
  businessId: string;
  phoneNumberId: string;
  country: string;
  billingMonth: string; // "2025-01"
  success?: boolean;
  errorMessage?: string;
  metadata?: any;
}

export class TelnyxTrackingService {
  
  /**
   * Enregistrer l'utilisation d'un appel Telnyx
   */
  static async trackCallUsage(data: TelnyxCallUsageData): Promise<string> {
    try {
      // Récupérer le numéro pour connaître le pays
      const phoneNumber = await prisma.phoneNumber.findUnique({
        where: { id: data.phoneNumberId }
      });
      
      if (!phoneNumber) {
        throw new Error(`PhoneNumber ${data.phoneNumberId} not found`);
      }
      
      const country = phoneNumber.country || 'FR';
      const pricing = TELNYX_PRICING[country as keyof typeof TELNYX_PRICING] || TELNYX_PRICING.FR;
      
      // Calculer le coût de l'appel
      const durationMinutes = Math.ceil(data.duration / 60); // Facturation à la minute entière supérieure
      const pricePerMinute = data.direction === 'inbound' ? pricing.inboundPerMinute : pricing.outboundPerMinute;
      const cost = durationMinutes * pricePerMinute;
      
      console.log(`📞 Tracking Telnyx Call: ${data.direction} ${durationMinutes}min - €${cost.toFixed(4)}`);
      
      const usage = await prisma.telnyxUsage.create({
        data: {
          storeId: data.storeId,
          businessId: data.businessId,
          phoneNumberId: data.phoneNumberId,
          usageType: data.direction === 'inbound' ? 'INBOUND_CALL' : 'OUTBOUND_CALL',
          callId: data.callId,
          duration: data.duration,
          direction: data.direction,
          fromNumber: data.fromNumber,
          toNumber: data.toNumber,
          cost,
          currency: 'EUR',
          billingDate: new Date(),
          success: data.success !== false,
          errorMessage: data.errorMessage,
          metadata: {
            ...data.metadata,
            country,
            pricePerMinute,
            durationMinutes
          }
        }
      });
      
      // Mettre à jour le résumé mensuel
      await this.updateMonthlySummary(data.storeId, data.businessId);
      
      return usage.id;
      
    } catch (error) {
      console.error('❌ Erreur tracking Telnyx call:', error);
      throw error;
    }
  }
  
  /**
   * Enregistrer le coût mensuel d'un numéro Telnyx
   */
  static async trackNumberMonthlyCost(data: TelnyxNumberUsageData): Promise<string> {
    try {
      const pricing = TELNYX_PRICING[data.country as keyof typeof TELNYX_PRICING] || TELNYX_PRICING.FR;
      const monthlyCost = pricing.monthly;
      
      console.log(`📱 Tracking Telnyx Number: ${data.country} - €${monthlyCost}/mois`);
      
      const usage = await prisma.telnyxUsage.create({
        data: {
          storeId: data.storeId,
          businessId: data.businessId,
          phoneNumberId: data.phoneNumberId,
          usageType: 'NUMBER_MONTHLY',
          cost: monthlyCost,
          currency: 'EUR',
          billingDate: new Date(data.billingMonth + '-01'),
          success: data.success !== false,
          errorMessage: data.errorMessage,
          metadata: {
            ...data.metadata,
            country: data.country,
            billingMonth: data.billingMonth
          }
        }
      });
      
      // Mettre à jour le résumé mensuel
      await this.updateMonthlySummary(data.storeId, data.businessId);
      
      return usage.id;
      
    } catch (error) {
      console.error('❌ Erreur tracking Telnyx number:', error);
      throw error;
    }
  }
  
  /**
   * Mettre à jour le résumé de consommation mensuel
   */
  static async updateMonthlySummary(storeId: string, businessId: string): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7); // "2025-01"
      
      // Calculer les métriques Telnyx du mois en cours
      const monthlyStats = await prisma.telnyxUsage.aggregate({
        where: {
          storeId,
          billingDate: {
            gte: new Date(currentMonth + '-01'),
            lt: new Date(new Date(currentMonth + '-01').setMonth(new Date(currentMonth + '-01').getMonth() + 1))
          }
        },
        _count: { id: true },
        _sum: { 
          cost: true,
          duration: true
        },
        _avg: { cost: true }
      });
      
      // Séparer coûts appels vs coûts numéros
      const callStats = await prisma.telnyxUsage.aggregate({
        where: {
          storeId,
          usageType: { in: ['INBOUND_CALL', 'OUTBOUND_CALL'] },
          billingDate: {
            gte: new Date(currentMonth + '-01'),
            lt: new Date(new Date(currentMonth + '-01').setMonth(new Date(currentMonth + '-01').getMonth() + 1))
          }
        },
        _count: { id: true },
        _sum: { duration: true, cost: true },
        _avg: { cost: true }
      });
      
      const numberStats = await prisma.telnyxUsage.aggregate({
        where: {
          storeId,
          usageType: 'NUMBER_MONTHLY',
          billingDate: {
            gte: new Date(currentMonth + '-01'),
            lt: new Date(new Date(currentMonth + '-01').setMonth(new Date(currentMonth + '-01').getMonth() + 1))
          }
        },
        _sum: { cost: true }
      });
      
      // Upsert résumé mensuel
      const currentTelnyxCost = await this.getCurrentTelnyxCost(storeId, currentMonth);
      const newTotalCost = monthlyStats._sum.cost || 0;
      
      await prisma.consumptionSummary.upsert({
        where: {
          storeId_period: {
            storeId,
            period: currentMonth
          }
        },
        create: {
          storeId,
          businessId,
          period: currentMonth,
          telnyxTotalCalls: callStats._count.id,
          telnyxTotalDuration: callStats._sum.duration || 0,
          telnyxTotalCost: newTotalCost,
          telnyxNumbersCost: numberStats._sum.cost || 0,
          telnyxAvgCostPerCall: callStats._avg.cost || 0,
          totalCost: newTotalCost
        },
        update: {
          telnyxTotalCalls: callStats._count.id,
          telnyxTotalDuration: callStats._sum.duration || 0,
          telnyxTotalCost: newTotalCost,
          telnyxNumbersCost: numberStats._sum.cost || 0,
          telnyxAvgCostPerCall: callStats._avg.cost || 0,
          totalCost: {
            increment: newTotalCost - currentTelnyxCost
          }
        }
      });
      
      console.log(`📈 Résumé Telnyx mis à jour pour ${storeId}`);
      
    } catch (error) {
      console.error('❌ Erreur mise à jour résumé Telnyx:', error);
    }
  }
  
  /**
   * Récupérer le coût Telnyx actuel pour éviter les doublons
   */
  private static async getCurrentTelnyxCost(storeId: string, period: string): Promise<number> {
    const existing = await prisma.consumptionSummary.findUnique({
      where: { storeId_period: { storeId, period } }
    });
    return existing?.telnyxTotalCost || 0;
  }
  
  /**
   * Facturer automatiquement les coûts mensuels des numéros pour toutes les boutiques actives
   */
  static async billMonthlyNumbers(month?: string): Promise<void> {
    try {
      const billingMonth = month || new Date().toISOString().substring(0, 7);
      console.log(`💳 Facturation mensuelle Telnyx pour ${billingMonth}`);
      
      // Récupérer tous les numéros actifs
      const activeNumbers = await prisma.phoneNumber.findMany({
        where: { 
          status: 'ACTIVE',
          // Éviter de facturer plusieurs fois le même mois
          NOT: {
            telnyxUsages: {
              some: {
                usageType: 'NUMBER_MONTHLY',
                billingDate: {
                  gte: new Date(billingMonth + '-01'),
                  lt: new Date(new Date(billingMonth + '-01').setMonth(new Date(billingMonth + '-01').getMonth() + 1))
                }
              }
            }
          }
        },
        include: { business: { include: { stores: true } } }
      });
      
      console.log(`📱 ${activeNumbers.length} numéros à facturer`);
      
      for (const phoneNumber of activeNumbers) {
        const store = phoneNumber.business.stores[0]; // Prendre le premier store du business
        if (!store) continue;
        
        try {
          await this.trackNumberMonthlyCost({
            storeId: store.id,
            businessId: phoneNumber.businessId,
            phoneNumberId: phoneNumber.id,
            country: phoneNumber.country,
            billingMonth,
            success: true,
            metadata: {
              auto_billing: true,
              billing_date: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error(`❌ Erreur facturation ${phoneNumber.number}:`, error);
        }
      }
      
      console.log(`✅ Facturation mensuelle Telnyx terminée`);
      
    } catch (error) {
      console.error('❌ Erreur facturation mensuelle:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir les statistiques Telnyx pour une boutique
   */
  static async getStoreStats(storeId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = { storeId };
    
    if (startDate || endDate) {
      whereClause.billingDate = {};
      if (startDate) whereClause.billingDate.gte = startDate;
      if (endDate) whereClause.billingDate.lte = endDate;
    }
    
    return await prisma.telnyxUsage.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { 
        cost: true,
        duration: true
      },
      _avg: { 
        cost: true,
        duration: true
      }
    });
  }
  
  /**
   * Obtenir détail des utilisations avec pagination
   */
  static async getDetailedUsage(params: {
    storeId?: string;
    businessId?: string;
    usageType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const whereClause: any = {};
    
    if (params.storeId) whereClause.storeId = params.storeId;
    if (params.businessId) whereClause.businessId = params.businessId;
    if (params.usageType) whereClause.usageType = params.usageType;
    
    if (params.startDate || params.endDate) {
      whereClause.billingDate = {};
      if (params.startDate) whereClause.billingDate.gte = params.startDate;
      if (params.endDate) whereClause.billingDate.lte = params.endDate;
    }
    
    return await prisma.telnyxUsage.findMany({
      where: whereClause,
      include: {
        store: { select: { name: true } },
        business: { select: { name: true } },
        phoneNumber: { select: { number: true, country: true } },
        call: { select: { id: true, fromNumber: true, toNumber: true } }
      },
      orderBy: { billingDate: 'desc' },
      take: params.limit || 100,
      skip: params.offset || 0
    });
  }
}

// Export pour utilisation dans d'autres services
export const telnyxTracking = TelnyxTrackingService;