import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { weatherService } from '@/lib/services/weatherService';

// GET - Récupérer la configuration IA intelligente
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
        subscription: true
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    // Retourner la configuration existante ou une configuration par défaut
    const config = store.intelligentAIConfig || {
      weatherTriggers: [],
      customerSegments: [
        {
          id: 'nouveaux',
          name: 'Nouveaux clients',
          criteria: { frequency: 'new' },
          recommendations: [],
          upsellStrategy: 'conservative',
          personalizedMessage: 'Bienvenue ! Laissez-moi vous recommander nos spécialités...'
        }
      ],
      predictiveRules: [],
      aiOptimization: {
        realTimeAdjustments: true,
        abTestingEnabled: true,
        learningRate: 0.1,
        adaptationFrequency: 'daily',
        performanceMetrics: ['conversion_rate', 'avg_order_value']
      },
      voiceOnboarding: {
        enabled: true,
        maxDuration: 4,
        questions: [
          "Pouvez-vous me décrire votre restaurant en quelques mots ?",
          "Quelle est votre spécialité culinaire ?",
          "Qui est votre clientèle cible ?"
        ],
        analysisDepth: 'comprehensive',
        autoSetupEnabled: true
      },
      automationLevel: 90,
      isFullyAutomated: true
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching intelligent AI config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Sauvegarder la configuration IA intelligente
export async function PUT(request: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const configData = await request.json();
    
    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: { 
        id: params.storeId,
        business: { ownerId: decoded.userId }
      },
      include: {
        subscription: true
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé' }, { status: 404 });
    }

    // Vérifier les permissions selon le plan
    const plan = store.subscription?.plan || 'STARTER';
    const config = validateConfigByPlan(configData, plan);

    // Sauvegarder dans la base de données
    const savedConfig = await prisma.intelligentAIConfig.upsert({
      where: { storeId: params.storeId },
      create: {
        storeId: params.storeId,
        weatherTriggers: JSON.stringify(config.weatherTriggers || []),
        customerSegments: JSON.stringify(config.customerSegments || []),
        predictiveRules: JSON.stringify(config.predictiveRules || []),
        aiOptimization: JSON.stringify(config.aiOptimization || {}),
        voiceOnboarding: JSON.stringify(config.voiceOnboarding || {}),
        automationLevel: config.automationLevel || 90,
        isFullyAutomated: config.isFullyAutomated || true,
        isActive: true
      },
      update: {
        weatherTriggers: JSON.stringify(config.weatherTriggers || []),
        customerSegments: JSON.stringify(config.customerSegments || []),
        predictiveRules: JSON.stringify(config.predictiveRules || []),
        aiOptimization: JSON.stringify(config.aiOptimization || {}),
        voiceOnboarding: JSON.stringify(config.voiceOnboarding || {}),
        automationLevel: config.automationLevel || 90,
        isFullyAutomated: config.isFullyAutomated || true,
        lastUpdated: new Date()
      }
    });

    // Déclencher la mise à jour des recommandations météo si activées
    if (config.weatherTriggers?.length > 0) {
      try {
        await updateWeatherRecommendations(params.storeId, config.weatherTriggers);
      } catch (weatherError) {
        console.error('Error updating weather recommendations:', weatherError);
        // Ne pas faire échouer la sauvegarde pour une erreur météo
      }
    }

    return NextResponse.json({ success: true, config: savedConfig });
  } catch (error) {
    console.error('Error saving intelligent AI config:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

// Fonction pour valider la configuration selon le plan
function validateConfigByPlan(config: any, plan: string) {
  const planLimits = {
    STARTER: {
      maxWeatherTriggers: 2,
      maxCustomerSegments: 3,
      maxPredictiveRules: 1,
      advancedAnalytics: false,
      voiceOnboarding: false,
      realTimeOptimization: false
    },
    PRO: {
      maxWeatherTriggers: 5,
      maxCustomerSegments: 8,
      maxPredictiveRules: 5,
      advancedAnalytics: true,
      voiceOnboarding: true,
      realTimeOptimization: true
    },
    BUSINESS: {
      maxWeatherTriggers: -1, // illimité
      maxCustomerSegments: -1,
      maxPredictiveRules: -1,
      advancedAnalytics: true,
      voiceOnboarding: true,
      realTimeOptimization: true
    }
  };

  const limits = planLimits[plan as keyof typeof planLimits] || planLimits.STARTER;
  
  // Filtrer selon les limites du plan
  if (limits.maxWeatherTriggers > 0) {
    config.weatherTriggers = config.weatherTriggers?.slice(0, limits.maxWeatherTriggers) || [];
  }
  
  if (limits.maxCustomerSegments > 0) {
    config.customerSegments = config.customerSegments?.slice(0, limits.maxCustomerSegments) || [];
  }
  
  if (limits.maxPredictiveRules > 0) {
    config.predictiveRules = config.predictiveRules?.slice(0, limits.maxPredictiveRules) || [];
  }

  // Désactiver les fonctionnalités non autorisées
  if (!limits.voiceOnboarding) {
    config.voiceOnboarding = { ...config.voiceOnboarding, enabled: false };
  }
  
  if (!limits.realTimeOptimization) {
    config.aiOptimization = { 
      ...config.aiOptimization, 
      realTimeAdjustments: false,
      abTestingEnabled: false 
    };
  }

  return config;
}

// Fonction pour mettre à jour les recommandations météo
async function updateWeatherRecommendations(storeId: string, weatherTriggers: any[]) {
  try {
    // Récupérer les informations du store pour obtenir la localisation
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { address: true }
    });

    if (!store?.address) return;

    // Obtenir la météo actuelle
    const weather = await weatherService.getWeatherByCity(store.address);
    
    // Calculer les recommandations actives
    const activeRecommendations = weatherService.getWeatherBasedRecommendations(
      weather,
      weatherTriggers
    );

    // Sauvegarder les recommandations actives
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

  } catch (error) {
    console.error('Error updating weather recommendations:', error);
    throw error;
  }
}

// POST - Déclencher l'analyse prédictive manuelle
export async function POST(request: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { action } = await request.json();
    
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

    switch (action) {
      case 'update_weather':
        await updateWeatherRecommendations(params.storeId, []);
        break;
      
      case 'analyze_customers':
        // TODO: Implémenter l'analyse des segments clients
        break;
      
      case 'optimize_catalog':
        // TODO: Implémenter l'optimisation du catalogue
        break;
      
      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Analyse déclenchée avec succès' });
  } catch (error) {
    console.error('Error triggering analysis:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 });
  }
}