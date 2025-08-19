// ============================================================================
// STRIPE + TELNYX AUTOMATION - Gestion automatique des numéros selon paiements
// ============================================================================

import Stripe from 'stripe';
import { prisma } from './prisma';
import { telnyxAutoPurchase } from './telnyx';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export interface SubscriptionStatus {
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  current_period_end: number;
  days_overdue?: number;
}

class StripeAutomationService {
  
  // ============================================================================
  // VÉRIFICATION STATUT ABONNEMENT
  // ============================================================================

  async checkSubscriptionStatus(businessId: string): Promise<SubscriptionStatus | null> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          subscription: true,
        },
      });

      if (!business?.subscription?.stripeSubscriptionId) {
        return null;
      }

      const subscription = await stripe.subscriptions.retrieve(
        business.subscription.stripeSubscriptionId
      );

      const status: SubscriptionStatus = {
        status: subscription.status as any,
        current_period_end: subscription.current_period_end,
      };

      // Calculer les jours de retard si past_due
      if (subscription.status === 'past_due') {
        const daysOverdue = Math.floor(
          (Date.now() / 1000 - subscription.current_period_end) / (24 * 3600)
        );
        status.days_overdue = daysOverdue;
      }

      return status;
    } catch (error) {
      console.error('❌ Erreur vérification abonnement:', error);
      return null;
    }
  }

  // ============================================================================
  // ACTIONS AUTOMATIQUES SELON STATUT PAIEMENT
  // ============================================================================

  async handlePaymentSuccess(businessId: string): Promise<void> {
    try {
      console.log(`💰 Paiement réussi pour business: ${businessId}`);

      // 1. Mettre à jour le statut en base
      await prisma.business.update({
        where: { id: businessId },
        data: { 
          subscriptionStatus: 'ACTIVE',
          lastPaymentDate: new Date(),
        },
      });

      // 2. Réactiver tous les numéros suspendus
      await telnyxAutoPurchase.reactivateNumbersForBusiness(businessId);

      // 3. Si aucun numéro actif, en acheter un automatiquement
      const activeNumbers = await prisma.phoneNumber.count({
        where: { 
          businessId, 
          status: 'ACTIVE' 
        },
      });

      if (activeNumbers === 0) {
        await this.autoPurchaseForBusiness(businessId);
      }

      console.log(`✅ Business réactivé: ${businessId}`);
    } catch (error) {
      console.error('❌ Erreur handlePaymentSuccess:', error);
    }
  }

  async handlePaymentFailed(businessId: string, daysOverdue = 0): Promise<void> {
    try {
      console.log(`💳 Échec paiement pour business: ${businessId} (${daysOverdue} jours)`);

      if (daysOverdue >= 7) {
        // Après 7 jours: suspendre les numéros
        await this.suspendBusinessNumbers(businessId);
      }

      if (daysOverdue >= 30) {
        // Après 30 jours: annuler définitivement
        await this.cancelBusinessNumbers(businessId);
      }

    } catch (error) {
      console.error('❌ Erreur handlePaymentFailed:', error);
    }
  }

  async handleSubscriptionCanceled(businessId: string): Promise<void> {
    try {
      console.log(`❌ Abonnement annulé pour business: ${businessId}`);

      // Mettre à jour le statut
      await prisma.business.update({
        where: { id: businessId },
        data: { subscriptionStatus: 'CANCELLED' },
      });

      // Annuler tous les numéros
      await this.cancelBusinessNumbers(businessId);

      console.log(`✅ Business désactivé: ${businessId}`);
    } catch (error) {
      console.error('❌ Erreur handleSubscriptionCanceled:', error);
    }
  }

  // ============================================================================
  // GESTION DES NUMÉROS
  // ============================================================================

  private async suspendBusinessNumbers(businessId: string): Promise<void> {
    try {
      await telnyxAutoPurchase.suspendNumberForBusiness(businessId);
      
      // Mettre à jour le statut business
      await prisma.business.update({
        where: { id: businessId },
        data: { subscriptionStatus: 'PAST_DUE' },
      });

      console.log(`⏸️ Numéros suspendus pour business: ${businessId}`);
    } catch (error) {
      console.error('❌ Erreur suspension numéros:', error);
    }
  }

  private async cancelBusinessNumbers(businessId: string): Promise<void> {
    try {
      await telnyxAutoPurchase.cancelNumbersForBusiness(businessId);
      
      // Mettre à jour le statut business
      await prisma.business.update({
        where: { id: businessId },
        data: { subscriptionStatus: 'CANCELLED' },
      });

      console.log(`❌ Numéros annulés pour business: ${businessId}`);
    } catch (error) {
      console.error('❌ Erreur annulation numéros:', error);
    }
  }

  private async autoPurchaseForBusiness(businessId: string): Promise<void> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { stores: true },
      });

      if (!business || business.stores.length === 0) {
        console.warn(`⚠️ Business ou store non trouvé: ${businessId}`);
        return;
      }

      const store = business.stores[0];
      const countryCode = this.getCountryCodeFromAddress(store.address || business.country || 'FR');

      await telnyxAutoPurchase.purchaseNumberForStore(
        businessId,
        store.id,
        countryCode
      );

      console.log(`📞 Numéro auto-acheté pour business: ${businessId}`);
    } catch (error) {
      console.error('❌ Erreur auto-purchase:', error);
    }
  }

  private getCountryCodeFromAddress(address: string): string {
    // Logique simple pour détecter le pays depuis l'adresse
    const countryPatterns = {
      'FR': ['france', 'français', 'paris', 'lyon', 'marseille'],
      'US': ['usa', 'america', 'new york', 'california', 'texas'],
      'GB': ['uk', 'london', 'england', 'britain'],
      'DE': ['germany', 'berlin', 'munich', 'hamburg'],
      'ES': ['spain', 'madrid', 'barcelona', 'valencia'],
      'IT': ['italy', 'rome', 'milan', 'naples'],
    };

    const lowerAddress = address.toLowerCase();
    
    for (const [code, patterns] of Object.entries(countryPatterns)) {
      if (patterns.some(pattern => lowerAddress.includes(pattern))) {
        return code;
      }
    }

    return 'FR'; // Défaut France
  }

  // ============================================================================
  // SURVEILLANCE AUTOMATIQUE DES ABONNEMENTS
  // ============================================================================

  async runAutomatedChecks(): Promise<void> {
    try {
      console.log('🔄 Démarrage vérification automatique des abonnements...');

      // Récupérer tous les business avec abonnement actif
      const businesses = await prisma.business.findMany({
        where: {
          subscriptionStatus: { in: ['ACTIVE', 'PAST_DUE'] },
        },
        include: {
          subscription: true,
          phoneNumbers: true,
        },
      });

      for (const business of businesses) {
        try {
          const status = await this.checkSubscriptionStatus(business.id);
          
          if (!status) continue;

          // Actions selon le statut
          switch (status.status) {
            case 'active':
              if (business.subscriptionStatus !== 'ACTIVE') {
                await this.handlePaymentSuccess(business.id);
              }
              break;

            case 'past_due':
              await this.handlePaymentFailed(business.id, status.days_overdue);
              break;

            case 'canceled':
            case 'unpaid':
              await this.handleSubscriptionCanceled(business.id);
              break;
          }

          // Petit délai pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`❌ Erreur vérification business ${business.id}:`, error);
        }
      }

      console.log(`✅ Vérification terminée: ${businesses.length} business vérifiés`);
    } catch (error) {
      console.error('❌ Erreur runAutomatedChecks:', error);
    }
  }

  // ============================================================================
  // RAPPORTS ET STATISTIQUES
  // ============================================================================

  async getPaymentStatusReport(): Promise<{
    active: number;
    pastDue: number;
    canceled: number;
    totalPhoneNumbers: number;
    suspendedNumbers: number;
  }> {
    try {
      const [active, pastDue, canceled, totalNumbers, suspended] = await Promise.all([
        prisma.business.count({ where: { subscriptionStatus: 'ACTIVE' } }),
        prisma.business.count({ where: { subscriptionStatus: 'PAST_DUE' } }),
        prisma.business.count({ where: { subscriptionStatus: 'CANCELLED' } }),
        prisma.phoneNumber.count({ where: { status: 'ACTIVE' } }),
        prisma.phoneNumber.count({ where: { status: 'SUSPENDED' } }),
      ]);

      return {
        active,
        pastDue,
        canceled,
        totalPhoneNumbers: totalNumbers,
        suspendedNumbers: suspended,
      };
    } catch (error) {
      console.error('❌ Erreur rapport statuts:', error);
      return {
        active: 0,
        pastDue: 0,
        canceled: 0,
        totalPhoneNumbers: 0,
        suspendedNumbers: 0,
      };
    }
  }
}

// Export singleton
export const stripeAutomation = new StripeAutomationService();

// ============================================================================
// WEBHOOK STRIPE HANDLER
// ============================================================================

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  try {
    console.log(`💳 Webhook Stripe: ${event.type}`);

    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`⚠️ Événement Stripe non géré: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ Erreur webhook Stripe:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const businessId = await getBusinessIdFromCustomer(invoice.customer as string);
  if (businessId) {
    await stripeAutomation.handlePaymentSuccess(businessId);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const businessId = await getBusinessIdFromCustomer(invoice.customer as string);
  if (businessId) {
    await stripeAutomation.handlePaymentFailed(businessId);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const businessId = await getBusinessIdFromCustomer(subscription.customer as string);
  if (businessId) {
    if (subscription.status === 'active') {
      await stripeAutomation.handlePaymentSuccess(businessId);
    } else if (['past_due', 'unpaid'].includes(subscription.status)) {
      await stripeAutomation.handlePaymentFailed(businessId);
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const businessId = await getBusinessIdFromCustomer(subscription.customer as string);
  if (businessId) {
    await stripeAutomation.handleSubscriptionCanceled(businessId);
  }
}

async function getBusinessIdFromCustomer(customerId: string): Promise<string | null> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });
    return subscription?.businessId || null;
  } catch (error) {
    console.error('❌ Erreur récupération businessId:', error);
    return null;
  }
}

// ============================================================================
// CRON JOB POUR VÉRIFICATIONS AUTOMATIQUES
// ============================================================================

export async function runDailyAutomationChecks(): Promise<void> {
  console.log('🕐 Démarrage vérifications quotidiennes Stripe + Telnyx...');
  await stripeAutomation.runAutomatedChecks();
}