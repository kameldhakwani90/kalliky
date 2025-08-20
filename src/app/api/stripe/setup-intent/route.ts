import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

// POST - Créer une session Setup Intent pour ajouter une nouvelle carte
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { stripeCustomerId: true, email: true, firstName: true, lastName: true }
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
          userId: decoded.userId
        }
      });
      
      stripeCustomerId = customer.id;
      
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { stripeCustomerId: customer.id }
      });
    }

    // Créer une session Checkout en mode setup pour ajouter une carte
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'setup',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?setup=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?setup=canceled`,
      locale: 'fr'
    });

    return NextResponse.json({ 
      setupUrl: session.url
    });

  } catch (error: any) {
    console.error('Setup intent error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du setup intent' },
      { status: 500 }
    );
  }
}