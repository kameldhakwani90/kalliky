import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import axios from 'axios';

// Annuler un abonnement et supprimer le numéro Telnyx
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

    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json({ message: 'storeId requis' }, { status: 400 });
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
        business: {
          include: {
            phoneNumbers: true
          }
        }
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

    // 1. Annuler l'abonnement Stripe si existe
    if (subscription.stripeSubscriptionId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        // Annuler à la fin de la période en cours (pas immédiatement)
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      } catch (stripeError: any) {
        console.error('Erreur Stripe lors de l\'annulation:', stripeError);
        // Continuer même si Stripe échoue
      }
    }

    // 2. Supprimer le numéro Telnyx si configuré
    const phoneNumbers = store.business.phoneNumbers || [];
    for (const phoneNumber of phoneNumbers) {
      if (phoneNumber.telnyxPhoneNumberId) {
        try {
          // Libérer le numéro Telnyx
          await axios.delete(
            `https://api.telnyx.com/v2/phone_numbers/${phoneNumber.telnyxPhoneNumberId}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.TELNYX_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`✅ Numéro Telnyx ${phoneNumber.number} libéré avec succès`);
        } catch (telnyxError: any) {
          console.error(`❌ Erreur lors de la suppression du numéro Telnyx:`, telnyxError.response?.data || telnyxError.message);
          // Continuer même si Telnyx échoue
        }
      }
    }

    // 3. Marquer l'abonnement comme annulé dans la base
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'canceled',
        isActive: false,
        canceledAt: new Date(),
        // Garder la date de fin si elle existe (fin de période payée)
        endDate: subscription.endDate || new Date()
      }
    });

    // 4. Désactiver la boutique
    await prisma.store.update({
      where: { id: storeId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // 5. Supprimer les numéros de téléphone de la base
    if (phoneNumbers.length > 0) {
      await prisma.phoneNumber.deleteMany({
        where: {
          businessId: store.businessId,
          telnyxPhoneNumberId: {
            not: null
          }
        }
      });
    }

    // 6. Mettre à jour les settings de la boutique
    const settings = store.settings ? (typeof store.settings === 'string' ? JSON.parse(store.settings) : store.settings) : {};
    settings.telnyxConfigured = false;
    settings.subscriptionCanceled = true;
    settings.canceledAt = new Date().toISOString();

    await prisma.store.update({
      where: { id: storeId },
      data: {
        settings: settings
      }
    });

    console.log(`✅ Abonnement annulé pour la boutique ${store.name} (${storeId})`);

    return NextResponse.json({
      success: true,
      message: 'Abonnement annulé avec succès',
      data: {
        storeId,
        storeName: store.name,
        subscriptionId: subscription.id,
        canceledAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'annulation de l\'abonnement:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur lors de l\'annulation de l\'abonnement',
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}