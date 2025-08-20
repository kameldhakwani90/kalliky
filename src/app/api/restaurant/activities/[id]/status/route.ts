import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// PATCH - Mettre à jour le statut d'une activité
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const { status } = await request.json();

    // Validation du statut
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    // Récupérer l'activité et vérifier qu'elle appartient à l'utilisateur
    const activity = await prisma.activityLog.findFirst({
      where: {
        id: params.id,
        store: {
          business: {
            ownerId: decoded.userId
          }
        }
      },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }

    // Mettre à jour le statut dans les métadonnées
    const currentMetadata = activity.metadata ? 
      (typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata) : {};
    
    const updatedMetadata = {
      ...currentMetadata,
      status: status,
      statusUpdatedAt: new Date().toISOString(),
      statusUpdatedBy: decoded.userId
    };

    // Mettre à jour l'activité
    const updatedActivity = await prisma.activityLog.update({
      where: { id: params.id },
      data: {
        metadata: updatedMetadata
      },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Si l'activité concerne une commande, mettre à jour aussi la commande
    if (activity.type === 'ORDER_CREATED' && activity.entityId) {
      try {
        await prisma.order.update({
          where: { id: activity.entityId },
          data: { 
            status: status === 'COMPLETED' ? 'completed' : 
                   status === 'CANCELLED' ? 'cancelled' :
                   status === 'IN_PROGRESS' ? 'processing' : 'pending'
          }
        });
      } catch (error) {
        // Ne pas échouer si la commande n'existe plus
        console.log('Commande non trouvée pour mise à jour du statut:', activity.entityId);
      }
    }

    // Si l'activité concerne une consultation, mettre à jour aussi la consultation
    if (activity.type === 'CONSULTATION_SCHEDULED' && activity.entityId) {
      try {
        await prisma.consultation.update({
          where: { id: activity.entityId },
          data: { 
            status: status === 'COMPLETED' ? 'completed' : 
                   status === 'CANCELLED' ? 'cancelled' :
                   status === 'IN_PROGRESS' ? 'in_progress' : 'scheduled'
          }
        });
      } catch (error) {
        // Ne pas échouer si la consultation n'existe plus
        console.log('Consultation non trouvée pour mise à jour du statut:', activity.entityId);
      }
    }

    return NextResponse.json({
      success: true,
      activity: {
        id: updatedActivity.id,
        type: updatedActivity.type,
        entityId: updatedActivity.entityId,
        status: status,
        title: updatedActivity.title,
        description: updatedActivity.description || '',
        urgencyLevel: 'NORMAL' as const,
        createdAt: updatedActivity.createdAt.toISOString(),
        amount: updatedActivity.amount,
        metadata: updatedActivity.metadata,
        store: updatedActivity.store
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}