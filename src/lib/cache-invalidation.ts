// ============================================================================
// CACHE INVALIDATION - Helpers pour invalidation automatique cache Redis
// ============================================================================

import { refreshStoreCache } from './store-data-loader';

/**
 * Invalide automatiquement le cache après modification des données boutique
 * À utiliser dans toutes les APIs de gestion boutique
 */
export async function invalidateStoreCacheAfterUpdate(storeId: string, updateType: string): Promise<void> {
  try {
    console.log(`🔄 Invalidation cache boutique ${storeId} après: ${updateType}`);
    
    // Rafraîchir cache avec nouvelles données
    await refreshStoreCache(storeId);
    
    console.log(`✅ Cache invalidé et rafraîchi: ${storeId}`);
    
  } catch (error) {
    console.error(`❌ Erreur invalidation cache ${storeId}:`, error);
    // Ne pas faire planter l'API si problème cache
  }
}

/**
 * Helper pour APIs produits
 */
export async function invalidateAfterProductUpdate(storeId: string): Promise<void> {
  await invalidateStoreCacheAfterUpdate(storeId, 'product_update');
}

/**
 * Helper pour APIs services
 */
export async function invalidateAfterServiceUpdate(storeId: string): Promise<void> {
  await invalidateStoreCacheAfterUpdate(storeId, 'service_update');
}

/**
 * Helper pour APIs configuration IA
 */
export async function invalidateAfterAIConfigUpdate(storeId: string): Promise<void> {
  await invalidateStoreCacheAfterUpdate(storeId, 'ai_config_update');
}

/**
 * Helper pour APIs notifications
 */
export async function invalidateAfterNotificationUpdate(storeId: string): Promise<void> {
  await invalidateStoreCacheAfterUpdate(storeId, 'notification_update');
}

/**
 * Helper pour APIs paramètres boutique
 */
export async function invalidateAfterStoreSettingsUpdate(storeId: string): Promise<void> {
  await invalidateStoreCacheAfterUpdate(storeId, 'store_settings_update');
}

/**
 * Helper pour APIs composants
 */
export async function invalidateAfterComponentUpdate(storeId: string): Promise<void> {
  await invalidateStoreCacheAfterUpdate(storeId, 'component_update');
}

/**
 * Invalide cache pour toutes les boutiques d'un business
 * Utile quand modification business impacte toutes ses boutiques
 */
export async function invalidateBusinessStoresCache(businessId: string): Promise<void> {
  try {
    // Importer prisma ici pour éviter les imports circulaires
    const { prisma } = await import('./prisma');
    
    const stores = await prisma.store.findMany({
      where: { businessId },
      select: { id: true }
    });
    
    for (const store of stores) {
      await invalidateStoreCacheAfterUpdate(store.id, 'business_update');
    }
    
    console.log(`✅ Cache invalidé pour ${stores.length} boutiques du business ${businessId}`);
    
  } catch (error) {
    console.error(`❌ Erreur invalidation cache business ${businessId}:`, error);
  }
}

/**
 * Middleware Express pour invalidation automatique
 * À utiliser dans les routes APIs qui modifient les données boutique
 */
export function createCacheInvalidationMiddleware(getStoreId: (req: any) => string) {
  return async (req: any, res: any, next: any) => {
    // Sauvegarder la méthode json originale
    const originalJson = res.json;
    
    // Override pour déclencher invalidation après succès
    res.json = function(data: any) {
      // Si succès (pas d'erreur), invalider cache
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const storeId = getStoreId(req);
        if (storeId) {
          // Invalidation asynchrone (ne pas attendre)
          invalidateStoreCacheAfterUpdate(storeId, `${req.method}_${req.path}`)
            .catch(error => console.error('❌ Erreur invalidation middleware:', error));
        }
      }
      
      // Appeler la méthode json originale
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Export des constantes pour types de modifications
export const CACHE_UPDATE_TYPES = {
  PRODUCT_CREATE: 'product_create',
  PRODUCT_UPDATE: 'product_update',
  PRODUCT_DELETE: 'product_delete',
  SERVICE_CREATE: 'service_create',
  SERVICE_UPDATE: 'service_update', 
  SERVICE_DELETE: 'service_delete',
  AI_CONFIG_UPDATE: 'ai_config_update',
  NOTIFICATION_UPDATE: 'notification_update',
  STORE_SETTINGS_UPDATE: 'store_settings_update',
  COMPONENT_UPDATE: 'component_update',
  BUSINESS_UPDATE: 'business_update'
} as const;