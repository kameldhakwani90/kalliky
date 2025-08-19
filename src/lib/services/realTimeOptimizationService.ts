import { prisma } from '@/lib/prisma';

interface ABTest {
  id: string;
  name: string;
  type: 'price' | 'recommendation' | 'upsell' | 'layout' | 'message';
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: ABVariant[];
  targetMetric: string;
  startDate: Date;
  endDate?: Date;
  sampleSize: number;
  confidence: number;
  results?: ABTestResults;
  createdAt: Date;
}

interface ABVariant {
  id: string;
  name: string;
  config: any;
  traffic: number; // pourcentage du trafic
  conversions: number;
  revenue: number;
  sessions: number;
  isControl: boolean;
}

interface ABTestResults {
  winner?: string;
  confidence: number;
  lift: number;
  significance: boolean;
  recommendation: string;
}

interface OptimizationRule {
  id: string;
  name: string;
  trigger: 'time_based' | 'performance_based' | 'traffic_based' | 'weather_based';
  conditions: any;
  action: 'adjust_price' | 'change_recommendations' | 'modify_upsell' | 'update_priority';
  parameters: any;
  isActive: boolean;
  performance: {
    totalTriggers: number;
    successRate: number;
    averageImpact: number;
  };
}

interface RealTimeMetrics {
  timestamp: Date;
  storeId: string;
  metrics: {
    conversionRate: number;
    avgOrderValue: number;
    revenue: number;
    sessionCount: number;
    bounceRate: number;
    customerSatisfaction: number;
  };
  tests: string[]; // IDs des tests actifs
}

class RealTimeOptimizationService {
  private optimizationInterval: NodeJS.Timeout | null = null;
  private readonly OPTIMIZATION_FREQUENCY = 60000; // 1 minute
  private readonly MIN_SAMPLE_SIZE = 100;
  private readonly SIGNIFICANCE_THRESHOLD = 0.95;

  // Démarrer l'optimisation en temps réel
  startRealTimeOptimization(storeId: string): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }

    this.optimizationInterval = setInterval(async () => {
      await this.performOptimizationCycle(storeId);
    }, this.OPTIMIZATION_FREQUENCY);

    console.log(`Real-time optimization started for store ${storeId}`);
  }

  // Arrêter l'optimisation
  stopRealTimeOptimization(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
  }

  // Cycle d'optimisation complet
  private async performOptimizationCycle(storeId: string): Promise<void> {
    try {
      // 1. Collecter les métriques temps réel
      const metrics = await this.collectRealTimeMetrics(storeId);
      
      // 2. Analyser les tests A/B en cours
      await this.analyzeActiveTests(storeId);
      
      // 3. Appliquer les règles d'optimisation
      await this.applyOptimizationRules(storeId, metrics);
      
      // 4. Détecter les opportunités d'amélioration
      await this.detectOptimizationOpportunities(storeId, metrics);
      
      // 5. Sauvegarder les métriques
      await this.saveMetrics(storeId, metrics);

    } catch (error) {
      console.error('Error in optimization cycle:', error);
    }
  }

  // Créer un nouveau test A/B
  async createABTest(storeId: string, testConfig: Partial<ABTest>): Promise<ABTest> {
    const test: ABTest = {
      id: `test_${Date.now()}`,
      name: testConfig.name || 'Test A/B',
      type: testConfig.type || 'recommendation',
      status: 'draft',
      variants: testConfig.variants || [],
      targetMetric: testConfig.targetMetric || 'conversion_rate',
      startDate: testConfig.startDate || new Date(),
      endDate: testConfig.endDate,
      sampleSize: testConfig.sampleSize || this.MIN_SAMPLE_SIZE,
      confidence: 0,
      createdAt: new Date()
    };

    // Valider les variants
    this.validateVariants(test.variants);

    // Sauvegarder le test
    await this.saveABTest(storeId, test);

    return test;
  }

  // Démarrer un test A/B
  async startABTest(storeId: string, testId: string): Promise<void> {
    const test = await this.getABTest(storeId, testId);
    if (!test) throw new Error('Test non trouvé');

    test.status = 'running';
    test.startDate = new Date();

    // Réinitialiser les métriques
    test.variants.forEach(variant => {
      variant.conversions = 0;
      variant.revenue = 0;
      variant.sessions = 0;
    });

    await this.saveABTest(storeId, test);
  }

  // Analyser les tests actifs
  private async analyzeActiveTests(storeId: string): Promise<void> {
    const activeTests = await this.getActiveABTests(storeId);

    for (const test of activeTests) {
      // Vérifier si le test a suffisamment de données
      const totalSessions = test.variants.reduce((sum, v) => sum + v.sessions, 0);
      
      if (totalSessions >= test.sampleSize) {
        // Calculer les résultats
        const results = this.calculateABResults(test);
        test.results = results;
        test.confidence = results.confidence;

        // Si significatif, arrêter le test
        if (results.significance && results.confidence >= this.SIGNIFICANCE_THRESHOLD) {
          test.status = 'completed';
          test.endDate = new Date();

          // Appliquer automatiquement le variant gagnant
          if (results.winner) {
            await this.applyWinningVariant(storeId, test, results.winner);
          }
        }

        await this.saveABTest(storeId, test);
      }
    }
  }

  // Calculer les résultats d'un test A/B
  private calculateABResults(test: ABTest): ABTestResults {
    const control = test.variants.find(v => v.isControl);
    const variants = test.variants.filter(v => !v.isControl);

    if (!control || variants.length === 0) {
      return {
        confidence: 0,
        lift: 0,
        significance: false,
        recommendation: 'Impossible de calculer - variant de contrôle manquant'
      };
    }

    let bestVariant = control;
    let maxImprovement = 0;
    let maxConfidence = 0;

    // Comparer chaque variant au contrôle
    for (const variant of variants) {
      const controlRate = control.sessions > 0 ? control.conversions / control.sessions : 0;
      const variantRate = variant.sessions > 0 ? variant.conversions / variant.sessions : 0;
      
      const improvement = controlRate > 0 ? (variantRate - controlRate) / controlRate : 0;
      const confidence = this.calculateStatisticalSignificance(control, variant);

      if (improvement > maxImprovement && confidence > maxConfidence) {
        bestVariant = variant;
        maxImprovement = improvement;
        maxConfidence = confidence;
      }
    }

    const isSignificant = maxConfidence >= this.SIGNIFICANCE_THRESHOLD;
    const winner = isSignificant && bestVariant !== control ? bestVariant.id : undefined;

    return {
      winner,
      confidence: maxConfidence,
      lift: maxImprovement * 100,
      significance: isSignificant,
      recommendation: this.generateTestRecommendation(maxImprovement, maxConfidence, isSignificant)
    };
  }

  // Calculer la significativité statistique (test Z)
  private calculateStatisticalSignificance(control: ABVariant, variant: ABVariant): number {
    if (control.sessions === 0 || variant.sessions === 0) return 0;

    const p1 = control.conversions / control.sessions;
    const p2 = variant.conversions / variant.sessions;
    const n1 = control.sessions;
    const n2 = variant.sessions;

    const pooledP = (control.conversions + variant.conversions) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    
    if (se === 0) return 0;
    
    const zScore = Math.abs(p2 - p1) / se;
    
    // Convertir le z-score en niveau de confiance
    return this.zScoreToConfidence(zScore);
  }

  private zScoreToConfidence(zScore: number): number {
    // Approximation simple de la fonction de répartition normale
    const confidence = 0.5 * (1 + this.erf(zScore / Math.sqrt(2)));
    return Math.min(0.999, Math.max(0, confidence));
  }

  private erf(x: number): number {
    // Approximation de la fonction d'erreur
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  // Appliquer le variant gagnant
  private async applyWinningVariant(storeId: string, test: ABTest, winnerId: string): Promise<void> {
    const winner = test.variants.find(v => v.id === winnerId);
    if (!winner) return;

    try {
      switch (test.type) {
        case 'price':
          await this.applyPriceOptimization(storeId, winner.config);
          break;
        case 'recommendation':
          await this.applyRecommendationOptimization(storeId, winner.config);
          break;
        case 'upsell':
          await this.applyUpsellOptimization(storeId, winner.config);
          break;
        case 'message':
          await this.applyMessageOptimization(storeId, winner.config);
          break;
      }

      // Log de l'application
      console.log(`Applied winning variant for test ${test.id}: ${winner.name}`);
      
    } catch (error) {
      console.error('Error applying winning variant:', error);
    }
  }

  // Collecter les métriques en temps réel
  private async collectRealTimeMetrics(storeId: string): Promise<RealTimeMetrics> {
    try {
      // Récupérer les commandes de la dernière heure
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentOrders = await prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: oneHourAgo }
        }
      });

      // Calculer les métriques
      const sessionCount = await this.estimateSessionCount(storeId, oneHourAgo);
      const conversionRate = sessionCount > 0 ? recentOrders.length / sessionCount : 0;
      const avgOrderValue = recentOrders.length > 0 ? 
        recentOrders.reduce((sum, order) => sum + order.total, 0) / recentOrders.length : 0;
      const revenue = recentOrders.reduce((sum, order) => sum + order.total, 0);

      // Simuler d'autres métriques
      const bounceRate = Math.random() * 0.3 + 0.1; // 10-40%
      const customerSatisfaction = Math.random() * 0.3 + 0.7; // 70-100%

      return {
        timestamp: new Date(),
        storeId,
        metrics: {
          conversionRate,
          avgOrderValue,
          revenue,
          sessionCount,
          bounceRate,
          customerSatisfaction
        },
        tests: await this.getActiveTestIds(storeId)
      };

    } catch (error) {
      console.error('Error collecting metrics:', error);
      return this.getDefaultMetrics(storeId);
    }
  }

  // Estimer le nombre de sessions
  private async estimateSessionCount(storeId: string, since: Date): Promise<number> {
    // Simulation basée sur les appels/visites
    const callLogs = await prisma.callLog.findMany({
      where: {
        storeId,
        timestamp: { gte: since }
      }
    });

    // Estimer qu'un appel = 1 session, + du trafic web simulé
    return callLogs.length + Math.floor(Math.random() * 50 + 10);
  }

  // Appliquer les règles d'optimisation
  private async applyOptimizationRules(storeId: string, metrics: RealTimeMetrics): Promise<void> {
    const rules = await this.getOptimizationRules(storeId);

    for (const rule of rules.filter(r => r.isActive)) {
      const shouldTrigger = this.evaluateRuleTrigger(rule, metrics);
      
      if (shouldTrigger) {
        await this.executeRule(storeId, rule, metrics);
        
        // Mettre à jour les performances de la règle
        rule.performance.totalTriggers++;
        await this.updateRulePerformance(storeId, rule);
      }
    }
  }

  // Évaluer si une règle doit se déclencher
  private evaluateRuleTrigger(rule: OptimizationRule, metrics: RealTimeMetrics): boolean {
    switch (rule.trigger) {
      case 'performance_based':
        return this.evaluatePerformanceTrigger(rule.conditions, metrics);
      case 'time_based':
        return this.evaluateTimeTrigger(rule.conditions);
      case 'traffic_based':
        return this.evaluateTrafficTrigger(rule.conditions, metrics);
      default:
        return false;
    }
  }

  private evaluatePerformanceTrigger(conditions: any, metrics: RealTimeMetrics): boolean {
    if (conditions.minConversionRate && metrics.metrics.conversionRate < conditions.minConversionRate) {
      return true;
    }
    if (conditions.minRevenue && metrics.metrics.revenue < conditions.minRevenue) {
      return true;
    }
    return false;
  }

  private evaluateTimeTrigger(conditions: any): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    if (conditions.timeRanges) {
      return conditions.timeRanges.some((range: any) => 
        hour >= range.start && hour <= range.end
      );
    }
    
    return false;
  }

  private evaluateTrafficTrigger(conditions: any, metrics: RealTimeMetrics): boolean {
    if (conditions.minSessions && metrics.metrics.sessionCount < conditions.minSessions) {
      return true;
    }
    if (conditions.maxBounceRate && metrics.metrics.bounceRate > conditions.maxBounceRate) {
      return true;
    }
    return false;
  }

  // Exécuter une règle d'optimisation
  private async executeRule(storeId: string, rule: OptimizationRule, metrics: RealTimeMetrics): Promise<void> {
    try {
      switch (rule.action) {
        case 'adjust_price':
          await this.executeAdjustPrice(storeId, rule.parameters);
          break;
        case 'change_recommendations':
          await this.executeChangeRecommendations(storeId, rule.parameters);
          break;
        case 'modify_upsell':
          await this.executeModifyUpsell(storeId, rule.parameters);
          break;
        case 'update_priority':
          await this.executeUpdatePriority(storeId, rule.parameters);
          break;
      }

      console.log(`Executed optimization rule: ${rule.name}`);
      
    } catch (error) {
      console.error(`Error executing rule ${rule.name}:`, error);
    }
  }

  // Détecter les opportunités d'optimisation
  private async detectOptimizationOpportunities(storeId: string, metrics: RealTimeMetrics): Promise<void> {
    const opportunities: string[] = [];

    // Taux de conversion faible
    if (metrics.metrics.conversionRate < 0.05) {
      opportunities.push('conversion_rate_low');
      await this.createAutoABTest(storeId, 'recommendation', 'Améliorer les recommandations');
    }

    // Panier moyen faible
    if (metrics.metrics.avgOrderValue < 15) {
      opportunities.push('avg_order_value_low');
      await this.createAutoABTest(storeId, 'upsell', 'Améliorer l\'upselling');
    }

    // Taux de rebond élevé
    if (metrics.metrics.bounceRate > 0.7) {
      opportunities.push('bounce_rate_high');
      await this.createAutoABTest(storeId, 'message', 'Améliorer l\'accueil client');
    }

    if (opportunities.length > 0) {
      console.log(`Detected optimization opportunities for ${storeId}:`, opportunities);
    }
  }

  // Créer automatiquement un test A/B
  private async createAutoABTest(storeId: string, type: string, name: string): Promise<void> {
    // Vérifier qu'il n'y a pas déjà un test similaire en cours
    const existingTests = await this.getActiveABTests(storeId);
    const hasExistingTest = existingTests.some(test => test.type === type);

    if (hasExistingTest) return;

    const variants = this.generateAutoVariants(type);
    
    const test: Partial<ABTest> = {
      name: `Auto: ${name}`,
      type: type as any,
      variants,
      targetMetric: type === 'upsell' ? 'avg_order_value' : 'conversion_rate',
      sampleSize: this.MIN_SAMPLE_SIZE,
      startDate: new Date()
    };

    const createdTest = await this.createABTest(storeId, test);
    await this.startABTest(storeId, createdTest.id);
  }

  // Générer automatiquement des variants
  private generateAutoVariants(type: string): ABVariant[] {
    const baseId = Date.now();
    
    switch (type) {
      case 'recommendation':
        return [
          {
            id: `control_${baseId}`,
            name: 'Contrôle',
            config: { algorithm: 'popularity' },
            traffic: 50,
            conversions: 0,
            revenue: 0,
            sessions: 0,
            isControl: true
          },
          {
            id: `variant_${baseId}`,
            name: 'IA Recommandations',
            config: { algorithm: 'ai_personalized' },
            traffic: 50,
            conversions: 0,
            revenue: 0,
            sessions: 0,
            isControl: false
          }
        ];
      
      case 'upsell':
        return [
          {
            id: `control_${baseId}`,
            name: 'Upsell Standard',
            config: { strategy: 'conservative', threshold: 20 },
            traffic: 50,
            conversions: 0,
            revenue: 0,
            sessions: 0,
            isControl: true
          },
          {
            id: `variant_${baseId}`,
            name: 'Upsell Agressif',
            config: { strategy: 'aggressive', threshold: 15 },
            traffic: 50,
            conversions: 0,
            revenue: 0,
            sessions: 0,
            isControl: false
          }
        ];
      
      default:
        return [];
    }
  }

  // Méthodes utilitaires et d'application
  private async applyPriceOptimization(storeId: string, config: any): Promise<void> {
    // Appliquer l'optimisation des prix
    console.log('Applying price optimization:', config);
  }

  private async applyRecommendationOptimization(storeId: string, config: any): Promise<void> {
    // Appliquer l'optimisation des recommandations
    console.log('Applying recommendation optimization:', config);
  }

  private async applyUpsellOptimization(storeId: string, config: any): Promise<void> {
    // Appliquer l'optimisation d'upsell
    console.log('Applying upsell optimization:', config);
  }

  private async applyMessageOptimization(storeId: string, config: any): Promise<void> {
    // Appliquer l'optimisation des messages
    console.log('Applying message optimization:', config);
  }

  private async executeAdjustPrice(storeId: string, parameters: any): Promise<void> {
    console.log('Executing price adjustment:', parameters);
  }

  private async executeChangeRecommendations(storeId: string, parameters: any): Promise<void> {
    console.log('Executing recommendation change:', parameters);
  }

  private async executeModifyUpsell(storeId: string, parameters: any): Promise<void> {
    console.log('Executing upsell modification:', parameters);
  }

  private async executeUpdatePriority(storeId: string, parameters: any): Promise<void> {
    console.log('Executing priority update:', parameters);
  }

  // Validation et utilitaires
  private validateVariants(variants: ABVariant[]): void {
    const totalTraffic = variants.reduce((sum, v) => sum + v.traffic, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error('La somme du trafic des variants doit être égale à 100%');
    }

    const controlCount = variants.filter(v => v.isControl).length;
    if (controlCount !== 1) {
      throw new Error('Il doit y avoir exactement un variant de contrôle');
    }
  }

  private generateTestRecommendation(improvement: number, confidence: number, isSignificant: boolean): string {
    if (!isSignificant) {
      return 'Test non significatif - continuer ou augmenter la taille d\'échantillon';
    }

    if (improvement > 0.1) {
      return `Amélioration significative de ${(improvement * 100).toFixed(1)}% - appliquer le variant gagnant`;
    } else if (improvement > 0.05) {
      return `Amélioration modérée de ${(improvement * 100).toFixed(1)}% - considérer l\'application`;
    } else {
      return 'Amélioration marginale - garder le contrôle';
    }
  }

  private getDefaultMetrics(storeId: string): RealTimeMetrics {
    return {
      timestamp: new Date(),
      storeId,
      metrics: {
        conversionRate: 0,
        avgOrderValue: 0,
        revenue: 0,
        sessionCount: 0,
        bounceRate: 0,
        customerSatisfaction: 0
      },
      tests: []
    };
  }

  // Méthodes de persistance (simulées)
  private async saveABTest(storeId: string, test: ABTest): Promise<void> {
    // Sauvegarder dans la base de données
    console.log(`Saving A/B test for store ${storeId}:`, test.name);
  }

  private async getABTest(storeId: string, testId: string): Promise<ABTest | null> {
    // Récupérer depuis la base de données
    return null;
  }

  private async getActiveABTests(storeId: string): Promise<ABTest[]> {
    // Récupérer les tests actifs
    return [];
  }

  private async getActiveTestIds(storeId: string): Promise<string[]> {
    const tests = await this.getActiveABTests(storeId);
    return tests.map(t => t.id);
  }

  private async getOptimizationRules(storeId: string): Promise<OptimizationRule[]> {
    // Récupérer les règles d'optimisation
    return [];
  }

  private async updateRulePerformance(storeId: string, rule: OptimizationRule): Promise<void> {
    // Mettre à jour les performances de la règle
    console.log(`Updating rule performance: ${rule.name}`);
  }

  private async saveMetrics(storeId: string, metrics: RealTimeMetrics): Promise<void> {
    // Sauvegarder les métriques
    console.log(`Saving metrics for store ${storeId}`);
  }
}

export const realTimeOptimizationService = new RealTimeOptimizationService();
export type { ABTest, ABVariant, ABTestResults, OptimizationRule, RealTimeMetrics };