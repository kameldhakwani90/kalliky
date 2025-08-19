// ============================================================================
// API DASHBOARD STATS - Statistiques temps réel pour le dashboard
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

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
        },
        subscriptions: true
      }
    });

    if (!business) {
      // Retourner des données par défaut si pas de business
      return NextResponse.json({
        success: true,
        data: {
          metrics: {
            revenue: { today: 0, growth: 0, yesterday: 0 },
            orders: { today: 0, growth: 0, yesterday: 0 },
            calls: { today: 0, growth: 0, yesterday: 0 },
            customers: { total: 0, new: 0, returning: 0 },
            avgOrderValue: { value: 0, growth: 0 },
            conversionRate: { value: 0, growth: 0 }
          },
          recentActivity: [],
          topProducts: [],
          revenueChart: [],
          callsChart: [],
          peakHours: [],
          customerSegments: { new: 0, regular: 0, vip: 0 },
          aiPerformance: {
            totalCalls: 0,
            resolvedByAI: 0,
            transferredToHuman: 0,
            avgResponseTime: 0,
            satisfactionScore: 0
          }
        }
      });
    }

    const storeIds = business.stores.map(s => s.id);
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const yesterdayEnd = endOfDay(subDays(now, 1));
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // ============================================================================
    // MÉTRIQUES PRINCIPALES
    // ============================================================================
    
    // Revenus aujourd'hui et hier
    const [revenueToday, revenueYesterday] = await Promise.all([
      prisma.order.aggregate({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { in: ['completed', 'delivered'] }
        },
        _sum: { total: true }
      }),
      prisma.order.aggregate({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          status: { in: ['completed', 'delivered'] }
        },
        _sum: { total: true }
      })
    ]);

    // Commandes aujourd'hui et hier
    const [ordersToday, ordersYesterday] = await Promise.all([
      prisma.order.count({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: todayStart, lte: todayEnd }
        }
      }),
      prisma.order.count({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd }
        }
      })
    ]);

    // Appels aujourd'hui et hier
    const [callsToday, callsYesterday] = await Promise.all([
      prisma.call.count({
        where: {
          businessId: business.id,
          createdAt: { gte: todayStart, lte: todayEnd }
        }
      }),
      prisma.call.count({
        where: {
          businessId: business.id,
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd }
        }
      })
    ]);

    // Clients (total, nouveaux, fidèles)
    const [totalCustomers, newCustomersToday, returningCustomers] = await Promise.all([
      prisma.customer.count({
        where: { businessId: business.id }
      }),
      prisma.customer.count({
        where: {
          businessId: business.id,
          createdAt: { gte: todayStart, lte: todayEnd }
        }
      }),
      prisma.customer.count({
        where: {
          businessId: business.id,
          orderCount: { gte: 2 }
        }
      })
    ]);

    // Panier moyen
    const avgOrderValue = ordersToday > 0 
      ? (revenueToday._sum.total || 0) / ordersToday
      : 0;
    
    const avgOrderValueYesterday = ordersYesterday > 0
      ? (revenueYesterday._sum.total || 0) / ordersYesterday
      : 0;

    // Taux de conversion (appels -> commandes)
    const conversionRate = callsToday > 0
      ? (ordersToday / callsToday) * 100
      : 0;
    
    const conversionRateYesterday = callsYesterday > 0
      ? (ordersYesterday / callsYesterday) * 100
      : 0;

    // ============================================================================
    // ACTIVITÉ RÉCENTE
    // ============================================================================
    
    const recentActivity = await prisma.activityLog.findMany({
      where: { storeId: { in: storeIds } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        store: { select: { name: true } }
      }
    });

    // ============================================================================
    // TOP PRODUITS
    // ============================================================================
    
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          storeId: { in: storeIds },
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      },
      _count: { productId: true },
      _sum: { total: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5
    });

    // Récupérer les détails des produits
    const productDetails = await prisma.product.findMany({
      where: { id: { in: topProducts.map(p => p.productId).filter(Boolean) as string[] } },
      select: { id: true, name: true, category: true }
    });

    const topProductsWithDetails = topProducts.map(p => {
      const product = productDetails.find(pd => pd.id === p.productId);
      return {
        id: p.productId,
        name: product?.name || 'Produit supprimé',
        category: product?.category || 'Non catégorisé',
        quantity: p._count.productId,
        revenue: p._sum.total || 0
      };
    });

    // ============================================================================
    // GRAPHIQUES REVENUS (7 derniers jours)
    // ============================================================================
    
    const revenueChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayRevenue = await prisma.order.aggregate({
        where: {
          storeId: { in: storeIds },
          createdAt: { gte: dayStart, lte: dayEnd },
          status: { in: ['completed', 'delivered'] }
        },
        _sum: { total: true }
      });
      
      revenueChart.push({
        date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        revenue: dayRevenue._sum.total || 0
      });
    }

    // ============================================================================
    // GRAPHIQUES APPELS (7 derniers jours)
    // ============================================================================
    
    const callsChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayCalls = await prisma.call.count({
        where: {
          businessId: business.id,
          createdAt: { gte: dayStart, lte: dayEnd }
        }
      });
      
      callsChart.push({
        date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        calls: dayCalls
      });
    }

    // ============================================================================
    // HEURES DE POINTE (dernières 24h)
    // ============================================================================
    
    const peakHours = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourOrders = await prisma.order.count({
        where: {
          storeId: { in: storeIds },
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour + 1, 0)
          }
        }
      });
      
      peakHours.push({
        hour: `${hour}h`,
        orders: hourOrders
      });
    }

    // ============================================================================
    // SEGMENTS CLIENTS
    // ============================================================================
    
    const [newCustomers, regularCustomers, vipCustomers] = await Promise.all([
      prisma.customer.count({
        where: {
          businessId: business.id,
          orderCount: { lte: 1 }
        }
      }),
      prisma.customer.count({
        where: {
          businessId: business.id,
          orderCount: { gte: 2, lte: 5 }
        }
      }),
      prisma.customer.count({
        where: {
          businessId: business.id,
          orderCount: { gte: 6 }
        }
      })
    ]);

    // ============================================================================
    // PERFORMANCE IA
    // ============================================================================
    
    const [totalAICalls, resolvedByAI, transferredToHuman] = await Promise.all([
      prisma.call.count({
        where: {
          businessId: business.id,
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      prisma.call.count({
        where: {
          businessId: business.id,
          createdAt: { gte: monthStart, lte: monthEnd },
          status: 'completed',
          metadata: {
            path: ['transferredToHuman'],
            equals: false
          }
        }
      }),
      prisma.call.count({
        where: {
          businessId: business.id,
          createdAt: { gte: monthStart, lte: monthEnd },
          metadata: {
            path: ['transferredToHuman'],
            equals: true
          }
        }
      })
    ]);

    // Temps de réponse moyen IA
    const aiSessions = await prisma.aIConversationSession.findMany({
      where: {
        businessId: business.id,
        createdAt: { gte: monthStart, lte: monthEnd }
      },
      select: {
        startedAt: true,
        endedAt: true
      }
    });

    const avgResponseTime = aiSessions.length > 0
      ? aiSessions.reduce((acc, session) => {
          if (session.endedAt) {
            const duration = (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000;
            return acc + duration;
          }
          return acc;
        }, 0) / aiSessions.length
      : 0;

    // ============================================================================
    // CALCUL DES CROISSANCES
    // ============================================================================
    
    const calculateGrowth = (today: number, yesterday: number) => {
      if (yesterday === 0) return today > 0 ? 100 : 0;
      return ((today - yesterday) / yesterday) * 100;
    };

    // ============================================================================
    // CONSTRUCTION RÉPONSE
    // ============================================================================
    
    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          revenue: {
            today: revenueToday._sum.total || 0,
            growth: calculateGrowth(revenueToday._sum.total || 0, revenueYesterday._sum.total || 0),
            yesterday: revenueYesterday._sum.total || 0
          },
          orders: {
            today: ordersToday,
            growth: calculateGrowth(ordersToday, ordersYesterday),
            yesterday: ordersYesterday
          },
          calls: {
            today: callsToday,
            growth: calculateGrowth(callsToday, callsYesterday),
            yesterday: callsYesterday
          },
          customers: {
            total: totalCustomers,
            new: newCustomersToday,
            returning: returningCustomers
          },
          avgOrderValue: {
            value: avgOrderValue,
            growth: calculateGrowth(avgOrderValue, avgOrderValueYesterday)
          },
          conversionRate: {
            value: conversionRate,
            growth: calculateGrowth(conversionRate, conversionRateYesterday)
          }
        },
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          amount: activity.amount,
          store: activity.store.name,
          createdAt: activity.createdAt
        })),
        topProducts: topProductsWithDetails,
        revenueChart,
        callsChart,
        peakHours,
        customerSegments: {
          new: newCustomers,
          regular: regularCustomers,
          vip: vipCustomers
        },
        aiPerformance: {
          totalCalls: totalAICalls,
          resolvedByAI,
          transferredToHuman,
          avgResponseTime: Math.round(avgResponseTime),
          satisfactionScore: 4.5 // TODO: Calculer depuis les feedbacks
        },
        subscription: {
          plan: business.subscriptions?.[0]?.plan || 'FREE',
          status: business.subscriptions?.[0]?.status || 'inactive'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur dashboard stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}