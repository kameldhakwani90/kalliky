import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Types pour l'analyse d'appel
interface CallAnalysisResult {
  intent: string;
  confidence: number;
  entities: {
    customerInfo?: {
      name?: string;
      phone?: string;
      email?: string;
    };
    orderInfo?: {
      products?: string[];
      totalAmount?: number;
      deliveryAddress?: string;
    };
    reservationInfo?: {
      date?: string;
      time?: string;
      numberOfPeople?: number;
      specialRequests?: string[];
    };
    consultationInfo?: {
      serviceType?: string;
      preferredDate?: string;
      urgency?: string;
      description?: string;
    };
  };
  sentiment: {
    score: number; // -1 (très négatif) à 1 (très positif)
    label: 'positive' | 'neutral' | 'negative';
  };
  actionableItems: {
    type: 'email' | 'sms' | 'callback' | 'notification';
    priority: 'high' | 'medium' | 'low';
    description: string;
    suggestedContent?: string;
  }[];
  qualityMetrics: {
    callDuration: number;
    speechClarity: number;
    customerSatisfaction: number;
  };
}

// Simulateur d'analyse IA (à remplacer par un vrai service IA)
async function analyzeCallTranscript(transcript: string, storeId: string): Promise<CallAnalysisResult> {
  // Récupérer les critères du store pour l'analyse
  const serviceCriteria = await prisma.serviceCriteria.findMany({
    where: { storeId }
  });

  // Simulation d'analyse basique - À remplacer par OpenAI/Claude
  const lowerTranscript = transcript.toLowerCase();
  
  // Détection d'intent
  let intent = 'unknown';
  let confidence = 0.5;
  
  if (lowerTranscript.includes('commander') || lowerTranscript.includes('commande') || lowerTranscript.includes('livraison')) {
    intent = 'order';
    confidence = 0.9;
  } else if (lowerTranscript.includes('réserver') || lowerTranscript.includes('réservation') || lowerTranscript.includes('table')) {
    intent = 'reservation';
    confidence = 0.85;
  } else if (lowerTranscript.includes('consultat') || lowerTranscript.includes('rendez-vous') || lowerTranscript.includes('conseil')) {
    intent = 'consultation';
    confidence = 0.8;
  } else if (lowerTranscript.includes('annul') || lowerTranscript.includes('problème') || lowerTranscript.includes('réclamat')) {
    intent = 'complaint';
    confidence = 0.75;
  }

  // Extraction d'entités basique
  const entities: any = {};
  
  // Détection numéro de téléphone
  const phoneMatch = transcript.match(/(\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2})/);
  if (phoneMatch) {
    entities.customerInfo = { phone: phoneMatch[1].replace(/\s/g, '') };
  }

  // Détection sentiment
  const positiveWords = ['excellent', 'parfait', 'merci', 'satisfait', 'content'];
  const negativeWords = ['problème', 'mécontent', 'déçu', 'nul', 'mauvais'];
  
  const positiveCount = positiveWords.filter(word => lowerTranscript.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerTranscript.includes(word)).length;
  
  let sentimentScore = (positiveCount - negativeCount) / 10;
  sentimentScore = Math.max(-1, Math.min(1, sentimentScore));
  
  const sentiment = {
    score: sentimentScore,
    label: sentimentScore > 0.2 ? 'positive' : sentimentScore < -0.2 ? 'negative' : 'neutral' as const
  };

  // Génération d'actions
  const actionableItems = [];
  
  if (intent === 'order') {
    actionableItems.push({
      type: 'email' as const,
      priority: 'medium' as const,
      description: 'Envoyer confirmation de commande',
      suggestedContent: 'Bonjour, nous confirmons votre commande...'
    });
  }
  
  if (intent === 'complaint') {
    actionableItems.push({
      type: 'callback' as const,
      priority: 'high' as const,
      description: 'Rappel prioritaire pour résoudre le problème'
    });
  }

  if (sentiment.label === 'negative') {
    actionableItems.push({
      type: 'notification' as const,
      priority: 'high' as const,
      description: 'Alerter le manager - client mécontent'
    });
  }

  return {
    intent,
    confidence,
    entities,
    sentiment,
    actionableItems,
    qualityMetrics: {
      callDuration: transcript.length / 10, // Approximation
      speechClarity: 0.8,
      customerSatisfaction: sentimentScore > 0 ? 0.8 : 0.4
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      storeId, 
      phoneNumber, 
      duration, 
      transcript, 
      recordingUrl,
      customerId 
    } = body;

    if (!storeId || !phoneNumber || !transcript) {
      return NextResponse.json({ 
        error: 'storeId, phoneNumber et transcript requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès au store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      }
    });

    if (!store) {
      return NextResponse.json({ 
        error: 'Store non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Analyser l'appel avec l'IA
    const analysisResult = await analyzeCallTranscript(transcript, storeId);

    // Rechercher ou créer le client
    let customer = null;
    if (customerId) {
      customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          businessId: store.businessId
        }
      });
    }

    // Si pas de customer fourni, essayer de le trouver par téléphone
    if (!customer && phoneNumber) {
      customer = await prisma.customer.findFirst({
        where: {
          phone: phoneNumber,
          businessId: store.businessId
        }
      });
    }

    // Créer le customer si il n'existe pas et qu'on a des infos
    let customerCreated = false;
    if (!customer && analysisResult.entities.customerInfo) {
      try {
        customer = await prisma.customer.create({
          data: {
            phone: phoneNumber,
            firstName: analysisResult.entities.customerInfo.name || 'Client',
            lastName: 'Anonyme',
            email: analysisResult.entities.customerInfo.email,
            businessId: store.businessId,
            status: 'NEW'
          }
        });
        customerCreated = true;
      } catch (error) {
        console.error('Error creating customer:', error);
      }
    }

    // Enregistrer le log d'appel
    const callLog = await prisma.callLog.create({
      data: {
        storeId,
        customerId: customer?.id,
        phoneNumber,
        duration: duration || 0,
        timestamp: new Date(),
        transcript,
        aiAnalysis: analysisResult,
        intent: analysisResult.intent,
        confidence: analysisResult.confidence,
        emailSent: false,
        customerCreated
      }
    });

    // Créer les actions à déclencher
    const actions = [];
    for (const actionItem of analysisResult.actionableItems) {
      const action = await prisma.action.create({
        data: {
          callLogId: callLog.id,
          type: actionItem.type,
          status: 'pending',
          data: {
            priority: actionItem.priority,
            description: actionItem.description,
            suggestedContent: actionItem.suggestedContent
          }
        }
      });
      actions.push(action);
    }

    // Mettre à jour les comportements du client si il existe
    if (customer) {
      try {
        await prisma.customerBehavior.upsert({
          where: {
            customerId: customer.id
          },
          update: {
            lastAnalysis: new Date(),
            // Mettre à jour basé sur l'analyse
          },
          create: {
            customerId: customer.id,
            favoriteCategories: [],
            lastAnalysis: new Date()
          }
        });
      } catch (error) {
        console.error('Error updating customer behavior:', error);
      }
    }

    return NextResponse.json({
      success: true,
      callLogId: callLog.id,
      analysis: analysisResult,
      customer: customer ? {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        isNew: customerCreated
      } : null,
      actionsCreated: actions.length,
      actions: actions.map(a => ({
        id: a.id,
        type: a.type,
        status: a.status,
        priority: (a.data as any)?.priority
      }))
    });

  } catch (error) {
    console.error('Error analyzing call:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'analyse de l\'appel' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!storeId) {
      return NextResponse.json({ 
        error: 'storeId requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès au store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      }
    });

    if (!store) {
      return NextResponse.json({ 
        error: 'Store non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Récupérer les logs d'appels
    const callLogs = await prisma.callLog.findMany({
      where: { storeId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true
          }
        },
        actions: {
          select: {
            id: true,
            type: true,
            status: true,
            data: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit
    });

    // Statistiques globales
    const stats = await prisma.callLog.aggregate({
      where: { storeId },
      _count: {
        id: true
      },
      _avg: {
        duration: true,
        confidence: true
      }
    });

    // Répartition par intent
    const intentStats = await prisma.callLog.groupBy({
      by: ['intent'],
      where: { storeId },
      _count: {
        intent: true
      }
    });

    return NextResponse.json({
      callLogs: callLogs.map(log => ({
        id: log.id,
        phoneNumber: log.phoneNumber,
        duration: log.duration,
        timestamp: log.timestamp,
        intent: log.intent,
        confidence: log.confidence,
        customer: log.customer,
        actionsCount: log.actions.length,
        pendingActions: log.actions.filter(a => a.status === 'pending').length
      })),
      stats: {
        totalCalls: stats._count.id,
        averageDuration: stats._avg.duration,
        averageConfidence: stats._avg.confidence,
        intentDistribution: intentStats
      },
      pagination: {
        limit,
        offset,
        total: stats._count.id
      }
    });

  } catch (error) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des logs d\'appels' 
    }, { status: 500 });
  }
}