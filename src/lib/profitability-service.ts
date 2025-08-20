import { prisma } from './prisma';

export interface ProfitabilityData {
  businessId: string;
  businessName: string;
  subscriptionPlan: string;
  subscriptionAmount: number;
  period: 'monthly' | 'yearly';
  
  // Coûts
  totalCosts: number;
  openaiCosts: number;
  telnyxCosts: number;
  telnyxNumbersCosts: number;
  
  // Revenus
  totalRevenue: number;
  subscriptionRevenue: number;
  commissionRevenue: number;
  
  // Métriques
  profitMargin: number;
  profitAmount: number;
  roi: number; // Return on Investment
  
  // Détails d'utilisation
  callsCount: number;
  ordersCount: number;
  avgOrderValue: number;
  
  // Dates
  periodStart: Date;
  periodEnd: Date;
  lastUpdated: Date;
}

export interface ProfitabilitySummary {
  totalBusinesses: number;
  profitableBusinesses: number;
  totalProfit: number;
  totalRevenue: number;
  totalCosts: number;
  averageMargin: number;
  topPerformers: ProfitabilityData[];
  lossmakers: ProfitabilityData[];
}

// Configuration des prix par plan
const SUBSCRIPTION_PLANS = {
  STARTER: { monthly: 129, commission: 0.1 }, // 10% commission
  PRO: { monthly: 329, commission: 1 }, // 1€ par commande
  ENTERPRISE: { monthly: 599, commission: 0 } // Pas de commission
} as const;

export class ProfitabilityService {
  
  // Calculer la profitabilité d'un business sur une période
  static async calculateBusinessProfitability(
    businessId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ProfitabilityData | null> {
    try {
      // Récupérer les données du business
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          subscriptions: {
            where: {
              status: { in: ['active', 'trialing'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          orders: {
            where: {
              createdAt: { gte: startDate, lte: endDate },
              status: { in: ['COMPLETED', 'DELIVERED'] }
            }
          },
          openaiUsages: {
            where: {
              createdAt: { gte: startDate, lte: endDate }
            }
          },
          telnyxUsages: {
            where: {
              createdAt: { gte: startDate, lte: endDate }
            }
          },
          phoneNumbers: {
            where: {
              status: 'ACTIVE'
            }
          }
        }
      });

      if (!business) {
        return null;
      }

      const currentSubscription = business.subscriptions[0];
      if (!currentSubscription || !currentSubscription.plan) {
        return null; // Pas de subscription active
      }

      const planConfig = SUBSCRIPTION_PLANS[currentSubscription.plan as keyof typeof SUBSCRIPTION_PLANS];
      if (!planConfig) {
        return null;
      }

      // Calculer les coûts
      const openaiCosts = business.openaiUsages.reduce((sum, usage) => sum + (usage.cost || 0), 0);
      const telnyxCallsCosts = business.telnyxUsages.reduce((sum, usage) => sum + (usage.cost || 0), 0);
      
      // Coût des numéros Telnyx (estimation 1€/mois par numéro)
      const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthsInPeriod = daysInPeriod / 30;
      const telnyxNumbersCosts = business.phoneNumbers.length * 1 * monthsInPeriod;
      
      const totalCosts = openaiCosts + telnyxCallsCosts + telnyxNumbersCosts;

      // Calculer les revenus
      const subscriptionRevenue = planConfig.monthly * monthsInPeriod;
      
      let commissionRevenue = 0;
      if (currentSubscription.plan === 'STARTER') {
        // 10% de commission sur le total des commandes
        const totalOrderValue = business.orders.reduce((sum, order) => sum + order.totalAmount, 0);
        commissionRevenue = totalOrderValue * planConfig.commission;
      } else if (currentSubscription.plan === 'PRO') {
        // 1€ par commande
        commissionRevenue = business.orders.length * planConfig.commission;
      }
      
      const totalRevenue = subscriptionRevenue + commissionRevenue;

      // Calculer les métriques de profitabilité
      const profitAmount = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? (profitAmount / totalRevenue) * 100 : 0;
      const roi = totalCosts > 0 ? ((profitAmount / totalCosts) * 100) : 0;

      // Métriques d'utilisation
      const avgOrderValue = business.orders.length > 0 
        ? business.orders.reduce((sum, order) => sum + order.totalAmount, 0) / business.orders.length 
        : 0;

      const callsCount = business.openaiUsages.length + business.telnyxUsages.length;

      return {
        businessId,
        businessName: business.name,
        subscriptionPlan: currentSubscription.plan,
        subscriptionAmount: planConfig.monthly,
        period: 'monthly',
        
        totalCosts,
        openaiCosts,
        telnyxCosts: telnyxCallsCosts,
        telnyxNumbersCosts,
        
        totalRevenue,
        subscriptionRevenue,
        commissionRevenue,
        
        profitMargin,
        profitAmount,
        roi,
        
        callsCount,
        ordersCount: business.orders.length,
        avgOrderValue,
        
        periodStart: startDate,
        periodEnd: endDate,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('❌ Erreur calcul profitabilité business:', error);
      return null;
    }
  }

  // Calculer la profitabilité globale de tous les business
  static async calculateGlobalProfitability(
    startDate: Date, 
    endDate: Date
  ): Promise<ProfitabilitySummary> {
    try {
      // Récupérer tous les business avec des subscriptions actives
      const businesses = await prisma.business.findMany({
        where: {
          subscriptions: {
            some: {
              status: { in: ['active', 'trialing'] }
            }
          }
        },
        select: { id: true }
      });

      const profitabilityData: ProfitabilityData[] = [];
      
      // Calculer la profitabilité pour chaque business
      for (const business of businesses) {
        const profitability = await this.calculateBusinessProfitability(
          business.id, 
          startDate, 
          endDate
        );
        
        if (profitability) {
          profitabilityData.push(profitability);
        }
      }

      // Calculer les métriques globales
      const totalBusinesses = profitabilityData.length;
      const profitableBusinesses = profitabilityData.filter(b => b.profitAmount > 0).length;
      const totalProfit = profitabilityData.reduce((sum, b) => sum + b.profitAmount, 0);
      const totalRevenue = profitabilityData.reduce((sum, b) => sum + b.totalRevenue, 0);
      const totalCosts = profitabilityData.reduce((sum, b) => sum + b.totalCosts, 0);
      const averageMargin = profitabilityData.length > 0 
        ? profitabilityData.reduce((sum, b) => sum + b.profitMargin, 0) / profitabilityData.length 
        : 0;

      // Top performers (les plus profitables)
      const topPerformers = [...profitabilityData]
        .sort((a, b) => b.profitAmount - a.profitAmount)
        .slice(0, 5);

      // Loss makers (en perte)
      const lossmakers = profitabilityData
        .filter(b => b.profitAmount < 0)
        .sort((a, b) => a.profitAmount - b.profitAmount)
        .slice(0, 5);

      return {
        totalBusinesses,
        profitableBusinesses,
        totalProfit,
        totalRevenue,
        totalCosts,
        averageMargin,
        topPerformers,
        lossmakers
      };

    } catch (error) {
      console.error('❌ Erreur calcul profitabilité globale:', error);
      return {
        totalBusinesses: 0,
        profitableBusinesses: 0,
        totalProfit: 0,
        totalRevenue: 0,
        totalCosts: 0,
        averageMargin: 0,
        topPerformers: [],
        lossmakers: []
      };
    }
  }

  // Calculer la profitabilité mensuelle en temps réel
  static async getCurrentMonthProfitability(): Promise<ProfitabilitySummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return this.calculateGlobalProfitability(startOfMonth, endOfMonth);
  }

  // Récupérer les tendances de profitabilité (3 derniers mois)
  static async getProfitabilityTrends(): Promise<{
    months: string[];
    profitData: number[];
    revenueData: number[];
    costsData: number[];
  }> {
    try {
      const trends = {
        months: [] as string[],
        profitData: [] as number[],
        revenueData: [] as number[],
        costsData: [] as number[]
      };

      const now = new Date();
      
      // Calculer pour les 3 derniers mois
      for (let i = 2; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        
        const profitability = await this.calculateGlobalProfitability(startOfMonth, endOfMonth);
        
        trends.months.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
        trends.profitData.push(profitability.totalProfit);
        trends.revenueData.push(profitability.totalRevenue);
        trends.costsData.push(profitability.totalCosts);
      }

      return trends;

    } catch (error) {
      console.error('❌ Erreur récupération tendances profitabilité:', error);
      return {
        months: [],
        profitData: [],
        revenueData: [],
        costsData: []
      };
    }
  }

  // Identifier les business à risque (coûts élevés, faible profitabilité)
  static async getBusinessesAtRisk(): Promise<ProfitabilityData[]> {
    const currentMonth = await this.getCurrentMonthProfitability();
    
    return currentMonth.lossmakers.concat(
      currentMonth.topPerformers.filter(b => b.profitMargin < 20) // Marge < 20%
    );
  }

  // Calculer le coût d'acquisition client (CAC)
  static async calculateCustomerAcquisitionCost(
    businessId: string,
    marketingSpend: number,
    newCustomersCount: number
  ): Promise<number> {
    if (newCustomersCount === 0) return 0;
    return marketingSpend / newCustomersCount;
  }

  // Calculer la valeur vie client (LTV)
  static async calculateCustomerLifetimeValue(businessId: string): Promise<number> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          customers: {
            include: {
              orders: {
                where: {
                  status: { in: ['COMPLETED', 'DELIVERED'] }
                }
              }
            }
          }
        }
      });

      if (!business || business.customers.length === 0) {
        return 0;
      }

      // Calculer la moyenne de commandes par client et la valeur moyenne
      let totalOrderValue = 0;
      let totalOrders = 0;
      
      business.customers.forEach(customer => {
        customer.orders.forEach(order => {
          totalOrderValue += order.totalAmount;
          totalOrders++;
        });
      });

      const avgOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;
      const avgOrdersPerCustomer = business.customers.length > 0 ? totalOrders / business.customers.length : 0;
      
      // Estimation simple: LTV = Valeur moyenne commande × Nombre moyen commandes par client × 12 mois
      return avgOrderValue * avgOrdersPerCustomer * 12;

    } catch (error) {
      console.error('❌ Erreur calcul LTV:', error);
      return 0;
    }
  }
}