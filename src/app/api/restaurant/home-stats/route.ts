// ============================================================================
// API HOME STATS - Statistiques pour la page d'accueil
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // TODO: Récupérer l'utilisateur de la session
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    // }

    // Pour l'instant, on utilise un userId fixe pour tester
    const userId = request.headers.get('x-user-id') || 'test-user-id';
    
    // Récupérer le business et les stores de l'utilisateur
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
      include: {
        stores: {
          where: { isActive: true },
          select: { id: true, name: true }
        }
      }
    });

    if (!business) {
      // Retourner des données par défaut si pas de business
      return NextResponse.json({
        success: true,
        data: {
          revenue: { total: 0, growth: 0 },
          calls: { total: 0, growth: 0 },
          customers: { total: 0, growth: 0 },
          stores: { active: 0, growth: 0 }
        }
      });
    }

    const storeIds = business.stores.map(s => s.id);
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const lastWeekStart = startOfWeek(subDays(now, 7));
    const lastWeekEnd = endOfWeek(subDays(now, 7));

    // ============================================================================
    // REVENUS CE MOIS VS MOIS DERNIER
    // ============================================================================
    
    const [revenueThisMonth, revenueLastMonth] = await Promise.all([
      prisma.order.aggregate({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['completed', 'delivered'] }
        },
        _sum: { total: true }
      }),
      prisma.order.aggregate({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
          status: { in: ['completed', 'delivered'] }
        },
        _sum: { total: true }
      })
    ]);

    // ============================================================================
    // APPELS CETTE SEMAINE VS SEMAINE DERNIÈRE
    // ============================================================================
    
    const [callsThisWeek, callsLastWeek] = await Promise.all([
      prisma.call.count({
        where: {
          businessId: business.id,
          createdAt: { gte: weekStart, lte: weekEnd }
        }
      }),
      prisma.call.count({
        where: {
          businessId: business.id,
          createdAt: { gte: lastWeekStart, lte: lastWeekEnd }
        }
      })
    ]);

    // ============================================================================
    // CLIENTS TOTAL VS MOIS DERNIER
    // ============================================================================
    
    const [totalCustomers, customersLastMonth] = await Promise.all([
      prisma.customer.count({
        where: { businessId: business.id }
      }),
      prisma.customer.count({
        where: {
          businessId: business.id,
          createdAt: { lte: lastMonthEnd }
        }
      })
    ]);

    // ============================================================================
    // BOUTIQUES ACTIVES
    // ============================================================================
    
    const activeStores = business.stores.length;
    // Pour la croissance des boutiques, on peut compter les boutiques créées récemment
    const storesGrowth = 0; // TODO: Calculer la croissance des boutiques

    // ============================================================================
    // CALCUL DES CROISSANCES
    // ============================================================================
    
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const revenueGrowth = calculateGrowth(
      revenueThisMonth._sum.total || 0, 
      revenueLastMonth._sum.total || 0
    );

    const callsGrowth = calculateGrowth(callsThisWeek, callsLastWeek);

    const customersGrowth = calculateGrowth(totalCustomers, customersLastMonth);

    // ============================================================================
    // CONSTRUCTION RÉPONSE
    // ============================================================================
    
    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          total: Math.round(revenueThisMonth._sum.total || 0),
          growth: Math.round(revenueGrowth * 100) / 100
        },
        calls: {
          total: callsThisWeek,
          growth: Math.round(callsGrowth * 100) / 100
        },
        customers: {
          total: totalCustomers,
          growth: Math.round(customersGrowth * 100) / 100
        },
        stores: {
          active: activeStores,
          growth: storesGrowth
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur home stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}