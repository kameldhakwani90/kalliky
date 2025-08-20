import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authService } from '@/services/auth.service';

// GET - Récupérer une configuration métier spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier les droits super admin
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const config = await prisma.businessCategoryConfig.findUnique({
      where: { id: params.id }
    });

    if (!config) {
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 });
    }

    return NextResponse.json(config);

  } catch (error) {
    console.error('❌ Erreur GET business-type:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Modifier une configuration métier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier les droits super admin
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const data = await request.json();

    // Vérifier que la configuration existe
    const existing = await prisma.businessCategoryConfig.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 });
    }

    // Mise à jour
    const updatedConfig = await prisma.businessCategoryConfig.update({
      where: { id: params.id },
      data: {
        displayName: data.displayName || existing.displayName,
        systemPrompt: data.systemPrompt || existing.systemPrompt,
        defaultParams: data.defaultParams !== undefined ? data.defaultParams : existing.defaultParams,
        availableOptions: data.availableOptions !== undefined ? data.availableOptions : existing.availableOptions,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
        lastModifiedBy: user.id,
        updatedAt: new Date()
      }
    });

    // Invalider le cache des boutiques qui utilisent ce type métier
    await invalidateStoresCacheForCategory(existing.category);

    return NextResponse.json(updatedConfig);

  } catch (error) {
    console.error('❌ Erreur PUT business-type:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une configuration métier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier les droits super admin
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Vérifier que la configuration existe
    const existing = await prisma.businessCategoryConfig.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 });
    }

    // Vérifier qu'aucune boutique n'utilise ce type métier
    const storesCount = await prisma.store.count({
      where: { businessCategory: existing.category as any }
    });

    if (storesCount > 0) {
      return NextResponse.json({ 
        error: `Impossible de supprimer: ${storesCount} boutique(s) utilisent ce type métier` 
      }, { status: 400 });
    }

    // Suppression
    await prisma.businessCategoryConfig.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Erreur DELETE business-type:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Fonction utilitaire pour invalider le cache des boutiques
async function invalidateStoresCacheForCategory(category: string) {
  try {
    // Récupérer toutes les boutiques de cette catégorie
    const stores = await prisma.store.findMany({
      where: { businessCategory: category as any },
      select: { id: true }
    });

    // Invalider le cache Redis pour chaque boutique
    // (sera fait plus tard quand on intégrera avec le StoreCacheService)
    console.log(`🔄 Cache à invalider pour ${stores.length} boutiques de catégorie ${category}`);
    
  } catch (error) {
    console.error('❌ Erreur invalidation cache:', error);
  }
}