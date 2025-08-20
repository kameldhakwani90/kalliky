import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

// Nouvelle API pour checkout consolidé (toutes les activités d'un utilisateur)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Récupérer tous les stores actifs de l'utilisateur avec leurs abonnements
    const businesses = await prisma.business.findMany({
      where: { ownerId: decoded.userId },
      include: {
        stores: {
          where: { isActive: true },
          include: {
            subscription: true,
            usageTracking: {
              where: {
                period: new Date().toISOString().slice(0, 7) // Format YYYY-MM
              }
            }
          }
        }
      }
    });

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

    // Construire les lignes de facturation
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    for (const business of businesses) {
      for (const store of business.stores) {
        if (store.subscription && store.subscription.status === 'active') {
          const settings = JSON.parse(store.settings || '{}');
          const serviceType = settings.serviceType;
          
          // Prix de base selon le plan
          const basePrices = {
            'STARTER': process.env.STRIPE_STARTER_PRICE_ID!,
            'PRO': process.env.STRIPE_PRO_BASE_PRICE_ID!,
            'BUSINESS': process.env.STRIPE_BUSINESS_PRICE_ID!
          };
          
          // Ajouter le prix de base
          lineItems.push({
            price: basePrices[store.subscription.plan],
            quantity: 1,
            adjustable_quantity: { enabled: false }
          });
          
          // Pour le plan PRO, ajouter les frais d'usage
          if (store.subscription.plan === 'PRO') {
            const usage = store.usageTracking[0];
            if (usage && usage.orderCount > 0) {
              // Créer un prix one-time pour les commandes
              const orderPrice = await stripe.prices.create({
                unit_amount: 100, // 1€ en centimes
                currency: 'eur',
                product_data: {
                  name: `${store.name} - Commandes (${usage.orderCount})`,
                  description: `Frais d'usage : ${usage.orderCount} commandes à 1€ chacune`
                }
              });
              
              lineItems.push({
                price: orderPrice.id,
                quantity: usage.orderCount
              });
            }
          }
          
          // Pour le plan STARTER, ajouter les commissions
          if (store.subscription.plan === 'STARTER') {
            const usage = store.usageTracking[0];
            if (usage && usage.commissionAmount > 0) {
              const commissionPrice = await stripe.prices.create({
                unit_amount: Math.round(usage.commissionAmount * 100), // En centimes
                currency: 'eur',
                product_data: {
                  name: `${store.name} - Commission (10%)`,
                  description: `Commission sur CA de ${usage.totalRevenue}€`
                }
              });
              
              lineItems.push({
                price: commissionPrice.id,
                quantity: 1
              });
            }
          }
        }
      }
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Aucun abonnement actif à facturer' },
        { status: 400 }
      );
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment', // Paiement unique pour facture mensuelle
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?canceled=true`,
      metadata: {
        userId: user.id,
        type: 'consolidated_billing'
      },
      locale: 'fr'
    });

    return NextResponse.json({ 
      sessionId: session.id,
      sessionUrl: session.url,
      totalStores: businesses.reduce((total, b) => total + b.stores.length, 0)
    });

  } catch (error: any) {
    console.error('Stripe checkout consolidé error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}