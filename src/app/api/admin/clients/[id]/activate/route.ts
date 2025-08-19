import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Activer/Désactiver un client
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { activate, endDate, notes } = await request.json();
    const { id } = await params;

    // Trouver l'utilisateur et son business
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        businesses: {
          include: { subscription: true }
        }
      }
    });

    if (!user || user.businesses.length === 0) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    const business = user.businesses[0];
    const subscription = business.subscription;

    if (!subscription) {
      return NextResponse.json(
        { error: 'Aucun abonnement trouvé' },
        { status: 404 }
      );
    }

    // Calculer les nouvelles dates si activation
    let newEndDate = subscription.currentPeriodEnd;
    let newNextBilling = subscription.nextBillingDate;

    if (activate && endDate) {
      newEndDate = new Date(endDate);
      
      // Si c'est un abonnement manuel, pas de prochaine facturation
      if (subscription.paymentType === 'MANUAL') {
        newNextBilling = null;
      } else {
        newNextBilling = new Date(endDate);
      }
    }

    // Mettre à jour l'abonnement
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        isActive: activate,
        status: activate ? 'active' : 'inactive',
        currentPeriodEnd: newEndDate,
        nextBillingDate: newNextBilling,
        cancelledAt: activate ? null : new Date(),
        cancelReason: activate ? null : 'Désactivé par admin',
        notes: notes || subscription.notes,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: activate ? 'Client activé avec succès' : 'Client désactivé avec succès',
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error('Erreur activation client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'activation/désactivation' },
      { status: 500 }
    );
  }
}