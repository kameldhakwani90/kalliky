import { prisma } from '@/lib/prisma';

// Configuration des limites par plan
export const NOTIFICATION_LIMITS_BY_PLAN = {
  STARTER: {
    maxNotificationsPerType: 2,
    allowedActionTypes: ['EMAIL', 'WHATSAPP', 'PRINT', 'CALENDAR', 'SMS', 'SLACK'], // Pas de N8N
    upgradeMessage: 'Passez au plan PRO pour plus de notifications et accès aux webhooks N8N'
  },
  PRO: {
    maxNotificationsPerType: 5,
    allowedActionTypes: ['EMAIL', 'WHATSAPP', 'PRINT', 'CALENDAR', 'N8N_WEBHOOK', 'SMS', 'SLACK'], // N8N inclus
    upgradeMessage: 'Passez au plan Business pour des notifications illimitées'
  },
  BUSINESS: {
    maxNotificationsPerType: 999, // Pratiquement illimité
    allowedActionTypes: ['EMAIL', 'WHATSAPP', 'PRINT', 'CALENDAR', 'N8N_WEBHOOK', 'SMS', 'SLACK'],
    upgradeMessage: null
  },
  ENTERPRISE: {
    maxNotificationsPerType: 999, // Pratiquement illimité
    allowedActionTypes: ['EMAIL', 'WHATSAPP', 'PRINT', 'CALENDAR', 'N8N_WEBHOOK', 'SMS', 'SLACK'],
    upgradeMessage: null
  }
} as const;

export class NotificationLimitsService {
  
  // Obtenir les limites pour un store selon son plan d'abonnement
  static async getNotificationLimitsForStore(storeId: string): Promise<typeof NOTIFICATION_LIMITS_BY_PLAN.STARTER> {
    try {
      // Récupérer l'abonnement actif du store
      const subscription = await prisma.subscription.findFirst({
        where: {
          storeId: storeId,
          isActive: true,
          status: {
            in: ['active', 'trialing']
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!subscription) {
        console.warn(`⚠️ Aucun abonnement actif trouvé pour store ${storeId}, utilisation des limites STARTER`);
        return NOTIFICATION_LIMITS_BY_PLAN.STARTER;
      }

      const plan = subscription.plan as keyof typeof NOTIFICATION_LIMITS_BY_PLAN;
      const limits = NOTIFICATION_LIMITS_BY_PLAN[plan] || NOTIFICATION_LIMITS_BY_PLAN.STARTER;

      console.log(`📊 Limites notifications pour store ${storeId} (plan ${plan}):`, limits);
      return limits;

    } catch (error) {
      console.error('❌ Erreur récupération limites notifications:', error);
      return NOTIFICATION_LIMITS_BY_PLAN.STARTER; // Fallback sécurisé
    }
  }

  // Vérifier si on peut ajouter une nouvelle notification
  static async canAddNotification(
    storeId: string, 
    activityType: string, 
    actionType: string
  ): Promise<{
    canAdd: boolean;
    reason?: string;
    currentCount?: number;
    maxAllowed?: number;
    upgradeMessage?: string;
  }> {
    try {
      // Obtenir les limites pour ce store
      const limits = await this.getNotificationLimitsForStore(storeId);
      
      // Vérifier si le type d'action est autorisé pour ce plan
      if (!limits.allowedActionTypes.includes(actionType as any)) {
        return {
          canAdd: false,
          reason: 'action_type_not_allowed',
          upgradeMessage: limits.upgradeMessage || 'Ce type de notification nécessite un plan supérieur'
        };
      }

      // Compter les notifications existantes pour ce type d'activité
      const currentCount = await this.getNotificationCountForActivityType(storeId, activityType);

      // Vérifier si on peut ajouter une nouvelle notification
      if (currentCount >= limits.maxNotificationsPerType) {
        return {
          canAdd: false,
          reason: 'limit_reached',
          currentCount: currentCount,
          maxAllowed: limits.maxNotificationsPerType,
          upgradeMessage: limits.upgradeMessage || 'Limite de notifications atteinte pour votre plan'
        };
      }

      return {
        canAdd: true,
        currentCount: currentCount,
        maxAllowed: limits.maxNotificationsPerType
      };

    } catch (error) {
      console.error('❌ Erreur vérification ajout notification:', error);
      return {
        canAdd: false,
        reason: 'error'
      };
    }
  }

  // Compter les notifications pour un type d'activité
  private static async getNotificationCountForActivityType(storeId: string, activityType: string): Promise<number> {
    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { settings: true }
      });

      const settings = store?.settings ? (typeof store.settings === 'string' ? JSON.parse(store.settings) : store.settings) : {};
      const notificationConfigs = settings.notificationConfigs || {};
      const activityConfig = notificationConfigs[activityType] || {};

      return activityConfig.actions?.length || 0;
    } catch (error) {
      console.error('❌ Erreur comptage notifications:', error);
      return 0;
    }
  }

  // Obtenir le statut des limites pour toutes les activités d'un store
  static async getStoreLimitsStatus(storeId: string): Promise<{
    plan: string;
    limits: typeof NOTIFICATION_LIMITS_BY_PLAN.STARTER;
    activityTypes: {
      [activityType: string]: {
        currentCount: number;
        maxAllowed: number;
        canAddMore: boolean;
        allowedActionTypes: string[];
      };
    };
  }> {
    try {
      const limits = await this.getNotificationLimitsForStore(storeId);
      
      // Récupérer le plan actuel
      const subscription = await prisma.subscription.findFirst({
        where: {
          storeId: storeId,
          isActive: true,
          status: {
            in: ['active', 'trialing']
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const plan = subscription?.plan || 'STARTER';

      // Statut pour chaque type d'activité
      const activityTypes = {
        ORDER: await this.getActivityTypeStatus(storeId, 'ORDER', limits),
        SERVICE: await this.getActivityTypeStatus(storeId, 'SERVICE', limits),
        CONSULTATION: await this.getActivityTypeStatus(storeId, 'CONSULTATION', limits),
        SIGNALEMENT: await this.getActivityTypeStatus(storeId, 'SIGNALEMENT', limits)
      };

      return {
        plan,
        limits,
        activityTypes
      };

    } catch (error) {
      console.error('❌ Erreur statut limites store:', error);
      throw error;
    }
  }

  // Obtenir le statut pour un type d'activité spécifique
  private static async getActivityTypeStatus(
    storeId: string, 
    activityType: string, 
    limits: typeof NOTIFICATION_LIMITS_BY_PLAN.STARTER
  ) {
    const currentCount = await this.getNotificationCountForActivityType(storeId, activityType);
    
    return {
      currentCount,
      maxAllowed: limits.maxNotificationsPerType,
      canAddMore: currentCount < limits.maxNotificationsPerType,
      allowedActionTypes: limits.allowedActionTypes
    };
  }

  // Obtenir les types d'actions disponibles pour un plan
  static async getAvailableActionTypes(storeId: string): Promise<{
    actionType: string;
    label: string;
    description: string;
    isAllowed: boolean;
    requiresUpgrade?: boolean;
  }[]> {
    const limits = await this.getNotificationLimitsForStore(storeId);
    
    const allActionTypes = [
      {
        actionType: 'EMAIL',
        label: '📧 Email',
        description: 'Envoyer un email de notification'
      },
      {
        actionType: 'WHATSAPP',
        label: '💬 WhatsApp',
        description: 'Envoyer via WhatsApp Business'
      },
      {
        actionType: 'SMS',
        label: '📱 SMS',
        description: 'Envoyer un SMS'
      },
      {
        actionType: 'SLACK',
        label: '💼 Slack',
        description: 'Notifier dans un canal Slack'
      },
      {
        actionType: 'PRINT',
        label: '🖨️ Impression',
        description: 'Imprimer un ticket'
      },
      {
        actionType: 'CALENDAR',
        label: '📅 Google Calendar',
        description: 'Créer un événement calendar'
      },
      {
        actionType: 'N8N_WEBHOOK',
        label: '🔗 Webhook N8N',
        description: 'Déclencher un webhook N8N'
      }
    ];

    return allActionTypes.map(actionType => ({
      ...actionType,
      isAllowed: limits.allowedActionTypes.includes(actionType.actionType as any),
      requiresUpgrade: !limits.allowedActionTypes.includes(actionType.actionType as any)
    }));
  }
}

// Export des constantes pour usage externe
export { NOTIFICATION_LIMITS_BY_PLAN as NotificationLimits };