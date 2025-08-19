import { NextRequest, NextResponse } from 'next/server';
import { StoreCacheService } from '@/lib/services/storeCacheService';

// POST - Forcer le rechargement du cache pour une boutique
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, action } = body;

    if (!storeId) {
      return NextResponse.json({ 
        error: 'storeId requis' 
      }, { status: 400 });
    }

    switch (action) {
      case 'refresh':
        await StoreCacheService.cacheStoreData(storeId);
        return NextResponse.json({ 
          success: true, 
          message: `Cache rafraîchi pour la boutique ${storeId}` 
        });

      case 'invalidate':
        await StoreCacheService.invalidateStoreCache(storeId);
        return NextResponse.json({ 
          success: true, 
          message: `Cache invalidé pour la boutique ${storeId}` 
        });

      case 'preload_all':
        // Action admin pour pré-charger toutes les boutiques
        await StoreCacheService.preloadAllActiveStores();
        return NextResponse.json({ 
          success: true, 
          message: 'Pré-chargement terminé pour toutes les boutiques actives' 
        });

      default:
        return NextResponse.json({ 
          error: 'Action invalide. Actions disponibles: refresh, invalidate, preload_all' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Erreur gestion cache boutique:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}

// GET - Récupérer les données en cache pour une boutique
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const type = searchParams.get('type') || 'data'; // 'data' ou 'prompts'

    if (!storeId) {
      return NextResponse.json({ 
        error: 'storeId requis en query parameter' 
      }, { status: 400 });
    }

    let cachedData;
    
    if (type === 'prompts') {
      cachedData = await StoreCacheService.getCachedStoreAIPrompts(storeId);
    } else {
      cachedData = await StoreCacheService.getCachedStoreData(storeId);
    }

    if (!cachedData) {
      return NextResponse.json({ 
        error: 'Aucune donnée en cache trouvée',
        storeId,
        type
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      storeId,
      type,
      data: cachedData,
      cachedAt: cachedData.lastUpdated || 'Unknown'
    });

  } catch (error) {
    console.error('❌ Erreur récupération cache boutique:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}