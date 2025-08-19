// ============================================================================
// API TICKETS UNIFIÉS - Récupération complète données ticket
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface UnifiedTicketData {
  id: string;
  date: string;
  duration?: string;
  customer: any;
  
  // ACTIVITÉS UNIFIÉES
  activities: Array<{
    type: 'order' | 'consultation' | 'signalement' | 'call';
    id: string;
    date: string;
    title: string;
    description: string;
    status: string;
    amount?: number;
    urgency?: string;
    data: any;
  }>;
  
  // TOTAUX
  total: number;
  
  // CONVERSATION IA
  conversation?: {
    sentiment: string;
    satisfaction: number;
    summary: string;
    keyTopics: string[];
    aiAnalysis: any;
  };
  
  // AUDIO
  audioUrl?: string;
  transcript?: string;
  
  // MÉTADONNÉES
  metadata: {
    source: string;
    aiProcessed: boolean;
    confidence?: number;
    lastUpdate: string;
  };
}

// GET - Récupérer ticket unifié par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    console.log(`🎫 Récupération ticket unifié: ${ticketId}`);

    // 1. ESSAYER DE TROUVER PAR ORDER NUMBER
    let baseEntity: any = null;
    let entityType: string = '';
    let customerId: string = '';
    let businessId: string = '';
    let storeId: string = '';

    // Chercher d'abord dans les commandes
    const order = await prisma.order.findFirst({
      where: { orderNumber: ticketId },
      include: {
        customer: true,
        business: {
          include: { stores: true }
        }
      }
    });

    if (order) {
      baseEntity = order;
      entityType = 'order';
      customerId = order.customerId;
      businessId = order.businessId;
      storeId = order.storeId;
    }

    // Si pas trouvé dans commandes, chercher dans les calls
    if (!baseEntity) {
      const call = await prisma.call.findFirst({
        where: {
          OR: [
            { id: ticketId },
            {
              metadata: {
                path: ['callControlId'],
                equals: ticketId
              }
            }
          ]
        },
        include: {
          customer: true,
          business: {
            include: { stores: true }
          }
        }
      });

      if (call) {
        baseEntity = call;
        entityType = 'call';
        customerId = call.customerId;
        businessId = call.businessId;
        // Pour les calls, prendre le premier store du business
        storeId = call.business.stores[0]?.id || '';
      }
    }

    // Si pas trouvé dans calls, chercher dans consultations
    if (!baseEntity) {
      const consultation = await prisma.consultation.findFirst({
        where: { id: ticketId },
        include: {
          customer: true,
          store: {
            include: {
              business: { include: { stores: true } }
            }
          }
        }
      });

      if (consultation) {
        baseEntity = consultation;
        entityType = 'consultation';
        customerId = consultation.customerId;
        businessId = consultation.store.businessId;
        storeId = consultation.storeId;
      }
    }

    if (!baseEntity) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    // 2. RÉCUPÉRER TOUTES LES ENTITÉS LIÉES AU CLIENT DANS UNE PÉRIODE
    const timeframe = new Date();
    timeframe.setHours(timeframe.getHours() - 24); // 24h de tolérance

    const [orders, consultations, signalements, calls, conversationSession] = await Promise.all([
      // COMMANDES
      prisma.order.findMany({
        where: {
          customerId,
          createdAt: { gte: timeframe }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // CONSULTATIONS
      prisma.consultation.findMany({
        where: {
          customerId,
          createdAt: { gte: timeframe }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // SIGNALEMENTS
      prisma.customerExchange.findMany({
        where: {
          customerId,
          type: 'COMPLAINT',
          createdAt: { gte: timeframe }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // APPELS
      prisma.call.findMany({
        where: {
          customerId,
          createdAt: { gte: timeframe }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // SESSION CONVERSATION IA
      prisma.aIConversationSession.findFirst({
        where: {
          customerId,
          createdAt: { gte: timeframe }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // 3. CONSTRUIRE ACTIVITÉS UNIFIÉES
    const activities = [];

    // Ajouter commandes
    orders.forEach(order => {
      activities.push({
        type: 'order' as const,
        id: order.id,
        date: order.createdAt.toISOString(),
        title: `Commande ${order.orderNumber}`,
        description: `${(order.items as any[])?.length || 0} article(s) - ${order.status}`,
        status: order.status,
        amount: order.totalAmount,
        urgency: (order.metadata as any)?.urgency || 'normal',
        data: order
      });
    });

    // Ajouter consultations
    consultations.forEach(consultation => {
      activities.push({
        type: 'consultation' as const,
        id: consultation.id,
        date: consultation.createdAt.toISOString(),
        title: `Consultation ${consultation.type}`,
        description: consultation.description || 'Consultation demandée',
        status: consultation.status,
        urgency: (consultation.metadata as any)?.urgency || 'normal',
        data: consultation
      });
    });

    // Ajouter signalements
    signalements.forEach(signalement => {
      const urgencyMap: Record<string, string> = {
        'HIGH': 'eleve',
        'NORMAL': 'normal',
        'LOW': 'faible'
      };

      activities.push({
        type: 'signalement' as const,
        id: signalement.id,
        date: signalement.createdAt.toISOString(),
        title: signalement.title || 'Signalement client',
        description: signalement.description || 'Problème signalé',
        status: signalement.status,
        urgency: urgencyMap[signalement.priority] || 'normal',
        data: signalement
      });
    });

    // Ajouter appels
    calls.forEach(call => {
      activities.push({
        type: 'call' as const,
        id: call.id,
        date: call.createdAt.toISOString(),
        title: `Appel ${call.type}`,
        description: `Durée: ${call.duration ? formatDuration(call.duration) : 'Inconnue'}`,
        status: (call.metadata as any)?.aiProcessed ? 'Traité par IA' : 'En attente',
        data: call
      });
    });

    // Trier activités par date (plus récent en premier)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 4. CALCULER TOTAL
    const total = activities
      .filter(a => a.amount)
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    // 5. RÉCUPÉRER AUDIO ET TRANSCRIPT DU CALL LE PLUS RÉCENT
    const mostRecentCall = calls[0];
    const audioUrl = mostRecentCall?.recordingUrl || undefined;
    const transcript = mostRecentCall?.transcript || undefined;

    // 6. CONSTRUIRE DONNÉES CONVERSATION IA
    let conversation = undefined;
    if (conversationSession) {
      const extractedData = conversationSession.extractedData as any;
      conversation = {
        sentiment: extractedData?.sentiment || 'neutral',
        satisfaction: extractedData?.satisfaction || 5,
        summary: extractedData?.summary || 'Résumé non disponible',
        keyTopics: extractedData?.keyTopics || [],
        aiAnalysis: extractedData?.analysisResult || null
      };
    }

    // 7. CONSTRUIRE TICKET UNIFIÉ
    const unifiedTicket: UnifiedTicketData = {
      id: ticketId,
      date: baseEntity.createdAt.toISOString(),
      duration: mostRecentCall?.duration ? formatDuration(mostRecentCall.duration) : undefined,
      customer: baseEntity.customer,
      
      activities,
      total,
      conversation,
      audioUrl,
      transcript,
      
      metadata: {
        source: entityType,
        aiProcessed: (mostRecentCall?.metadata as any)?.aiProcessed || false,
        confidence: (conversationSession?.metadata as any)?.confidence || undefined,
        lastUpdate: new Date().toISOString()
      }
    };

    console.log(`✅ Ticket unifié construit: ${activities.length} activités, total ${total}€`);

    return NextResponse.json(unifiedTicket);

  } catch (error) {
    console.error(`❌ Erreur récupération ticket:`, error);
    
    return NextResponse.json(
      { 
        error: 'Erreur récupération ticket',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  // Logique POST si nécessaire
  return NextResponse.json({ message: `POST to ticket ${ticketId}` });
}

// Helper pour formater durée en minutes:secondes
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// GET avec query params pour recherche avancée
export async function GET_SEARCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const businessId = searchParams.get('businessId');
    const storeId = searchParams.get('storeId');
    const type = searchParams.get('type'); // 'order', 'call', 'consultation', 'complaint'
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log(`🔍 Recherche tickets: customerId=${customerId}, type=${type}`);

    const tickets = [];

    // Recherche selon critères
    if (type === 'order' || !type) {
      const orders = await prisma.order.findMany({
        where: {
          ...(customerId && { customerId }),
          ...(businessId && { businessId }),
          ...(storeId && { storeId })
        },
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      orders.forEach(order => {
        tickets.push({
          id: order.orderNumber,
          type: 'order',
          date: order.createdAt,
          customer: order.customer,
          amount: order.totalAmount,
          status: order.status
        });
      });
    }

    if (type === 'call' || !type) {
      const calls = await prisma.call.findMany({
        where: {
          ...(customerId && { customerId }),
          ...(businessId && { businessId })
        },
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      calls.forEach(call => {
        tickets.push({
          id: call.id,
          type: 'call',
          date: call.createdAt,
          customer: call.customer,
          duration: call.duration ? formatDuration(call.duration) : undefined,
          status: (call.metadata as any)?.aiProcessed ? 'Traité' : 'En attente'
        });
      });
    }

    // Trier par date
    tickets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      tickets: tickets.slice(0, limit),
      total: tickets.length
    });

  } catch (error) {
    console.error('❌ Erreur recherche tickets:', error);
    return NextResponse.json({ error: 'Erreur recherche' }, { status: 500 });
  }
}