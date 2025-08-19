import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { weatherService } from '@/lib/services/weatherService';
import { customerProfilingService } from '@/lib/services/customerProfilingService';
import { predictiveAnalyticsService } from '@/lib/services/predictiveAnalyticsService';
import { realTimeOptimizationService } from '@/lib/services/realTimeOptimizationService';

interface AutomationStatus {
  storeId: string;
  isActive: boolean;
  level: number;
  services: {
    weatherOptimization: boolean;
    customerProfiling: boolean;
    predictiveAnalytics: boolean;
    realTimeOptimization: boolean;
    voiceOnboarding: boolean;
  };
  metrics: {
    totalAutomatedActions: number;
    successRate: number;
    revenueImpact: number;
    lastUpdate: Date;
  };
  recommendations: string[];
}

// GET - Obtenir le statut de l'automation
export async function GET(request: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: { 
        id: params.storeId,
        business: { ownerId: decoded.userId }
      },
      include: {
        intelligentAIConfig: true,
        weatherRecommendation: true,
        subscription: true
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    // Générer le statut d'automation
    const status = await generateAutomationStatus(store);

    return NextResponse.json(status);

  } catch (error) {
    console.error('Error fetching automation status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Déclencher des actions d'automation
export async function POST(request: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { action, parameters } = await request.json();
    
    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: { 
        id: params.storeId,
        business: { ownerId: decoded.userId }
      },
      include: {
        intelligentAIConfig: true,
        subscription: true
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    let result;

    switch (action) {
      case 'analyze_all_customers':
        result = await analyzeAllCustomers(params.storeId);
        break;
        
      case 'optimize_catalog':
        result = await optimizeCatalog(params.storeId);
        break;
        
      case 'update_weather_recommendations':
        result = await updateWeatherRecommendations(params.storeId);
        break;
        
      case 'run_predictive_analysis':
        result = await runPredictiveAnalysis(params.storeId);
        break;
        
      case 'start_ab_testing':
        result = await startABTesting(params.storeId, parameters);
        break;
        
      case 'full_automation_cycle':
        result = await runFullAutomationCycle(params.storeId);
        break;
        
      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      action,
      result,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error executing automation action:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'exécution' }, { status: 500 });
  }
}

// PUT - Mettre à jour la configuration d'automation
export async function PUT(request: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { level, services } = await request.json();
    
    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: { 
        id: params.storeId,
        business: { ownerId: decoded.userId }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    // Mettre à jour la configuration
    await prisma.intelligentAIConfig.upsert({
      where: { storeId: params.storeId },
      create: {
        storeId: params.storeId,
        automationLevel: level,
        isFullyAutomated: level >= 90,
        isActive: true
      },
      update: {
        automationLevel: level,
        isFullyAutomated: level >= 90,
        lastUpdated: new Date()
      }
    });

    // Activer/désactiver les services selon la configuration
    await configureAutomationServices(params.storeId, services, level);

    return NextResponse.json({ 
      success: true, 
      message: 'Configuration d\'automation mise à jour',
      level,
      services
    });

  } catch (error) {
    console.error('Error updating automation config:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

// Générer le statut d'automation
async function generateAutomationStatus(store: any): Promise<AutomationStatus> {
  const config = store.intelligentAIConfig;
  const hasWeatherRec = !!store.weatherRecommendation;
  
  // Calculer les métriques d'automation
  const metrics = await calculateAutomationMetrics(store.id);
  
  // Générer des recommandations
  const recommendations = await generateAutomationRecommendations(store);

  return {
    storeId: store.id,
    isActive: config?.isActive || false,
    level: config?.automationLevel || 0,
    services: {
      weatherOptimization: hasWeatherRec,
      customerProfiling: !!config?.customerSegments,
      predictiveAnalytics: !!config?.predictiveRules,
      realTimeOptimization: !!config?.aiOptimization,
      voiceOnboarding: !!config?.voiceOnboarding
    },
    metrics,
    recommendations
  };
}

// Calculer les métriques d'automation
async function calculateAutomationMetrics(storeId: string) {
  try {
    // Récupérer les métriques des 30 derniers jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const orders = await prisma.order.findMany({
      where: {
        storeId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Simuler des métriques d'automation
    const totalAutomatedActions = Math.floor(Math.random() * 500) + 100;
    const successRate = Math.random() * 0.3 + 0.7; // 70-100%
    const revenueImpact = orders.reduce((sum, order) => sum + order.total, 0) * 0.15; // 15% d'impact estimé

    return {
      totalAutomatedActions,
      successRate,
      revenueImpact,
      lastUpdate: new Date()
    };
  } catch (error) {
    return {
      totalAutomatedActions: 0,
      successRate: 0,
      revenueImpact: 0,
      lastUpdate: new Date()
    };
  }
}

// Générer des recommandations d'automation
async function generateAutomationRecommendations(store: any): Promise<string[]> {
  const recommendations: string[] = [];
  const config = store.intelligentAIConfig;
  
  if (!config) {
    recommendations.push('Configurer l\'IA intelligente pour démarrer l\'automation');
    recommendations.push('Commencer par une session d\'onboarding vocal');
    return recommendations;
  }

  if (!config.voiceOnboarding) {
    recommendations.push('Effectuer une session d\'onboarding vocal pour optimiser la configuration');
  }

  if (config.automationLevel < 70) {
    recommendations.push('Augmenter le niveau d\'automation pour de meilleurs résultats');
  }

  if (!store.weatherRecommendation) {
    recommendations.push('Activer les recommandations météo pour booster les ventes');
  }

  if (!config.customerSegments || JSON.parse(config.customerSegments).length < 3) {
    recommendations.push('Créer plus de segments clients pour une personnalisation avancée');
  }

  if (!config.predictiveRules || JSON.parse(config.predictiveRules).length < 2) {
    recommendations.push('Ajouter des règles prédictives pour l\'optimisation automatique');
  }

  // Recommandations basées sur les performances
  const metrics = await calculateAutomationMetrics(store.id);
  if (metrics.successRate < 0.8) {
    recommendations.push('Analyser et ajuster les règles d\'automation pour améliorer le taux de succès');
  }

  if (metrics.revenueImpact < 100) {
    recommendations.push('Optimiser les stratégies d\'upselling pour augmenter l\'impact sur le chiffre d\'affaires');
  }

  return recommendations;
}

// Actions d'automation

async function analyzeAllCustomers(storeId: string) {
  try {
    const profiles = await customerProfilingService.analyzeAllCustomers(storeId);
    
    return {
      message: 'Analyse des clients terminée',
      profilesCreated: profiles.length,
      segments: profiles.reduce((acc, profile) => {
        acc[profile.segment] = (acc[profile.segment] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    };
  } catch (error) {
    throw new Error('Erreur lors de l\'analyse des clients');
  }
}

async function optimizeCatalog(storeId: string) {
  try {
    // Récupérer les produits du store
    const products = await prisma.product.findMany({
      where: { storeId, status: 'ACTIVE' }
    });

    // Analyser chaque produit pour l'optimisation
    const optimizations = [];
    
    for (const product of products.slice(0, 5)) { // Limiter à 5 pour la démo
      const forecast = await predictiveAnalyticsService.forecastDemand(storeId, product.id);
      const priceOpt = await predictiveAnalyticsService.optimizePrice(storeId, product.id);
      
      if (forecast || priceOpt) {
        optimizations.push({
          productId: product.id,
          productName: product.name,
          forecast,
          priceOptimization: priceOpt
        });
      }
    }

    return {
      message: 'Optimisation du catalogue terminée',
      productsAnalyzed: products.length,
      optimizations: optimizations.length,
      details: optimizations
    };
  } catch (error) {
    throw new Error('Erreur lors de l\'optimisation du catalogue');
  }
}

async function updateWeatherRecommendations(storeId: string) {
  try {
    // Récupérer le store et sa localisation
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { address: true }
    });

    if (!store?.address) {
      throw new Error('Adresse du store non trouvée');
    }

    // Obtenir la météo actuelle
    const weather = await weatherService.getWeatherByCity(store.address);
    
    // Récupérer les déclencheurs météo configurés
    const config = await prisma.intelligentAIConfig.findUnique({
      where: { storeId }
    });

    const triggers = config?.weatherTriggers ? JSON.parse(config.weatherTriggers as string) : [];
    
    // Calculer les recommandations actives
    const activeRecommendations = weatherService.getWeatherBasedRecommendations(weather, triggers);

    // Sauvegarder les recommandations
    await prisma.weatherRecommendation.upsert({
      where: { storeId },
      create: {
        storeId,
        currentWeather: JSON.stringify(weather),
        activeProducts: JSON.stringify(activeRecommendations),
        lastUpdated: new Date()
      },
      update: {
        currentWeather: JSON.stringify(weather),
        activeProducts: JSON.stringify(activeRecommendations),
        lastUpdated: new Date()
      }
    });

    return {
      message: 'Recommandations météo mises à jour',
      weather: {
        temperature: weather.temperature,
        condition: weather.condition,
        description: weather.description
      },
      activeProducts: activeRecommendations.length,
      triggers: triggers.length
    };
  } catch (error) {
    throw new Error('Erreur lors de la mise à jour météo');
  }
}

async function runPredictiveAnalysis(storeId: string) {
  try {
    // Détecter les tendances
    const trends = await predictiveAnalyticsService.detectTrends(storeId);
    
    // Récupérer les règles existantes
    const config = await prisma.intelligentAIConfig.findUnique({
      where: { storeId }
    });

    const rules = config?.predictiveRules ? JSON.parse(config.predictiveRules as string) : [];
    
    // Améliorer les règles avec l'apprentissage automatique
    const improvedRules = await predictiveAnalyticsService.learnAndImprove(storeId, rules);

    return {
      message: 'Analyse prédictive terminée',
      trendsDetected: trends.length,
      rulesImproved: improvedRules.length,
      trends: trends.map(t => ({
        category: t.category,
        trend: t.trend,
        strength: t.strength
      }))
    };
  } catch (error) {
    throw new Error('Erreur lors de l\'analyse prédictive');
  }
}

async function startABTesting(storeId: string, parameters: any) {
  try {
    const testConfig = {
      name: parameters.name || 'Test automatique IA',
      type: parameters.type || 'recommendation',
      targetMetric: parameters.targetMetric || 'conversion_rate',
      sampleSize: parameters.sampleSize || 100
    };

    const test = await realTimeOptimizationService.createABTest(storeId, testConfig);
    await realTimeOptimizationService.startABTest(storeId, test.id);

    return {
      message: 'Test A/B démarré',
      testId: test.id,
      testName: test.name,
      variants: test.variants.length
    };
  } catch (error) {
    throw new Error('Erreur lors du démarrage du test A/B');
  }
}

async function runFullAutomationCycle(storeId: string) {
  try {
    const results = {
      weatherUpdate: null,
      customerAnalysis: null,
      catalogOptimization: null,
      predictiveAnalysis: null,
      errors: [] as string[]
    };

    // 1. Mise à jour météo
    try {
      results.weatherUpdate = await updateWeatherRecommendations(storeId);
    } catch (error) {
      results.errors.push('Erreur mise à jour météo');
    }

    // 2. Analyse clients
    try {
      results.customerAnalysis = await analyzeAllCustomers(storeId);
    } catch (error) {
      results.errors.push('Erreur analyse clients');
    }

    // 3. Optimisation catalogue
    try {
      results.catalogOptimization = await optimizeCatalog(storeId);
    } catch (error) {
      results.errors.push('Erreur optimisation catalogue');
    }

    // 4. Analyse prédictive
    try {
      results.predictiveAnalysis = await runPredictiveAnalysis(storeId);
    } catch (error) {
      results.errors.push('Erreur analyse prédictive');
    }

    return {
      message: 'Cycle d\'automation complet terminé',
      results,
      successRate: ((4 - results.errors.length) / 4) * 100
    };
  } catch (error) {
    throw new Error('Erreur lors du cycle d\'automation complet');
  }
}

// Configurer les services d'automation
async function configureAutomationServices(storeId: string, services: any, level: number) {
  try {
    if (level >= 70 && services.realTimeOptimization) {
      // Démarrer l'optimisation temps réel
      realTimeOptimizationService.startRealTimeOptimization(storeId);
    } else {
      realTimeOptimizationService.stopRealTimeOptimization();
    }

    // Autres configurations de services...
    console.log(`Configured automation services for store ${storeId} at level ${level}`);
  } catch (error) {
    console.error('Error configuring automation services:', error);
  }
}