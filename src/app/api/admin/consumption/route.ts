// ============================================================================
// API ADMIN CONSUMPTION - Récupération métriques consommation pour superadmin
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { openaiTracking } from '@/lib/openai-tracking';
import { telnyxTracking } from '@/lib/telnyx-tracking';

// GET - Récupérer les métriques globales de consommation
export async function GET(request: NextRequest) {
  try {
    // Vérifier authentification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Vérifier que c'est un super admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || new Date().toISOString().substring(0, 7); // "2025-01"
    const businessId = searchParams.get('businessId');
    const storeId = searchParams.get('storeId');
    const limit = parseInt(searchParams.get('limit') || '0'); // 0 = tous les clients
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // MÉTRIQUES GLOBALES POUR LA PÉRIODE
    const whereClause: any = {};
    if (businessId) whereClause.businessId = businessId;
    if (storeId) whereClause.storeId = storeId;
    
    const startDate = new Date(period + '-01');
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Récupérer résumés mensuels
    const summaries = await prisma.consumptionSummary.findMany({
      where: {
        ...whereClause,
        period
      },
      include: {
        business: { 
          select: { 
            name: true,
            owner: { select: { email: true, firstName: true, lastName: true } }
          } 
        },
        store: { select: { name: true, address: true, country: true } }
      },
      orderBy: { totalCost: 'desc' }
    });

    // Calculer totaux globaux
    const globalTotals = summaries.reduce((acc, summary) => ({
      totalClients: acc.totalClients + 1,
      totalStores: acc.totalStores + 1,
      totalOpenAICost: acc.totalOpenAICost + summary.openaiTotalCost,
      totalOpenAICalls: acc.totalOpenAICalls + summary.openaiTotalCalls,
      totalOpenAITokens: acc.totalOpenAITokens + summary.openaiTotalTokens,
      totalTelnyxCost: acc.totalTelnyxCost + summary.telnyxTotalCost,
      totalTelnyxCalls: acc.totalTelnyxCalls + summary.telnyxTotalCalls,
      totalTelnyxDuration: acc.totalTelnyxDuration + summary.telnyxTotalDuration,
      totalNumbersCost: acc.totalNumbersCost + summary.telnyxNumbersCost,
      grandTotal: acc.grandTotal + summary.totalCost
    }), {
      totalClients: 0,
      totalStores: 0,
      totalOpenAICost: 0,
      totalOpenAICalls: 0,
      totalOpenAITokens: 0,
      totalTelnyxCost: 0,
      totalTelnyxCalls: 0,
      totalTelnyxDuration: 0,
      totalNumbersCost: 0,
      grandTotal: 0
    });

    // TOUS LES CLIENTS AVEC PAGINATION
    const allClientsData = summaries
      .reduce((acc, summary) => {
        const existing = acc.find(client => client.businessId === summary.businessId);
        if (existing) {
          existing.totalCost += summary.totalCost;
          existing.openaiCost += summary.openaiTotalCost;
          existing.telnyxCost += summary.telnyxTotalCost;
          existing.storesCount += 1;
        } else {
          acc.push({
            businessId: summary.businessId,
            businessName: summary.business.name,
            ownerEmail: summary.business.owner.email,
            ownerName: `${summary.business.owner.firstName || ''} ${summary.business.owner.lastName || ''}`.trim(),
            totalCost: summary.totalCost,
            openaiCost: summary.openaiTotalCost,
            telnyxCost: summary.telnyxTotalCost,
            storesCount: 1
          });
        }
        return acc;
      }, [] as any[])
      .sort((a, b) => b.totalCost - a.totalCost);

    // Appliquer limite et pagination
    const totalClients = allClientsData.length;
    let allClients = allClientsData;

    if (limit > 0) {
      // Mode limite (ex: Top 10, Top 20)
      allClients = allClientsData.slice(0, limit);
    } else {
      // Mode pagination pour tous les clients
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      allClients = allClientsData.slice(startIndex, endIndex);
    }

    // Garder les anciens "topClients" pour compatibilité
    const topClients = allClientsData.slice(0, 10);

    // ÉVOLUTION SUR LES 6 DERNIERS MOIS
    const evolutionMonths = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthPeriod = monthDate.toISOString().substring(0, 7);
      
      const monthSummaries = await prisma.consumptionSummary.aggregate({
        where: {
          ...whereClause,
          period: monthPeriod
        },
        _sum: {
          openaiTotalCost: true,
          telnyxTotalCost: true,
          totalCost: true
        },
        _count: { id: true }
      });
      
      evolutionMonths.push({
        period: monthPeriod,
        openaiCost: monthSummaries._sum.openaiTotalCost || 0,
        telnyxCost: monthSummaries._sum.telnyxTotalCost || 0,
        totalCost: monthSummaries._sum.totalCost || 0,
        storesCount: monthSummaries._count
      });
    }

    // ALERTES - Clients dépassant seuils
    const highUsageAlerts = summaries
      .filter(summary => summary.totalCost > 50) // Seuil 50€/mois
      .map(summary => ({
        businessName: summary.business.name,
        storeName: summary.store.name,
        totalCost: summary.totalCost,
        openaiCost: summary.openaiTotalCost,
        telnyxCost: summary.telnyxTotalCost,
        alertLevel: summary.totalCost > 100 ? 'high' : 'medium'
      }));

    return NextResponse.json({
      period,
      globalTotals,
      topClients,
      evolutionMonths,
      highUsageAlerts,
      detailedSummaries: summaries.map(summary => ({
        storeId: summary.storeId,
        storeName: summary.store.name,
        storeCountry: summary.store.country,
        businessId: summary.businessId,
        businessName: summary.business.name,
        ownerEmail: summary.business.owner.email,
        totalCost: summary.totalCost,
        openai: {
          totalCalls: summary.openaiTotalCalls,
          totalTokens: summary.openaiTotalTokens,
          totalCost: summary.openaiTotalCost,
          avgCostPerCall: summary.openaiAvgCostPerCall
        },
        telnyx: {
          totalCalls: summary.telnyxTotalCalls,
          totalDuration: summary.telnyxTotalDuration,
          totalCost: summary.telnyxTotalCost,
          numbersCost: summary.telnyxNumbersCost,
          avgCostPerCall: summary.telnyxAvgCostPerCall
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching consumption metrics:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Générer/régénérer les résumés de consommation pour une période
export async function POST(request: NextRequest) {
  try {
    // Vérifier authentification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Vérifier que c'est un super admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const { period } = await request.json();
    const targetPeriod = period || new Date().toISOString().substring(0, 7);

    console.log(`🔄 Régénération résumés consommation pour ${targetPeriod}`);

    // Récupérer toutes les boutiques avec leurs business
    const stores = await prisma.store.findMany({
      select: { id: true, businessId: true }
    });

    let processed = 0;
    
    // Régénérer résumé pour chaque boutique
    for (const store of stores) {
      try {
        // Forcer mise à jour via les services de tracking
        await openaiTracking.updateMonthlySummary(store.id, store.businessId);
        await telnyxTracking.updateMonthlySummary(store.id, store.businessId);
        processed++;
      } catch (error) {
        console.error(`❌ Erreur régénération ${store.id}:`, error);
      }
    }

    console.log(`✅ ${processed}/${stores.length} résumés régénérés`);

    return NextResponse.json({ 
      success: true, 
      processed, 
      total: stores.length,
      period: targetPeriod 
    });

  } catch (error) {
    console.error('Error regenerating consumption summaries:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}