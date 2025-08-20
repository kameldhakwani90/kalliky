import { NextRequest, NextResponse } from 'next/server';
import { TrialUsageService } from '../trial-usage';

export interface TrialLimitsResult {
  allowed: boolean;
  reason?: string;
  remainingCalls?: number;
  remainingDays?: number;
}

export class TrialLimitsMiddleware {
  
  // Middleware principal pour vérifier les limites avant appels Telnyx
  static async checkTrialLimits(businessId: string): Promise<TrialLimitsResult> {
    try {
      const status = await TrialUsageService.checkTrialStatus(businessId);
      
      if (!status.canMakeCall) {
        return {
          allowed: false,
          reason: status.blockReason || 'Limite de trial atteinte',
          remainingCalls: status.callsRemaining,
          remainingDays: status.daysRemaining
        };
      }

      return {
        allowed: true,
        remainingCalls: status.callsRemaining,
        remainingDays: status.daysRemaining
      };

    } catch (error) {
      console.error('❌ Erreur vérification limites trial:', error);
      return {
        allowed: false,
        reason: 'Erreur de vérification des limites'
      };
    }
  }

  // Middleware pour les requêtes HTTP entrantes
  static async handleRequest(request: NextRequest, businessId: string) {
    const limitsResult = await this.checkTrialLimits(businessId);
    
    if (!limitsResult.allowed) {
      return NextResponse.json(
        {
          error: 'Trial limits exceeded',
          reason: limitsResult.reason,
          remainingCalls: limitsResult.remainingCalls,
          remainingDays: limitsResult.remainingDays,
          action: 'upgrade_required'
        },
        { 
          status: 402, // Payment Required
          headers: {
            'X-Trial-Limit-Exceeded': 'true',
            'X-Remaining-Calls': String(limitsResult.remainingCalls || 0),
            'X-Remaining-Days': String(limitsResult.remainingDays || 0)
          }
        }
      );
    }

    return null; // Continue with the request
  }

  // Vérification spécifique pour les appels Telnyx
  static async checkBeforeTelnyxCall(businessId: string): Promise<{
    canProceed: boolean;
    error?: any;
  }> {
    const limitsResult = await this.checkTrialLimits(businessId);
    
    if (!limitsResult.allowed) {
      const error = {
        code: 'TRIAL_LIMITS_EXCEEDED',
        message: limitsResult.reason,
        data: {
          remainingCalls: limitsResult.remainingCalls,
          remainingDays: limitsResult.remainingDays,
          upgradeUrl: `/app/billing?upgrade=true&reason=trial_limit`
        }
      };

      console.log('🚫 Appel Telnyx bloqué:', error);
      
      return {
        canProceed: false,
        error
      };
    }

    return { canProceed: true };
  }

  // Post-traitement après un appel réussi
  static async recordSuccessfulCall(businessId: string): Promise<boolean> {
    try {
      return await TrialUsageService.recordCallUsage(businessId);
    } catch (error) {
      console.error('❌ Erreur enregistrement appel réussi:', error);
      return false;
    }
  }

  // Vérifier si un business a un plan payant actif
  static async hasPaidPlan(businessId: string): Promise<boolean> {
    try {
      const { prisma } = await import('../prisma');
      
      const subscription = await prisma.subscription.findFirst({
        where: {
          businessId,
          status: { in: ['active', 'trialing'] }
        }
      });

      return !!subscription;
    } catch (error) {
      console.error('❌ Erreur vérification plan payant:', error);
      return false;
    }
  }

  // Réponse standardisée pour les limites dépassées
  static createLimitExceededResponse(limitsResult: TrialLimitsResult) {
    const isCallsExhausted = (limitsResult.remainingCalls || 0) <= 0;
    const isDaysExpired = (limitsResult.remainingDays || 0) <= 0;

    let title: string;
    let message: string;
    let urgency: 'low' | 'medium' | 'high' = 'medium';

    if (isCallsExhausted && isDaysExpired) {
      title = '🔒 Période d\'essai terminée';
      message = 'Votre essai gratuit et vos appels sont épuisés. Passez à un plan payant pour continuer.';
      urgency = 'high';
    } else if (isCallsExhausted) {
      title = '📞 Limite d\'appels atteinte';
      message = `Vous avez utilisé tous vos appels gratuits. Il vous reste ${limitsResult.remainingDays} jours pour passer à un plan payant.`;
      urgency = 'high';
    } else if (isDaysExpired) {
      title = '⏰ Période d\'essai expirée';
      message = 'Votre période d\'essai de 15 jours est terminée. Activez un plan pour continuer à utiliser le service.';
      urgency = 'high';
    } else {
      title = '⚠️ Service suspendu';
      message = limitsResult.reason || 'Votre service a été temporairement suspendu.';
      urgency = 'medium';
    }

    return {
      blocked: true,
      title,
      message,
      urgency,
      remainingCalls: limitsResult.remainingCalls || 0,
      remainingDays: limitsResult.remainingDays || 0,
      actions: {
        upgrade: {
          label: 'Passer à un plan payant',
          url: `/app/billing?upgrade=true&reason=trial_limit&urgency=${urgency}`
        },
        contact: {
          label: 'Contacter le support',
          url: '/support'
        }
      }
    };
  }

  // Utilitaire pour les appels API externes (Telnyx, etc.)
  static async wrapExternalCall<T>(
    businessId: string,
    externalCall: () => Promise<T>
  ): Promise<{
    success: boolean;
    data?: T;
    error?: any;
  }> {
    // Vérifier les limites avant l'appel
    const checkResult = await this.checkBeforeTelnyxCall(businessId);
    
    if (!checkResult.canProceed) {
      return {
        success: false,
        error: checkResult.error
      };
    }

    try {
      // Exécuter l'appel externe
      const result = await externalCall();
      
      // Enregistrer l'utilisation après succès
      await this.recordSuccessfulCall(businessId);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Erreur appel externe:', error);
      return {
        success: false,
        error: {
          code: 'EXTERNAL_CALL_FAILED',
          message: 'L\'appel externe a échoué',
          originalError: error
        }
      };
    }
  }
}

// Export des types pour utilisation externe
export type {
  TrialLimitsResult
};