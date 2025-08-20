// ============================================================================
// SERVICE REMBOURSEMENT STRIPE - Gestion des échecs d'attribution Telnyx
// ============================================================================

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil'
});

export interface TelnyxFailureRefundData {
  stripeSubscriptionId: string;
  businessId: string;
  storeId: string;
  countryCode: string;
  reason: string;
  userId: string;
}

export class StripeRefundService {
  
  /**
   * Rembourser automatiquement un abonnement suite à un échec Telnyx
   */
  static async refundForTelnyxFailure(data: TelnyxFailureRefundData): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    try {
      console.log(`🔄 Remboursement automatique pour échec Telnyx - Subscription: ${data.stripeSubscriptionId}`);
      
      // 1. Récupérer l'abonnement Stripe
      const subscription = await stripe.subscriptions.retrieve(data.stripeSubscriptionId);
      if (!subscription) {
        throw new Error('Abonnement Stripe non trouvé');
      }

      // 2. Récupérer la dernière facture payée
      const latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
      if (!latestInvoice || !latestInvoice.payment_intent) {
        throw new Error('Aucune facture payée trouvée');
      }

      // 3. Créer le remboursement
      const refund = await stripe.refunds.create({
        payment_intent: typeof latestInvoice.payment_intent === 'string' ? latestInvoice.payment_intent : latestInvoice.payment_intent.id,
        amount: latestInvoice.amount_paid,
        reason: 'requested_by_customer',
        metadata: {
          reason: 'telnyx_attribution_failed',
          businessId: data.businessId,
          storeId: data.storeId,
          country: data.countryCode,
          originalError: data.reason,
          automaticRefund: 'true'
        }
      });

      console.log(`✅ Remboursement créé: ${refund.id} - Montant: ${refund.amount / 100}€`);

      // 4. Annuler l'abonnement
      await stripe.subscriptions.update(data.stripeSubscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          ...subscription.metadata,
          cancelled_reason: 'telnyx_attribution_failed',
          automatic_cancellation: 'true'
        }
      });

      // 5. Mettre à jour l'abonnement en DB
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: data.stripeSubscriptionId },
        data: {
          status: 'cancelled',
          isActive: false,
          cancelledAt: new Date(),
          cancelReason: `Remboursement automatique - Échec attribution numéro ${data.countryCode}: ${data.reason}`,
          notes: `Refund ID: ${refund.id}`
        }
      });

      // 6. Créer un log de remboursement
      await prisma.activityLog.create({
        data: {
          storeId: data.storeId,
          type: 'REFUND',
          title: 'Remboursement automatique - Échec Telnyx',
          description: `Remboursement automatique de ${refund.amount / 100}€ suite à l'échec d'attribution du numéro ${data.countryCode}`,
          amount: refund.amount / 100,
          metadata: JSON.stringify({
            refundId: refund.id,
            stripeSubscriptionId: data.stripeSubscriptionId,
            country: data.countryCode,
            telnyxError: data.reason,
            automaticRefund: true,
            status: 'COMPLETED'
          })
        }
      });

      // 7. Notifier l'utilisateur par email (optionnel)
      await this.sendRefundNotification(data, refund.id, refund.amount / 100);

      return {
        success: true,
        refundId: refund.id
      };

    } catch (error) {
      console.error('❌ Erreur remboursement automatique:', error);
      
      // Log l'erreur de remboursement
      await prisma.activityLog.create({
        data: {
          storeId: data.storeId,
          type: 'ERROR',
          title: 'Échec remboursement automatique',
          description: `Impossible de rembourser automatiquement suite à l'échec Telnyx: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          metadata: JSON.stringify({
            stripeSubscriptionId: data.stripeSubscriptionId,
            country: data.countryCode,
            telnyxError: data.reason,
            refundError: error instanceof Error ? error.message : 'Erreur inconnue',
            requiresManualIntervention: true
          })
        }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Vérifier si un remboursement est nécessaire pour un échec Telnyx
   */
  static async shouldRefundForTelnyxFailure(stripeSubscriptionId: string): Promise<boolean> {
    try {
      // Vérifier si c'est un nouvel abonnement (créé dans les dernières 24h)
      const dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId },
        include: { store: true }
      });

      if (!dbSubscription) return false;

      const createdAt = dbSubscription.createdAt;
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      // Rembourser uniquement si l'abonnement a moins de 24h et qu'aucun service n'a été utilisé
      return hoursSinceCreation < 24;

    } catch (error) {
      console.error('Erreur vérification remboursement:', error);
      return false;
    }
  }

  /**
   * Rembourser partiellement si des services ont été utilisés
   */
  static async partialRefundForUsage(data: TelnyxFailureRefundData, usageAmount: number): Promise<{
    success: boolean;
    refundId?: string;
    refundAmount?: number;
  }> {
    try {
      const subscription = await stripe.subscriptions.retrieve(data.stripeSubscriptionId);
      const latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
      
      if (!latestInvoice || !latestInvoice.payment_intent) {
        throw new Error('Aucune facture trouvée');
      }

      // Calculer le remboursement (montant payé - usage)
      const paidAmount = latestInvoice.amount_paid;
      const refundAmount = Math.max(0, paidAmount - (usageAmount * 100)); // Convertir en centimes

      if (refundAmount <= 0) {
        console.log('Aucun remboursement nécessaire - Usage supérieur au montant payé');
        return { success: true, refundAmount: 0 };
      }

      const refund = await stripe.refunds.create({
        payment_intent: typeof latestInvoice.payment_intent === 'string' ? latestInvoice.payment_intent : latestInvoice.payment_intent.id,
        amount: refundAmount,
        reason: 'requested_by_customer',
        metadata: {
          reason: 'partial_refund_telnyx_failure',
          usageAmount: usageAmount.toString(),
          originalAmount: (paidAmount / 100).toString()
        }
      });

      return {
        success: true,
        refundId: refund.id,
        refundAmount: refundAmount / 100
      };

    } catch (error) {
      console.error('Erreur remboursement partiel:', error);
      return { success: false };
    }
  }

  /**
   * Envoyer notification email de remboursement
   */
  private static async sendRefundNotification(
    data: TelnyxFailureRefundData, 
    refundId: string, 
    amount: number
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        include: { businesses: { include: { stores: true } } }
      });

      if (!user || !user.email) return;

      // Ici on pourrait intégrer un service d'email comme SendGrid, Resend, etc.
      console.log(`📧 Notification remboursement à envoyer à: ${user.email}`);
      console.log(`Montant remboursé: ${amount}€ - Refund ID: ${refundId}`);
      
      // TODO: Implémenter l'envoi d'email réel
      
    } catch (error) {
      console.error('Erreur notification email:', error);
    }
  }

  /**
   * Gérer les remboursements manuels depuis l'admin
   */
  static async manualRefundForTelnyxFailure(
    subscriptionId: string,
    reason: string,
    adminUserId: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
        include: { store: { include: { business: true } } }
      });

      if (!dbSubscription) {
        throw new Error('Abonnement non trouvé');
      }

      const refundData: TelnyxFailureRefundData = {
        stripeSubscriptionId: subscriptionId,
        businessId: dbSubscription.store.businessId,
        storeId: dbSubscription.storeId,
        countryCode: 'MANUAL',
        reason: reason,
        userId: dbSubscription.store.business.ownerId
      };

      const result = await this.refundForTelnyxFailure(refundData);

      // Log l'action admin
      if (result.success) {
        await prisma.activityLog.create({
          data: {
            storeId: dbSubscription.storeId,
            type: 'ADMIN_ACTION',
            title: 'Remboursement manuel par admin',
            description: `Remboursement manuel effectué par l'admin: ${reason}`,
            metadata: JSON.stringify({
              adminUserId,
              refundId: result.refundId,
              manualRefund: true
            })
          }
        });
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
}