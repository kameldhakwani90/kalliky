import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationLimitsService } from '@/lib/services/notificationLimitsService';

// GET - Récupérer toutes les configurations de notifications pour un store
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const businessId = searchParams.get('businessId');

    if (!storeId || !businessId) {
      return NextResponse.json({ error: 'storeId et businessId requis' }, { status: 400 });
    }

    // Récupérer les configurations depuis le champ settings du store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true }
    });

    const settings = store?.settings ? (typeof store.settings === 'string' ? JSON.parse(store.settings) : store.settings) : {};
    const notificationConfigs = settings.notificationConfigs || {};

    // Transformer en format attendu par l'interface
    const configs = ['ORDER', 'SERVICE', 'CONSULTATION', 'SIGNALEMENT'].map(activityType => ({
      id: `${storeId}-${activityType}`,
      storeId,
      businessId,
      activityType,
      isActive: notificationConfigs[activityType]?.isActive || false,
      conditions: notificationConfigs[activityType]?.conditions || {},
      actions: notificationConfigs[activityType]?.actions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    return NextResponse.json(configs);

  } catch (error) {
    console.error('Erreur API notifications configs GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer ou mettre à jour une configuration de notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, businessId, activityType, isActive, conditions, actions } = body;

    if (!storeId || !businessId || !activityType) {
      return NextResponse.json({ 
        error: 'storeId, businessId et activityType requis' 
      }, { status: 400 });
    }

    // Vérifier les limitations avant d'ajouter des actions
    if (actions && actions.length > 0) {
      for (const action of actions) {
        const canAdd = await NotificationLimitsService.canAddNotification(
          storeId,
          activityType,
          action.actionType || action.type
        );

        if (!canAdd.canAdd) {
          return NextResponse.json({ 
            error: 'Limite de notifications atteinte',
            reason: canAdd.reason,
            upgradeMessage: canAdd.upgradeMessage,
            currentCount: canAdd.currentCount,
            maxAllowed: canAdd.maxAllowed
          }, { status: 400 });
        }
      }
    }

    // Récupérer les settings actuels du store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true }
    });

    const currentSettings = store?.settings ? 
      (typeof store.settings === 'string' ? JSON.parse(store.settings) : store.settings) : {};
    
    // Mettre à jour la configuration pour ce type d'activité
    const notificationConfigs = currentSettings.notificationConfigs || {};
    notificationConfigs[activityType] = {
      isActive,
      conditions: conditions || {},
      actions: actions || [],
      updatedAt: new Date().toISOString()
    };

    // Sauvegarder dans les settings
    const updatedSettings = {
      ...currentSettings,
      notificationConfigs
    };

    await prisma.store.update({
      where: { id: storeId },
      data: { 
        settings: updatedSettings,
        updatedAt: new Date()
      }
    });

    // Retourner la configuration mise à jour
    const updatedConfig = {
      id: `${storeId}-${activityType}`,
      storeId,
      businessId,
      activityType,
      isActive,
      conditions: conditions || {},
      actions: actions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(updatedConfig);

  } catch (error) {
    console.error('Erreur API notifications configs POST:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');

    if (!configId) {
      return NextResponse.json({ error: 'configId requis' }, { status: 400 });
    }

    // Supprimer d'abord les actions
    await prisma.notificationAction.deleteMany({
      where: { configId }
    });

    // Puis la configuration
    await prisma.notificationConfig.delete({
      where: { id: configId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur API notifications configs DELETE:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}