import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// GET - Récupérer l'abonnement actuel
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
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

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // Prendre le premier business (pour l'instant on suppose qu'un utilisateur a un seul business)
        const business = user.businesses[0];
        if (!business) {
            return NextResponse.json({ 
                subscription: null,
                message: 'Aucun business trouvé' 
            });
        }

        const subscription = business.subscription;
        if (!subscription) {
            return NextResponse.json({ 
                subscription: null,
                message: 'Aucun abonnement actif' 
            });
        }

        return NextResponse.json({
            subscription: {
                id: subscription.id,
                plan: subscription.plan,
                period: subscription.period,
                status: subscription.status,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                nextBillingDate: subscription.nextBillingDate,
                isActive: subscription.isActive,
                autoRenew: subscription.autoRenew,
                stripeSubscriptionId: subscription.stripeSubscriptionId,
                stripeCustomerId: subscription.stripeCustomerId || user.stripeCustomerId
            },
            business: {
                id: business.id,
                name: business.name
            }
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}