import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
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

    const { subscriptionId, newPriceId } = await request.json();

    if (!subscriptionId || !newPriceId) {
      return NextResponse.json(
        { error: 'subscriptionId et newPriceId requis' }, 
        { status: 400 }
      );
    }

    // Map des prix pour récupérer les infos du nouveau plan
    const priceMap: Record<string, { name: string; amount: number }> = {
      'price_starter': { name: 'STARTER', amount: 49 },
      'price_pro': { name: 'PRO', amount: 99 },
      'price_enterprise': { name: 'ENTERPRISE', amount: 199 }
    };

    const newPlanInfo = priceMap[newPriceId];
    if (!newPlanInfo) {
      return NextResponse.json(
        { error: 'Plan invalide' }, 
        { status: 400 }
      );
    }

    // TODO: Ici vous devriez utiliser l'API Stripe pour mettre à jour l'abonnement
    // Exemple avec Stripe SDK:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const subscription = await stripe.subscriptions.update(subscriptionId, {
    //   items: [{
    //     id: subscription.items.data[0].id,
    //     price: newPriceId,
    //   }],
    //   proration_behavior: 'create_prorations', // Facturation au prorata
    // });

    // Pour l'instant, simuler la mise à jour en base
    const updatedSubscription = await prisma.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscriptionId
      },
      data: {
        stripePriceId: newPriceId,
        plan: newPlanInfo.name,
        amount: newPlanInfo.amount,
        updatedAt: new Date()
      }
    });

    // Enregistrer l'action dans les logs
    await prisma.activityLog.create({
      data: {
        type: 'REFUND', // Réutilisation du type existant
        description: `Changement d'abonnement vers ${newPlanInfo.name} (${newPlanInfo.amount}€) par ${decoded.email}`,
        amount: newPlanInfo.amount,
        metadata: {
          subscriptionId,
          newPriceId,
          newPlan: newPlanInfo.name,
          adminId: decoded.userId,
          adminEmail: decoded.email,
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Abonnement mis à jour vers ${newPlanInfo.name}`,
      newPlan: newPlanInfo.name,
      newAmount: newPlanInfo.amount,
      updatedCount: updatedSubscription.count
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour subscription:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}