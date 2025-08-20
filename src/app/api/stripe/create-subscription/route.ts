import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

// API pour créer un abonnement avec une carte existante
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { plan, activityData, paymentMethodId } = await request.json();
    
    if (!plan || !activityData || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Plan, données d\'activité et moyen de paiement obligatoires' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Déterminer le Price ID selon le plan
    const priceIds = {
      'STARTER': process.env.STRIPE_STARTER_PRICE_ID!,
      'PRO': process.env.STRIPE_PRO_BASE_PRICE_ID!,
      'BUSINESS': process.env.STRIPE_BUSINESS_PRICE_ID!
    };

    const priceId = priceIds[plan as keyof typeof priceIds];
    if (!priceId) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    // Vérifier que le payment method appartient au customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== user.stripeCustomerId) {
      return NextResponse.json({ error: 'Moyen de paiement non autorisé' }, { status: 403 });
    }

    try {
      // Créer l'abonnement directement avec la carte existante
      const subscription = await stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [{ price: priceId }],
        default_payment_method: paymentMethodId,
        metadata: {
          userId: user.id,
          type: 'new_activity',
          plan: plan
        }
      });

      // Créer l'activité directement
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/app/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${token}`
        },
        body: JSON.stringify({
          ...activityData,
          paidPlan: plan,
          stripeSubscriptionId: subscription.id
        })
      });

      if (!response.ok) {
        // Si la création de l'activité échoue, annuler l'abonnement
        await stripe.subscriptions.cancel(subscription.id);
        throw new Error('Erreur lors de la création de l\'activité');
      }

      const createdActivity = await response.json();

      return NextResponse.json({ 
        success: true,
        subscriptionId: subscription.id,
        activity: createdActivity
      });

    } catch (error: any) {
      console.error('Error creating subscription:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'abonnement' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}