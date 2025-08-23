import { NextRequest, NextResponse } from 'next/server';
import { getStoreBusinessConfigApi } from '@/lib/services/business-config';

/**
 * API pour récupérer la configuration business d'une boutique
 * GET /api/stores/[storeId]/business-config
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId requis' },
        { status: 400 }
      );
    }

    // Récupérer la configuration business (statique + admin override)
    const config = await getStoreBusinessConfigApi(storeId);

    return NextResponse.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('[GET business-config] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la configuration' },
      { status: 500 }
    );
  }
}