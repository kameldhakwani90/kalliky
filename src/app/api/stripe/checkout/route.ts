import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

export async function POST(request: NextRequest) {
  try {
    const { userId, plan, email } = await request.json();

    if (!userId || !plan || !email) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { businesses: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Déterminer le prix Stripe selon le plan
    let priceId = '';
    let mode: Stripe.Checkout.SessionCreateParams.Mode = 'subscription';
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    switch (plan) {
      case 'STARTER':
        priceId = process.env.STRIPE_STARTER_PRICE_ID!;
        lineItems.push({
          price: priceId,
          quantity: 1
        });
        break;
      
      case 'PRO':
        // Pour le plan Pro, on ajoute le prix de base + le prix à l'usage
        lineItems.push({
          price: process.env.STRIPE_PRO_BASE_PRICE_ID!,
          quantity: 1
        });
        // Le prix à l'usage sera géré via l'API après création de l'abonnement
        break;
      
      case 'BUSINESS':
        priceId = process.env.STRIPE_BUSINESS_PRICE_ID!;
        lineItems.push({
          price: priceId,
          quantity: 1
        });
        break;
      
      default:
        return NextResponse.json(
          { error: 'Plan invalide' },
          { status: 400 }
        );
    }

    // Créer ou récupérer le customer Stripe
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
          plan: plan
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Sauvegarder l'ID Stripe dans notre DB
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      });
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/restaurant/stores?success=true&session_id={CHECKOUT_SESSION_ID}&firstPayment=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?canceled=true`,
      metadata: {
        userId: user.id,
        businessId: user.businesses[0]?.id || '',
        plan: plan
      },
      subscription_data: {
        trial_period_days: 14, // 14 jours d'essai gratuit
        metadata: {
          userId: user.id,
          businessId: user.businesses[0]?.id || '',
          plan: plan
        }
      },
      customer_update: {
        address: 'auto'
      },
      billing_address_collection: 'auto',
      locale: 'fr'
    });

    return NextResponse.json({ 
      sessionId: session.id,
      sessionUrl: session.url 
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}