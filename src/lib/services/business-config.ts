/**
 * SERVICE POUR RÉCUPÉRATION CONFIGURATION BUSINESS
 * 
 * Combine les configurations statiques (sécurisées) avec les overrides admin (DB)
 */

import { prisma } from '@/lib/prisma';
import { 
  getBusinessConfig, 
  type BusinessConfig, 
  type BusinessCategoryCode 
} from '@/lib/constants/business-configs';

export interface StoreBusinessConfig {
  businessType: string;
  config: BusinessConfig | null;
  hasConfig: boolean;
  adminOverride?: {
    displayName?: string;
    wording?: {
      products?: string;
      equipment?: string;
      staff?: string;
      options?: string;
    };
    systemPrompt?: string;
    menuExtractionPrompt?: string;
  };
}

/**
 * Récupère la configuration business complète pour une boutique
 * 
 * @param storeId ID de la boutique
 * @returns Configuration combinée (statique + admin override)
 */
export async function getStoreBusinessConfig(storeId: string): Promise<StoreBusinessConfig> {
  try {
    // 1. Récupérer le type d'activité depuis la fiche boutique
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        businessCategory: true,
      }
    });

    if (!store) {
      return {
        businessType: 'UNKNOWN',
        config: null,
        hasConfig: false
      };
    }

    const businessCategory = store.businessCategory as string;

    // 2. Récupérer la configuration statique (sécurisée)
    const staticConfig = getBusinessConfig(businessCategory);

    if (!staticConfig) {
      return {
        businessType: businessCategory,
        config: null,
        hasConfig: false
      };
    }

    // 3. Récupérer les overrides admin depuis la DB (optionnel)
    let adminOverride = null;
    try {
      const adminConfig = await prisma.businessCategoryConfig.findUnique({
        where: { category: businessCategory as any }
      });

      if (adminConfig && adminConfig.isActive) {
        adminOverride = {
          displayName: adminConfig.displayName,
          systemPrompt: adminConfig.systemPrompt,
          menuExtractionPrompt: adminConfig.menuExtractionPrompt,
          // Extraire wording depuis defaultParams si défini
          wording: adminConfig.defaultParams && typeof adminConfig.defaultParams === 'object' 
            ? (adminConfig.defaultParams as any).wording 
            : null
        };
      }
    } catch (dbError) {
      console.warn(`[getStoreBusinessConfig] Admin override non disponible pour ${businessCategory}:`, dbError);
      // Continuer avec config statique uniquement
    }

    // 4. Fusionner les configurations (admin override prime sur statique)
    const finalConfig: BusinessConfig = {
      ...staticConfig,
      displayName: adminOverride?.displayName || staticConfig.displayName,
      systemPrompt: adminOverride?.systemPrompt || staticConfig.systemPrompt,
      menuExtractionPrompt: adminOverride?.menuExtractionPrompt || staticConfig.menuExtractionPrompt,
      wording: {
        ...staticConfig.wording,
        ...(adminOverride?.wording || {})
      }
    };

    return {
      businessType: businessCategory,
      config: finalConfig,
      hasConfig: true,
      adminOverride
    };

  } catch (error) {
    console.error('[getStoreBusinessConfig] Erreur:', error);
    return {
      businessType: 'ERROR',
      config: null,
      hasConfig: false
    };
  }
}

/**
 * Version API pour récupérer la config business
 * Utilisable dans les API routes
 */
export async function getStoreBusinessConfigApi(storeId: string) {
  return await getStoreBusinessConfig(storeId);
}

/**
 * Récupère seulement le wording adapté au type de boutique
 * Version légère pour les interfaces
 */
export async function getStoreWording(storeId: string) {
  try {
    const config = await getStoreBusinessConfig(storeId);
    
    return {
      wording: config.config?.wording || {
        products: "Quels produits/services ?",
        equipment: "Vos équipements",
        staff: "Votre équipe",
        options: "Options additionnelles"
      },
      businessType: config.businessType,
      displayName: config.config?.displayName || 'Activité'
    };
  } catch (error) {
    console.error('[getStoreWording] Erreur:', error);
    return {
      wording: {
        products: "Quels produits/services ?",
        equipment: "Vos équipements", 
        staff: "Votre équipe",
        options: "Options additionnelles"
      },
      businessType: 'UNKNOWN',
      displayName: 'Activité'
    };
  }
}

