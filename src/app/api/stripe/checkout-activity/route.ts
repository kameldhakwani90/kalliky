import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

// API pour créer checkout pour nouvelle activité
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { plan, activityData } = await request.json();
    
    if (!plan || !activityData) {
      return NextResponse.json(
        { error: 'Plan et données d\'activité obligatoires' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Créer ou récupérer le customer Stripe
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id
        }
      });
      
      stripeCustomerId = customer.id;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id }
      });
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

    // Stocker temporairement les données d'activité dans les metadata utilisateur
    const currentMetadata = user.metadata ? JSON.parse(user.metadata) : {};
    const tempActivityId = `temp_${Date.now()}`;
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: JSON.stringify({
          ...currentMetadata,
          [`pendingActivity_${tempActivityId}`]: activityData
        })
      }
    });

    // Créer la session Stripe Checkout avec metadata réduit
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/stores?success=true&session_id={CHECKOUT_SESSION_ID}&activity=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/stores?canceled=true`,
      metadata: {
        userId: user.id,
        type: 'new_activity',
        plan: plan,
        tempActivityId: tempActivityId
      },
      locale: 'fr'
    });

    return NextResponse.json({ 
      sessionId: session.id,
      sessionUrl: session.url
    });

  } catch (error: any) {
    console.error('Stripe checkout activity error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}