import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

// GET - Récupérer les moyens de paiement sauvegardés
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { stripeCustomerId: true }
    });

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    // Récupérer les moyens de paiement depuis Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    // Formater les données pour le frontend
    const formattedMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: false // On peut ajouter une logique pour définir une carte par défaut
    }));

    return NextResponse.json({ paymentMethods: formattedMethods });

  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un moyen de paiement
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'ID du moyen de paiement requis' }, { status: 400 });
    }

    // Vérifier que l'utilisateur possède ce moyen de paiement
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { stripeCustomerId: true }
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    if (paymentMethod.customer !== user.stripeCustomerId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Détacher le moyen de paiement
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}