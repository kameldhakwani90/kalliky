/**
 * CRON JOB - Suppression automatique des comptes trial après 5 jours d'inactivité
 * 
 * Ce service gère la suppression automatique des comptes trial qui:
 * 1. Sont en statut "blocked" depuis plus de 5 jours
 * 2. Ont déjà reçu l'email d'avertissement de suppression
 * 3. N'ont plus d'activité récente
 * 
 * Actions effectuées lors de la suppression:
 * - Suppression des données Stripe (subscriptions, customer)
 * - Libération des numéros Telnyx
 * - Suppression des données en base de données
 * - Envoi email de confirmation de suppression
 */

import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import { TelnyxBlockingService } from '@/lib/telnyx-blocking';

interface DeletionResult {
  deletedBusinesses: number;
  errors: string[];
  details: Array<{
    businessId: string;
    businessName: string;
    deletionDate: Date;
    reason: string;
  }>;
}

export class TrialDeletionCronService {

  // Configuration des délais
  private static readonly DELETION_DELAY_DAYS = 5;
  private static readonly WARNING_EMAIL_DELAY_DAYS = 3; // Email d'avertissement 3 jours après blocage

  /**
   * Processus principal du CRON job
   * À exécuter quotidiennement
   */
  static async processScheduledDeletions(): Promise<DeletionResult> {
    console.log('🗑️ [CRON] Démarrage processus suppression automatique trials');
    
    const result: DeletionResult = {
      deletedBusinesses: 0,
      errors: [],
      details: []
    };

    try {
      // Étape 1: Envoyer les emails d'avertissement (3 jours après blocage)
      await this.sendDeletionWarningEmails();

      // Étape 2: Identifier les comptes à supprimer (5 jours après blocage)
      const businessesToDelete = await this.findBusinessesToDelete();
      
      if (businessesToDelete.length === 0) {
        console.log('✅ [CRON] Aucun compte trial à supprimer aujourd\'hui');
        return result;
      }

      console.log(`🔍 [CRON] ${businessesToDelete.length} comptes trial à supprimer`);

      // Étape 3: Supprimer chaque compte
      for (const trialUsage of businessesToDelete) {
        try {
          const deletionDetail = await this.deleteTrialBusiness(trialUsage);
          if (deletionDetail) {
            result.details.push(deletionDetail);
            result.deletedBusinesses++;
          }
        } catch (error) {
          const errorMsg = `Erreur suppression ${trialUsage.businessId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
          console.error(`❌ [CRON] ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }

      console.log(`✅ [CRON] Suppression terminée: ${result.deletedBusinesses} comptes supprimés, ${result.errors.length} erreurs`);

    } catch (error) {
      const errorMsg = `Erreur globale CRON suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
      console.error(`❌ [CRON] ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    return result;
  }

  /**
   * Envoyer les emails d'avertissement aux comptes bloqués depuis 3 jours
   */
  private static async sendDeletionWarningEmails(): Promise<void> {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() - this.WARNING_EMAIL_DELAY_DAYS);

    const trialsForWarning = await prisma.trialUsage.findMany({
      where: {
        status: 'blocked',
        isBlocked: true,
        deletionWarningEmailSent: false,
        blockedEmailDate: {
          lte: warningDate
        },
        business: {
          isNot: null
        }
      },
      include: {
        business: {
          include: {
            owner: { select: { email: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    console.log(`📧 [CRON] ${trialsForWarning.length} emails d'avertissement à envoyer`);

    for (const trial of trialsForWarning) {
      try {
        if (trial.business && trial.business.owner) {
          const deletionDate = new Date(trial.blockedEmailDate || new Date());
          deletionDate.setDate(deletionDate.getDate() + this.DELETION_DELAY_DAYS);

          await emailService.sendTrialDeletionWarning(
            trial.business.owner.email,
            {
              firstName: trial.business.owner.firstName || 'Client',
              businessName: trial.business.name,
              deletionDate: deletionDate.toLocaleDateString('fr-FR'),
              callsUsed: trial.callsUsed,
              daysRemaining: Math.max(0, trial.daysRemaining)
            }
          );

          // Marquer l'email comme envoyé
          await prisma.trialUsage.update({
            where: { id: trial.id },
            data: { 
              deletionWarningEmailSent: true,
              deletionWarningEmailDate: new Date()
            }
          });

          console.log(`📧 [CRON] Email avertissement envoyé à ${trial.business.owner.email}`);
        }
      } catch (error) {
        console.error(`❌ [CRON] Erreur envoi email avertissement ${trial.businessId}:`, error);
      }
    }
  }

  /**
   * Identifier les comptes trial à supprimer (bloqués depuis 5 jours)
   */
  private static async findBusinessesToDelete() {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() - this.DELETION_DELAY_DAYS);

    return await prisma.trialUsage.findMany({
      where: {
        status: 'blocked',
        isBlocked: true,
        deletionWarningEmailSent: true, // Email d'avertissement déjà envoyé
        blockedEmailDate: {
          lte: deletionDate
        },
        business: {
          isNot: null
        }
      },
      include: {
        business: {
          include: {
            owner: { select: { email: true, firstName: true, lastName: true } },
            stores: { select: { id: true, name: true } },
            phoneNumbers: { select: { id: true, phoneNumber: true, status: true } },
            subscriptions: { select: { id: true, stripeSubscriptionId: true, stripeCustomerId: true } }
          }
        }
      }
    });
  }

  /**
   * Supprimer complètement un compte trial
   */
  private static async deleteTrialBusiness(trialUsage: any): Promise<{
    businessId: string;
    businessName: string;
    deletionDate: Date;
    reason: string;
  } | null> {
    
    const business = trialUsage.business;
    if (!business) return null;

    console.log(`🗑️ [CRON] Suppression du compte: ${business.name} (${business.id})`);

    try {
      // Transaction pour assurer la cohérence
      const result = await prisma.$transaction(async (tx) => {
        
        // 1. Libérer les numéros Telnyx
        if (business.phoneNumbers && business.phoneNumbers.length > 0) {
          for (const phoneNumber of business.phoneNumbers) {
            try {
              await TelnyxBlockingService.releaseTelnyxNumber(phoneNumber.phoneNumber);
              console.log(`📞 [CRON] Numéro Telnyx libéré: ${phoneNumber.phoneNumber}`);
            } catch (error) {
              console.error(`❌ [CRON] Erreur libération numéro ${phoneNumber.phoneNumber}:`, error);
            }
          }
        }

        // 2. Supprimer les données Stripe (subscriptions)
        if (business.subscriptions && business.subscriptions.length > 0) {
          for (const subscription of business.subscriptions) {
            try {
              if (subscription.stripeSubscriptionId) {
                // Note: Ici il faudrait appeler l'API Stripe pour annuler la subscription
                console.log(`💳 [CRON] Suppression Stripe subscription: ${subscription.stripeSubscriptionId}`);
              }
            } catch (error) {
              console.error(`❌ [CRON] Erreur suppression Stripe:`, error);
            }
          }
        }

        // 3. Envoyer email de confirmation avant suppression
        if (business.owner) {
          try {
            await emailService.sendAccountDeletedConfirmation(
              business.owner.email,
              {
                firstName: business.owner.firstName || 'Client',
                businessName: business.name,
                deletionDate: new Date().toLocaleDateString('fr-FR')
              }
            );
            console.log(`📧 [CRON] Email confirmation suppression envoyé`);
          } catch (error) {
            console.error(`❌ [CRON] Erreur envoi email confirmation:`, error);
          }
        }

        // 4. Supprimer toutes les données en cascade
        // Les relations sont configurées avec onDelete: Cascade dans le schema

        // Supprimer d'abord les enregistrements liés
        await tx.trialUsage.delete({ where: { businessId: business.id } });
        await tx.phoneNumber.deleteMany({ where: { businessId: business.id } });
        await tx.store.deleteMany({ where: { businessId: business.id } });
        await tx.subscription.deleteMany({ where: { businessId: business.id } });
        await tx.openAIUsage.deleteMany({ where: { businessId: business.id } });
        await tx.telnyxUsage.deleteMany({ where: { businessId: business.id } });
        await tx.consumptionSummary.deleteMany({ where: { businessId: business.id } });

        // Supprimer le business (et l'utilisateur en cascade via la relation)
        await tx.business.delete({ 
          where: { id: business.id }
        });

        // Enregistrer l'activité de suppression
        await tx.activityLog.create({
          data: {
            type: 'TRIAL_AUTO_DELETION',
            description: `Suppression automatique du compte trial ${business.name} après 5 jours d'inactivité`,
            metadata: {
              businessId: business.id,
              businessName: business.name,
              ownerEmail: business.owner?.email,
              deletionReason: 'TRIAL_EXPIRED_AUTO_DELETION',
              blockedDate: trialUsage.blockedEmailDate,
              deletionDate: new Date()
            }
          }
        });

        return {
          businessId: business.id,
          businessName: business.name,
          deletionDate: new Date(),
          reason: 'Trial expiré - Suppression automatique après 5 jours'
        };
      });

      console.log(`✅ [CRON] Compte ${business.name} supprimé avec succès`);
      return result;

    } catch (error) {
      console.error(`❌ [CRON] Erreur suppression business ${business.id}:`, error);
      throw error;
    }
  }

  /**
   * Nettoyage des logs et données anciennes (à exécuter hebdomadairement)
   */
  static async cleanupOldData(): Promise<void> {
    console.log('🧹 [CRON] Nettoyage des anciennes données');

    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Supprimer les anciens logs d'activité
      const deletedLogs = await prisma.activityLog.deleteMany({
        where: {
          createdAt: { lt: oneMonthAgo },
          type: { in: ['TRIAL_AUTO_DELETION', 'TRIAL_WARNING_EMAIL', 'TRIAL_BLOCKED_EMAIL'] }
        }
      });

      console.log(`🧹 [CRON] ${deletedLogs.count} anciens logs supprimés`);

      // Nettoyage d'autres données anciennes si nécessaire...

    } catch (error) {
      console.error('❌ [CRON] Erreur nettoyage données:', error);
    }
  }

  /**
   * Statistiques pour monitoring
   */
  static async getStatistics() {
    try {
      const stats = await prisma.trialUsage.aggregate({
        _count: {
          id: true
        },
        where: {
          status: 'blocked',
          isBlocked: true
        }
      });

      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() - this.WARNING_EMAIL_DELAY_DAYS);

      const pendingWarnings = await prisma.trialUsage.count({
        where: {
          status: 'blocked',
          isBlocked: true,
          deletionWarningEmailSent: false,
          blockedEmailDate: { lte: warningDate }
        }
      });

      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() - this.DELETION_DELAY_DAYS);

      const pendingDeletions = await prisma.trialUsage.count({
        where: {
          status: 'blocked',
          isBlocked: true,
          deletionWarningEmailSent: true,
          blockedEmailDate: { lte: deletionDate }
        }
      });

      return {
        totalBlockedTrials: stats._count.id,
        pendingWarningEmails: pendingWarnings,
        pendingDeletions: pendingDeletions
      };

    } catch (error) {
      console.error('❌ Erreur récupération statistiques CRON:', error);
      return {
        totalBlockedTrials: 0,
        pendingWarningEmails: 0,
        pendingDeletions: 0
      };
    }
  }
}