import { prisma } from './prisma';
import { emailService } from './email';
import { TelnyxBlockingService } from './telnyx-blocking';

export interface TrialUsageData {
  businessId?: string;
  identifier: string;
  identifierType: string;
  userId?: string;
}

export interface TrialStatusCheck {
  canMakeCall: boolean;
  callsRemaining: number;
  daysRemaining: number;
  status: string;
  blockReason?: string;
}

export class TrialUsageService {
  // Créer ou récupérer un usage trial
  static async getOrCreateTrialUsage(data: TrialUsageData) {
    let trialUsage = await prisma.trialUsage.findUnique({
      where: { identifier: data.identifier },
      include: { business: true }
    });

    if (!trialUsage) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 15);
      
      trialUsage = await prisma.trialUsage.create({
        data: {
          ...data,
          trialEndDate: endDate,
          callsUsed: 0,
          callsRemaining: 10,
          callsLimit: 10,
          daysRemaining: 15,
          daysLimit: 15,
          status: 'active'
        },
        include: { business: true }
      });
      
      console.log('✅ Nouveau trial créé:', trialUsage.identifier);
    }

    return trialUsage;
  }

  // Vérifier si un appel peut être effectué
  static async checkTrialStatus(identifier: string): Promise<TrialStatusCheck> {
    const trialUsage = await this.getOrCreateTrialUsage({
      identifier,
      identifierType: 'business_id'
    });

    // Calculer les jours restants
    const now = new Date();
    const trialEnd = trialUsage.trialEndDate || new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    
    // Mettre à jour les jours restants
    if (daysRemaining !== trialUsage.daysRemaining) {
      await prisma.trialUsage.update({
        where: { id: trialUsage.id },
        data: { 
          daysRemaining,
          daysUsed: trialUsage.daysLimit - daysRemaining
        }
      });
    }

    // Vérifications
    const isExpired = daysRemaining <= 0;
    const callsExhausted = trialUsage.callsRemaining <= 0;
    const isBlocked = trialUsage.isBlocked;

    let canMakeCall = true;
    let blockReason: string | undefined;

    if (isBlocked) {
      canMakeCall = false;
      blockReason = trialUsage.blockReason || 'Trial bloqué';
    } else if (isExpired) {
      canMakeCall = false;
      blockReason = 'Période d\'essai expirée';
    } else if (callsExhausted) {
      canMakeCall = false;
      blockReason = 'Limite d\'appels atteinte';
    }

    return {
      canMakeCall,
      callsRemaining: trialUsage.callsRemaining,
      daysRemaining,
      status: trialUsage.status,
      blockReason
    };
  }

  // Enregistrer l'utilisation d'un appel
  static async recordCallUsage(identifier: string): Promise<boolean> {
    try {
      const trialUsage = await this.getOrCreateTrialUsage({
        identifier,
        identifierType: 'business_id'
      });

      // Vérifier si l'appel peut être effectué
      const status = await this.checkTrialStatus(identifier);
      if (!status.canMakeCall) {
        console.log('❌ Appel bloqué:', status.blockReason);
        return false;
      }

      // Décrémenter les compteurs
      const updatedUsage = await prisma.trialUsage.update({
        where: { id: trialUsage.id },
        data: {
          callsUsed: { increment: 1 },
          callsRemaining: { decrement: 1 },
          lastCallDate: new Date(),
          lastActivityDate: new Date()
        },
        include: { business: true }
      });

      console.log(`✅ Appel enregistré pour ${identifier}: ${updatedUsage.callsUsed}/${updatedUsage.callsLimit}`);

      // Vérifier si des seuils sont atteints pour envoyer des emails
      await this.checkAndSendWarningEmails(updatedUsage);

      return true;
    } catch (error) {
      console.error('❌ Erreur enregistrement appel:', error);
      return false;
    }
  }

  // Vérifier et envoyer les emails d'avertissement
  static async checkAndSendWarningEmails(trialUsage: any) {
    const now = new Date();
    
    // Email d'avertissement si 8 appels utilisés ou 3 jours restants
    if (
      !trialUsage.warningEmailSent && 
      (trialUsage.callsUsed >= 8 || trialUsage.daysRemaining <= 3) &&
      trialUsage.business
    ) {
      const success = await emailService.sendTrialWarningEmail({
        firstName: trialUsage.business.owner?.firstName || 'Client',
        lastName: trialUsage.business.owner?.lastName || '',
        email: trialUsage.business.owner?.email || '',
        restaurantName: trialUsage.business.name,
        callsUsed: trialUsage.callsUsed,
        callsRemaining: trialUsage.callsRemaining,
        daysRemaining: trialUsage.daysRemaining
      });

      if (success) {
        await prisma.trialUsage.update({
          where: { id: trialUsage.id },
          data: {
            warningEmailSent: true,
            warningEmailDate: now,
            status: 'warned'
          }
        });
        console.log('📧 Email d\'avertissement envoyé');
      }
    }

    // Email de blocage si limite atteinte
    if (
      !trialUsage.blockedEmailSent && 
      (trialUsage.callsRemaining <= 0 || trialUsage.daysRemaining <= 0) &&
      trialUsage.business
    ) {
      const success = await emailService.sendTrialBlockedEmail({
        firstName: trialUsage.business.owner?.firstName || 'Client',
        lastName: trialUsage.business.owner?.lastName || '',
        email: trialUsage.business.owner?.email || '',
        restaurantName: trialUsage.business.name,
        totalCallsUsed: trialUsage.callsUsed
      });

      if (success) {
        const blockReason = trialUsage.callsRemaining <= 0 ? 'Limite d\'appels atteinte' : 'Période d\'essai expirée';
        
        await prisma.trialUsage.update({
          where: { id: trialUsage.id },
          data: {
            blockedEmailSent: true,
            blockedEmailDate: now,
            status: 'blocked',
            isBlocked: true,
            blockReason,
            scheduledDeletionDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 jours
          }
        });
        
        // BLOQUER AUTOMATIQUEMENT LES NUMÉROS TELNYX
        if (trialUsage.businessId) {
          console.log('🚫 Déclenchement blocage automatique numéros Telnyx');
          const blockingResult = await TelnyxBlockingService.blockTelnyxNumber(
            trialUsage.businessId,
            trialUsage.callsRemaining <= 0 ? 'trial_calls_exhausted' : 'trial_expired'
          );
          
          if (blockingResult.success) {
            console.log(`✅ ${blockingResult.blockedNumbers} numéros bloqués automatiquement`);
          } else {
            console.error('❌ Erreur blocage automatique:', blockingResult.error);
          }
        }
        
        console.log('📧 Email de blocage envoyé');
      }
    }
  }

  // Traitement batch pour les comptes expirés
  static async processPendingDeletions() {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    // Trouver les comptes bloqués depuis 3 jours pour email de suppression
    const pendingDeletion = await prisma.trialUsage.findMany({
      where: {
        status: 'blocked',
        blockedEmailDate: { lte: threeDaysAgo },
        deletionWarningEmailSent: false
      },
      include: { business: { include: { owner: true } } }
    });

    for (const trialUsage of pendingDeletion) {
      if (trialUsage.business?.owner) {
        const daysUntilDeletion = Math.max(1, Math.ceil(
          ((trialUsage.scheduledDeletionDate?.getTime() || 0) - now.getTime()) / (24 * 60 * 60 * 1000)
        ));

        const success = await emailService.sendTrialDeletionWarningEmail({
          firstName: trialUsage.business.owner.firstName,
          lastName: trialUsage.business.owner.lastName,
          email: trialUsage.business.owner.email,
          restaurantName: trialUsage.business.name,
          daysUntilDeletion
        });

        if (success) {
          await prisma.trialUsage.update({
            where: { id: trialUsage.id },
            data: {
              deletionWarningEmailSent: true,
              deletionWarningEmailDate: now,
              status: 'pending_deletion'
            }
          });
          console.log('📧 Email d\'avertissement suppression envoyé');
        }
      }
    }

    // Trouver les comptes à supprimer définitivement
    const toDelete = await prisma.trialUsage.findMany({
      where: {
        scheduledDeletionDate: { lte: now },
        status: { in: ['blocked', 'pending_deletion'] }
      },
      include: { business: { include: { owner: true } } }
    });

    for (const trialUsage of toDelete) {
      if (trialUsage.business?.owner) {
        // Envoyer email de confirmation suppression
        await emailService.sendAccountDeletedEmail({
          firstName: trialUsage.business.owner.firstName,
          lastName: trialUsage.business.owner.lastName,
          email: trialUsage.business.owner.email,
          restaurantName: trialUsage.business.name,
          deletionDate: now.toLocaleDateString('fr-FR')
        });

        // Marquer comme supprimé
        await prisma.trialUsage.update({
          where: { id: trialUsage.id },
          data: {
            status: 'deleted',
            deletionEmailSent: true,
            deletionEmailDate: now
          }
        });

        console.log('📧 Email de confirmation suppression envoyé');
        // TODO: Déclencher la suppression effective des données business
      }
    }

    return { pendingDeletion: pendingDeletion.length, deleted: toDelete.length };
  }

  // Statistiques pour l'admin
  static async getTrialStats() {
    const [active, warned, blocked, pendingDeletion, deleted] = await Promise.all([
      prisma.trialUsage.count({ where: { status: 'active' } }),
      prisma.trialUsage.count({ where: { status: 'warned' } }),
      prisma.trialUsage.count({ where: { status: 'blocked' } }),
      prisma.trialUsage.count({ where: { status: 'pending_deletion' } }),
      prisma.trialUsage.count({ where: { status: 'deleted' } })
    ]);

    const recent = await prisma.trialUsage.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      include: { business: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return {
      counts: { active, warned, blocked, pendingDeletion, deleted },
      recent
    };
  }

  // Réactiver un trial (lors du passage à un plan payant)
  static async activatePaidPlan(businessId: string) {
    await prisma.trialUsage.updateMany({
      where: { businessId, status: { in: ['blocked', 'pending_deletion'] } },
      data: {
        status: 'paid',
        isBlocked: false,
        blockReason: null,
        scheduledDeletionDate: null
      }
    });
    
    // DÉBLOQUER AUTOMATIQUEMENT LES NUMÉROS TELNYX
    console.log('✅ Déclenchement déblocage automatique numéros Telnyx');
    const unblockResult = await TelnyxBlockingService.unblockTelnyxNumber(businessId);
    
    if (unblockResult.success) {
      console.log(`✅ ${unblockResult.unblockedNumbers} numéros débloqués automatiquement`);
    } else {
      console.error('❌ Erreur déblocage automatique:', unblockResult.error);
    }
    
    console.log('✅ Trial réactivé pour plan payant:', businessId);
  }
}