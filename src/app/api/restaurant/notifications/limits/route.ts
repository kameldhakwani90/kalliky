import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { NotificationLimitsService } from '@/lib/services/notificationLimitsService';

// GET - Récupérer les limites et statut des notifications pour un store
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const activityType = searchParams.get('activityType');
    const actionType = searchParams.get('actionType');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requis' }, { status: 400 });
    }

    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: { 
        id: storeId,
        business: { ownerId: decoded.userId }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé ou non autorisé' }, { status: 403 });
    }

    // Si activityType et actionType fournis, vérifier si on peut ajouter cette action
    if (activityType && actionType) {
      const canAdd = await NotificationLimitsService.canAddNotification(
        storeId,
        activityType,
        actionType
      );

      return NextResponse.json({
        canAdd: canAdd.canAdd,
        reason: canAdd.reason,
        currentCount: canAdd.currentCount,
        maxAllowed: canAdd.maxAllowed,
        upgradeMessage: canAdd.upgradeMessage
      });
    }

    // Sinon, retourner le statut complet des limites
    const limitsStatus = await NotificationLimitsService.getStoreLimitsStatus(storeId);

    return NextResponse.json(limitsStatus);

  } catch (error) {
    console.error('Erreur API notifications limits:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Vérifier si une action peut être ajoutée
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const body = await request.json();
    const { storeId, activityType, actionType } = body;

    if (!storeId || !activityType || !actionType) {
      return NextResponse.json({ 
        error: 'storeId, activityType et actionType requis' 
      }, { status: 400 });
    }

    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: { 
        id: storeId,
        business: { ownerId: decoded.userId }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé ou non autorisé' }, { status: 403 });
    }

    const canAdd = await NotificationLimitsService.canAddNotification(
      storeId,
      activityType,
      actionType
    );

    // Obtenir aussi les types d'actions disponibles
    const availableActionTypes = await NotificationLimitsService.getAvailableActionTypes(storeId);

    return NextResponse.json({
      ...canAdd,
      availableActionTypes
    });

  } catch (error) {
    console.error('Erreur API notifications limits POST:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}