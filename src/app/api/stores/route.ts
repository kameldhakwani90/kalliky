import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { telnyxAutoPurchase } from '@/lib/telnyx';
import { stripeAutomation } from '@/lib/stripe-telnyx-automation';

const prisma = new PrismaClient();

// GET - Récupérer tous les stores d'un business
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId requis' },
        { status: 400 }
      );
    }

    const stores = await prisma.store.findMany({
      where: { businessId },
      include: {
        business: true,
        subscription: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Mapper les données pour inclure les informations des services
    const mappedStores = stores.map(store => ({
      id: store.id,
      name: store.name,
      address: store.address,
      isActive: store.isActive,
      // Services multi-métiers
      hasProducts: store.hasProducts || true,
      hasReservations: store.hasReservations || true,
      hasConsultations: store.hasConsultations || true,
      productsConfig: store.productsConfig,
      reservationsConfig: store.reservationsConfig,
      consultationsConfig: store.consultationsConfig,
      settings: store.settings,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      business: store.business,
      subscription: store.subscription
    }));

    return NextResponse.json(mappedStores);
  } catch (error) {
    console.error('Erreur GET stores:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau store
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      address,
      phone,
      businessId,
      businessCategory = 'RESTAURANT', // Type métier par défaut
      currency = 'EUR',
      taxRate = 0,
      openingHours,
      whatsappNumber,
      notifications,
      // Services multi-métiers (tous activés par défaut)
      hasProducts = true,
      hasReservations = true,
      hasConsultations = true,
      productsConfig,
      reservationsConfig,
      consultationsConfig
    } = body;

    if (!name || !address || !phone || !businessId) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const store = await prisma.store.create({
      data: {
        name,
        address,
        businessId,
        businessCategory: businessCategory as any,
        isActive: true,
        // Services multi-métiers
        hasProducts,
        hasReservations,
        hasConsultations,
        // Configuration par défaut pour chaque service
        productsConfig: productsConfig || JSON.stringify({
          currency,
          taxRates: taxRate ? [{ id: 'default', name: 'TVA', rate: taxRate, isDefault: true }] : [],
          categories: [],
          acceptsOrders: true
        }),
        reservationsConfig: reservationsConfig || JSON.stringify({
          timeSlots: [],
          advanceBookingDays: 30,
          cancellationPolicy: 'flexible',
          requiresDeposit: false
        }),
        consultationsConfig: consultationsConfig || JSON.stringify({
          duration: 60,
          timeSlots: [],
          specialties: [],
          requiresAppointment: true
        }),
        settings: JSON.stringify({
          currency,
          taxRates: taxRate ? [{ id: 'default', name: 'TVA', rate: taxRate, isDefault: true }] : [],
          schedule: openingHours || {},
          printers: [],
          notifications: notifications || { enabled: false },
          whatsappNumber,
          telnyxConfigured: false,
          isConfigured: true
        })
      }
    });

    // ============================================================================
    // APPLIQUER CONFIGURATION MÉTIER PAR DÉFAUT
    // ============================================================================
    
    try {
      // Récupérer la configuration du type métier
      const businessConfig = await prisma.businessCategoryConfig.findUnique({
        where: { 
          category: businessCategory as any,
        }
      });

      if (businessConfig && businessConfig.isActive) {
        // Mettre à jour les settings avec les paramètres métier
        const currentSettings = JSON.parse(store.settings as string);
        const updatedSettings = {
          ...currentSettings,
          businessConfig: {
            category: businessConfig.category,
            displayName: businessConfig.displayName,
            defaultParams: businessConfig.defaultParams,
            availableOptions: businessConfig.availableOptions
          }
        };

        await prisma.store.update({
          where: { id: store.id },
          data: {
            settings: JSON.stringify(updatedSettings)
          }
        });

        console.log(`✅ Configuration métier ${businessConfig.displayName} appliquée à la boutique ${store.id}`);
      }
    } catch (error) {
      console.error('❌ Erreur application config métier:', error);
      // Ne pas faire échouer la création pour ça
    }

    // ============================================================================
    // AUTO-PURCHASE NUMÉRO TELNYX APRÈS CRÉATION BOUTIQUE
    // ============================================================================
    
    let phoneNumber: string | null = null;
    let telnyxError: string | null = null;

    try {
      // Vérifier si l'abonnement est actif avant d'acheter
      const subscriptionStatus = await stripeAutomation.checkSubscriptionStatus(businessId);
      
      if (subscriptionStatus?.status === 'active' && process.env.TELNYX_AUTO_PURCHASE === 'true') {
        console.log(`🔄 Auto-purchase numéro pour nouvelle boutique: ${store.id}`);
        
        // Déterminer le pays depuis l'adresse
        const countryCode = getCountryCodeFromAddress(address);
        
        // Acheter automatiquement un numéro
        phoneNumber = await telnyxAutoPurchase.purchaseNumberForStore(
          businessId,
          store.id,
          countryCode
        );

        // Mettre à jour les settings du store
        const updatedSettings = JSON.parse(store.settings);
        updatedSettings.telnyxConfigured = true;
        updatedSettings.phoneNumber = phoneNumber;
        
        await prisma.store.update({
          where: { id: store.id },
          data: { 
            settings: JSON.stringify(updatedSettings),
            phone: phoneNumber // Mettre aussi dans le champ phone
          }
        });

        console.log(`✅ Numéro auto-acheté: ${phoneNumber} pour store: ${store.id}`);
      } else {
        console.log(`⚠️ Auto-purchase ignoré: abonnement inactif ou désactivé pour business: ${businessId}`);
      }
    } catch (error) {
      console.error('❌ Erreur auto-purchase numéro:', error);
      telnyxError = error instanceof Error ? error.message : 'Erreur auto-purchase';
      
      // Ne pas faire échouer la création du store pour autant
    }

    // Retourner le store avec les infos du numéro
    const response = {
      ...store,
      autoPhoneNumber: phoneNumber,
      telnyxError
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Erreur POST store:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCountryCodeFromAddress(address: string): string {
  // Logique simple pour détecter le pays depuis l'adresse
  const countryPatterns = {
    'FR': ['france', 'français', 'paris', 'lyon', 'marseille', 'toulouse', 'nice', 'strasbourg', 'bordeaux', 'lille'],
    'US': ['usa', 'america', 'new york', 'california', 'texas', 'florida', 'chicago', 'washington'],
    'GB': ['uk', 'united kingdom', 'london', 'england', 'britain', 'manchester', 'birmingham', 'liverpool'],
    'DE': ['germany', 'deutschland', 'berlin', 'munich', 'hamburg', 'cologne', 'frankfurt'],
    'ES': ['spain', 'españa', 'madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza'],
    'IT': ['italy', 'italia', 'rome', 'milan', 'naples', 'turin', 'palermo', 'genoa'],
    'CA': ['canada', 'toronto', 'montreal', 'vancouver', 'calgary', 'ottawa'],
    'AU': ['australia', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide'],
  };

  const lowerAddress = address.toLowerCase();
  
  for (const [code, patterns] of Object.entries(countryPatterns)) {
    if (patterns.some(pattern => lowerAddress.includes(pattern))) {
      return code;
    }
  }

  // Détecter par codes postaux si les mots-clés ne marchent pas
  if (/\b\d{5}\b/.test(address)) return 'FR'; // Code postal français
  if (/\b\d{5}-\d{4}\b/.test(address)) return 'US'; // ZIP code US
  if (/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(address)) return 'GB'; // UK postcode
  
  return 'FR'; // Défaut France
}