import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { handleStripeWebhook } from '@/lib/stripe-telnyx-automation';
import { StoreCacheService } from '@/lib/services/storeCacheService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature') as string;

    let event: Stripe.Event;

    // Vérifier la signature du webhook
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Traitement automatique Telnyx pour certains événements
    await handleStripeWebhook(event);

    // Gérer les différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        // Récupérer les métadonnées
        const type = session.metadata?.type;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as 'STARTER' | 'PRO' | 'BUSINESS';
        const tempActivityId = session.metadata?.tempActivityId;

        // Nouveau processus d'inscription complète
        if (type === 'complete_signup') {
          console.log('Processing complete signup for session:', session.id);
          
          try {
            // Récupérer les données depuis les métadonnées
            const userData = JSON.parse(session.metadata?.userData || '{}');
            const businessData = JSON.parse(session.metadata?.businessData || '{}');
            const storeData = JSON.parse(session.metadata?.storeData || '{}');

            console.log('Creating complete signup with data:', { userData: userData.email, businessData: businessData.name, storeData: storeData.name });

            // Créer l'utilisateur
            const hashedPassword = await require('bcryptjs').hash(userData.password, 10);
            const user = await prisma.user.create({
              data: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: hashedPassword,
                phone: userData.phone,
                language: userData.language || 'fr',
                stripeCustomerId: session.customer as string,
                role: 'CLIENT'
              }
            });

            console.log('User created:', user.id);

            // Créer le business
            const business = await prisma.business.create({
              data: {
                name: businessData.name,
                description: `Activité ${storeData.serviceType}`,
                type: storeData.serviceType === 'products' ? 'PRODUCTS' : 
                      storeData.serviceType === 'reservations' ? 'RESERVATIONS' : 'CONSULTATION',
                ownerId: user.id
              }
            });

            console.log('Business created:', business.id);

            // Créer le store avec tous les services activés par défaut
            const store = await prisma.store.create({
              data: {
                name: storeData.name,
                address: storeData.address,
                businessId: business.id,
                isActive: true,
                // Services multi-métiers (tous activés par défaut)
                hasProducts: storeData.hasProducts !== undefined ? storeData.hasProducts : true,
                hasReservations: storeData.hasReservations !== undefined ? storeData.hasReservations : true,
                hasConsultations: storeData.hasConsultations !== undefined ? storeData.hasConsultations : true,
                // Configuration par défaut pour chaque service
                productsConfig: JSON.stringify({
                  currency: 'EUR',
                  taxRates: [],
                  categories: [],
                  acceptsOrders: true
                }),
                reservationsConfig: JSON.stringify({
                  timeSlots: [],
                  advanceBookingDays: 30,
                  cancellationPolicy: 'flexible',
                  requiresDeposit: false
                }),
                consultationsConfig: JSON.stringify({
                  duration: 60,
                  timeSlots: [],
                  specialties: [],
                  requiresAppointment: true
                }),
                settings: JSON.stringify({
                  currency: 'EUR',
                  taxRates: [],
                  schedule: {},
                  printers: [],
                  notifications: { enabled: false },
                  serviceType: storeData.serviceType || 'products',
                  telnyxConfigured: false,
                  isConfigured: true
                })
              }
            });

            console.log('Store created:', store.id);

            // Déclencher l'achat automatique d'un numéro Telnyx
            try {
              const countryCode = storeData.country || 'FR';
              console.log(`🔄 Déclenchement achat automatique numéro ${countryCode} pour business: ${business.id}`);
              
              const { telnyxAutoPurchase } = await import('@/lib/telnyx');
              const phoneNumber = await telnyxAutoPurchase.purchaseNumberForStore(
                business.id,
                store.id,
                countryCode
              );
              
              console.log(`✅ Numéro Telnyx acheté automatiquement: ${phoneNumber}`);
              
              // Mettre à jour les settings du store avec le numéro
              await prisma.store.update({
                where: { id: store.id },
                data: {
                  settings: JSON.stringify({
                    ...JSON.parse(store.settings as string),
                    telnyxConfigured: true,
                    telnyxNumber: phoneNumber
                  })
                }
              });
              
            } catch (telnyxError) {
              console.error('❌ Erreur achat automatique Telnyx:', telnyxError);
              // On continue même si l'achat Telnyx échoue
            }

            // Récupérer l'abonnement Stripe pour obtenir l'ID
            const stripeSubscriptionId = session.subscription as string;

            // Créer l'abonnement
            await prisma.subscription.create({
              data: {
                storeId: store.id,
                plan: plan,
                status: 'active',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                trialUsed: false,
                isActive: true,
                stripeSubscriptionId: stripeSubscriptionId,
                stripeCustomerId: session.customer as string
              }
            });

            console.log('Subscription created for store:', store.id);

            // Ajouter le numéro de téléphone
            await prisma.phoneNumber.create({
              data: {
                number: storeData.phone,
                businessId: business.id,
                telnyxId: ''
              }
            });

            // Pré-charger le cache pour la nouvelle boutique
            try {
              await StoreCacheService.cacheStoreData(store.id);
              console.log(`🚀 Cache pré-chargé pour la nouvelle boutique: ${store.id}`);
            } catch (cacheError) {
              console.error('⚠️ Erreur pré-chargement cache (non bloquante):', cacheError);
            }

            console.log('Complete signup process finished successfully');

          } catch (error) {
            console.error('Error in complete signup process:', error);
          }
        }
        // Ancien processus pour les utilisateurs existants
        else if (userId && plan) {
          // Récupérer l'utilisateur pour déclencher la création d'activité
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });

          if (user) {
            // Mettre à jour le stripeCustomerId si pas encore fait
            if (!user.stripeCustomerId) {
              await prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId: session.customer as string }
              });
            }

            // Pour les nouvelles activités avec tempActivityId, déclencher la création
            if (tempActivityId) {
              console.log(`Creating new activity for user ${userId} with plan ${plan}`);
              console.log(`TempActivityId: ${tempActivityId}`);
              
              // Récupérer les données d'activité depuis les metadata
              const activityData = user.metadata ? 
                JSON.parse(user.metadata)[`pendingActivity_${tempActivityId}`] : null;
              
              if (activityData) {
                console.log('Activity data found:', activityData);
                console.log('Activity serviceType:', activityData.serviceType);
                
                // Créer la nouvelle activité (business + store + subscription)
                const newBusiness = await prisma.business.create({
                  data: {
                    name: activityData.businessName || activityData.name || 'Nouvelle activité',
                    description: `Activité ${activityData.serviceType}`,
                    type: activityData.serviceType === 'products' ? 'PRODUCTS' : 
                          activityData.serviceType === 'reservations' ? 'RESERVATIONS' : 'CONSULTATION',
                    ownerId: userId
                  }
                });
                
                const newStore = await prisma.store.create({
                  data: {
                    name: activityData.storeName || activityData.name || (activityData.isConfigured ? 'Nouvelle activité' : '🔄 En attente de configuration...'),
                    address: activityData.address || (activityData.isConfigured ? 'Adresse configurée' : 'À configurer'),
                    businessId: newBusiness.id,
                    isActive: activityData.isConfigured || false, // Activée si déjà configurée
                    // Services multi-métiers (tous activés par défaut)
                    hasProducts: true,
                    hasReservations: true,
                    hasConsultations: true,
                    // Configuration par défaut pour chaque service
                    productsConfig: JSON.stringify({
                      currency: 'EUR',
                      taxRates: [],
                      categories: [],
                      acceptsOrders: true
                    }),
                    reservationsConfig: JSON.stringify({
                      timeSlots: [],
                      advanceBookingDays: 30,
                      cancellationPolicy: 'flexible',
                      requiresDeposit: false
                    }),
                    consultationsConfig: JSON.stringify({
                      duration: 60,
                      timeSlots: [],
                      specialties: [],
                      requiresAppointment: true
                    }),
                    settings: JSON.stringify({
                      currency: activityData.currency || 'EUR',
                      taxRates: activityData.taxRates || [],
                      schedule: activityData.schedule || {},
                      printers: activityData.printers || [],
                      notifications: activityData.notifications || { enabled: false },
                      serviceType: activityData.serviceType || 'products',
                      telnyxConfigured: activityData.telnyxConfigured || false,
                      isConfigured: activityData.isConfigured || false, // Utiliser la valeur de l'activité
                      pendingConfiguration: !activityData.isConfigured // Seulement si pas configuré
                    })
                  }
                });
                
                // Créer l'abonnement
                await prisma.subscription.create({
                  data: {
                    storeId: newStore.id,
                    plan: plan,
                    status: 'active',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    trialUsed: false,
                    isActive: true,
                    stripeSubscriptionId: session.subscription as string,
                    stripeCustomerId: session.customer as string
                  }
                });
                
                // Créer le numéro de téléphone si fourni
                if (activityData.phone) {
                  await prisma.phoneNumber.create({
                    data: {
                      number: activityData.phone,
                      businessId: newBusiness.id,
                      telnyxId: ''
                    }
                  });
                }
                
                // Nettoyer les metadata temporaires
                const cleanedMetadata = { ...JSON.parse(user.metadata || '{}') };
                delete cleanedMetadata[`pendingActivity_${tempActivityId}`];
                
                await prisma.user.update({
                  where: { id: userId },
                  data: {
                    metadata: JSON.stringify(cleanedMetadata)
                  }
                });
                
                // Déclencher l'achat automatique d'un numéro Telnyx pour la nouvelle activité
                try {
                  const countryCode = activityData.country || 'FR';
                  console.log(`🔄 Déclenchement achat automatique numéro ${countryCode} pour nouvelle activité: ${newBusiness.id}`);
                  
                  const { telnyxAutoPurchase } = await import('@/lib/telnyx');
                  const phoneNumber = await telnyxAutoPurchase.purchaseNumberForStore(
                    newBusiness.id,
                    newStore.id,
                    countryCode
                  );
                  
                  console.log(`✅ Numéro Telnyx acheté automatiquement pour nouvelle activité: ${phoneNumber}`);
                  
                  // Mettre à jour les settings du store avec le numéro
                  await prisma.store.update({
                    where: { id: newStore.id },
                    data: {
                      settings: JSON.stringify({
                        ...JSON.parse(newStore.settings as string),
                        telnyxConfigured: true,
                        telnyxNumber: phoneNumber
                      })
                    }
                  });
                  
                } catch (telnyxError) {
                  console.error('❌ Erreur achat automatique Telnyx pour nouvelle activité:', telnyxError);
                  // On continue même si l'achat Telnyx échoue
                }

                // Pré-charger le cache pour la nouvelle activité/boutique
                try {
                  await StoreCacheService.cacheStoreData(newStore.id);
                  console.log(`🚀 Cache pré-chargé pour la nouvelle activité: ${newStore.id}`);
                } catch (cacheError) {
                  console.error('⚠️ Erreur pré-chargement cache nouvelle activité (non bloquante):', cacheError);
                }

                console.log(`New activity created successfully - Business: ${newBusiness.id}, Store: ${newStore.id}`);
              } else {
                console.error(`Activity data not found for tempActivityId: ${tempActivityId}`);
              }
            } else {
              // Marquer que l'utilisateur a payé et doit créer sa première activité
              const currentMetadata = user.metadata ? JSON.parse(user.metadata) : {};
              await prisma.user.update({
                where: { id: userId },
                data: {
                  metadata: JSON.stringify({
                    ...currentMetadata,
                    needsFirstActivity: true,
                    paidPlan: plan
                  })
                }
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);

        // Trouver l'abonnement dans notre DB via le stripeSubscriptionId
        const dbSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id }
        });

        if (dbSubscription) {
          // Mettre à jour le statut
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: subscription.status,
              isActive: subscription.status === 'active' || subscription.status === 'trialing',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              nextBillingDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
            }
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription cancelled:', subscription.id);

        // Désactiver l'abonnement
        const dbSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id }
        });

        if (dbSubscription) {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: 'cancelled',
              isActive: false,
              cancelledAt: new Date(),
              cancelReason: 'Cancelled by customer'
            }
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice paid:', invoice.id);

        // Créer une facture dans notre DB
        const customerId = invoice.customer as string;
        const customer = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          include: { businesses: true }
        });

        if (customer && customer.businesses[0]) {
          // Vérifier si la facture existe déjà
          const existingInvoice = await prisma.invoice.findFirst({
            where: { stripeInvoiceId: invoice.id }
          });

          if (!existingInvoice) {
            await prisma.invoice.create({
              data: {
                invoiceNumber: invoice.number || invoice.id,
                businessId: customer.businesses[0].id,
                amount: invoice.amount_paid / 100, // Convertir de centimes en euros
                status: 'paid',
                dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : new Date(),
                paidAt: new Date(),
                stripeInvoiceId: invoice.id
              }
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoice.id);

        // Gérer l'échec de paiement
        const customerId = invoice.customer as string;
        const customer = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          include: { businesses: true }
        });

        if (customer && customer.businesses[0]) {
          // Mettre à jour le statut des abonnements liés aux stores de cet utilisateur
          const stores = await prisma.store.findMany({
            where: { businessId: customer.businesses[0].id },
            include: { subscription: true }
          });

          for (const store of stores) {
            if (store.subscription) {
              await prisma.subscription.update({
                where: { id: store.subscription.id },
                data: {
                  status: 'payment_failed',
                  notes: `Payment failed for invoice ${invoice.id}`
                }
              });
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Désactiver le body parsing pour les webhooks Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};