// ============================================================================
// STORE DATA LOADER - Chargement complet données boutique pour IA
// ============================================================================

import { prisma } from './prisma';

export interface CompleteStoreData {
  // IDENTIFIANTS
  storeId: string;
  businessId: string;
  storeName: string;
  businessName: string;
  businessCategory: string;

  // CONFIGURATION IA PERSONNALISÉE
  aiPersonality: string;
  voiceType: 'femme' | 'homme';
  voiceStyle: string;
  aiInstructions: string;
  automationLevel: number;
  aiOptimization: any;

  // CATALOGUE PRODUITS COMPLET
  products: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    status: string;
    available: boolean;
    stock: number;
    popularity: number;
    aiKeywords: string[];
    hasComposition: boolean;
  }>;

  // SERVICES COMPLETS
  services: Array<{
    id: string;
    name: string;
    description: string;
    category?: string;
    duration: number;
    price: number;
    available: boolean;
    type: 'service' | 'universal';
  }>;

  // CONSULTATIONS PROGRAMMÉES
  consultations: Array<{
    id: string;
    title: string;
    type: string;
    description: string;
    scheduledAt: string;
    duration: number;
    price: number;
    status: string;
    consultantName: string;
    customerName: string;
  }>;

  // CONFIGURATION BOUTIQUE
  businessHours: any;
  timezone: string;
  currency: string;
  taxRate: number;
  settings: any;

  // TEMPLATES NOTIFICATIONS
  notificationTemplates: Array<{
    id: string;
    actionType: string;
    activityType: string;
    name: string;
    subject: string;
    body: string;
    variables: any;
    isDefault: boolean;
  }>;

  // COMPOSANTS & CONFIGURATION
  components: any[];
  
  // RESSOURCES DE SERVICES
  serviceResources: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    isAvailable: boolean;
    specifications: any;
    availability: any;
    constraints: any;
    costs: any;
  }>;
  
  // CONFIGURATIONS DE PLANNING
  scheduleConfigs: Array<{
    id: string;
    name: string;
    type: string;
    workingHours: any;
    slotConfig: any;
    bookingRules: any;
    exceptions: any;
    serviceZones: any;
    isActive: boolean;
  }>;
  
  // RÉSERVATIONS ACTIVES
  activeReservations: Array<{
    id: string;
    customerName: string;
    date: string;
    time: string;
    serviceName: string;
    title: string;
    status: string;
  }>;
  
  // MÉTADONNÉES
  lastUpdated: string;
  hasProducts: boolean;
  hasReservations: boolean;
  hasConsultations: boolean;
}

/**
 * Charge TOUTES les données d'une boutique depuis la base
 * Utilisé pour cache Redis et analyse IA
 */
export async function loadCompleteStoreData(storeId: string): Promise<CompleteStoreData> {
  try {
    console.log(`📊 Chargement données complètes boutique: ${storeId}`);

    // 1. DONNÉES BOUTIQUE DE BASE
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { 
        business: true,
        subscription: true
      }
    });

    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    // 2. CONFIGURATION IA COMPLÈTE
    const aiConfig = await prisma.intelligentAIConfig.findUnique({
      where: { storeId }
    });

    // 3. CATALOGUE PRODUITS
    const products = await prisma.product.findMany({
      where: { 
        storeId,
        status: 'ACTIVE' // Utilise 'status' au lieu de 'isActive'
      },
      orderBy: { name: 'asc' }
    });

    // 4. SERVICES TYPES
    const serviceTypes = await prisma.serviceType.findMany({
      where: { storeId },
      orderBy: { name: 'asc' }
    });

    // 5. SERVICES UNIVERSELS
    const universalServices = await prisma.universalService.findMany({
      where: { storeId },
      orderBy: { name: 'asc' }
    });

    // 6. CONSULTATIONS PROGRAMMÉES (si activées)
    let consultations = [];
    if (store.hasConsultations) {
      consultations = await prisma.consultation.findMany({
        where: { 
          storeId,
          scheduledAt: { gte: new Date() }
        },
        include: {
          customer: true
        },
        take: 20,
        orderBy: { scheduledAt: 'asc' }
      });
    }

    // 7. TEMPLATES NOTIFICATIONS
    const notificationTemplates = await prisma.notificationTemplate.findMany({
      where: { storeId },
      orderBy: { name: 'asc' }
    });

    // 8. COMPOSANTS BOUTIQUE
    const components = await prisma.component.findMany({
      where: { storeId },
      orderBy: { name: 'asc' }
    });

    // 9. RESSOURCES DE SERVICES (au lieu d'employés/équipements séparés)
    const serviceResources = await prisma.serviceResource.findMany({
      where: { storeId },
      orderBy: { name: 'asc' }
    });

    // 10. CONFIGURATIONS DE PLANNING (via UniversalService)
    const scheduleConfigs = await prisma.serviceScheduleConfig.findMany({
      where: { 
        service: { storeId }
      },
      include: {
        service: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // 11. RÉSERVATIONS ACTIVES (pour comprendre l'utilisation des ressources)
    const activeReservations = await prisma.reservation.findMany({
      where: { 
        storeId,
        startDateTime: { gte: new Date() }
      },
      include: {
        customer: true
      },
      take: 50, // Limiter pour performance
      orderBy: { startDateTime: 'asc' }
    });

    // 9. CONSTRUIRE DONNÉES OPTIMISÉES POUR IA
    const voiceOnboarding = aiConfig?.voiceOnboarding as any || {};
    const aiOptimization = aiConfig?.aiOptimization as any || {};
    const storeSettings = store.settings as any || {};

    const completeData: CompleteStoreData = {
      // IDENTIFIANTS
      storeId,
      businessId: store.businessId,
      storeName: store.name,
      businessName: store.business.name,
      businessCategory: store.businessCategory,

      // CONFIGURATION IA PERSONNALISÉE
      aiPersonality: voiceOnboarding.personality || aiOptimization.personality || 'professionnel',
      voiceType: voiceOnboarding.voiceType || 'femme',
      voiceStyle: voiceOnboarding.style || 'cool',
      aiInstructions: aiOptimization.instructions || '',
      automationLevel: aiConfig?.automationLevel || 90,
      aiOptimization: aiOptimization,

      // CATALOGUE PRODUITS COMPLET
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        category: product.category || 'general',
        status: product.status,
        available: product.status === 'ACTIVE',
        stock: product.stock || 0,
        popularity: product.popularity || 0,
        aiKeywords: product.aiKeywords || [],
        hasComposition: product.hasComposition
      })),

      // SERVICES COMPLETS (Types + Universels)
      services: [
        ...serviceTypes.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description || '',
          category: service.category,
          duration: service.duration || 60,
          price: service.price || 0,
          available: service.isActive,
          type: 'service' as const
        })),
        ...universalServices.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description || '',
          duration: 60, // Durée par défaut pour services universels
          price: 0, // Prix par défaut pour services universels
          available: service.isActive,
          type: 'universal' as const
        }))
      ],

      // CONSULTATIONS PROGRAMMÉES
      consultations: consultations.map(consultation => ({
        id: consultation.id,
        title: consultation.title,
        type: consultation.consultationType,
        description: consultation.description || '',
        scheduledAt: consultation.scheduledAt.toISOString(),
        duration: consultation.duration,
        price: consultation.price || 0,
        status: consultation.status,
        consultantName: consultation.consultantName || '',
        customerName: `${consultation.customer?.firstName || ''} ${consultation.customer?.lastName || ''}`.trim()
      })),

      // CONFIGURATION BOUTIQUE
      businessHours: storeSettings.businessHours || {
        'lundi': '09:00-18:00',
        'mardi': '09:00-18:00',
        'mercredi': '09:00-18:00',
        'jeudi': '09:00-18:00',
        'vendredi': '09:00-18:00',
        'samedi': '09:00-17:00',
        'dimanche': 'fermé'
      },
      timezone: storeSettings.timezone || 'Europe/Paris',
      currency: storeSettings.currency || 'EUR',
      taxRate: storeSettings.taxSettings?.rate || 0.20,
      settings: storeSettings,

      // TEMPLATES NOTIFICATIONS
      notificationTemplates: notificationTemplates.map(template => ({
        id: template.id,
        actionType: template.actionType,
        activityType: template.activityType,
        name: template.name,
        subject: template.subject || '',
        body: template.body,
        variables: template.variables || {},
        isDefault: template.isDefault
      })),

      // COMPOSANTS
      components: components.map(component => ({
        id: component.id,
        name: component.name,
        description: component.description || '',
        variations: component.variations || [],
        aliases: component.aliases || [],
        allergens: component.allergens || [],
        usageCount: component.usageCount
      })),

      // RESSOURCES DE SERVICES
      serviceResources: serviceResources.map(resource => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        description: resource.description || '',
        isAvailable: resource.isActive,
        specifications: resource.specifications || {},
        availability: resource.availability || {},
        constraints: resource.constraints || {},
        costs: resource.costs || {}
      })),

      // CONFIGURATIONS DE PLANNING
      scheduleConfigs: scheduleConfigs.map(config => ({
        id: config.id,
        name: config.service.name,
        type: config.type,
        workingHours: config.workingHours || {},
        slotConfig: config.slotConfig || {},
        bookingRules: config.bookingRules || {},
        exceptions: config.exceptions || [],
        serviceZones: config.serviceZones || {},
        isActive: config.service.isActive
      })),

      // RÉSERVATIONS ACTIVES
      activeReservations: activeReservations.map(reservation => ({
        id: reservation.id,
        customerName: `${reservation.customer?.firstName || ''} ${reservation.customer?.lastName || ''}`.trim() || 'Client',
        date: reservation.startDateTime.toISOString().split('T')[0],
        time: reservation.startDateTime.toTimeString().split(' ')[0],
        serviceName: reservation.serviceType,
        title: reservation.title,
        status: reservation.status
      })),

      // MÉTADONNÉES
      lastUpdated: new Date().toISOString(),
      hasProducts: store.hasProducts,
      hasReservations: store.hasReservations,
      hasConsultations: store.hasConsultations
    };

    console.log(`✅ Données complètes chargées: ${completeData.products.length} produits, ${completeData.services.length} services, ${completeData.serviceResources.length} ressources, ${completeData.scheduleConfigs.length} configs planning, ${completeData.activeReservations.length} réservations, ${completeData.notificationTemplates.length} templates`);
    
    return completeData;

  } catch (error) {
    console.error(`❌ Erreur chargement données boutique ${storeId}:`, error);
    throw error;
  }
}

/**
 * Construit le contexte textuel optimisé pour prompts IA
 */
export function buildAIContext(storeData: CompleteStoreData): {
  businessContext: string;
  productsContext: string;
  servicesContext: string;
  consultationsContext: string;
  resourcesContext: string;
  schedulingContext: string;
  reservationsContext: string;
  systemPrompt: string;
} {
  
  // CONTEXTE BUSINESS
  const businessContext = `
Entreprise: ${storeData.businessName}
Boutique: ${storeData.storeName}
Catégorie: ${storeData.businessCategory}
Adresse: Informations disponibles dans le système
Horaires: ${JSON.stringify(storeData.businessHours)}
Devise: ${storeData.currency}
Taux TVA: ${(storeData.taxRate * 100).toFixed(0)}%`;

  // CONTEXTE PRODUITS
  const productsContext = storeData.products.length > 0 
    ? storeData.products.map(p => {
        return `- ${p.name}: ${p.description} | Catégorie: ${p.category} | ${p.available ? 'DISPONIBLE' : 'INDISPONIBLE'} | Stock: ${p.stock} | Popularité: ${p.popularity}${p.aiKeywords.length > 0 ? ` | Mots-clés: ${p.aiKeywords.join(', ')}` : ''}`;
      }).join('\n')
    : 'Aucun produit configuré';

  // CONTEXTE SERVICES
  const servicesContext = storeData.services.length > 0
    ? storeData.services.map(s => 
        `- ${s.name}: ${s.description} | Prix: ${s.price}€ | Durée: ${s.duration}min | ${s.available ? 'DISPONIBLE' : 'INDISPONIBLE'} | Type: ${s.type}${s.category ? ` | Catégorie: ${s.category}` : ''}`
      ).join('\n')
    : 'Aucun service configuré';

  // CONTEXTE CONSULTATIONS
  const consultationsContext = storeData.consultations.length > 0
    ? `${storeData.consultations.length} consultations programmées:\n` +
      storeData.consultations.slice(0, 5).map(c => 
        `- ${c.scheduledAt.split('T')[0]} ${c.scheduledAt.split('T')[1].substring(0,5)}: ${c.title} (${c.type}) - ${c.customerName} | ${c.duration}min | ${c.price}€ | ${c.status}`
      ).join('\n')
    : 'Aucune consultation programmée';

  // CONTEXTE RESSOURCES
  const resourcesContext = storeData.serviceResources.length > 0
    ? storeData.serviceResources.map(resource => 
        `- ${resource.name} (${resource.type}): ${resource.description} | ${resource.isAvailable ? 'DISPONIBLE' : 'INDISPONIBLE'}`
      ).join('\n')
    : 'Aucune ressource configurée';

  // CONTEXTE PLANNING
  const schedulingContext = storeData.scheduleConfigs.length > 0
    ? storeData.scheduleConfigs.map(config => 
        `- ${config.name} (${config.type}): ${config.isActive ? 'ACTIF' : 'INACTIF'} | Configuration de créneaux et horaires disponible`
      ).join('\n')
    : 'Aucune configuration de planning';

  // CONTEXTE RÉSERVATIONS
  const reservationsContext = storeData.activeReservations.length > 0
    ? `${storeData.activeReservations.length} réservations actives:\n` + 
      storeData.activeReservations.slice(0, 5).map(reservation => // Limiter à 5 pour le prompt
        `- ${reservation.date} ${reservation.time}: ${reservation.title} (${reservation.serviceName}) - ${reservation.customerName} - ${reservation.status}`
      ).join('\n')
    : 'Aucune réservation active';

  // PROMPT SYSTÈME PERSONNALISÉ
  const systemPrompt = `Tu es l'assistant IA de ${storeData.businessName} - ${storeData.storeName}.
Configuration IA personnalisée:
- Personnalité: ${storeData.aiPersonality}
- Type de voix: ${storeData.voiceType}
- Style: ${storeData.voiceStyle}
- Niveau d'automation: ${storeData.automationLevel}%
Instructions spéciales: ${storeData.aiInstructions}

Tu réponds aux appels téléphoniques de manière ${storeData.aiPersonality} avec une voix ${storeData.voiceType} au style ${storeData.voiceStyle}.`;

  return {
    businessContext,
    productsContext,
    servicesContext,
    consultationsContext,
    resourcesContext,
    schedulingContext,
    reservationsContext,
    systemPrompt
  };
}

/**
 * Invalide et recharge les données cache pour une boutique
 */
export async function refreshStoreCache(storeId: string): Promise<void> {
  try {
    const { redisService } = await import('./redis');
    
    // Invalider cache existant
    await redisService.invalidateStoreCache(storeId);
    
    // Recharger données fraîches
    const freshData = await loadCompleteStoreData(storeId);
    
    // Construire contexte IA
    const aiContext = buildAIContext(freshData);
    
    // Re-cacher avec nouvelles données - utiliser le bon format
    await redisService.cacheStoreData(storeId, {
      storeInfo: {
        id: freshData.storeId,
        businessId: freshData.businessId,
        name: freshData.storeName
      },
      catalog: freshData.products,
      services: freshData.services,
      consultations: freshData.consultations,
      serviceResources: freshData.serviceResources,
      scheduleConfigs: freshData.scheduleConfigs,
      activeReservations: freshData.activeReservations,
      settings: freshData.settings,
      aiConfig: {
        personality: freshData.aiPersonality,
        instructions: freshData.aiInstructions
      },
      businessInfo: {
        name: freshData.businessName,
        businessCategory: freshData.businessCategory
      }
    });
    
    console.log(`🔄 Cache boutique rafraîchi: ${storeId}`);
    
  } catch (error) {
    console.error(`❌ Erreur refresh cache ${storeId}:`, error);
    throw error;
  }
}