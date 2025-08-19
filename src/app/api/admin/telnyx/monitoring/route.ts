import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redisService } from '@/lib/redis';
import { stripeAutomation } from '@/lib/stripe-telnyx-automation';

// GET - Dashboard de monitoring Telnyx + IA
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d'; // 1d, 7d, 30d

    // ============================================================================
    // STATISTIQUES GÉNÉRALES
    // ============================================================================

    const [
      totalPhoneNumbers,
      activeNumbers,
      suspendedNumbers,
      totalCalls,
      activeCalls,
      totalBusinesses,
      activeBusinesses
    ] = await Promise.all([
      prisma.phoneNumber.count(),
      prisma.phoneNumber.count({ where: { status: 'ACTIVE' } }),
      prisma.phoneNumber.count({ where: { status: 'SUSPENDED' } }),
      prisma.call.count(),
      prisma.call.count({ where: { status: 'ACTIVE' } }),
      prisma.business.count(),
      prisma.business.count({ where: { subscriptionStatus: 'ACTIVE' } })
    ]);

    // ============================================================================
    // STATISTIQUES PAR PAYS
    // ============================================================================

    const numbersByCountry = await prisma.phoneNumber.groupBy({
      by: ['country', 'status'],
      _count: { id: true },
      orderBy: { country: 'asc' }
    });

    const countryStats = numbersByCountry.reduce((acc, item) => {
      if (!acc[item.country]) {
        acc[item.country] = { total: 0, active: 0, suspended: 0, error: 0 };
      }
      acc[item.country].total += item._count.id;
      acc[item.country][item.status.toLowerCase()] = item._count.id;
      return acc;
    }, {} as Record<string, any>);

    // ============================================================================
    // STATISTIQUES D'APPELS RÉCENTS
    // ============================================================================

    const now = new Date();
    const dateRanges = {
      '1d': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };

    const startDate = dateRanges[range] || dateRanges['7d'];

    const callStats = await prisma.call.groupBy({
      by: ['status'],
      where: {
        startTime: { gte: startDate }
      },
      _count: { id: true },
      _avg: { duration: true }
    });

    // Sessions IA actives depuis Redis
    const activeAISessions = await getActiveAISessionsCount();

    // ============================================================================
    // COÛTS ET REVENUS
    // ============================================================================

    const costAnalysis = await prisma.phoneNumber.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { monthlyPrice: true },
      _count: { id: true }
    });

    const paymentStatus = await stripeAutomation.getPaymentStatusReport();

    // ============================================================================
    // ERREURS ET ALERTES
    // ============================================================================

    const recentErrors = await prisma.phoneNumber.findMany({
      where: { 
        status: 'ERROR',
        createdAt: { gte: startDate }
      },
      include: { business: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const failedCalls = await prisma.call.count({
      where: {
        status: 'FAILED',
        startTime: { gte: startDate }
      }
    });

    // ============================================================================
    // PERFORMANCES IA
    // ============================================================================

    const aiSessions = await prisma.aIConversationSession.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: { id: true }
    });

    const aiPerformance = {
      totalSessions: aiSessions.reduce((sum, s) => sum + s._count.id, 0),
      activeSessions: aiSessions.find(s => s.status === 'ACTIVE')?._count.id || 0,
      completedSessions: aiSessions.find(s => s.status === 'COMPLETED')?._count.id || 0,
    };

    // ============================================================================
    // RÉPONSE COMPLÈTE
    // ============================================================================

    const response = {
      overview: {
        totalPhoneNumbers,
        activeNumbers,
        suspendedNumbers,
        totalCalls,
        activeCalls,
        totalBusinesses,
        activeBusinesses,
        activeAISessions
      },
      
      geography: {
        countries: Object.keys(countryStats).length,
        distribution: countryStats
      },
      
      calls: {
        range,
        stats: callStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = {
            count: stat._count.id,
            avgDuration: Math.round(stat._avg.duration || 0)
          };
          return acc;
        }, {} as Record<string, any>),
        failedCalls
      },
      
      ai: {
        ...aiPerformance,
        activeRedisSessions: activeAISessions
      },
      
      financial: {
        monthlyTelnyxCost: costAnalysis._sum.monthlyPrice || 0,
        activePhoneNumbers: costAnalysis._count.id || 0,
        paymentStatus
      },
      
      alerts: {
        recentErrors: recentErrors.map(error => ({
          id: error.id,
          number: error.number,
          businessName: error.business?.name,
          error: error.telnyxConfig?.error,
          createdAt: error.createdAt
        })),
        errorCount: recentErrors.length,
        failedCallsCount: failedCalls
      },
      
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erreur monitoring:', error);
    return NextResponse.json({ 
      error: 'Erreur récupération monitoring' 
    }, { status: 500 });
  }
}

// ============================================================================
// POST - Actions de maintenance
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, target } = body;

    switch (action) {
      case 'cleanup_expired_sessions':
        await redisService.cleanupExpiredSessions();
        return NextResponse.json({ success: true, message: 'Sessions expirées nettoyées' });

      case 'run_payment_checks':
        await stripeAutomation.runAutomatedChecks();
        return NextResponse.json({ success: true, message: 'Vérifications paiement lancées' });

      case 'suspend_business':
        if (!target) throw new Error('businessId requis');
        await stripeAutomation.handlePaymentFailed(target);
        return NextResponse.json({ success: true, message: `Business ${target} suspendu` });

      case 'reactivate_business':
        if (!target) throw new Error('businessId requis');
        await stripeAutomation.handlePaymentSuccess(target);
        return NextResponse.json({ success: true, message: `Business ${target} réactivé` });

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Erreur action monitoring:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erreur action' 
    }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getActiveAISessionsCount(): Promise<number> {
  try {
    await redisService.connect();
    const keys = await (redisService as any).client.keys('call:session:*');
    
    let activeCount = 0;
    for (const key of keys) {
      const session = await (redisService as any).client.get(key);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.status === 'active') {
          activeCount++;
        }
      }
    }
    
    return activeCount;
  } catch (error) {
    console.error('❌ Erreur comptage sessions Redis:', error);
    return 0;
  }
}