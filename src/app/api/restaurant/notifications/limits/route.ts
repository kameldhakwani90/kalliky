import { NextRequest, NextResponse } from 'next/server';
import { NotificationLimitsService } from '@/lib/services/notificationLimitsService';

// GET - Récupérer les limites et statut des notifications pour un store
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const activityType = searchParams.get('activityType');
    const actionType = searchParams.get('actionType');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId requis' }, { status: 400 });
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
    const body = await request.json();
    const { storeId, activityType, actionType } = body;

    if (!storeId || !activityType || !actionType) {
      return NextResponse.json({ 
        error: 'storeId, activityType et actionType requis' 
      }, { status: 400 });
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