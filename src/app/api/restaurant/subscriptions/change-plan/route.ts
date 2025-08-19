import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

// Mapping des plans vers les price IDs Stripe
const PLAN_PRICE_IDS = {
  STARTER: process.env.STRIPE_STARTER_PRICE_ID!,
  PRO: process.env.STRIPE_PRO_BASE_PRICE_ID!,
  BUSINESS: process.env.STRIPE_BUSINESS_PRICE_ID!
};

// Changer le plan d'un abonnement (upgrade/downgrade)
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ message: 'Token invalide' }, { status: 401 });
    }

    const { storeId, newPlan } = await request.json();

    if (!storeId || !newPlan) {
      return NextResponse.json({ message: 'storeId et newPlan requis' }, { status: 400 });
    }

    if (!['STARTER', 'PRO', 'BUSINESS'].includes(newPlan)) {
      return NextResponse.json({ message: 'Plan invalide' }, { status: 400 });
    }

    // Vérifier que l'utilisateur est propriétaire de cette boutique
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          userId
        }
      },
      include: {
        business: true
      }
    });

    if (!store) {
      return NextResponse.json({ message: 'Boutique non trouvée ou accès refusé' }, { status: 404 });
    }

    // Trouver l'abonnement actif
    const subscription = await prisma.subscription.findFirst({
      where: {
        storeId: storeId,
        isActive: true,
        status: {
          in: ['active', 'trialing']
        }
      }
    });

    if (!subscription) {
      return NextResponse.json({ message: 'Aucun abonnement actif trouvé' }, { status: 404 });
    }

    // Vérifier que le nouveau plan est différent
    if (subscription.plan === newPlan) {
      return NextResponse.json({ message: 'Le nouveau plan est identique au plan actuel' }, { status: 400 });
    }

    const isUpgrade = getPlanLevel(newPlan) > getPlanLevel(subscription.plan);
    const isDowngrade = getPlanLevel(newPlan) < getPlanLevel(subscription.plan);

    console.log(`📊 Changement de plan: ${subscription.plan} -> ${newPlan} (${isUpgrade ? 'UPGRADE' : 'DOWNGRADE'})`);

    // Si l'abonnement a un ID Stripe, le mettre à jour dans Stripe
    if (subscription.stripeSubscriptionId) {
      try {
        // Récupérer l'abonnement Stripe actuel
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
        
        // Récupérer l'item de l'abonnement actuel
        const currentItem = stripeSubscription.items.data[0];
        
        // Mettre à jour l'abonnement avec le nouveau plan
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [{
            id: currentItem.id,
            price: PLAN_PRICE_IDS[newPlan as keyof typeof PLAN_PRICE_IDS]
          }],
          // Pour un upgrade, appliquer immédiatement avec prorata
          // Pour un downgrade, attendre la fin de la période
          proration_behavior: isUpgrade ? 'create_prorations' : 'none',
          billing_cycle_anchor: isDowngrade ? 'unchanged' : undefined
        });

        console.log(`✅ Abonnement Stripe mis à jour avec succès`);
      } catch (stripeError: any) {
        console.error('❌ Erreur Stripe lors du changement de plan:', stripeError);
        return NextResponse.json({ 
          message: 'Erreur lors de la mise à jour dans Stripe',
          error: stripeError.message 
        }, { status: 500 });
      }
    }

    // Mettre à jour l'abonnement dans la base de données
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: newPlan,
        updatedAt: new Date(),
        // Si c'est un downgrade, noter qu'il prendra effet à la fin de la période
        ...(isDowngrade && {
          pendingPlanChange: newPlan,
          pendingPlanChangeDate: subscription.endDate || new Date()
        })
      }
    });

    // Mettre à jour les settings de la boutique pour refléter le changement
    const settings = store.settings ? 
      (typeof store.settings === 'string' ? JSON.parse(store.settings) : store.settings) : {};
    
    settings.lastPlanChange = {
      from: subscription.plan,
      to: newPlan,
      date: new Date().toISOString(),
      type: isUpgrade ? 'upgrade' : 'downgrade',
      effectiveImmediately: isUpgrade
    };

    await prisma.store.update({
      where: { id: storeId },
      data: {
        settings: settings,
        updatedAt: new Date()
      }
    });

    // Créer une entrée dans l'historique d'activité
    await prisma.activityLog.create({
      data: {
        type: 'SUBSCRIPTION_CHANGE',
        description: `Changement de plan: ${subscription.plan} → ${newPlan}`,
        metadata: {
          storeId,
          storeName: store.name,
          oldPlan: subscription.plan,
          newPlan,
          changeType: isUpgrade ? 'upgrade' : 'downgrade',
          effectiveDate: isUpgrade ? new Date().toISOString() : (subscription.endDate?.toISOString() || 'end_of_period')
        },
        userId,
        businessId: store.businessId
      }
    });

    console.log(`✅ Plan changé avec succès pour la boutique ${store.name} (${storeId}): ${subscription.plan} → ${newPlan}`);

    return NextResponse.json({
      success: true,
      message: isUpgrade 
        ? `Upgrade vers le plan ${newPlan} effectué avec succès. Les nouvelles fonctionnalités sont disponibles immédiatement.`
        : `Downgrade vers le plan ${newPlan} effectué. Le changement prendra effet à la fin de la période de facturation actuelle.`,
      data: {
        storeId,
        storeName: store.name,
        oldPlan: subscription.plan,
        newPlan,
        changeType: isUpgrade ? 'upgrade' : 'downgrade',
        effectiveImmediately: isUpgrade,
        effectiveDate: isUpgrade ? new Date().toISOString() : subscription.endDate?.toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur lors du changement de plan:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur lors du changement de plan',
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}

// Fonction helper pour déterminer le niveau d'un plan
function getPlanLevel(plan: string): number {
  const levels: Record<string, number> = {
    'STARTER': 1,
    'PRO': 2,
    'BUSINESS': 3,
    'ENTERPRISE': 4
  };
  return levels[plan] || 0;
}