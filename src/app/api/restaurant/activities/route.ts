import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { telnyxAutoPurchase } from '@/lib/telnyx';

// GET - Récupérer toutes les activités de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Récupérer les stores de l'utilisateur
    const stores = await prisma.store.findMany({
      where: {
        business: {
          ownerId: decoded.userId
        }
      },
      select: {
        id: true,
        name: true,
        address: true,
        settings: true
      }
    });

    // Récupérer les activités de tous les stores de l'utilisateur
    const activities = await prisma.activityLog.findMany({
      where: {
        storeId: {
          in: stores.map(s => s.id)
        }
      },
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limiter à 100 activités récentes
    });

    // Transformer les données pour correspondre au format attendu par l'interface
    const transformedActivities = activities.map(activity => {
      // Récupérer le statut depuis les métadonnées ou utiliser un défaut
      const metadata = activity.metadata ? (typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata) : {};
      const status = metadata.status || 'PENDING';
      
      return {
        id: activity.id,
        type: activity.type,
        entityId: activity.entityId, // Ajout de entityId pour la redirection
        customerId: activity.customerId, // Ajout du customerId pour les liens
        status: status,
        title: activity.title,
        description: activity.description || '',
        urgencyLevel: 'NORMAL' as const,
        createdAt: activity.createdAt.toISOString(),
        amount: activity.amount,
        metadata: metadata,
        store: activity.store,
        customer: activity.customer // Ajout des infos customer
      };
    });

    return NextResponse.json({
      stores: stores.map(store => ({
        id: store.id,
        name: store.name,
        address: store.address,
        serviceType: store.settings && typeof store.settings === 'object' ? (store.settings as any).serviceType || 'products' : 'products'
      })),
      activities: transformedActivities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une nouvelle activité
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const data = await request.json();

    // Récupérer l'utilisateur pour avoir son email
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const {
      name,
      address,
      phone,
      country,
      businessCategory,
      serviceType,
      currency,
      taxRates,
      schedule,
      printers,
      notifications,
      telnyxConfigured,
      isConfigured,
      paidPlan,
      stripeSubscriptionId
    } = data;

    // Validation des données obligatoires
    if (!name || !address || !phone || !serviceType) {
      return NextResponse.json(
        { error: 'Nom, adresse, téléphone et type de service sont obligatoires' },
        { status: 400 }
      );
    }

    // Créer le business
    const business = await prisma.business.create({
      data: {
        name,
        description: `Activité ${serviceType}`,
        type: serviceType === 'products' ? 'PRODUCTS' : 'SERVICES',
        ownerId: decoded.userId
      }
    });

    // Vérifier si le numéro de téléphone a déjà été utilisé pour un trial
    const phoneTrialUsage = await prisma.trialUsage.findFirst({
      where: { 
        identifier: phone,
        identifierType: 'phone'
      }
    });

    const emailTrialUsage = await prisma.trialUsage.findFirst({
      where: { 
        identifier: user.email,
        identifierType: 'email'
      }
    });

    const canUseTrial = !phoneTrialUsage && !emailTrialUsage;

    // Créer un store par défaut
    const store = await prisma.store.create({
      data: {
        name,
        address,
        country: country || 'FR',
        businessId: business.id,
        businessCategory: businessCategory || 'RESTAURANT',
        isActive: true,
        settings: JSON.stringify({
          currency: currency || 'EUR',
          taxRates: taxRates || [],
          schedule: schedule || {},
          printers: printers || [],
          notifications: notifications || { enabled: false },
          serviceType,
          telnyxConfigured: telnyxConfigured || false,
          isConfigured: isConfigured || false
        })
      }
    });

    // Vérifier si l'utilisateur a un plan payé en attente (première activité)
    const userMetadata = user.metadata ? JSON.parse(user.metadata) : {};
    const isFirstActivity = userMetadata.needsFirstActivity;
    const userPaidPlan = userMetadata.paidPlan;
    const userStripeSubscriptionId = userMetadata.stripeSubscriptionId;

    // Déterminer le plan à utiliser
    let planToUse = serviceType === 'products' ? 'STARTER' : 
                   serviceType === 'reservations' ? 'PRO' : 'BUSINESS';
    
    // Si c'est la première activité et qu'un plan a été payé, utiliser ce plan
    if (isFirstActivity && userPaidPlan) {
      planToUse = userPaidPlan;
    }
    
    // Si un plan a été payé spécifiquement pour cette activité (nouvelle activité), l'utiliser
    if (paidPlan && !isFirstActivity) {
      planToUse = paidPlan;
    }

    // Créer l'abonnement pour ce store
    const subscription = await prisma.subscription.create({
      data: {
        storeId: store.id,
        plan: planToUse,
        status: ((isFirstActivity && userPaidPlan) || paidPlan) ? 'active' : (canUseTrial ? 'trial' : 'active'),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (((isFirstActivity && userPaidPlan) || paidPlan) ? 30 : (canUseTrial ? 14 : 30)) * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + (((isFirstActivity && userPaidPlan) || paidPlan) ? 30 : (canUseTrial ? 14 : 30)) * 24 * 60 * 60 * 1000),
        trialUsed: !canUseTrial || ((isFirstActivity && userPaidPlan) || paidPlan),
        isActive: true,
        stripeSubscriptionId: stripeSubscriptionId || userStripeSubscriptionId || null,
        stripeCustomerId: user.stripeCustomerId || null
      }
    });

    // Marquer le téléphone et email comme utilisés pour trial si c'est un trial
    if (canUseTrial) {
      await prisma.trialUsage.createMany({
        data: [
          {
            identifier: phone,
            identifierType: 'phone',
            userId: decoded.userId
          },
          {
            identifier: user.email,
            identifierType: 'email', 
            userId: decoded.userId
          }
        ]
      });
    }

    // Si c'est la première activité, effacer le flag
    if (isFirstActivity) {
      const updatedMetadata = { ...userMetadata };
      delete updatedMetadata.needsFirstActivity;
      delete updatedMetadata.paidPlan;
      delete updatedMetadata.stripeSubscriptionId;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          metadata: Object.keys(updatedMetadata).length > 0 ? JSON.stringify(updatedMetadata) : null
        }
      });
    }

    // Ajouter le numéro de téléphone boutique (pas Telnyx)
    await prisma.phoneNumber.create({
      data: {
        number: phone,
        businessId: business.id,
        isActive: true,
        isPrimary: true
      }
    });

    // ATTRIBUTION AUTOMATIQUE NUMÉRO TELNYX pour plans payés
    if (((isFirstActivity && userPaidPlan) || paidPlan) && country) {
      try {
        console.log(`🔄 Attribution automatique numéro Telnyx pour ${store.name} (${country})`);
        const telnyxNumber = await telnyxAutoPurchase.purchaseNumberForStore(
          business.id, 
          store.id, 
          country
        );
        console.log(`✅ Numéro Telnyx attribué: ${telnyxNumber}`);
        
        // Mettre à jour le store avec le numéro Telnyx
        await prisma.store.update({
          where: { id: store.id },
          data: {
            settings: JSON.stringify({
              ...JSON.parse(store.settings as string),
              telnyxConfigured: true,
              telnyxNumber: telnyxNumber
            })
          }
        });
        
      } catch (telnyxError) {
        console.error('❌ Erreur attribution numéro Telnyx:', telnyxError);
        // Ne pas faire échouer toute la création pour ça
        // L'erreur est déjà loggée dans la DB par le service Telnyx
      }
    }

    // Retourner le business créé avec ses relations
    const createdBusiness = await prisma.business.findUnique({
      where: { id: business.id },
      include: {
        stores: {
          include: {
            subscription: true
          }
        },
        phoneNumbers: true
      }
    });

    return NextResponse.json(createdBusiness, { status: 201 });

  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}

// PUT - Modifier une activité existante
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const data = await request.json();

    const {
      storeId,
      name,
      address,
      phone,
      serviceType,
      currency,
      taxRates,
      schedule,
      printers,
      notifications,
      telnyxConfigured,
      isConfigured,
      aiAgent
    } = data;

    // Validation des données obligatoires
    if (!storeId || !name || !address || !phone || !serviceType) {
      return NextResponse.json(
        { error: 'ID du store, nom, adresse, téléphone et type de service sont obligatoires' },
        { status: 400 }
      );
    }

    // Vérifier que le store appartient à l'utilisateur
    const store = await prisma.store.findFirst({
      where: { 
        id: storeId,
        business: { ownerId: decoded.userId }
      },
      include: {
        business: {
          include: {
            phoneNumbers: true
          }
        }
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store non trouvé ou non autorisé' }, { status: 404 });
    }

    // Mettre à jour le store
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        name,
        address,
        settings: JSON.stringify({
          currency: currency || 'EUR',
          taxRates: taxRates || [],
          schedule: schedule || {},
          printers: printers || [],
          notifications: notifications || { enabled: false },
          serviceType,
          telnyxConfigured: telnyxConfigured || false,
          isConfigured: isConfigured || false,
          ...(aiAgent && { aiAgent })
        })
      }
    });

    // Mettre à jour le business name si différent
    if (store.business.name !== name) {
      await prisma.business.update({
        where: { id: store.businessId },
        data: { name }
      });
    }

    // Mettre à jour le numéro de téléphone
    const existingPhone = store.business.phoneNumbers[0];
    if (existingPhone && existingPhone.number !== phone) {
      await prisma.phoneNumber.update({
        where: { id: existingPhone.id },
        data: { number: phone }
      });
    } else if (!existingPhone) {
      await prisma.phoneNumber.create({
        data: {
          number: phone,
          businessId: store.businessId,
          telnyxId: ''
        }
      });
    }

    // Retourner le business mis à jour avec ses relations
    const updatedBusiness = await prisma.business.findUnique({
      where: { id: store.businessId },
      include: {
        stores: {
          include: {
            subscription: true
          }
        },
        phoneNumbers: true
      }
    });

    return NextResponse.json(updatedBusiness);

  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}