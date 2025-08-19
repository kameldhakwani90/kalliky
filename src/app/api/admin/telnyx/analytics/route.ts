import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redisService } from '@/lib/redis';

// GET - Analytics détaillées des appels et performances IA
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const range = searchParams.get('range') || '30d';
    const metric = searchParams.get('metric') || 'calls'; // calls, ai, revenue

    // Calcul des dates
    const now = new Date();
    const dateRanges = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };
    const startDate = dateRanges[range] || dateRanges['30d'];

    switch (metric) {
      case 'calls':
        return NextResponse.json(await getCallAnalytics(businessId, startDate));
      
      case 'ai':
        return NextResponse.json(await getAIAnalytics(businessId, startDate));
      
      case 'revenue':
        return NextResponse.json(await getRevenueAnalytics(businessId, startDate));
      
      case 'performance':
        return NextResponse.json(await getPerformanceAnalytics(businessId, startDate));
      
      default:
        return NextResponse.json(await getOverallAnalytics(businessId, startDate));
    }

  } catch (error) {
    console.error('❌ Erreur analytics:', error);
    return NextResponse.json({ 
      error: 'Erreur récupération analytics' 
    }, { status: 500 });
  }
}

// ============================================================================
// ANALYTICS DES APPELS
// ============================================================================

async function getCallAnalytics(businessId: string | null, startDate: Date) {
  const whereClause = {
    startTime: { gte: startDate },
    ...(businessId && { businessId })
  };

  // Statistiques générales
  const [totalCalls, callsByStatus, callsByHour, avgDuration] = await Promise.all([
    prisma.call.count({ where: whereClause }),
    
    prisma.call.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true }
    }),
    
    prisma.$queryRaw`
      SELECT 
        EXTRACT(hour FROM "startTime") as hour,
        COUNT(*) as calls,
        AVG("duration") as avg_duration
      FROM "Call" 
      WHERE "startTime" >= ${startDate}
      ${businessId ? prisma.$queryRaw`AND "businessId" = ${businessId}` : prisma.$queryRaw``}
      GROUP BY EXTRACT(hour FROM "startTime")
      ORDER BY hour
    `,
    
    prisma.call.aggregate({
      where: { ...whereClause, duration: { not: null } },
      _avg: { duration: true }
    })
  ]);

  // Appels par jour
  const callsByDay = await prisma.$queryRaw`
    SELECT 
      DATE("startTime") as date,
      COUNT(*) as calls,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
      AVG("duration") as avg_duration
    FROM "Call"
    WHERE "startTime" >= ${startDate}
    ${businessId ? prisma.$queryRaw`AND "businessId" = ${businessId}` : prisma.$queryRaw``}
    GROUP BY DATE("startTime")
    ORDER BY date
  `;

  // Top businesses (si pas de businessId spécifique)
  const topBusinesses = businessId ? [] : await prisma.call.groupBy({
    by: ['businessId'],
    where: whereClause,
    _count: { id: true },
    _avg: { duration: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  });

  return {
    summary: {
      totalCalls,
      avgDuration: Math.round(avgDuration._avg.duration || 0),
      statusDistribution: callsByStatus.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count.id;
        return acc;
      }, {} as Record<string, number>)
    },
    timeline: {
      daily: callsByDay,
      hourly: callsByHour
    },
    topBusinesses: await enrichBusinessData(topBusinesses),
    period: { startDate, endDate: new Date() }
  };
}

// ============================================================================
// ANALYTICS IA
// ============================================================================

async function getAIAnalytics(businessId: string | null, startDate: Date) {
  const whereClause = {
    createdAt: { gte: startDate },
    ...(businessId && { businessId })
  };

  // Statistiques sessions IA
  const [totalSessions, sessionsByStatus, avgSessionLength] = await Promise.all([
    prisma.aIConversationSession.count({ where: whereClause }),
    
    prisma.aIConversationSession.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true }
    }),
    
    prisma.$queryRaw`
      SELECT AVG(
        EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))
      ) as avg_seconds
      FROM "AIConversationSession"
      WHERE "createdAt" >= ${startDate}
      ${businessId ? prisma.$queryRaw`AND "businessId" = ${businessId}` : prisma.$queryRaw``}
      AND "status" = 'COMPLETED'
    `
  ]);

  // Analyse des intents les plus fréquents
  const intentAnalysis = await prisma.$queryRaw`
    SELECT 
      "extractedData"->>'intent' as intent,
      COUNT(*) as count,
      AVG(
        CASE 
          WHEN "extractedData"->>'satisfaction' IS NOT NULL 
          THEN CAST("extractedData"->>'satisfaction' AS FLOAT)
          ELSE NULL 
        END
      ) as avg_satisfaction
    FROM "AIConversationSession"
    WHERE "createdAt" >= ${startDate}
    ${businessId ? prisma.$queryRaw`AND "businessId" = ${businessId}` : prisma.$queryRaw``}
    AND "extractedData"->>'intent' IS NOT NULL
    GROUP BY "extractedData"->>'intent'
    ORDER BY count DESC
    LIMIT 10
  `;

  // Performance par langue
  const languageStats = await prisma.aIConversationSession.groupBy({
    by: ['language'],
    where: whereClause,
    _count: { id: true },
    _avg: { id: true } // Placeholder pour calcul satisfaction
  });

  return {
    summary: {
      totalSessions,
      avgSessionLength: avgSessionLength[0]?.avg_seconds || 0,
      statusDistribution: sessionsByStatus.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count.id;
        return acc;
      }, {} as Record<string, number>)
    },
    intents: intentAnalysis,
    languages: languageStats,
    period: { startDate, endDate: new Date() }
  };
}

// ============================================================================
// ANALYTICS REVENUS
// ============================================================================

async function getRevenueAnalytics(businessId: string | null, startDate: Date) {
  const whereClause = {
    createdAt: { gte: startDate },
    ...(businessId && { businessId })
  };

  // Coûts des numéros de téléphone
  const phoneNumberCosts = await prisma.phoneNumber.aggregate({
    where: { 
      ...whereClause,
      status: { in: ['ACTIVE', 'SUSPENDED'] }
    },
    _sum: { monthlyPrice: true },
    _count: { id: true }
  });

  // Revenus par pays
  const revenueByCountry = await prisma.phoneNumber.groupBy({
    by: ['country'],
    where: whereClause,
    _sum: { monthlyPrice: true },
    _count: { id: true },
    orderBy: { _sum: { monthlyPrice: 'desc' } }
  });

  // Évolution mensuelle des coûts
  const monthlyCosts = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "createdAt") as month,
      SUM("monthlyPrice") as total_cost,
      COUNT(*) as phone_numbers
    FROM "PhoneNumber"
    WHERE "createdAt" >= ${startDate}
    ${businessId ? prisma.$queryRaw`AND "businessId" = ${businessId}` : prisma.$queryRaw``}
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month
  `;

  return {
    summary: {
      totalMonthlyCost: phoneNumberCosts._sum.monthlyPrice || 0,
      activeNumbers: phoneNumberCosts._count.id || 0,
      avgCostPerNumber: phoneNumberCosts._count.id > 0 
        ? (phoneNumberCosts._sum.monthlyPrice || 0) / phoneNumberCosts._count.id 
        : 0
    },
    geography: revenueByCountry,
    timeline: monthlyCosts,
    period: { startDate, endDate: new Date() }
  };
}

// ============================================================================
// ANALYTICS PERFORMANCE
// ============================================================================

async function getPerformanceAnalytics(businessId: string | null, startDate: Date) {
  // Taux de réussite des appels
  const callSuccessRate = await prisma.$queryRaw`
    SELECT 
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
      COUNT(*) as total,
      ROUND(
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100, 
        2
      ) as success_rate
    FROM "Call"
    WHERE "startTime" >= ${startDate}
    ${businessId ? prisma.$queryRaw`AND "businessId" = ${businessId}` : prisma.$queryRaw``}
  `;

  // Performance IA
  const aiPerformance = await prisma.$queryRaw`
    SELECT 
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_sessions,
      COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_sessions,
      COUNT(*) as total_sessions,
      AVG(
        CASE 
          WHEN "extractedData"->>'satisfaction' IS NOT NULL 
          THEN CAST("extractedData"->>'satisfaction' AS FLOAT)
          ELSE NULL 
        END
      ) as avg_satisfaction
    FROM "AIConversationSession"
    WHERE "createdAt" >= ${startDate}
    ${businessId ? prisma.$queryRaw`AND "businessId" = ${businessId}` : prisma.$queryRaw``}
  `;

  // Temps de réponse moyen (Redis)
  const responseTimeStats = await getResponseTimeStats(businessId);

  return {
    calls: callSuccessRate[0] || {},
    ai: aiPerformance[0] || {},
    responseTime: responseTimeStats,
    period: { startDate, endDate: new Date() }
  };
}

// ============================================================================
// ANALYTICS GLOBALES
// ============================================================================

async function getOverallAnalytics(businessId: string | null, startDate: Date) {
  const [calls, ai, revenue, performance] = await Promise.all([
    getCallAnalytics(businessId, startDate),
    getAIAnalytics(businessId, startDate),
    getRevenueAnalytics(businessId, startDate),
    getPerformanceAnalytics(businessId, startDate)
  ]);

  return {
    calls: calls.summary,
    ai: ai.summary,
    revenue: revenue.summary,
    performance,
    period: { startDate, endDate: new Date() }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function enrichBusinessData(businesses: any[]) {
  if (businesses.length === 0) return [];

  const businessIds = businesses.map(b => b.businessId);
  const businessData = await prisma.business.findMany({
    where: { id: { in: businessIds } },
    select: { id: true, name: true, businessCategory: true }
  });

  return businesses.map(business => ({
    ...business,
    business: businessData.find(b => b.id === business.businessId)
  }));
}

async function getResponseTimeStats(businessId: string | null) {
  try {
    // Statistiques basiques depuis Redis si disponible
    return {
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0
    };
  } catch (error) {
    console.error('❌ Erreur stats temps de réponse:', error);
    return {
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0
    };
  }
}