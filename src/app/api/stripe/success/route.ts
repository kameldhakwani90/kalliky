import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID manquant' },
        { status: 400 }
      );
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session.metadata?.userId) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé dans la session' },
        { status: 404 }
      );
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.metadata.userId },
      include: { businesses: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Gérer les différents types de paiement
    if (session.metadata?.type === 'new_activity') {
      // Paiement pour une nouvelle activité - récupérer les données depuis user metadata
      const tempActivityId = session.metadata.tempActivityId;
      const plan = session.metadata.plan;
      
      // Récupérer les données d'activité stockées temporairement
      const userMetadata = user.metadata ? JSON.parse(user.metadata) : {};
      const activityData = userMetadata[`pendingActivity_${tempActivityId}`] || {};
      
      try {
        // Créer l'activité avec le plan payé
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/restaurant/activities`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': `auth-token=${jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' })}`
          },
          body: JSON.stringify({
            ...activityData,
            paidPlan: plan,
            stripeSubscriptionId: session.subscription
          })
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la création de l\'activité');
        }
        
        // Nettoyer les données temporaires après création réussie
        const cleanedMetadata = { ...userMetadata };
        delete cleanedMetadata[`pendingActivity_${tempActivityId}`];
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            metadata: JSON.stringify(cleanedMetadata)
          }
        });
        
      } catch (error) {
        console.error('Erreur création activité après paiement:', error);
      }
    } else if (user.businesses.length === 0) {
      // Paiement initial - marquer pour création première activité
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          stripeCustomerId: session.customer as string,
          // Ajouter un flag pour indiquer qu'il faut créer la première activité
          metadata: JSON.stringify({ 
            needsFirstActivity: true,
            paidPlan: session.metadata?.plan || 'STARTER',
            stripeSubscriptionId: session.subscription
          })
        }
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Créer la réponse avec le cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });

    // Définir le cookie d'authentification
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 jours
    });

    return response;

  } catch (error: any) {
    console.error('Stripe success error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la connexion automatique' },
      { status: 500 }
    );
  }
}