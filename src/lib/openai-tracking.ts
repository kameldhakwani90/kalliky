// ============================================================================
// SERVICE TRACKING OPENAI - Suivi automatique des coûts et consommation
// ============================================================================

import { prisma } from './prisma';

// Prix OpenAI par modèle (prix par 1M tokens - janvier 2025)
const OPENAI_PRICING = {
  'gpt-4o': {
    input: 2.50,  // $2.50 per 1M input tokens
    output: 10.00  // $10.00 per 1M output tokens
  },
  'gpt-4o-mini': {
    input: 0.15,   // $0.15 per 1M input tokens  
    output: 0.60   // $0.60 per 1M output tokens
  },
  'gpt-4-turbo': {
    input: 10.00,  // $10.00 per 1M input tokens
    output: 30.00  // $30.00 per 1M output tokens
  },
  'gpt-4': {
    input: 30.00,  // $30.00 per 1M input tokens
    output: 60.00  // $60.00 per 1M output tokens
  },
  'gpt-3.5-turbo': {
    input: 0.50,   // $0.50 per 1M input tokens
    output: 1.50   // $1.50 per 1M output tokens
  }
};

interface OpenAIUsageData {
  storeId: string;
  businessId: string;
  customerId?: string;
  callId?: string;
  operation: 'call_analysis' | 'conversation' | 'menu_processing' | 'general_chat' | 'product_extraction';
  model: string;
  tokensInput: number;
  tokensOutput: number;
  duration?: number; // durée en secondes
  success?: boolean;
  errorMessage?: string;
  metadata?: any;
}

export class OpenAITrackingService {
  
  /**
   * Enregistrer une utilisation d'OpenAI
   */
  static async trackUsage(data: OpenAIUsageData): Promise<string> {
    try {
      const totalTokens = data.tokensInput + data.tokensOutput;
      const pricing = OPENAI_PRICING[data.model as keyof typeof OPENAI_PRICING];
      
      let costInput = 0;
      let costOutput = 0;
      let totalCost = 0;
      
      if (pricing) {
        // Calculer coûts en USD
        costInput = (data.tokensInput / 1_000_000) * pricing.input;
        costOutput = (data.tokensOutput / 1_000_000) * pricing.output;
        totalCost = costInput + costOutput;
      }
      
      console.log(`📊 Tracking OpenAI: ${data.model} - ${totalTokens} tokens - $${totalCost.toFixed(4)}`);
      
      const usage = await prisma.openAIUsage.create({
        data: {
          storeId: data.storeId,
          businessId: data.businessId,
          customerId: data.customerId,
          callId: data.callId,
          operation: data.operation,
          model: data.model,
          tokensInput: data.tokensInput,
          tokensOutput: data.tokensOutput,
          totalTokens,
          costInput,
          costOutput,
          totalCost,
          duration: data.duration,
          success: data.success !== false,
          errorMessage: data.errorMessage,
          metadata: data.metadata || {}
        }
      });
      
      // Mettre à jour le résumé mensuel
      await this.updateMonthlySummary(data.storeId, data.businessId);
      
      return usage.id;
      
    } catch (error) {
      console.error('❌ Erreur tracking OpenAI:', error);
      throw error;
    }
  }
  
  /**
   * Mettre à jour le résumé de consommation mensuel
   */
  static async updateMonthlySummary(storeId: string, businessId: string): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7); // "2025-01"
      
      // Calculer les métriques du mois en cours
      const monthlyStats = await prisma.openAIUsage.aggregate({
        where: {
          storeId,
          createdAt: {
            gte: new Date(currentMonth + '-01'),
            lt: new Date(new Date(currentMonth + '-01').setMonth(new Date(currentMonth + '-01').getMonth() + 1))
          }
        },
        _count: { id: true },
        _sum: { 
          totalTokens: true,
          totalCost: true
        },
        _avg: { totalCost: true }
      });
      
      // Upsert résumé mensuel
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
          openaiTotalCalls: monthlyStats._count.id,
          openaiTotalTokens: monthlyStats._sum.totalTokens || 0,
          openaiTotalCost: monthlyStats._sum.totalCost || 0,
          openaiAvgCostPerCall: monthlyStats._avg.totalCost || 0,
          totalCost: monthlyStats._sum.totalCost || 0
        },
        update: {
          openaiTotalCalls: monthlyStats._count.id,
          openaiTotalTokens: monthlyStats._sum.totalTokens || 0,
          openaiTotalCost: monthlyStats._sum.totalCost || 0,
          openaiAvgCostPerCall: monthlyStats._avg.totalCost || 0,
          // On met à jour totalCost en ajoutant OpenAI aux coûts Telnyx existants
          totalCost: {
            increment: (monthlyStats._sum.totalCost || 0) - await this.getCurrentOpenAICost(storeId, currentMonth)
          }
        }
      });
      
      console.log(`📈 Résumé mensuel mis à jour pour ${storeId}`);
      
    } catch (error) {
      console.error('❌ Erreur mise à jour résumé mensuel:', error);
    }
  }
  
  /**
   * Récupérer le coût OpenAI actuel pour éviter les doublons dans totalCost
   */
  private static async getCurrentOpenAICost(storeId: string, period: string): Promise<number> {
    const existing = await prisma.consumptionSummary.findUnique({
      where: { storeId_period: { storeId, period } }
    });
    return existing?.openaiTotalCost || 0;
  }
  
  /**
   * Obtenir les statistiques OpenAI pour une boutique
   */
  static async getStoreStats(storeId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = { storeId };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }
    
    return await prisma.openAIUsage.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { 
        totalTokens: true, 
        totalCost: true,
        tokensInput: true,
        tokensOutput: true
      },
      _avg: { 
        totalCost: true,
        totalTokens: true
      }
    });
  }
  
  /**
   * Obtenir les statistiques OpenAI pour un business (toutes ses boutiques)
   */
  static async getBusinessStats(businessId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = { businessId };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }
    
    return await prisma.openAIUsage.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { 
        totalTokens: true, 
        totalCost: true 
      },
      _avg: { totalCost: true }
    });
  }
  
  /**
   * Obtenir détail des utilisations avec pagination
   */
  static async getDetailedUsage(params: {
    storeId?: string;
    businessId?: string;
    startDate?: Date;
    endDate?: Date;
    operation?: string;
    limit?: number;
    offset?: number;
  }) {
    const whereClause: any = {};
    
    if (params.storeId) whereClause.storeId = params.storeId;
    if (params.businessId) whereClause.businessId = params.businessId;
    if (params.operation) whereClause.operation = params.operation;
    
    if (params.startDate || params.endDate) {
      whereClause.createdAt = {};
      if (params.startDate) whereClause.createdAt.gte = params.startDate;
      if (params.endDate) whereClause.createdAt.lte = params.endDate;
    }
    
    return await prisma.openAIUsage.findMany({
      where: whereClause,
      include: {
        store: { select: { name: true } },
        business: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true, phone: true } },
        call: { select: { id: true, duration: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 100,
      skip: params.offset || 0
    });
  }
  
  /**
   * Obtenir les Top opérations les plus coûteuses
   */
  static async getTopExpensiveOperations(businessId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await prisma.openAIUsage.groupBy({
      by: ['operation'],
      where: {
        businessId,
        createdAt: { gte: startDate }
      },
      _sum: { totalCost: true },
      _count: { id: true },
      _avg: { totalCost: true },
      orderBy: { _sum: { totalCost: 'desc' } },
      take: 10
    });
  }
}

// Export pour utilisation dans d'autres services
export const openaiTracking = OpenAITrackingService;