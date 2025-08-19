import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

// API pour connecter automatiquement un utilisateur après un signup via Stripe
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

    if (!session || session.metadata?.type !== 'complete_signup') {
      return NextResponse.json(
        { error: 'Session invalide ou non autorisée' },
        { status: 400 }
      );
    }

    // Récupérer l'email depuis les métadonnées
    const userData = JSON.parse(session.metadata?.userData || '{}');
    const userEmail = userData.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email utilisateur non trouvé' },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur dans la base de données
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        businesses: {
          include: {
            stores: {
              include: {
                subscription: true
              }
            },
            phoneNumbers: true
          }
        }
      }
    });

    // Si l'utilisateur n'existe pas, le créer (fallback si webhook a échoué)
    if (!user) {
      console.log('User not found, creating from Stripe session data...');
      
      try {
        const businessData = JSON.parse(session.metadata?.businessData || '{}');
        const storeData = JSON.parse(session.metadata?.storeData || '{}');
        const plan = session.metadata?.plan as 'STARTER' | 'PRO' | 'BUSINESS';

        // Créer l'utilisateur
        const hashedPassword = await require('bcryptjs').hash(userData.password, 10);
        user = await prisma.user.create({
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: hashedPassword,
            phone: userData.phone,
            language: userData.language || 'fr',
            stripeCustomerId: session.customer as string,
            role: 'CLIENT'
          },
          include: {
            businesses: {
              include: {
                stores: {
                  include: {
                    subscription: true
                  }
                },
                phoneNumbers: true
              }
            }
          }
        });

        // Créer le business
        const business = await prisma.business.create({
          data: {
            name: businessData.name,
            description: `Activité ${storeData.serviceType || 'products'}`,
            type: storeData.serviceType === 'products' ? 'PRODUCTS' : 
                  storeData.serviceType === 'reservations' ? 'RESERVATIONS' : 'CONSULTATION',
            ownerId: user.id
          }
        });

        // Créer le store
        const store = await prisma.store.create({
          data: {
            name: storeData.name,
            address: storeData.address,
            businessId: business.id,
            isActive: true,
            hasProducts: storeData.hasProducts !== undefined ? storeData.hasProducts : true,
            hasReservations: storeData.hasReservations !== undefined ? storeData.hasReservations : true,
            hasConsultations: storeData.hasConsultations !== undefined ? storeData.hasConsultations : true,
            settings: JSON.stringify({
              currency: 'EUR',
              taxRates: [],
              schedule: {},
              printers: [],
              notifications: { enabled: false },
              serviceType: storeData.serviceType || 'products',
              telnyxConfigured: false,
              isConfigured: true
            })
          }
        });

        // Créer l'abonnement
        await prisma.subscription.create({
          data: {
            storeId: store.id,
            plan: plan,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            trialUsed: false,
            isActive: true,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string
          }
        });

        // Ajouter le numéro de téléphone
        await prisma.phoneNumber.create({
          data: {
            number: storeData.phone,
            businessId: business.id,
            telnyxId: ''
          }
        });

        console.log('Complete signup created successfully via fallback');
        
        // Recharger l'utilisateur avec toutes les relations
        user = await prisma.user.findUnique({
          where: { email: userEmail },
          include: {
            businesses: {
              include: {
                stores: {
                  include: {
                    subscription: true
                  }
                },
                phoneNumbers: true
              }
            }
          }
        });
      } catch (error) {
        console.error('Error creating user from Stripe session:', error);
        return NextResponse.json(
          { error: 'Erreur lors de la création du compte' },
          { status: 500 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Impossible de créer ou trouver l\'utilisateur' },
        { status: 404 }
      );
    }

    // Créer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Retourner les infos utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      token,
      user: userWithoutPassword,
      message: 'Connexion automatique réussie'
    });

    // Définir le cookie auth-token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 jours
    });

    return response;

  } catch (error: any) {
    console.error('Auto-login signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la connexion automatique' },
      { status: 500 }
    );
  }
}