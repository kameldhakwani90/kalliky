import { prisma } from '@/lib/prisma';

interface PredictiveRule {
  id: string;
  name: string;
  type: 'demand_forecast' | 'price_optimization' | 'inventory_alert' | 'trend_detection';
  conditions: {
    timeframe?: string;
    productCategories?: string[];
    customerSegments?: string[];
    weatherConditions?: string[];
    minConfidence?: number;
  };
  action: 'boost_product' | 'adjust_price' | 'alert_manager' | 'auto_reorder';
  parameters: {
    boostPercentage?: number;
    priceAdjustment?: number;
    alertThreshold?: number;
    reorderQuantity?: number;
  };
  confidence: number;
  isActive: boolean;
  performance: {
    successRate: number;
    totalTriggers: number;
    revenueImpact: number;
  };
}

interface DemandForecast {
  productId: string;
  forecastedDemand: number;
  confidence: number;
  factors: {
    historical: number;
    seasonal: number;
    weather: number;
    trends: number;
  };
  timeframe: string;
  recommendations: string[];
}

interface PriceOptimization {
  productId: string;
  currentPrice: number;
  optimizedPrice: number;
  expectedImpact: {
    salesIncrease: number;
    revenueChange: number;
    marginChange: number;
  };
  confidence: number;
  reasoning: string[];
}

interface TrendAnalysis {
  category: string;
  trend: 'rising' | 'falling' | 'stable';
  strength: number;
  timeframe: string;
  affectedProducts: string[];
  factors: string[];
  recommendations: string[];
}

class PredictiveAnalyticsService {
  private readonly HISTORICAL_DAYS = 90;
  private readonly MIN_DATA_POINTS = 10;
  
  // Prévision de la demande
  async forecastDemand(storeId: string, productId: string, days: number = 7): Promise<DemandForecast | null> {
    try {
      // Récupérer l'historique des ventes
      const historicalData = await this.getHistoricalSales(storeId, productId);
      
      if (historicalData.length < this.MIN_DATA_POINTS) {
        return null;
      }

      // Analyser les patterns saisonniers
      const seasonalFactors = this.analyzeSeasonalPatterns(historicalData);
      
      // Analyser les tendances
      const trendFactors = this.analyzeTrends(historicalData);
      
      // Intégrer les facteurs météo (si disponible)
      const weatherFactors = await this.getWeatherImpact(storeId, productId);
      
      // Calculer la prévision
      const baseDemand = this.calculateBaseDemand(historicalData);
      const forecastedDemand = baseDemand * 
        (1 + seasonalFactors * 0.3) * 
        (1 + trendFactors * 0.4) * 
        (1 + weatherFactors * 0.2);

      // Calculer la confiance
      const confidence = this.calculateForecastConfidence(
        historicalData,
        seasonalFactors,
        trendFactors
      );

      // Générer des recommandations
      const recommendations = this.generateDemandRecommendations(
        forecastedDemand,
        baseDemand,
        confidence
      );

      return {
        productId,
        forecastedDemand: Math.round(forecastedDemand),
        confidence,
        factors: {
          historical: baseDemand,
          seasonal: seasonalFactors,
          weather: weatherFactors,
          trends: trendFactors
        },
        timeframe: `${days} jours`,
        recommendations
      };

    } catch (error) {
      console.error('Error forecasting demand:', error);
      return null;
    }
  }

  // Optimisation des prix
  async optimizePrice(storeId: string, productId: string): Promise<PriceOptimization | null> {
    try {
      // Récupérer le produit et son historique
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          variations: true
        }
      });

      if (!product) return null;

      // Récupérer l'historique des prix et ventes
      const priceHistory = await this.getPriceHistory(storeId, productId);
      const salesHistory = await this.getHistoricalSales(storeId, productId);

      // Analyser l'élasticité des prix
      const priceElasticity = this.calculatePriceElasticity(priceHistory, salesHistory);

      // Analyser la concurrence (simulation)
      const competitiveAnalysis = await this.analyzeCompetitivePricing(product);

      // Calculer le prix optimal
      const currentPrice = this.getCurrentPrice(product);
      const optimizedPrice = this.calculateOptimalPrice(
        currentPrice,
        priceElasticity,
        competitiveAnalysis
      );

      // Estimer l'impact
      const expectedImpact = this.estimatePriceImpact(
        currentPrice,
        optimizedPrice,
        priceElasticity,
        salesHistory
      );

      // Calculer la confiance
      const confidence = this.calculatePriceConfidence(
        priceHistory.length,
        priceElasticity,
        competitiveAnalysis
      );

      // Générer le raisonnement
      const reasoning = this.generatePriceReasoning(
        currentPrice,
        optimizedPrice,
        priceElasticity,
        expectedImpact
      );

      return {
        productId,
        currentPrice,
        optimizedPrice,
        expectedImpact,
        confidence,
        reasoning
      };

    } catch (error) {
      console.error('Error optimizing price:', error);
      return null;
    }
  }

  // Détection de tendances
  async detectTrends(storeId: string): Promise<TrendAnalysis[]> {
    try {
      const trends: TrendAnalysis[] = [];

      // Récupérer les catégories de produits
      const categories = await this.getProductCategories(storeId);

      for (const category of categories) {
        // Analyser la tendance pour chaque catégorie
        const categoryData = await this.getCategorySalesData(storeId, category);
        
        if (categoryData.length < this.MIN_DATA_POINTS) continue;

        const trendAnalysis = this.analyzeCategoryTrend(categoryData);
        const affectedProducts = await this.getProductsInCategory(storeId, category);

        trends.push({
          category,
          trend: trendAnalysis.direction,
          strength: trendAnalysis.strength,
          timeframe: '30 jours',
          affectedProducts: affectedProducts.map(p => p.id),
          factors: trendAnalysis.factors,
          recommendations: this.generateTrendRecommendations(trendAnalysis, category)
        });
      }

      return trends.sort((a, b) => b.strength - a.strength);

    } catch (error) {
      console.error('Error detecting trends:', error);
      return [];
    }
  }

  // Apprentissage automatique et amélioration des règles
  async learnAndImprove(storeId: string, rules: PredictiveRule[]): Promise<PredictiveRule[]> {
    try {
      const improvedRules: PredictiveRule[] = [];

      for (const rule of rules) {
        // Analyser les performances de la règle
        const performance = await this.analyzeRulePerformance(storeId, rule);
        
        // Ajuster les paramètres selon les performances
        const adjustedRule = this.adjustRuleParameters(rule, performance);
        
        // Mettre à jour la confiance
        adjustedRule.confidence = this.updateConfidence(rule.confidence, performance);
        
        // Mettre à jour les métriques de performance
        adjustedRule.performance = performance;

        improvedRules.push(adjustedRule);
      }

      // Sauvegarder les règles améliorées
      await this.saveImprovedRules(storeId, improvedRules);

      return improvedRules;

    } catch (error) {
      console.error('Error in learning and improvement:', error);
      return rules;
    }
  }

  // Méthodes utilitaires privées

  private async getHistoricalSales(storeId: string, productId: string): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - this.HISTORICAL_DAYS * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        storeId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Extraire les ventes pour le produit spécifique
    const sales: any[] = [];
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.productId === productId) {
            sales.push({
              date: order.createdAt,
              quantity: item.quantity || 1,
              price: item.price || 0,
              total: (item.quantity || 1) * (item.price || 0)
            });
          }
        });
      }
    });

    return sales;
  }

  private analyzeSeasonalPatterns(data: any[]): number {
    if (data.length < 14) return 0;

    // Analyser les patterns jour de la semaine
    const weekdayAverages: { [key: number]: number } = {};
    const weekdayCounts: { [key: number]: number } = {};

    data.forEach(sale => {
      const weekday = new Date(sale.date).getDay();
      weekdayAverages[weekday] = (weekdayAverages[weekday] || 0) + sale.quantity;
      weekdayCounts[weekday] = (weekdayCounts[weekday] || 0) + 1;
    });

    // Calculer les moyennes
    Object.keys(weekdayAverages).forEach(day => {
      const dayNum = parseInt(day);
      weekdayAverages[dayNum] = weekdayAverages[dayNum] / weekdayCounts[dayNum];
    });

    // Calculer la variation saisonnière
    const currentWeekday = new Date().getDay();
    const currentDayAvg = weekdayAverages[currentWeekday] || 0;
    const overallAvg = Object.values(weekdayAverages).reduce((sum, avg) => sum + avg, 0) / 
                       Object.keys(weekdayAverages).length;

    return overallAvg > 0 ? (currentDayAvg - overallAvg) / overallAvg : 0;
  }

  private analyzeTrends(data: any[]): number {
    if (data.length < 5) return 0;

    // Calcul simple de la tendance linéaire
    const recentData = data.slice(-14); // 2 dernières semaines
    const olderData = data.slice(-28, -14); // 2 semaines d'avant

    const recentAvg = recentData.reduce((sum, sale) => sum + sale.quantity, 0) / recentData.length;
    const olderAvg = olderData.reduce((sum, sale) => sum + sale.quantity, 0) / (olderData.length || 1);

    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  private async getWeatherImpact(storeId: string, productId: string): Promise<number> {
    try {
      // Récupérer les recommandations météo actives
      const weatherRec = await prisma.weatherRecommendation.findUnique({
        where: { storeId }
      });

      if (!weatherRec) return 0;

      const activeProducts = JSON.parse(weatherRec.activeProducts as string);
      return activeProducts.includes(productId) ? 0.3 : 0;
    } catch (error) {
      return 0;
    }
  }

  private calculateBaseDemand(data: any[]): number {
    if (data.length === 0) return 0;
    
    // Moyenne mobile sur les 7 derniers jours
    const recent = data.slice(-7);
    return recent.reduce((sum, sale) => sum + sale.quantity, 0) / recent.length;
  }

  private calculateForecastConfidence(
    data: any[],
    seasonalFactor: number,
    trendFactor: number
  ): number {
    let confidence = 0.5; // Base

    // Plus de données = plus de confiance
    if (data.length > 30) confidence += 0.2;
    if (data.length > 60) confidence += 0.1;

    // Facteurs stables = plus de confiance
    if (Math.abs(seasonalFactor) < 0.2) confidence += 0.1;
    if (Math.abs(trendFactor) < 0.3) confidence += 0.1;

    // Variance faible = plus de confiance
    const variance = this.calculateVariance(data.map(d => d.quantity));
    if (variance < 2) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }

  private generateDemandRecommendations(
    forecast: number,
    baseline: number,
    confidence: number
  ): string[] {
    const recommendations: string[] = [];
    const change = (forecast - baseline) / baseline;

    if (change > 0.2 && confidence > 0.7) {
      recommendations.push('Augmenter le stock de ce produit');
      recommendations.push('Considérer une promotion pour capitaliser sur la demande');
    } else if (change < -0.2 && confidence > 0.7) {
      recommendations.push('Réduire le stock temporairement');
      recommendations.push('Envisager une promotion pour stimuler les ventes');
    } else if (confidence < 0.5) {
      recommendations.push('Données insuffisantes - continuer à surveiller');
    }

    return recommendations;
  }

  private async getPriceHistory(storeId: string, productId: string): Promise<any[]> {
    // Simulation - dans la vraie vie, cela viendrait d'un historique des prix
    return [
      { date: new Date(), price: 15.50, sales: 25 },
      { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), price: 16.00, sales: 20 },
      { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), price: 15.00, sales: 30 }
    ];
  }

  private calculatePriceElasticity(priceHistory: any[], salesHistory: any[]): number {
    if (priceHistory.length < 2) return -1; // Élasticité par défaut

    // Calcul simplifié de l'élasticité prix-demande
    let totalElasticity = 0;
    let count = 0;

    for (let i = 1; i < priceHistory.length; i++) {
      const priceDiff = (priceHistory[i].price - priceHistory[i-1].price) / priceHistory[i-1].price;
      const salesDiff = (priceHistory[i].sales - priceHistory[i-1].sales) / priceHistory[i-1].sales;
      
      if (priceDiff !== 0) {
        totalElasticity += salesDiff / priceDiff;
        count++;
      }
    }

    return count > 0 ? totalElasticity / count : -1;
  }

  private async analyzeCompetitivePricing(product: any): Promise<any> {
    // Simulation d'analyse concurrentielle
    return {
      averageMarketPrice: 16.00,
      ourPosition: 'competitive', // 'low' | 'competitive' | 'premium'
      priceGap: 0.50
    };
  }

  private getCurrentPrice(product: any): number {
    // Extraire le prix actuel du produit
    if (product.variations && product.variations.length > 0) {
      const defaultVariation = product.variations.find((v: any) => v.isDefault) || product.variations[0];
      const prices = typeof defaultVariation.prices === 'string' ? 
        JSON.parse(defaultVariation.prices) : defaultVariation.prices;
      return prices['dine-in'] || 0;
    }
    return 0;
  }

  private calculateOptimalPrice(
    currentPrice: number,
    elasticity: number,
    competitive: any
  ): number {
    // Algorithme simplifié d'optimisation des prix
    let optimizedPrice = currentPrice;

    // Ajustement basé sur l'élasticité
    if (elasticity > -1.5 && elasticity < -0.5) {
      // Demande peu élastique - on peut augmenter légèrement
      optimizedPrice = currentPrice * 1.05;
    } else if (elasticity < -2) {
      // Demande très élastique - baisser légèrement
      optimizedPrice = currentPrice * 0.95;
    }

    // Ajustement basé sur la concurrence
    if (competitive.ourPosition === 'premium' && competitive.priceGap > 2) {
      optimizedPrice = Math.min(optimizedPrice, competitive.averageMarketPrice + 1);
    }

    return Math.round(optimizedPrice * 100) / 100;
  }

  private estimatePriceImpact(
    currentPrice: number,
    optimizedPrice: number,
    elasticity: number,
    salesHistory: any[]
  ): any {
    const priceChange = (optimizedPrice - currentPrice) / currentPrice;
    const salesChange = elasticity * priceChange;
    
    const avgSales = salesHistory.length > 0 ? 
      salesHistory.reduce((sum, sale) => sum + sale.quantity, 0) / salesHistory.length : 10;
    
    const newSales = avgSales * (1 + salesChange);
    const revenueChange = (newSales * optimizedPrice) - (avgSales * currentPrice);
    
    return {
      salesIncrease: salesChange * 100,
      revenueChange,
      marginChange: priceChange * 100
    };
  }

  private calculatePriceConfidence(
    dataPoints: number,
    elasticity: number,
    competitive: any
  ): number {
    let confidence = 0.3;
    
    if (dataPoints > 5) confidence += 0.2;
    if (dataPoints > 10) confidence += 0.2;
    if (Math.abs(elasticity + 1) < 0.5) confidence += 0.2; // Élasticité "normale"
    if (competitive.ourPosition === 'competitive') confidence += 0.1;
    
    return Math.min(confidence, 0.9);
  }

  private generatePriceReasoning(
    current: number,
    optimized: number,
    elasticity: number,
    impact: any
  ): string[] {
    const reasoning: string[] = [];
    const change = ((optimized - current) / current) * 100;

    if (change > 2) {
      reasoning.push(`Augmentation de ${change.toFixed(1)}% recommandée`);
      reasoning.push(`Élasticité faible permet une hausse sans perte significative de ventes`);
    } else if (change < -2) {
      reasoning.push(`Baisse de ${Math.abs(change).toFixed(1)}% recommandée`);
      reasoning.push(`Stimuler les ventes avec un prix plus attractif`);
    } else {
      reasoning.push('Prix actuel proche de l\'optimum');
    }

    if (impact.revenueChange > 0) {
      reasoning.push(`Gain de revenus estimé: ${impact.revenueChange.toFixed(2)}€`);
    }

    return reasoning;
  }

  private async getProductCategories(storeId: string): Promise<string[]> {
    const products = await prisma.product.findMany({
      where: { storeId, status: 'ACTIVE' },
      select: { category: true },
      distinct: ['category']
    });

    return products.map(p => p.category).filter(Boolean);
  }

  private async getCategorySalesData(storeId: string, category: string): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        storeId,
        createdAt: { gte: startDate, lte: endDate }
      },
      orderBy: { createdAt: 'asc' }
    });

    const categorySales: any[] = [];
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.category === category) {
            categorySales.push({
              date: order.createdAt,
              quantity: item.quantity || 1,
              revenue: (item.quantity || 1) * (item.price || 0)
            });
          }
        });
      }
    });

    return categorySales;
  }

  private analyzeCategoryTrend(data: any[]): any {
    if (data.length < 10) {
      return { direction: 'stable', strength: 0, factors: ['Données insuffisantes'] };
    }

    // Diviser en deux périodes
    const midPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midPoint);
    const secondHalf = data.slice(midPoint);

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.quantity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.quantity, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;
    const strength = Math.abs(change);

    let direction: 'rising' | 'falling' | 'stable' = 'stable';
    if (change > 0.1) direction = 'rising';
    else if (change < -0.1) direction = 'falling';

    const factors = this.identifyTrendFactors(data, change);

    return { direction, strength, factors };
  }

  private identifyTrendFactors(data: any[], change: number): string[] {
    const factors: string[] = [];

    if (Math.abs(change) > 0.3) {
      factors.push('Changement significatif de demande');
    }

    // Analyser la saisonnalité
    const weekendSales = data.filter(d => {
      const day = new Date(d.date).getDay();
      return day === 0 || day === 6;
    });

    if (weekendSales.length > data.length * 0.4) {
      factors.push('Forte activité weekend');
    }

    // Autres facteurs potentiels
    if (change > 0.2) {
      factors.push('Tendance croissante forte');
      factors.push('Popularité en hausse');
    } else if (change < -0.2) {
      factors.push('Tendance décroissante');
      factors.push('Possible saturation du marché');
    }

    return factors;
  }

  private async getProductsInCategory(storeId: string, category: string): Promise<any[]> {
    return await prisma.product.findMany({
      where: { storeId, category, status: 'ACTIVE' },
      select: { id: true, name: true }
    });
  }

  private generateTrendRecommendations(analysis: any, category: string): string[] {
    const recommendations: string[] = [];

    if (analysis.direction === 'rising' && analysis.strength > 0.2) {
      recommendations.push(`Augmenter le stock pour la catégorie ${category}`);
      recommendations.push('Considérer l\'ajout de nouveaux produits dans cette catégorie');
      recommendations.push('Mettre en avant cette catégorie dans les recommandations');
    } else if (analysis.direction === 'falling' && analysis.strength > 0.2) {
      recommendations.push(`Réduire temporairement le stock de ${category}`);
      recommendations.push('Envisager des promotions pour relancer les ventes');
      recommendations.push('Analyser les raisons de la baisse de popularité');
    } else {
      recommendations.push(`Catégorie ${category} stable - maintenir la stratégie actuelle`);
    }

    return recommendations;
  }

  private async analyzeRulePerformance(storeId: string, rule: PredictiveRule): Promise<any> {
    // Simulation d'analyse de performance
    return {
      successRate: Math.random() * 0.4 + 0.6, // 60-100%
      totalTriggers: Math.floor(Math.random() * 50) + 10,
      revenueImpact: Math.random() * 1000 + 500,
      averageConfidence: Math.random() * 0.3 + 0.7
    };
  }

  private adjustRuleParameters(rule: PredictiveRule, performance: any): PredictiveRule {
    const adjustedRule = { ...rule };

    // Ajuster selon les performances
    if (performance.successRate > 0.8) {
      // Bonnes performances - augmenter la sensibilité
      if (adjustedRule.conditions.minConfidence) {
        adjustedRule.conditions.minConfidence = Math.max(0.5, adjustedRule.conditions.minConfidence - 0.1);
      }
    } else if (performance.successRate < 0.6) {
      // Mauvaises performances - être plus conservateur
      if (adjustedRule.conditions.minConfidence) {
        adjustedRule.conditions.minConfidence = Math.min(0.9, adjustedRule.conditions.minConfidence + 0.1);
      }
    }

    return adjustedRule;
  }

  private updateConfidence(currentConfidence: number, performance: any): number {
    const performanceWeight = 0.3;
    return currentConfidence * (1 - performanceWeight) + performance.averageConfidence * performanceWeight;
  }

  private async saveImprovedRules(storeId: string, rules: PredictiveRule[]): Promise<void> {
    try {
      await prisma.intelligentAIConfig.upsert({
        where: { storeId },
        create: {
          storeId,
          predictiveRules: JSON.stringify(rules)
        },
        update: {
          predictiveRules: JSON.stringify(rules),
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      console.error('Error saving improved rules:', error);
    }
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
export type { PredictiveRule, DemandForecast, PriceOptimization, TrendAnalysis };