import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Ajouter une notification à la queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      storeId, 
      businessId, 
      activityType, 
      activityId, 
      data, 
      priority = 'NORMAL',
      scheduledFor 
    } = body;

    if (!storeId || !businessId || !activityType || !activityId) {
      return NextResponse.json({ 
        error: 'storeId, businessId, activityType et activityId requis' 
      }, { status: 400 });
    }

    // Récupérer les configurations actives pour ce type d'activité
    const configs = await prisma.notificationConfig.findMany({
      where: {
        storeId,
        businessId,
        activityType,
        isActive: true
      },
      include: {
        actions: {
          where: { isActive: true }
        }
      }
    });

    if (configs.length === 0) {
      return NextResponse.json({ 
        message: 'Aucune configuration active trouvée' 
      }, { status: 200 });
    }

    // Créer les éléments de queue pour chaque action
    const queueItems = [];
    
    for (const config of configs) {
      // Vérifier les conditions
      if (config.conditions && !checkConditions(config.conditions, data)) {
        continue;
      }

      for (const action of config.actions) {
        const scheduleTime = scheduledFor ? 
          new Date(scheduledFor) : 
          new Date(Date.now() + (action.delay * 60 * 1000)); // délai en minutes

        const queueItem = await prisma.notificationQueueItem.create({
          data: {
            configId: config.id,
            activityType,
            activityId,
            actionType: action.type,
            actionSettings: action.settings,
            priority: action.priority,
            status: 'PENDING',
            scheduledFor: scheduleTime,
            data,
            metadata: {
              storeId,
              businessId,
              provider: action.provider
            }
          }
        });

        queueItems.push(queueItem);
      }
    }

    return NextResponse.json({ 
      message: `${queueItems.length} notifications ajoutées à la queue`,
      queueItems: queueItems.map(item => ({
        id: item.id,
        actionType: item.actionType,
        priority: item.priority,
        scheduledFor: item.scheduledFor
      }))
    });

  } catch (error) {
    console.error('Erreur API notifications queue POST:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET - Récupérer les éléments de la queue
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!storeId || !businessId) {
      return NextResponse.json({ error: 'storeId et businessId requis' }, { status: 400 });
    }

    const where: any = {
      metadata: {
        path: ['storeId'],
        equals: storeId
      }
    };

    if (status) {
      where.status = status;
    }

    const queueItems = await prisma.notificationQueueItem.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { scheduledFor: 'asc' }
      ],
      take: limit,
      include: {
        config: {
          select: {
            activityType: true
          }
        }
      }
    });

    return NextResponse.json(queueItems);

  } catch (error) {
    console.error('Erreur API notifications queue GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Helper function pour vérifier les conditions
function checkConditions(conditions: any, data: any): boolean {
  try {
    // Vérifier montant minimum
    if (conditions.minAmount && data.total < conditions.minAmount) {
      return false;
    }

    // Vérifier type de client
    if (conditions.clientType && conditions.clientType.length > 0) {
      if (!conditions.clientType.includes('Tous') && 
          !conditions.clientType.includes(data.clientType)) {
        return false;
      }
    }

    // Vérifier urgence (pour signalements)
    if (conditions.urgency && conditions.urgency.length > 0) {
      if (!conditions.urgency.includes('tous') && 
          !conditions.urgency.includes(data.urgency)) {
        return false;
      }
    }

    // Vérifier créneaux horaires
    if (conditions.timeSlots && conditions.timeSlots.length > 0) {
      const now = new Date();
      const hour = now.getHours();
      
      for (const slot of conditions.timeSlots) {
        if (slot === 'toujours') return true;
        if (slot === 'ouverture' && hour >= 8 && hour <= 20) return true;
        if (slot === 'bureau' && hour >= 9 && hour <= 17) return true;
        if (slot === 'urgence' && data.priority === 'URGENT') return true;
      }
      
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur vérification conditions:', error);
    return false;
  }
}