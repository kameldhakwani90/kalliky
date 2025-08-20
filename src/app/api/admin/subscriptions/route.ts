import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Vérification admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    // Récupérer tous les abonnements depuis la base de données
    const subscriptions = await prisma.subscription.findMany({
      include: {
        business: {
          include: {
            owner: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formater les données pour l'interface
    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      customerName: sub.business?.owner ? 
        `${sub.business.owner.firstName} ${sub.business.owner.lastName}` : 
        'Client Inconnu',
      customerEmail: sub.business?.owner?.email || 'email@inconnu.com',
      currentPlan: sub.plan || 'TRIAL',
      currentPrice: parseFloat(sub.amount?.toString() || '0'),
      status: sub.status,
      nextBillingDate: sub.currentPeriodEnd?.toISOString() || new Date().toISOString(),
      stripeSubscriptionId: sub.stripeSubscriptionId || '',
      stripePriceId: sub.stripePriceId || ''
    }));

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      total: formattedSubscriptions.length,
      totalRevenue: formattedSubscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + s.currentPrice, 0)
    });

  } catch (error) {
    console.error('❌ Erreur GET subscriptions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}