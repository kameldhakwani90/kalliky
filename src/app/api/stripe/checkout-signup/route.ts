import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

// API pour créer une session Stripe avec TOUTES les données d'inscription
// RIEN n'est créé en base - tout passe par Stripe metadata
export async function POST(request: NextRequest) {
  try {
    const { userData, businessData, storeData, plan } = await request.json();

    // Validation des données obligatoires
    if (!userData || !businessData || !storeData || !plan) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
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

    // Créer la session Stripe Checkout avec TOUTES les données en metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/restaurant/stores?success=true&session_id={CHECKOUT_SESSION_ID}&signup=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?canceled=true`,
      customer_email: userData.email,
      metadata: {
        type: 'complete_signup',
        plan: plan,
        // Données user (JSON encodé)
        userData: JSON.stringify(userData),
        // Données business (JSON encodé) 
        businessData: JSON.stringify(businessData),
        // Données store (JSON encodé)
        storeData: JSON.stringify(storeData)
      },
      subscription_data: {
        trial_period_days: 14, // 14 jours d'essai gratuit
        metadata: {
          type: 'complete_signup',
          plan: plan
        }
      },
      billing_address_collection: 'auto',
      locale: 'fr'
    });

    return NextResponse.json({ 
      sessionId: session.id,
      sessionUrl: session.url 
    });

  } catch (error: any) {
    console.error('Stripe checkout signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}