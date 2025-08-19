// ============================================================================
// API LIVE CALLS - Appels en temps réel
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redisService } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    // TODO: Auth check
    const userId = request.headers.get('x-user-id') || 'test-user-id';
    
    // Récupérer le business
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
      select: { id: true }
    });

    if (!business) {
      return NextResponse.json({
        success: true,
        data: {
          activeCalls: [],
          queuedCalls: [],
          recentCalls: [],
          stats: {
            activeCount: 0,
            queuedCount: 0,
            avgWaitTime: 0,
            avgCallDuration: 0
          }
        }
      });
    }

    // ============================================================================
    // APPELS ACTIFS (depuis Redis)
    // ============================================================================
    
    await redisService.connect();
    const activeCallIds = await redisService.getActiveCalls(business.id);
    
    const activeCalls = [];
    for (const callId of activeCallIds) {
      const session = await redisService.getCallSession(callId);
      if (session && session.status === 'active') {
        // Récupérer les détails depuis la DB
        const call = await prisma.call.findUnique({
          where: { id: callId },
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                status: true
              }
            }
          }
        });
        
        if (call) {
          activeCalls.push({
            id: call.id,
            customerName: call.customer 
              ? `${call.customer.firstName} ${call.customer.lastName}`.trim()
              : 'Client inconnu',
            customerPhone: call.customer?.phone || call.fromNumber,
            customerStatus: call.customer?.status || 'new',
            duration: Math.floor((Date.now() - new Date(call.createdAt).getTime()) / 1000),
            status: 'active',
            aiHandling: !session.aiContext?.conversation?.some(m => m.role === 'system' && m.content.includes('transfer')),
            sentiment: (session.metadata as any)?.sentiment || 'neutral'
          });
        }
      }
    }

    // ============================================================================
    // APPELS EN FILE D'ATTENTE (depuis Redis)
    // ============================================================================
    
    const queueKey = `call_queue:${business.id}`;
    const queuedCallsData = await redisService.client.zRange(queueKey, 0, -1);
    
    const queuedCalls = [];
    for (const queueData of queuedCallsData) {
      try {
        const queueItem = JSON.parse(queueData);
        queuedCalls.push({
          id: queueItem.callId,
          position: queueItem.position,
          estimatedWaitTime: queueItem.estimatedWaitTime,
          priority: queueItem.priority,
          queuedAt: queueItem.queuedAt
        });
      } catch (error) {
        console.error('Erreur parsing queue item:', error);
      }
    }

    // ============================================================================
    // APPELS RÉCENTS (dernières 24h)
    // ============================================================================
    
    const recentCalls = await prisma.call.findMany({
      where: {
        businessId: business.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            status: true
          }
        }
      }
    });

    const formattedRecentCalls = recentCalls.map(call => ({
      id: call.id,
      customerName: call.customer 
        ? `${call.customer.firstName} ${call.customer.lastName}`.trim()
        : 'Client inconnu',
      customerPhone: call.customer?.phone || call.fromNumber,
      customerStatus: call.customer?.status || 'new',
      duration: call.duration || 0,
      status: call.status,
      createdAt: call.createdAt,
      endedAt: call.endedAt,
      aiSummary: call.aiSummary,
      cost: call.cost || 0,
      metadata: call.metadata
    }));

    // ============================================================================
    // STATISTIQUES
    // ============================================================================
    
    // Temps d'attente moyen (appels en queue)
    const avgWaitTime = queuedCalls.length > 0
      ? queuedCalls.reduce((acc, call) => acc + call.estimatedWaitTime, 0) / queuedCalls.length
      : 0;

    // Durée moyenne des appels (dernières 24h)
    const callsWithDuration = recentCalls.filter(c => c.duration);
    const avgCallDuration = callsWithDuration.length > 0
      ? callsWithDuration.reduce((acc, call) => acc + (call.duration || 0), 0) / callsWithDuration.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        activeCalls,
        queuedCalls,
        recentCalls: formattedRecentCalls,
        stats: {
          activeCount: activeCalls.length,
          queuedCount: queuedCalls.length,
          avgWaitTime: Math.round(avgWaitTime),
          avgCallDuration: Math.round(avgCallDuration)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur live calls:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des appels' },
      { status: 500 }
    );
  }
}