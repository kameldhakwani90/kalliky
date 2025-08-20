import { TrialUsageService } from './trial-usage';
import { TelnyxBlockingService } from './telnyx-blocking';
import { prisma } from './prisma';

export interface AutomatedEmailStats {
  processed: number;
  warningsSent: number;
  blockingsSent: number;
  deletionWarningsSent: number;
  deletionsSent: number;
  numbersBlocked: number;
  errors: string[];
}

export class AutomatedEmailService {
  
  // Service principal pour traiter tous les emails automatiques
  static async processAutomatedEmails(): Promise<AutomatedEmailStats> {
    const stats: AutomatedEmailStats = {
      processed: 0,
      warningsSent: 0,
      blockingsSent: 0,
      deletionWarningsSent: 0,
      deletionsSent: 0,
      numbersBlocked: 0,
      errors: []
    };

    try {
      console.log('📧 Début traitement emails automatiques');

      // 1. TRAITER LES AVERTISSEMENTS TRIAL
      await this.processTrialWarnings(stats);

      // 2. TRAITER LES BLOCAGES TRIAL
      await this.processTrialBlockings(stats);

      // 3. TRAITER LES AVERTISSEMENTS DE SUPPRESSION
      await this.processDeletionWarnings(stats);

      // 4. TRAITER LES SUPPRESSIONS DÉFINITIVES
      await this.processAccountDeletions(stats);

      // 5. BLOQUER LES NUMÉROS EN ATTENTE
      await this.processNumberBlockings(stats);

      console.log('✅ Traitement emails automatiques terminé:', stats);

    } catch (error) {
      console.error('❌ Erreur traitement emails automatiques:', error);
      stats.errors.push(`Erreur globale: ${error}`);
    }

    return stats;
  }

  // 1. Traiter les avertissements de fin de trial
  private static async processTrialWarnings(stats: AutomatedEmailStats) {
    try {
      const now = new Date();
      
      // Trouver les trials qui doivent recevoir un avertissement
      const trialsNeedingWarning = await prisma.trialUsage.findMany({
        where: {
          status: 'active',
          warningEmailSent: false,
          OR: [
            { callsUsed: { gte: 8 } }, // 8 appels utilisés ou plus
            { daysRemaining: { lte: 3 } }, // 3 jours ou moins
            {
              AND: [
                { callsRemaining: { lte: 2 } }, // 2 appels ou moins restants
                { callsUsed: { gte: 5 } } // mais au moins 5 appels utilisés
              ]
            }
          ]
        },
        include: {
          business: {
            include: {
              owner: true
            }
          }
        }
      });

      for (const trial of trialsNeedingWarning) {
        try {
          stats.processed++;
          
          if (!trial.business?.owner) {
            stats.errors.push(`Trial ${trial.id}: pas d'owner trouvé`);
            continue;
          }

          // Calculer les jours restants en temps réel
          const trialEnd = trial.trialEndDate || new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
          const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

          // Envoyer l'email d'avertissement via le service existant
          const triggerWarning = await TrialUsageService.checkAndSendWarningEmails({
            ...trial,
            daysRemaining,
            business: trial.business
          });

          stats.warningsSent++;
          console.log(`📧 Email d'avertissement envoyé pour ${trial.business.name}`);

        } catch (error) {
          stats.errors.push(`Trial warning ${trial.id}: ${error}`);
        }
      }

    } catch (error) {
      stats.errors.push(`Erreur warnings: ${error}`);
    }
  }

  // 2. Traiter les blocages de trial
  private static async processTrialBlockings(stats: AutomatedEmailStats) {
    try {
      // Trouver les trials qui doivent être bloqués
      const trialsNeedingBlocking = await prisma.trialUsage.findMany({
        where: {
          OR: [
            { callsRemaining: { lte: 0 } },
            { daysRemaining: { lte: 0 } }
          ],
          status: { in: ['active', 'warned'] },
          isBlocked: false
        },
        include: {
          business: {
            include: {
              owner: true
            }
          }
        }
      });

      for (const trial of trialsNeedingBlocking) {
        try {
          stats.processed++;
          
          if (!trial.business?.owner) {
            stats.errors.push(`Trial ${trial.id}: pas d'owner trouvé`);
            continue;
          }

          // Déclencher le blocage via le service existant
          // (qui enverra automatiquement l'email et bloquera les numéros)
          await TrialUsageService.checkAndSendWarningEmails({
            ...trial,
            callsRemaining: 0, // Forcer le blocage
            business: trial.business
          });

          stats.blockingsSent++;
          console.log(`🚫 Blocage déclenché pour ${trial.business.name}`);

        } catch (error) {
          stats.errors.push(`Trial blocking ${trial.id}: ${error}`);
        }
      }

    } catch (error) {
      stats.errors.push(`Erreur blockings: ${error}`);
    }
  }

  // 3. Traiter les avertissements de suppression
  private static async processDeletionWarnings(stats: AutomatedEmailStats) {
    try {
      const result = await TrialUsageService.processPendingDeletions();
      stats.deletionWarningsSent = result.pendingDeletion;
      stats.deletionsSent = result.deleted;
      stats.processed += result.pendingDeletion + result.deleted;

    } catch (error) {
      stats.errors.push(`Erreur deletion warnings: ${error}`);
    }
  }

  // 4. Traiter les suppressions définitives (implémenté dans TrialUsageService)
  private static async processAccountDeletions(stats: AutomatedEmailStats) {
    // Déjà traité dans processPendingDeletions
  }

  // 5. Traiter les blocages de numéros en attente
  private static async processNumberBlockings(stats: AutomatedEmailStats) {
    try {
      const result = await TelnyxBlockingService.processPendingBlocks();
      stats.numbersBlocked = result.blocked;
      stats.errors.push(...result.errors);

    } catch (error) {
      stats.errors.push(`Erreur number blockings: ${error}`);
    }
  }

  // Planificateur intelligent basé sur les seuils
  static async getProcessingSchedule(): Promise<{
    nextRun: Date;
    priority: 'low' | 'medium' | 'high';
    reason: string;
  }> {
    try {
      const now = new Date();
      
      // Compter les trials critiques
      const [criticalTrials, expiredTrials] = await Promise.all([
        prisma.trialUsage.count({
          where: {
            status: 'active',
            OR: [
              { callsRemaining: { lte: 2 } },
              { daysRemaining: { lte: 1 } }
            ]
          }
        }),
        prisma.trialUsage.count({
          where: {
            OR: [
              { callsRemaining: { lte: 0 } },
              { daysRemaining: { lte: 0 } }
            ],
            isBlocked: false
          }
        })
      ]);

      let priority: 'low' | 'medium' | 'high' = 'low';
      let nextRun = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4h par défaut
      let reason = 'Vérification de routine';

      if (expiredTrials > 0) {
        priority = 'high';
        nextRun = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
        reason = `${expiredTrials} trials expirés nécessitent blocage immédiat`;
      } else if (criticalTrials > 0) {
        priority = 'medium';
        nextRun = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
        reason = `${criticalTrials} trials critiques à surveiller`;
      }

      return { nextRun, priority, reason };

    } catch (error) {
      console.error('❌ Erreur calcul schedule:', error);
      return {
        nextRun: new Date(Date.now() + 60 * 60 * 1000), // 1h
        priority: 'medium',
        reason: 'Erreur calcul - vérification de sécurité'
      };
    }
  }

  // Rapport détaillé pour l'admin
  static async generateProcessingReport(): Promise<{
    summary: AutomatedEmailStats;
    details: {
      activeTrials: number;
      warnedTrials: number;
      blockedTrials: number;
      pendingDeletion: number;
      blockedNumbers: number;
    };
    nextActions: Array<{
      action: string;
      count: number;
      deadline: Date;
    }>;
  }> {
    try {
      const [trialStats, summary] = await Promise.all([
        TrialUsageService.getTrialStats(),
        this.processAutomatedEmails()
      ]);

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Calculer les actions à venir
      const [upcomingWarnings, upcomingBlocks, upcomingDeletions] = await Promise.all([
        prisma.trialUsage.count({
          where: {
            status: 'active',
            warningEmailSent: false,
            OR: [
              { callsRemaining: { lte: 3 } },
              { daysRemaining: { lte: 4 } }
            ]
          }
        }),
        prisma.trialUsage.count({
          where: {
            status: { in: ['active', 'warned'] },
            isBlocked: false,
            OR: [
              { callsRemaining: { lte: 1 } },
              { daysRemaining: { lte: 1 } }
            ]
          }
        }),
        prisma.trialUsage.count({
          where: {
            status: 'blocked',
            scheduledDeletionDate: { lte: tomorrow }
          }
        })
      ]);

      return {
        summary,
        details: {
          activeTrials: trialStats.counts.active,
          warnedTrials: trialStats.counts.warned,
          blockedTrials: trialStats.counts.blocked,
          pendingDeletion: trialStats.counts.pendingDeletion,
          blockedNumbers: await prisma.phoneNumber.count({
            where: { status: 'BLOCKED' }
          })
        },
        nextActions: [
          {
            action: 'Emails d\'avertissement à envoyer',
            count: upcomingWarnings,
            deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000)
          },
          {
            action: 'Comptes à bloquer',
            count: upcomingBlocks,
            deadline: new Date(now.getTime() + 60 * 60 * 1000)
          },
          {
            action: 'Suppressions programmées',
            count: upcomingDeletions,
            deadline: tomorrow
          }
        ]
      };

    } catch (error) {
      console.error('❌ Erreur génération rapport:', error);
      throw error;
    }
  }
}