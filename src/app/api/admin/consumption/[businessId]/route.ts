// ============================================================================
// API ADMIN CONSUMPTION DETAIL - Détails consommation par business/client
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { openaiTracking } from '@/lib/openai-tracking';
import { telnyxTracking } from '@/lib/telnyx-tracking';

// GET - Récupérer les détails de consommation pour un business spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;

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
    const period = searchParams.get('period') || new Date().toISOString().substring(0, 7);
    const storeId = searchParams.get('storeId');

    // Récupérer infos business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: { select: { email: true, firstName: true, lastName: true, createdAt: true } },
        stores: { 
          select: { 
            id: true, 
            name: true, 
            address: true, 
            country: true, 
            createdAt: true,
            isActive: true
          } 
        },
        phoneNumbers: { 
          select: { 
            id: true, 
            number: true, 
            country: true, 
            status: true, 
            monthlyPrice: true,
            purchaseDate: true
          } 
        }
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Business non trouvé' }, { status: 404 });
    }

    // Filtrer par store si spécifié
    const targetStores = storeId 
      ? business.stores.filter(s => s.id === storeId)
      : business.stores;

    // RÉSUMÉS MENSUELS PAR STORE
    const storeSummaries = await prisma.consumptionSummary.findMany({
      where: {
        businessId,
        period,
        ...(storeId && { storeId })
      },
      include: {
        store: { select: { name: true, address: true, country: true } }
      }
    });

    // DÉTAILS OPENAI RÉCENTS
    const recentOpenAIUsage = await openaiTracking.getDetailedUsage({
      businessId,
      ...(storeId && { storeId }),
      startDate: new Date(period + '-01'),
      endDate: new Date(new Date(period + '-01').setMonth(new Date(period + '-01').getMonth() + 1)),
      limit: 50
    });

    // DÉTAILS TELNYX RÉCENTS  
    const recentTelnyxUsage = await telnyxTracking.getDetailedUsage({
      businessId,
      ...(storeId && { storeId }),
      startDate: new Date(period + '-01'),
      endDate: new Date(new Date(period + '-01').setMonth(new Date(period + '-01').getMonth() + 1)),
      limit: 50
    });

    // TOP OPÉRATIONS OPENAI LES PLUS COÛTEUSES
    const topOpenAIOperations = await openaiTracking.getTopExpensiveOperations(businessId, 30);

    // STATISTIQUES GLOBALES BUSINESS
    const globalStats = await prisma.consumptionSummary.aggregate({
      where: { businessId, period },
      _sum: {
        openaiTotalCost: true,
        openaiTotalCalls: true,
        openaiTotalTokens: true,
        telnyxTotalCost: true,
        telnyxTotalCalls: true,
        telnyxTotalDuration: true,
        telnyxNumbersCost: true,
        totalCost: true
      }
    });

    // ÉVOLUTION 6 DERNIERS MOIS
    const evolutionData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthPeriod = monthDate.toISOString().substring(0, 7);
      
      const monthStats = await prisma.consumptionSummary.aggregate({
        where: { businessId, period: monthPeriod },
        _sum: {
          openaiTotalCost: true,
          telnyxTotalCost: true,
          totalCost: true
        }
      });
      
      evolutionData.push({
        period: monthPeriod,
        openaiCost: monthStats._sum.openaiTotalCost || 0,
        telnyxCost: monthStats._sum.telnyxTotalCost || 0,
        totalCost: monthStats._sum.totalCost || 0
      });
    }

    // RÉPARTITION PAR STORE
    const storeBreakdown = storeSummaries.map(summary => ({
      storeId: summary.storeId,
      storeName: summary.store.name,
      storeCountry: summary.store.country,
      totalCost: summary.totalCost,
      openaiCost: summary.openaiTotalCost,
      telnyxCost: summary.telnyxTotalCost,
      percentageOfTotal: globalStats._sum.totalCost 
        ? (summary.totalCost / globalStats._sum.totalCost) * 100 
        : 0
    }));

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        type: business.type,
        createdAt: business.createdAt,
        owner: {
          email: business.owner.email,
          name: `${business.owner.firstName || ''} ${business.owner.lastName || ''}`.trim(),
          memberSince: business.owner.createdAt
        }
      },
      period,
      globalStats: {
        totalCost: globalStats._sum.totalCost || 0,
        openai: {
          totalCalls: globalStats._sum.openaiTotalCalls || 0,
          totalTokens: globalStats._sum.openaiTotalTokens || 0,
          totalCost: globalStats._sum.openaiTotalCost || 0
        },
        telnyx: {
          totalCalls: globalStats._sum.telnyxTotalCalls || 0,
          totalDuration: globalStats._sum.telnyxTotalDuration || 0,
          totalCost: globalStats._sum.telnyxTotalCost || 0,
          numbersCost: globalStats._sum.telnyxNumbersCost || 0
        }
      },
      stores: targetStores.map(store => ({
        ...store,
        summary: storeSummaries.find(s => s.storeId === store.id)
      })),
      phoneNumbers: business.phoneNumbers,
      evolutionData,
      storeBreakdown,
      topOpenAIOperations,
      recentActivity: {
        openaiUsage: recentOpenAIUsage,
        telnyxUsage: recentTelnyxUsage
      }
    });

  } catch (error) {
    console.error('Error fetching business consumption details:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}