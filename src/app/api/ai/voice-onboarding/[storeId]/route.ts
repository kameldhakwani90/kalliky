import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

interface VoiceOnboardingData {
  analysis: {
    restaurantType: string;
    cuisine: string;
    targetCustomers: string[];
    specialties: string[];
    busyHours: string[];
    priceRange: string;
    atmosphere: string;
    strengths: string[];
    challenges: string[];
    aiRecommendations: string[];
    confidence: number;
  };
  responses: { [questionId: string]: string };
  sessionDuration: number;
  completedAt: Date;
}

// POST - Sauvegarder les résultats de l'onboarding vocal
export async function POST(request: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const data: VoiceOnboardingData = await request.json();
    
    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: { 
        id: params.storeId,
        business: { ownerId: decoded.userId }
      },
      include: {
        intelligentAIConfig: true
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    // Générer la configuration IA automatique basée sur l'analyse
    const autoConfig = generateAutoConfig(data.analysis);

    // Sauvegarder ou mettre à jour la configuration IA intelligente
    await prisma.intelligentAIConfig.upsert({
      where: { storeId: params.storeId },
      create: {
        storeId: params.storeId,
        weatherTriggers: JSON.stringify(autoConfig.weatherTriggers),
        customerSegments: JSON.stringify(autoConfig.customerSegments),
        predictiveRules: JSON.stringify(autoConfig.predictiveRules),
        aiOptimization: JSON.stringify(autoConfig.aiOptimization),
        voiceOnboarding: JSON.stringify({
          ...data.analysis,
          responses: data.responses,
          sessionDuration: data.sessionDuration,
          completedAt: data.completedAt,
          autoConfigured: true
        }),
        automationLevel: 95, // Très élevé car configuré par onboarding vocal
        isFullyAutomated: true,
        isActive: true
      },
      update: {
        weatherTriggers: JSON.stringify(autoConfig.weatherTriggers),
        customerSegments: JSON.stringify(autoConfig.customerSegments),
        predictiveRules: JSON.stringify(autoConfig.predictiveRules),
        aiOptimization: JSON.stringify(autoConfig.aiOptimization),
        voiceOnboarding: JSON.stringify({
          ...data.analysis,
          responses: data.responses,
          sessionDuration: data.sessionDuration,
          completedAt: data.completedAt,
          autoConfigured: true
        }),
        automationLevel: 95,
        isFullyAutomated: true,
        lastUpdated: new Date()
      }
    });

    // Mettre à jour les paramètres du store pour refléter l'analyse
    await updateStoreSettings(params.storeId, data.analysis);

    // Créer des segments clients basés sur l'analyse
    await createCustomerSegments(params.storeId, autoConfig.customerSegments);

    // Activer l'optimisation temps réel
    await activateRealTimeOptimization(params.storeId);

    return NextResponse.json({ 
      success: true, 
      message: 'Configuration IA générée automatiquement',
      autoConfig
    });

  } catch (error) {
    console.error('Error saving voice onboarding:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

// GET - Récupérer les résultats de l'onboarding vocal
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
        intelligentAIConfig: true
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    const voiceOnboardingData = store.intelligentAIConfig?.voiceOnboarding ? 
      JSON.parse(store.intelligentAIConfig.voiceOnboarding as string) : null;

    return NextResponse.json({
      hasOnboarding: !!voiceOnboardingData,
      data: voiceOnboardingData
    });

  } catch (error) {
    console.error('Error fetching voice onboarding:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Générer automatiquement la configuration IA basée sur l'analyse vocale
function generateAutoConfig(analysis: any) {
  const weatherTriggers = generateWeatherTriggers(analysis);
  const customerSegments = generateCustomerSegments(analysis);
  const predictiveRules = generatePredictiveRules(analysis);
  const aiOptimization = generateAIOptimization(analysis);

  return {
    weatherTriggers,
    customerSegments,
    predictiveRules,
    aiOptimization
  };
}

function generateWeatherTriggers(analysis: any) {
  const triggers = [];

  // Basé sur le type de cuisine
  if (analysis.cuisine.toLowerCase().includes('glace') || analysis.cuisine.toLowerCase().includes('dessert')) {
    triggers.push({
      condition: 'hot',
      threshold: 25,
      products: [], // Sera rempli avec les vrais IDs produits
      message: `Il fait chaud ! Parfait pour nos délicieuses ${analysis.specialties[0] || 'spécialités'}`,
      boost: 60
    });
  }

  if (analysis.cuisine.toLowerCase().includes('soupe') || analysis.cuisine.toLowerCase().includes('plat chaud')) {
    triggers.push({
      condition: 'cold',
      threshold: 10,
      products: [],
      message: `Réchauffez-vous avec nos ${analysis.specialties[0] || 'plats chauds'}`,
      boost: 50
    });
  }

  // Déclencheur pluie pour livraison
  triggers.push({
    condition: 'rainy',
    products: [],
    message: `Il pleut ? Pas de problème ! Nous livrons vos ${analysis.specialties[0] || 'plats favoris'}`,
    boost: 40
  });

  return triggers;
}

function generateCustomerSegments(analysis: any) {
  const segments = [];

  // Segment basé sur les clients cibles identifiés
  analysis.targetCustomers.forEach((customerType: string, index: number) => {
    segments.push({
      id: `auto_${customerType.toLowerCase().replace(/\s+/g, '_')}_${index}`,
      name: `Segment ${customerType}`,
      criteria: {
        frequency: index === 0 ? 'regular' : 'occasional', // Premier segment = réguliers
        timeOfDay: analysis.busyHours.slice(0, 2),
        preferences: [analysis.cuisine.toLowerCase()]
      },
      recommendations: analysis.specialties.slice(0, 3),
      upsellStrategy: customerType.toLowerCase().includes('famille') ? 'conservative' : 'balanced',
      personalizedMessage: `Bonjour ! Comme vous appréciez notre cuisine ${analysis.cuisine.toLowerCase()}, je vous recommande ${analysis.specialties[0] || 'nos spécialités'}...`
    });
  });

  // Segment VIP basé sur la gamme de prix
  if (analysis.priceRange.toLowerCase().includes('élevé') || analysis.priceRange.toLowerCase().includes('premium')) {
    segments.push({
      id: 'auto_vip_premium',
      name: 'Clients Premium',
      criteria: {
        avgOrderValue: [40, 999],
        frequency: 'vip'
      },
      recommendations: analysis.specialties,
      upsellStrategy: 'balanced',
      personalizedMessage: `Bonjour ! J'ai une recommandation exclusive pour vous aujourd'hui : ${analysis.specialties[0]}...`
    });
  }

  return segments;
}

function generatePredictiveRules(analysis: any) {
  const rules = [];

  // Règle de prévision de demande pour les heures de pointe
  rules.push({
    id: 'auto_demand_forecast_busy',
    name: 'Prévision demande heures de pointe',
    type: 'demand_forecast',
    conditions: {
      timeframe: 'hourly',
      customerSegments: ['reguliers'],
      minConfidence: 0.7
    },
    action: 'boost_product',
    parameters: {
      boostPercentage: 30
    },
    confidence: 0.8,
    isActive: true,
    performance: {
      successRate: 0,
      totalTriggers: 0,
      revenueImpact: 0
    }
  });

  // Règle d'optimisation des prix si mentionné dans les défis
  if (analysis.challenges.some((challenge: string) => 
    challenge.toLowerCase().includes('prix') || challenge.toLowerCase().includes('marge'))) {
    rules.push({
      id: 'auto_price_optimization',
      name: 'Optimisation prix automatique',
      type: 'price_optimization',
      conditions: {
        timeframe: 'daily',
        minConfidence: 0.8
      },
      action: 'adjust_price',
      parameters: {
        priceAdjustment: 0.05 // 5% max
      },
      confidence: 0.75,
      isActive: true,
      performance: {
        successRate: 0,
        totalTriggers: 0,
        revenueImpact: 0
      }
    });
  }

  // Règle de détection de tendance pour les spécialités
  rules.push({
    id: 'auto_trend_detection_specialties',
    name: 'Détection tendances spécialités',
    type: 'trend_detection',
    conditions: {
      productCategories: [analysis.cuisine],
      minConfidence: 0.6
    },
    action: 'boost_product',
    parameters: {
      boostPercentage: 25
    },
    confidence: 0.7,
    isActive: true,
    performance: {
      successRate: 0,
      totalTriggers: 0,
      revenueImpact: 0
    }
  });

  return rules;
}

function generateAIOptimization(analysis: any) {
  return {
    realTimeAdjustments: true,
    abTestingEnabled: true,
    learningRate: 0.15, // Légèrement plus élevé pour un apprentissage rapide
    adaptationFrequency: 'daily',
    performanceMetrics: [
      'conversion_rate',
      'avg_order_value',
      'customer_satisfaction',
      'recommendation_accuracy'
    ],
    // Configuration spécifique basée sur l'analyse
    customSettings: {
      focusMetric: analysis.challenges.some((c: string) => c.includes('vente')) ? 'conversion_rate' : 'avg_order_value',
      optimizationGoals: analysis.aiRecommendations.slice(0, 3),
      restaurantProfile: {
        type: analysis.restaurantType,
        cuisine: analysis.cuisine,
        atmosphere: analysis.atmosphere
      }
    }
  };
}

// Mettre à jour les paramètres du store
async function updateStoreSettings(storeId: string, analysis: any) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) return;

    const currentSettings = typeof store.settings === 'string' ? 
      JSON.parse(store.settings || '{}') : store.settings || {};

    const updatedSettings = {
      ...currentSettings,
      aiAnalysis: {
        restaurantType: analysis.restaurantType,
        cuisine: analysis.cuisine,
        priceRange: analysis.priceRange,
        atmosphere: analysis.atmosphere,
        busyHours: analysis.busyHours,
        lastAnalyzed: new Date()
      },
      automation: {
        enabled: true,
        level: 95,
        voiceConfigured: true
      }
    };

    await prisma.store.update({
      where: { id: storeId },
      data: {
        settings: JSON.stringify(updatedSettings)
      }
    });

  } catch (error) {
    console.error('Error updating store settings:', error);
  }
}

// Créer les segments clients automatiquement
async function createCustomerSegments(storeId: string, segments: any[]) {
  try {
    // Cette fonction pourrait créer des enregistrements dans une table de segments
    // Pour l'instant, on log simplement
    console.log(`Created ${segments.length} customer segments for store ${storeId}`);
  } catch (error) {
    console.error('Error creating customer segments:', error);
  }
}

// Activer l'optimisation temps réel
async function activateRealTimeOptimization(storeId: string) {
  try {
    // Ici on pourrait déclencher le service d'optimisation temps réel
    console.log(`Activated real-time optimization for store ${storeId}`);
  } catch (error) {
    console.error('Error activating real-time optimization:', error);
  }
}