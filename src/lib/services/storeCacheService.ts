import { prisma } from '@/lib/prisma';
import { redisService } from '@/lib/redis';

export class StoreCacheService {
  
  // Méthode principale pour mettre en cache toutes les données d'une boutique
  static async cacheStoreData(storeId: string): Promise<void> {
    try {
      console.log(`🔄 Mise en cache des données pour la boutique: ${storeId}`);
      
      // 1. Utiliser le nouveau système de chargement complet avec employés/équipements
      const { loadCompleteStoreData, buildAIContext } = await import('../store-data-loader');
      const completeData = await loadCompleteStoreData(storeId);
      const aiContext = buildAIContext(completeData);
      
      // 2. Conversion vers l'ancien format pour compatibilité
      const storeData = {
        storeInfo: {
          id: completeData.storeId,
          businessId: completeData.businessId,
          name: completeData.storeName,
        },
        catalog: completeData.products,
        services: completeData.services,
        consultations: completeData.consultations,
        serviceResources: completeData.serviceResources,
        scheduleConfigs: completeData.scheduleConfigs,
        activeReservations: completeData.activeReservations,
        settings: {
          businessHours: completeData.businessHours,
          timezone: completeData.timezone,
          currency: completeData.currency,
          taxSettings: { rate: completeData.taxRate }
        },
        aiConfig: {
          personality: completeData.aiPersonality,
          instructions: completeData.aiInstructions,
          language: 'fr'
        },
        businessInfo: {
          name: completeData.businessName,
          businessCategory: completeData.businessCategory
        }
      };

      // 3. Mettre en cache les données étendues
      await redisService.cacheStoreData(storeId, storeData);
      
      // 4. Générer et mettre en cache les prompts IA optimisés
      const aiPromptData = this.generateAIPrompts(storeData);
      await redisService.cacheStoreAIPrompt(storeId, aiPromptData);
      
      console.log(`✅ Cache mis à jour avec données étendues: ${completeData.serviceResources.length} ressources, ${completeData.scheduleConfigs.length} configs planning, ${completeData.activeReservations.length} réservations`);
      
    } catch (error) {
      console.error(`❌ Erreur mise en cache boutique ${storeId}:`, error);
    }
  }

  // Récupération complète des données boutique depuis la DB
  private static async fetchCompleteStoreData(storeId: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        business: {
          include: {
            phoneNumbers: true
          }
        },
        products: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        services: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        consultations: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!store) return null;

    return {
      storeInfo: {
        id: store.id,
        name: store.name,
        address: store.address,
        businessId: store.businessId,
        isActive: store.isActive
      },
      businessInfo: {
        id: store.business.id,
        name: store.business.name,
        businessCategory: store.business.businessCategory,
        phoneNumbers: store.business.phoneNumbers
      },
      catalog: store.products || [],
      services: store.services || [],
      consultations: store.consultations || [],
      settings: store.settings || {},
      aiConfig: (store.settings as any)?.aiConfig || {}
    };
  }

  // Génération des prompts IA optimisés
  private static generateAIPrompts(storeData: any): {
    systemPrompt: string;
    businessContext: string;
    productsContext: string;
    servicesContext: string;
    consultationsContext: string;
  } {
    const { storeInfo, businessInfo, catalog, services, consultations, settings, aiConfig } = storeData;
    
    // Prompt système principal
    const systemPrompt = `Tu es l'assistant IA de ${businessInfo.name} (${storeInfo.name}).
Type d'entreprise: ${businessInfo.businessCategory}
Adresse: ${storeInfo.address}
Personnalité: ${aiConfig.personality || 'professionnel et serviable'}

Instructions spécifiques: ${aiConfig.instructions || 'Sois poli, efficace et représente bien notre entreprise.'}

Tu peux aider les clients avec:
- Informations sur nos produits et services
- Prise de commande si activée
- Réservations si activées  
- Consultations si activées
- Renseignements généraux

IMPORTANT: 
- Toujours confirmer les détails importants
- Être précis sur les prix et disponibilités
- Transférer vers un humain si demandé ou si nécessaire
- Respecter les horaires d'ouverture`;

    // Contexte entreprise
    const businessContext = `Entreprise: ${businessInfo.name}
Boutique: ${storeInfo.name}
Catégorie: ${businessInfo.businessCategory}
Adresse: ${storeInfo.address}
Horaires: ${JSON.stringify(settings.businessHours || {})}
Devise: ${settings.currency || 'EUR'}
Fuseau horaire: ${settings.timezone || 'Europe/Paris'}`;

    // Contexte produits
    const productsContext = catalog.length > 0 ? 
      `CATALOGUE PRODUITS:\n${catalog.map(product => 
        `- ${product.name}: ${product.description || ''} - ${product.price}€${product.available ? '' : ' (INDISPONIBLE)'}`
      ).join('\n')}` : 
      'Aucun produit configuré.';

    // Contexte services
    const servicesContext = services.length > 0 ?
      `SERVICES DISPONIBLES:\n${services.map(service =>
        `- ${service.name}: ${service.description || ''} - ${service.price}€ (${service.duration}min)${service.available ? '' : ' (INDISPONIBLE)'}`
      ).join('\n')}` :
      'Aucun service configuré.';

    // Contexte consultations
    const consultationsContext = consultations.length > 0 ?
      `CONSULTATIONS DISPONIBLES:\n${consultations.map(consultation =>
        `- ${consultation.name}: ${consultation.description || ''} - ${consultation.price}€ (${consultation.duration}min) - Niveau: ${consultation.expertiseLevel || 'Standard'}${consultation.available ? '' : ' (INDISPONIBLE)'}`
      ).join('\n')}` :
      'Aucune consultation configurée.';

    return {
      systemPrompt,
      businessContext,
      productsContext,
      servicesContext,
      consultationsContext
    };
  }

  // Récupération rapide des données depuis le cache
  static async getCachedStoreData(storeId: string): Promise<any | null> {
    try {
      let cachedData = await redisService.getCachedStoreData(storeId);
      
      // Si pas en cache, charger et mettre en cache
      if (!cachedData) {
        console.log(`📦 Cache manquant pour ${storeId}, rechargement...`);
        await this.cacheStoreData(storeId);
        cachedData = await redisService.getCachedStoreData(storeId);
      }
      
      return cachedData;
    } catch (error) {
      console.error(`❌ Erreur récupération cache ${storeId}:`, error);
      return null;
    }
  }

  // Récupération des prompts IA depuis le cache
  static async getCachedStoreAIPrompts(storeId: string): Promise<any | null> {
    try {
      let promptData = await redisService.getCachedStoreAIPrompt(storeId);
      
      // Si pas en cache, régénérer
      if (!promptData) {
        console.log(`🤖 Prompts IA manquants pour ${storeId}, régénération...`);
        await this.cacheStoreData(storeId); // Recharge tout
        promptData = await redisService.getCachedStoreAIPrompt(storeId);
      }
      
      return promptData;
    } catch (error) {
      console.error(`❌ Erreur récupération prompts IA ${storeId}:`, error);
      return null;
    }
  }

  // Invalidation du cache quand les données changent
  static async invalidateStoreCache(storeId: string): Promise<void> {
    try {
      await redisService.invalidateStoreCache(storeId);
      console.log(`🗑️ Cache invalidé pour la boutique: ${storeId}`);
    } catch (error) {
      console.error(`❌ Erreur invalidation cache ${storeId}:`, error);
    }
  }

  // Mise en cache préventive pour toutes les boutiques actives
  static async preloadAllActiveStores(): Promise<void> {
    try {
      console.log('🚀 Pré-chargement des caches pour toutes les boutiques actives...');
      
      const activeStores = await prisma.store.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      });

      console.log(`📦 ${activeStores.length} boutiques actives trouvées`);

      // Traitement en parallèle avec limite
      const batchSize = 5;
      for (let i = 0; i < activeStores.length; i += batchSize) {
        const batch = activeStores.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(store => 
            this.cacheStoreData(store.id).catch(error => 
              console.error(`❌ Erreur pré-chargement ${store.name} (${store.id}):`, error)
            )
          )
        );
        
        // Pause entre les batches pour éviter la surcharge
        if (i + batchSize < activeStores.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('✅ Pré-chargement terminé');
    } catch (error) {
      console.error('❌ Erreur pré-chargement global:', error);
    }
  }

  // Hook appelé lors des mises à jour de boutique
  static async onStoreUpdated(storeId: string, updateType: 'products' | 'services' | 'consultations' | 'settings' | 'all'): Promise<void> {
    try {
      console.log(`🔄 Boutique ${storeId} mise à jour (${updateType}), rechargement cache...`);
      
      // Invalider le cache existant
      await this.invalidateStoreCache(storeId);
      
      // Recharger avec les nouvelles données
      await this.cacheStoreData(storeId);
      
    } catch (error) {
      console.error(`❌ Erreur mise à jour cache boutique ${storeId}:`, error);
    }
  }
}

// Export singleton pour compatibilité
export const storeCacheService = new StoreCacheService();