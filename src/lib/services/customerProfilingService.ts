import { prisma } from '@/lib/prisma';

interface CustomerProfile {
  id: string;
  segment: string;
  score: number;
  preferences: {
    favoriteCategories: string[];
    priceRange: [number, number];
    orderTiming: string[];
    frequency: 'new' | 'occasional' | 'regular' | 'vip';
  };
  behavior: {
    avgOrderValue: number;
    totalOrders: number;
    lastOrderDate: Date;
    churnRisk: number;
    lifetimeValue: number;
  };
  recommendations: string[];
  personalizedMessage: string;
}

interface SegmentationRule {
  id: string;
  name: string;
  criteria: {
    ageRange?: [number, number];
    avgOrderValue?: [number, number];
    frequency?: string;
    timeOfDay?: string[];
    dayOfWeek?: string[];
    preferences?: string[];
  };
  weight: number;
}

class CustomerProfilingService {
  private segmentationRules: SegmentationRule[] = [
    {
      id: 'nouveaux',
      name: 'Nouveaux clients',
      criteria: { frequency: 'new' },
      weight: 1.0
    },
    {
      id: 'reguliers',
      name: 'Clients réguliers',
      criteria: { frequency: 'regular', avgOrderValue: [15, 50] },
      weight: 1.2
    },
    {
      id: 'vip',
      name: 'Clients VIP',
      criteria: { frequency: 'vip', avgOrderValue: [50, 999] },
      weight: 1.5
    },
    {
      id: 'midi',
      name: 'Clients du midi',
      criteria: { timeOfDay: ['11:00-14:00'] },
      weight: 0.8
    },
    {
      id: 'soir',
      name: 'Clients du soir',
      criteria: { timeOfDay: ['18:00-22:00'] },
      weight: 1.1
    },
    {
      id: 'weekend',
      name: 'Clients weekend',
      criteria: { dayOfWeek: ['saturday', 'sunday'] },
      weight: 0.9
    },
    {
      id: 'healthy',
      name: 'Clients healthy',
      criteria: { preferences: ['healthy', 'vegetarian', 'vegan'] },
      weight: 1.3
    },
    {
      id: 'premium',
      name: 'Clients premium',
      criteria: { avgOrderValue: [40, 999] },
      weight: 1.4
    }
  ];

  async analyzeCustomer(customerId: string, storeId: string): Promise<CustomerProfile | null> {
    try {
      // Récupérer les données client
      const customer = await prisma.customer.findFirst({
        where: { id: customerId },
        include: {
          orders: {
            where: { storeId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Analyser les 50 dernières commandes
          },
          behavior: true
        }
      });

      if (!customer || customer.orders.length === 0) {
        return null;
      }

      // Analyser les patterns de commande
      const orderAnalysis = this.analyzeOrderPatterns(customer.orders);
      
      // Déterminer le segment principal
      const primarySegment = this.determineSegment(customer, orderAnalysis);
      
      // Calculer les préférences
      const preferences = this.extractPreferences(customer.orders);
      
      // Analyser le comportement
      const behavior = this.analyzeBehavior(customer, customer.orders);
      
      // Générer les recommandations
      const recommendations = await this.generateRecommendations(
        storeId, 
        primarySegment, 
        preferences, 
        behavior
      );

      // Message personnalisé
      const personalizedMessage = this.generatePersonalizedMessage(
        primarySegment, 
        customer.firstName || 'cher client',
        behavior
      );

      const profile: CustomerProfile = {
        id: customerId,
        segment: primarySegment.name,
        score: primarySegment.score,
        preferences: {
          favoriteCategories: preferences.categories,
          priceRange: preferences.priceRange,
          orderTiming: preferences.timing,
          frequency: behavior.frequency
        },
        behavior,
        recommendations,
        personalizedMessage
      };

      // Sauvegarder le profil
      await this.saveCustomerProfile(customerId, profile);

      return profile;

    } catch (error) {
      console.error('Error analyzing customer:', error);
      return null;
    }
  }

  private analyzeOrderPatterns(orders: any[]): any {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const recentOrders = orders.filter(o => new Date(o.createdAt) > oneMonthAgo);
    const oldOrders = orders.filter(o => new Date(o.createdAt) > threeMonthsAgo);

    // Analyser les heures de commande
    const orderHours = orders.map(order => new Date(order.createdAt).getHours());
    const timePatterns = this.analyzeTimePatterns(orderHours);

    // Analyser les jours de la semaine
    const orderDays = orders.map(order => new Date(order.createdAt).getDay());
    const dayPatterns = this.analyzeDayPatterns(orderDays);

    // Analyser la fréquence
    const frequency = this.calculateFrequency(orders);

    return {
      recentOrders: recentOrders.length,
      totalOrders: orders.length,
      timePatterns,
      dayPatterns,
      frequency,
      avgOrderInterval: this.calculateAvgInterval(orders)
    };
  }

  private determineSegment(customer: any, orderAnalysis: any): { name: string; score: number } {
    const scores: { [key: string]: number } = {};

    // Évaluer chaque règle de segmentation
    for (const rule of this.segmentationRules) {
      let score = 0;

      // Critères de fréquence
      if (rule.criteria.frequency) {
        if (rule.criteria.frequency === orderAnalysis.frequency) {
          score += 1.0;
        }
      }

      // Critères de panier moyen
      if (rule.criteria.avgOrderValue) {
        const [min, max] = rule.criteria.avgOrderValue;
        if (customer.avgBasket >= min && customer.avgBasket <= max) {
          score += 1.0;
        }
      }

      // Critères temporels
      if (rule.criteria.timeOfDay) {
        const overlap = this.calculateTimeOverlap(
          rule.criteria.timeOfDay,
          orderAnalysis.timePatterns
        );
        score += overlap;
      }

      if (rule.criteria.dayOfWeek) {
        const overlap = this.calculateDayOverlap(
          rule.criteria.dayOfWeek,
          orderAnalysis.dayPatterns
        );
        score += overlap;
      }

      scores[rule.id] = score * rule.weight;
    }

    // Trouver le segment avec le score le plus élevé
    const bestSegment = Object.entries(scores).reduce((best, [id, score]) => {
      return score > best.score ? { id, score } : best;
    }, { id: 'nouveaux', score: 0 });

    const segmentRule = this.segmentationRules.find(r => r.id === bestSegment.id);
    return {
      name: segmentRule?.name || 'Client standard',
      score: bestSegment.score
    };
  }

  private extractPreferences(orders: any[]): {
    categories: string[];
    priceRange: [number, number];
    timing: string[];
  } {
    // Analyser les catégories favorites
    const categoryCount: { [key: string]: number } = {};
    const orderValues: number[] = [];

    orders.forEach(order => {
      orderValues.push(order.total);
      
      // Analyser les items de commande
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.category) {
            categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
          }
        });
      }
    });

    // Top 3 des catégories
    const favoriteCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Fourchette de prix
    const minPrice = Math.min(...orderValues);
    const maxPrice = Math.max(...orderValues);
    const priceRange: [number, number] = [minPrice, maxPrice];

    // Heures préférées
    const hourCounts: { [key: number]: number } = {};
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const preferredHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([hour]) => `${hour}:00`);

    return {
      categories: favoriteCategories,
      priceRange,
      timing: preferredHours
    };
  }

  private analyzeBehavior(customer: any, orders: any[]): any {
    const now = new Date();
    const lastOrder = orders[0] ? new Date(orders[0].createdAt) : null;
    const daysSinceLastOrder = lastOrder ? 
      Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    // Calculer le risque de churn
    let churnRisk = 0;
    if (daysSinceLastOrder > 30) churnRisk = 0.8;
    else if (daysSinceLastOrder > 14) churnRisk = 0.5;
    else if (daysSinceLastOrder > 7) churnRisk = 0.2;

    // Déterminer la fréquence
    let frequency: 'new' | 'occasional' | 'regular' | 'vip' = 'new';
    if (customer.orderCount >= 20) frequency = 'vip';
    else if (customer.orderCount >= 10) frequency = 'regular';
    else if (customer.orderCount >= 3) frequency = 'occasional';

    // Calculer la valeur à vie
    const lifetimeValue = customer.totalSpent;

    return {
      avgOrderValue: customer.avgBasket || 0,
      totalOrders: customer.orderCount,
      lastOrderDate: lastOrder,
      churnRisk,
      lifetimeValue,
      frequency,
      daysSinceLastOrder
    };
  }

  private async generateRecommendations(
    storeId: string, 
    segment: any, 
    preferences: any, 
    behavior: any
  ): Promise<string[]> {
    try {
      // Récupérer les produits populaires dans les catégories préférées
      const products = await prisma.product.findMany({
        where: {
          storeId,
          status: 'ACTIVE',
          category: { in: preferences.categories }
        },
        orderBy: { popularity: 'desc' },
        take: 5
      });

      return products.map(p => p.id);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  private generatePersonalizedMessage(
    segment: any, 
    customerName: string, 
    behavior: any
  ): string {
    const templates = {
      'Nouveaux clients': `Bienvenue ${customerName} ! Laissez-moi vous faire découvrir nos spécialités...`,
      'Clients réguliers': `Bonjour ${customerName} ! Content de vous revoir. Voulez-vous goûter notre nouveauté ?`,
      'Clients VIP': `Bonjour ${customerName} ! J'ai une recommandation spéciale pour vous aujourd'hui...`,
      'Clients du midi': `Bonjour ${customerName} ! Pour un déjeuner rapide, je vous suggère...`,
      'Clients du soir': `Bonsoir ${customerName} ! Pour ce dîner, que diriez-vous de...`,
      'Clients healthy': `Bonjour ${customerName} ! J'ai de délicieuses options saines pour vous...`,
      'Clients premium': `Bonjour ${customerName} ! Nos créations premium du jour sont...`
    };

    return templates[segment.name as keyof typeof templates] || 
           `Bonjour ${customerName} ! Comment puis-je vous aider aujourd'hui ?`;
  }

  private async saveCustomerProfile(customerId: string, profile: CustomerProfile): Promise<void> {
    try {
      await prisma.customerBehavior.upsert({
        where: { customerId },
        create: {
          customerId,
          favoriteCategories: profile.preferences.favoriteCategories,
          priceRangeMin: profile.preferences.priceRange[0],
          priceRangeMax: profile.preferences.priceRange[1],
          orderFrequency: profile.preferences.frequency,
          loyaltyScore: profile.score,
          churnRisk: profile.behavior.churnRisk,
          lifetimeValue: profile.behavior.lifetimeValue,
          lastAnalysis: new Date()
        },
        update: {
          favoriteCategories: profile.preferences.favoriteCategories,
          priceRangeMin: profile.preferences.priceRange[0],
          priceRangeMax: profile.preferences.priceRange[1],
          orderFrequency: profile.preferences.frequency,
          loyaltyScore: profile.score,
          churnRisk: profile.behavior.churnRisk,
          lifetimeValue: profile.behavior.lifetimeValue,
          lastAnalysis: new Date()
        }
      });
    } catch (error) {
      console.error('Error saving customer profile:', error);
    }
  }

  // Méthodes utilitaires
  private analyzeTimePatterns(hours: number[]): string[] {
    const patterns: string[] = [];
    const hourCounts: { [key: number]: number } = {};
    
    hours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Identifier les créneaux les plus fréquents
    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    sortedHours.forEach(([hour]) => {
      const h = parseInt(hour);
      if (h >= 11 && h <= 14) patterns.push('11:00-14:00');
      else if (h >= 18 && h <= 22) patterns.push('18:00-22:00');
      else if (h >= 7 && h <= 11) patterns.push('07:00-11:00');
    });

    return [...new Set(patterns)];
  }

  private analyzeDayPatterns(days: number[]): string[] {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayCounts: { [key: number]: number } = {};
    
    days.forEach(day => {
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => dayNames[parseInt(day)]);
  }

  private calculateFrequency(orders: any[]): 'new' | 'occasional' | 'regular' | 'vip' {
    const orderCount = orders.length;
    if (orderCount >= 20) return 'vip';
    if (orderCount >= 10) return 'regular';
    if (orderCount >= 3) return 'occasional';
    return 'new';
  }

  private calculateAvgInterval(orders: any[]): number {
    if (orders.length < 2) return 0;
    
    const intervals: number[] = [];
    for (let i = 1; i < orders.length; i++) {
      const diff = new Date(orders[i-1].createdAt).getTime() - new Date(orders[i].createdAt).getTime();
      intervals.push(diff / (1000 * 60 * 60 * 24)); // en jours
    }
    
    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  private calculateTimeOverlap(ruleTimes: string[], customerTimes: string[]): number {
    let overlap = 0;
    for (const ruleTime of ruleTimes) {
      if (customerTimes.some(ct => ct === ruleTime)) {
        overlap += 0.5;
      }
    }
    return Math.min(overlap, 1.0);
  }

  private calculateDayOverlap(ruleDays: string[], customerDays: string[]): number {
    let overlap = 0;
    for (const ruleDay of ruleDays) {
      if (customerDays.includes(ruleDay)) {
        overlap += 0.3;
      }
    }
    return Math.min(overlap, 1.0);
  }

  // Analyse en lot de tous les clients d'un store
  async analyzeAllCustomers(storeId: string): Promise<CustomerProfile[]> {
    try {
      const customers = await prisma.customer.findMany({
        where: {
          orders: {
            some: { storeId }
          }
        },
        select: { id: true }
      });

      const profiles: CustomerProfile[] = [];

      for (const customer of customers) {
        const profile = await this.analyzeCustomer(customer.id, storeId);
        if (profile) {
          profiles.push(profile);
        }
      }

      return profiles;
    } catch (error) {
      console.error('Error analyzing all customers:', error);
      return [];
    }
  }
}

export const customerProfilingService = new CustomerProfilingService();
export type { CustomerProfile, SegmentationRule };