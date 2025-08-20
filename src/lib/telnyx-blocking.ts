import { prisma } from './prisma';
import { TrialUsageService } from './trial-usage';

export interface TelnyxBlockingConfig {
  blockMessage: string;
  redirectUrl?: string;
  allowEmergencyCalls: boolean;
}

export interface TelnyxNumberStatus {
  phoneNumberId: string;
  telnyxNumberId: string;
  isBlocked: boolean;
  blockReason?: string;
  blockedAt?: Date;
  businessId: string;
}

export class TelnyxBlockingService {
  
  // Configuration par défaut pour les numéros bloqués
  private static readonly DEFAULT_BLOCK_CONFIG: TelnyxBlockingConfig = {
    blockMessage: "Votre période d'essai est terminée. Pour réactiver votre service, rendez-vous sur votre espace client ou contactez le support.",
    allowEmergencyCalls: true
  };

  // Bloquer automatiquement un numéro Telnyx
  static async blockTelnyxNumber(businessId: string, reason: 'trial_expired' | 'trial_calls_exhausted' | 'manual'): Promise<{
    success: boolean;
    blockedNumbers: number;
    error?: string;
  }> {
    try {
      console.log(`🚫 Blocage automatique numéros Telnyx pour business: ${businessId}`);

      // Récupérer tous les numéros de téléphone du business
      const phoneNumbers = await prisma.phoneNumber.findMany({
        where: { 
          business: { id: businessId },
          status: 'ACTIVE'
        }
      });

      if (phoneNumbers.length === 0) {
        return { success: true, blockedNumbers: 0 };
      }

      let blockedCount = 0;
      const errors: string[] = [];

      for (const phoneNumber of phoneNumbers) {
        try {
          // Configurer Telnyx pour rediriger vers un message vocal
          const blockResult = await this.configureBlockedNumber(phoneNumber.telnyxNumberId!, reason);
          
          if (blockResult.success) {
            // Mettre à jour le statut en base
            await prisma.phoneNumber.update({
              where: { id: phoneNumber.id },
              data: {
                status: 'BLOCKED',
                metadata: {
                  ...(phoneNumber.metadata as any || {}),
                  blocked: true,
                  blockReason: reason,
                  blockedAt: new Date().toISOString(),
                  originalConfig: phoneNumber.metadata // Sauvegarder config originale
                }
              }
            });

            blockedCount++;
            console.log(`✅ Numéro ${phoneNumber.phoneNumber} bloqué avec succès`);
          } else {
            errors.push(`${phoneNumber.phoneNumber}: ${blockResult.error}`);
          }
        } catch (error) {
          console.error(`❌ Erreur blocage ${phoneNumber.phoneNumber}:`, error);
          errors.push(`${phoneNumber.phoneNumber}: ${error}`);
        }
      }

      // Créer un log d'activité
      await this.createBlockingActivityLog(businessId, blockedCount, reason);

      return {
        success: errors.length === 0,
        blockedNumbers: blockedCount,
        error: errors.length > 0 ? errors.join('; ') : undefined
      };

    } catch (error) {
      console.error('❌ Erreur blocage Telnyx:', error);
      return {
        success: false,
        blockedNumbers: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Débloquer un numéro (lors activation plan payant)
  static async unblockTelnyxNumber(businessId: string): Promise<{
    success: boolean;
    unblockedNumbers: number;
    error?: string;
  }> {
    try {
      console.log(`✅ Déblocage numéros Telnyx pour business: ${businessId}`);

      const blockedNumbers = await prisma.phoneNumber.findMany({
        where: { 
          business: { id: businessId },
          status: 'BLOCKED'
        }
      });

      if (blockedNumbers.length === 0) {
        return { success: true, unblockedNumbers: 0 };
      }

      let unblockedCount = 0;

      for (const phoneNumber of blockedNumbers) {
        try {
          // Restaurer la configuration originale
          const unblockResult = await this.restoreOriginalConfig(phoneNumber.telnyxNumberId!, phoneNumber.metadata);
          
          if (unblockResult.success) {
            await prisma.phoneNumber.update({
              where: { id: phoneNumber.id },
              data: {
                status: 'ACTIVE',
                metadata: {
                  ...(phoneNumber.metadata as any || {}),
                  blocked: false,
                  unblockedAt: new Date().toISOString()
                }
              }
            });

            unblockedCount++;
            console.log(`✅ Numéro ${phoneNumber.phoneNumber} débloqué`);
          }
        } catch (error) {
          console.error(`❌ Erreur déblocage ${phoneNumber.phoneNumber}:`, error);
        }
      }

      // Réactiver le trial usage
      await TrialUsageService.activatePaidPlan(businessId);

      return { success: true, unblockedNumbers: unblockedCount };

    } catch (error) {
      console.error('❌ Erreur déblocage Telnyx:', error);
      return {
        success: false,
        unblockedNumbers: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Configurer un numéro pour le mode bloqué
  private static async configureBlockedNumber(telnyxNumberId: string, reason: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const apiKey = process.env.TELNYX_API_KEY;
      if (!apiKey) {
        throw new Error('TELNYX_API_KEY manquant');
      }

      // Message personnalisé selon la raison
      let message: string;
      switch (reason) {
        case 'trial_expired':
          message = "Votre période d'essai de 15 jours est terminée. Pour réactiver votre service immédiatement, connectez-vous à votre espace client et choisissez un plan adapté à votre restaurant.";
          break;
        case 'trial_calls_exhausted':
          message = "Vous avez utilisé vos 10 appels gratuits. Pour continuer à utiliser notre service IA 24h/24, passez à un plan payant depuis votre espace client.";
          break;
        default:
          message = this.DEFAULT_BLOCK_CONFIG.blockMessage;
      }

      // Configurer le webhook pour rediriger vers un message vocal
      const response = await fetch(`https://api.telnyx.com/v2/phone_numbers/${telnyxNumberId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/telnyx/blocked-call-handler`,
          webhook_failover_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/telnyx/blocked-call-failover`,
          webhook_request_method: 'POST'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telnyx API error: ${errorData.errors?.[0]?.detail || response.statusText}`);
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Erreur configuration blocage Telnyx:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Restaurer la configuration originale d'un numéro
  private static async restoreOriginalConfig(telnyxNumberId: string, metadata: any): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const apiKey = process.env.TELNYX_API_KEY;
      if (!apiKey) {
        throw new Error('TELNYX_API_KEY manquant');
      }

      const originalConfig = metadata?.originalConfig;
      if (!originalConfig) {
        console.warn('⚠️ Pas de configuration originale trouvée, utilisation config par défaut');
      }

      // Restaurer la configuration webhook originale
      const response = await fetch(`https://api.telnyx.com/v2/phone_numbers/${telnyxNumberId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhook_url: originalConfig?.webhook_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/telnyx/webhook`,
          webhook_failover_url: originalConfig?.webhook_failover_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/telnyx/webhooks`,
          webhook_request_method: 'POST'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telnyx API error: ${errorData.errors?.[0]?.detail || response.statusText}`);
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Erreur restauration config Telnyx:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Créer un log d'activité pour le blocage
  private static async createBlockingActivityLog(businessId: string, blockedCount: number, reason: string) {
    try {
      const business = await prisma.business.findFirst({
        where: { id: businessId },
        include: { stores: { take: 1 } }
      });

      if (business?.stores[0]) {
        await prisma.activityLog.create({
          data: {
            storeId: business.stores[0].id,
            type: 'PHONE_BLOCKED',
            title: `${blockedCount} numéro(s) Telnyx bloqué(s)`,
            description: `Blocage automatique suite à: ${reason}`,
            metadata: {
              blockedCount,
              reason,
              businessId,
              autoGenerated: true,
              timestamp: new Date().toISOString()
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Erreur création activity log blocage:', error);
    }
  }

  // Traitement batch des blocages pour les trials expirés
  static async processPendingBlocks(): Promise<{
    processed: number;
    blocked: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      blocked: 0,
      errors: [] as string[]
    };

    try {
      // Récupérer tous les trials bloqués qui n'ont pas encore leurs numéros bloqués
      const blockedTrials = await prisma.trialUsage.findMany({
        where: {
          status: 'blocked',
          isBlocked: true
        },
        include: {
          business: {
            include: {
              phoneNumbers: {
                where: { status: 'ACTIVE' } // Seulement les numéros encore actifs
              }
            }
          }
        }
      });

      for (const trial of blockedTrials) {
        results.processed++;
        
        if (trial.business?.phoneNumbers.length > 0) {
          const blockResult = await this.blockTelnyxNumber(
            trial.business.id,
            trial.blockReason?.includes('appels') ? 'trial_calls_exhausted' : 'trial_expired'
          );
          
          if (blockResult.success) {
            results.blocked += blockResult.blockedNumbers;
          } else {
            results.errors.push(`Business ${trial.business.id}: ${blockResult.error}`);
          }
        }
      }

    } catch (error) {
      console.error('❌ Erreur traitement batch blocages:', error);
      results.errors.push(`Erreur globale: ${error}`);
    }

    return results;
  }

  // Obtenir le statut de tous les numéros d'un business
  static async getNumbersStatus(businessId: string): Promise<TelnyxNumberStatus[]> {
    try {
      const phoneNumbers = await prisma.phoneNumber.findMany({
        where: { businessId }
      });

      return phoneNumbers.map(phone => ({
        phoneNumberId: phone.id,
        telnyxNumberId: phone.telnyxNumberId || '',
        isBlocked: phone.status === 'BLOCKED',
        blockReason: (phone.metadata as any)?.blockReason,
        blockedAt: (phone.metadata as any)?.blockedAt ? new Date((phone.metadata as any).blockedAt) : undefined,
        businessId
      }));

    } catch (error) {
      console.error('❌ Erreur récupération statut numéros:', error);
      return [];
    }
  }
}

// Middleware webhook handler pour les appels bloqués
export async function handleBlockedCall(telnyxEvent: any) {
  try {
    console.log('📞 Appel entrant sur numéro bloqué:', telnyxEvent);
    
    // Répondre avec un message vocal informatif
    const response = {
      actions: [
        {
          type: 'answer'
        },
        {
          type: 'speak',
          text: "Bonjour, le service de ce restaurant est temporairement indisponible suite à la fin de sa période d'essai. Pour plus d'informations, veuillez contacter directement le restaurant. Merci de votre compréhension.",
          voice: 'alice',
          language: 'fr-FR'
        },
        {
          type: 'hangup'
        }
      ]
    };

    return response;
  } catch (error) {
    console.error('❌ Erreur traitement appel bloqué:', error);
    return {
      actions: [
        {
          type: 'hangup'
        }
      ]
    };
  }
}