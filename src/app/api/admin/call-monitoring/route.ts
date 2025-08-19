import { NextRequest, NextResponse } from 'next/server';
import { CallLimitsService } from '@/lib/services/callLimitsService';
import { redisService } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

// GET - Monitoring des appels en temps réel pour l'admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const businessId = searchParams.get('businessId');
    const overview = searchParams.get('overview') === 'true';

    // Vue d'ensemble globale
    if (overview) {
      return getGlobalCallOverview();
    }

    // Monitoring spécifique d'un store
    if (storeId) {
      return getStoreCallMonitoring(storeId);
    }

    // Monitoring spécifique d'un business
    if (businessId) {
      return getBusinessCallMonitoring(businessId);
    }

    return NextResponse.json({ 
      error: 'storeId, businessId ou overview=true requis' 
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Erreur monitoring appels:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}

// Vue d'ensemble globale de tous les appels
async function getGlobalCallOverview() {
  try {
    // Récupérer tous les stores actifs
    const activeStores = await prisma.store.findMany({
      where: { isActive: true },
      include: {
        business: {
          include: {
            subscription: {
              where: { isActive: true },
              take: 1
            }
          }
        }
      }
    });

    const globalStats = {
      totalStores: activeStores.length,
      totalActiveCalls: 0,
      totalQueued: 0,
      storeDetails: [] as any[],
      planBreakdown: {
        STARTER: { stores: 0, activeCalls: 0, queued: 0 },
        PRO: { stores: 0, activeCalls: 0, queued: 0 },
        BUSINESS: { stores: 0, activeCalls: 0, queued: 0 },
        ENTERPRISE: { stores: 0, activeCalls: 0, queued: 0 }
      }
    };

    // Traitement en parallèle pour les performances
    const storeStatsPromises = activeStores.map(async (store) => {
      try {
        const queueStatus = await CallLimitsService.getQueueStatus(store.id);
        const plan = store.business.subscription?.[0]?.plan || 'STARTER';

        const storeData = {
          storeId: store.id,
          storeName: store.name,
          businessName: store.business.name,
          plan: plan,
          activeCalls: queueStatus.activeCalls,
          maxConcurrent: queueStatus.maxConcurrent,
          queueSize: queueStatus.queueSize,
          maxQueue: queueStatus.maxQueue,
          utilizationPercent: Math.round((queueStatus.activeCalls / queueStatus.maxConcurrent) * 100),
          status: queueStatus.activeCalls >= queueStatus.maxConcurrent ? 'FULL' : 
                  queueStatus.activeCalls > 0 ? 'ACTIVE' : 'IDLE'
        };

        // Ajouter aux statistiques globales
        globalStats.totalActiveCalls += queueStatus.activeCalls;
        globalStats.totalQueued += queueStatus.queueSize;
        globalStats.planBreakdown[plan as keyof typeof globalStats.planBreakdown].stores++;
        globalStats.planBreakdown[plan as keyof typeof globalStats.planBreakdown].activeCalls += queueStatus.activeCalls;
        globalStats.planBreakdown[plan as keyof typeof globalStats.planBreakdown].queued += queueStatus.queueSize;

        return storeData;
      } catch (error) {
        console.error(`❌ Erreur stats store ${store.id}:`, error);
        return null;
      }
    });

    const storeDetails = (await Promise.all(storeStatsPromises)).filter(Boolean);
    globalStats.storeDetails = storeDetails;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      globalStats
    });

  } catch (error) {
    console.error('❌ Erreur vue d\'ensemble globale:', error);
    return NextResponse.json({ 
      error: 'Erreur récupération vue d\'ensemble' 
    }, { status: 500 });
  }
}

// Monitoring détaillé d'un store spécifique
async function getStoreCallMonitoring(storeId: string) {
  try {
    const queueStatus = await CallLimitsService.getQueueStatus(storeId);
    
    // Récupérer les détails des appels actifs
    const activeCalls = await prisma.call.findMany({
      where: {
        storeId: storeId,
        status: { in: ['INITIATED', 'ANSWERED'] }
      },
      include: {
        customer: true
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    // Récupérer les sessions Redis pour plus de détails
    const activeCallsWithSessions = await Promise.all(
      activeCalls.map(async (call) => {
        try {
          const session = await redisService.getCallSession(call.id);
          return {
            ...call,
            session: session ? {
              aiContext: session.aiContext,
              duration: Math.round((new Date().getTime() - new Date(session.startTime).getTime()) / 1000),
              conversationLength: session.aiContext?.conversation?.length || 0
            } : null
          };
        } catch {
          return { ...call, session: null };
        }
      })
    );

    return NextResponse.json({
      success: true,
      storeId,
      timestamp: new Date().toISOString(),
      queueStatus,
      activeCalls: activeCallsWithSessions,
      queueItems: queueStatus.queueItems.map((item: any) => ({
        ...item,
        waitTime: Math.round((new Date().getTime() - new Date(item.queuedAt).getTime()) / 1000)
      }))
    });

  } catch (error) {
    console.error(`❌ Erreur monitoring store ${storeId}:`, error);
    return NextResponse.json({ 
      error: 'Erreur monitoring store' 
    }, { status: 500 });
  }
}

// Monitoring d'un business (peut avoir plusieurs stores)
async function getBusinessCallMonitoring(businessId: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        stores: {
          where: { isActive: true }
        }
      }
    });

    if (!business) {
      return NextResponse.json({ 
        error: 'Business non trouvé' 
      }, { status: 404 });
    }

    // Récupérer le monitoring pour chaque store du business
    const storeMonitoringPromises = business.stores.map(store => 
      getStoreCallMonitoring(store.id).then(response => ({
        storeId: store.id,
        storeName: store.name,
        data: response
      }))
    );

    const storeMonitoring = await Promise.all(storeMonitoringPromises);

    return NextResponse.json({
      success: true,
      businessId,
      businessName: business.name,
      timestamp: new Date().toISOString(),
      stores: storeMonitoring
    });

  } catch (error) {
    console.error(`❌ Erreur monitoring business ${businessId}:`, error);
    return NextResponse.json({ 
      error: 'Erreur monitoring business' 
    }, { status: 500 });
  }
}

// POST - Actions d'administration sur les appels
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, storeId, callId, telnyxCallId } = body;

    switch (action) {
      case 'force_hangup':
        return await forceHangupCall(telnyxCallId);
        
      case 'clear_queue':
        return await clearQueue(storeId);
        
      case 'transfer_call':
        return await adminTransferCall(telnyxCallId, body.targetNumber);
        
      default:
        return NextResponse.json({ 
          error: 'Action non supportée' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Erreur action admin appels:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}

// Actions administratives
async function forceHangupCall(telnyxCallId: string) {
  try {
    // Utiliser l'API Telnyx pour raccrocher forcément
    const response = await fetch(`https://api.telnyx.com/v2/calls/${telnyxCallId}/actions/hangup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Appel raccroché par l\'administrateur' 
      });
    } else {
      throw new Error('Erreur API Telnyx');
    }

  } catch (error) {
    console.error('❌ Erreur raccrochage forcé:', error);
    return NextResponse.json({ 
      error: 'Erreur raccrochage forcé' 
    }, { status: 500 });
  }
}

async function clearQueue(storeId: string) {
  try {
    const queueKey = `call:queue:${storeId}`;
    await redisService.client.del(queueKey);

    return NextResponse.json({ 
      success: true, 
      message: 'Queue vidée par l\'administrateur' 
    });

  } catch (error) {
    console.error('❌ Erreur vidage queue:', error);
    return NextResponse.json({ 
      error: 'Erreur vidage queue' 
    }, { status: 500 });
  }
}

async function adminTransferCall(telnyxCallId: string, targetNumber: string) {
  try {
    const response = await fetch(`https://api.telnyx.com/v2/calls/${telnyxCallId}/actions/bridge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: targetNumber,
        timeout_secs: 30
      })
    });

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: `Appel transféré vers ${targetNumber}` 
      });
    } else {
      throw new Error('Erreur transfert API Telnyx');
    }

  } catch (error) {
    console.error('❌ Erreur transfert admin:', error);
    return NextResponse.json({ 
      error: 'Erreur transfert administratif' 
    }, { status: 500 });
  }
}