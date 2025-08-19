import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { settingsService } from '@/lib/email';

// POST - Changer de plan
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const { newPlan } = await request.json();

        if (!newPlan || !['STARTER', 'PRO', 'BUSINESS'].includes(newPlan)) {
            return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
        }

        // Récupérer l'utilisateur avec son business et abonnement
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                businesses: {
                    include: {
                        subscription: true
                    }
                }
            }
        });

        if (!user || !user.businesses[0]) {
            return NextResponse.json({ error: 'Business non trouvé' }, { status: 404 });
        }

        const business = user.businesses[0];
        const currentSubscription = business.subscription;

        if (!currentSubscription) {
            // Créer un nouvel abonnement
            const newSubscription = await prisma.subscription.create({
                data: {
                    businessId: business.id,
                    plan: newPlan,
                    period: 'MONTHLY',
                    paymentType: 'STRIPE_AUTO',
                    status: 'active',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
                    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    isActive: true,
                    autoRenew: true
                }
            });

            return NextResponse.json({ 
                success: true,
                subscription: newSubscription 
            });
        }

        // Mettre à jour l'abonnement existant
        const updatedSubscription = await prisma.subscription.update({
            where: { id: currentSubscription.id },
            data: {
                plan: newPlan,
                updatedAt: new Date()
            }
        });

        // Si Stripe est configuré, mettre à jour l'abonnement Stripe
        const stripeSecretKey = await settingsService.get('stripe_secret_key');
        if (stripeSecretKey && currentSubscription.stripeSubscriptionId) {
            try {
                const stripe = new Stripe(stripeSecretKey, {
                    apiVersion: '2024-12-18.acacia'
                });

                // Récupérer les prix Stripe (à configurer dans les settings)
                const stripePrices = {
                    'STARTER': process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
                    'PRO': process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
                    'BUSINESS': process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business'
                };

                // Mettre à jour l'abonnement Stripe
                await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId, {
                    items: [{
                        id: (await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId)).items.data[0].id,
                        price: stripePrices[newPlan]
                    }],
                    proration_behavior: 'create_prorations'
                });
            } catch (stripeError) {
                console.error('Erreur Stripe lors du changement de plan:', stripeError);
                // Continuer même si Stripe échoue
            }
        }

        return NextResponse.json({ 
            success: true,
            subscription: updatedSubscription,
            message: 'Plan mis à jour avec succès'
        });

    } catch (error) {
        console.error('Error changing plan:', error);
        return NextResponse.json({ error: 'Erreur lors du changement de plan' }, { status: 500 });
    }
}