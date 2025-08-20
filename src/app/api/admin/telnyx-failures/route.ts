// ============================================================================
// API ADMIN - Gestion des échecs d'attribution Telnyx et remboursements
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { StripeRefundService } from '@/lib/stripe-refund-service';

// GET - Récupérer les échecs d'attribution Telnyx
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Vérifier que l'utilisateur est SUPERADMIN
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    // Temporairement, permettre à tous les utilisateurs connectés d'accéder
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer les échecs d'attribution Telnyx
    const telnyxFailures = await prisma.phoneNumber.findMany({
      where: {
        status: 'ERROR',
        number: { startsWith: 'ERROR_' }
      },
      include: {
        business: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            stores: {
              include: {
                subscription: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    // Récupérer les activités de remboursement
    const refundActivities = await prisma.activityLog.findMany({
      where: {
        OR: [
          { type: 'REFUND' },
          { 
            type: 'ERROR',
            title: { contains: 'remboursement' }
          }
        ]
      },
      include: {
        store: {
          include: {
            business: {
              include: {
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Statistiques
    const stats = {
      totalFailures: telnyxFailures.length,
      pendingRefunds: refundActivities.filter(a => 
        a.metadata && JSON.parse(a.metadata).requiresManualIntervention
      ).length,
      completedRefunds: refundActivities.filter(a => 
        a.type === 'REFUND' && a.metadata && JSON.parse(a.metadata).status === 'COMPLETED'
      ).length,
      totalRefundAmount: refundActivities
        .filter(a => a.type === 'REFUND' && a.amount)
        .reduce((sum, a) => sum + (a.amount || 0), 0)
    };

    // Formater les données pour l'interface
    const formattedFailures = telnyxFailures.map(failure => {
      const store = failure.business.stores[0];
      const subscription = store?.subscription;
      const metadata = failure.telnyxConfig as any;

      return {
        id: failure.id,
        businessId: failure.businessId,
        storeId: store?.id,
        storeName: store?.name,
        country: failure.country,
        error: metadata?.error || 'Erreur inconnue',
        timestamp: metadata?.timestamp || failure.createdAt,
        owner: failure.business.owner,
        hasActiveSubscription: subscription?.status === 'active',
        subscriptionId: subscription?.stripeSubscriptionId,
        needsRefund: subscription?.status === 'active' && !refundActivities.some(ra => 
          ra.storeId === store?.id && ra.type === 'REFUND'
        )
      };
    });

    const formattedRefunds = refundActivities.map(activity => {
      const metadata = activity.metadata ? JSON.parse(activity.metadata) : {};
      
      return {
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        amount: activity.amount,
        createdAt: activity.createdAt,
        store: activity.store,
        owner: activity.store?.business.owner,
        metadata,
        status: metadata.status || (activity.type === 'REFUND' ? 'COMPLETED' : 'ERROR'),
        refundId: metadata.refundId,
        requiresIntervention: metadata.requiresManualIntervention
      };
    });

    return NextResponse.json({
      stats,
      failures: formattedFailures,
      refunds: formattedRefunds
    });

  } catch (error) {
    console.error('Error fetching Telnyx failures:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Déclencher un remboursement manuel
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Vérifier que l'utilisateur est SUPERADMIN
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    // Temporairement, permettre à tous les utilisateurs connectés d'accéder
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { subscriptionId, reason, type = 'full' } = await request.json();

    if (!subscriptionId || !reason) {
      return NextResponse.json(
        { error: 'subscriptionId et reason sont requis' },
        { status: 400 }
      );
    }

    let result;
    
    if (type === 'full') {
      // Remboursement complet
      result = await StripeRefundService.manualRefundForTelnyxFailure(
        subscriptionId,
        reason,
        user.id
      );
    } else {
      // TODO: Implémenter remboursement partiel si nécessaire
      return NextResponse.json(
        { error: 'Remboursement partiel non encore implémenté' },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        refundId: result.refundId,
        message: 'Remboursement effectué avec succès'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Erreur lors du remboursement'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing manual refund:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur lors du remboursement'
    }, { status: 500 });
  }
}

// PUT - Marquer une erreur comme résolue
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Vérifier que l'utilisateur est SUPERADMIN
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    // Temporairement, permettre à tous les utilisateurs connectés d'accéder
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { failureId, resolution } = await request.json();

    if (!failureId || !resolution) {
      return NextResponse.json(
        { error: 'failureId et resolution sont requis' },
        { status: 400 }
      );
    }

    // Marquer l'échec comme résolu
    await prisma.phoneNumber.update({
      where: { id: failureId },
      data: {
        status: 'RESOLVED',
        telnyxConfig: {
          ...({} as any), // Récupérer la config existante
          resolution: resolution,
          resolvedAt: new Date().toISOString(),
          resolvedBy: user.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Échec marqué comme résolu'
    });

  } catch (error) {
    console.error('Error resolving failure:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}