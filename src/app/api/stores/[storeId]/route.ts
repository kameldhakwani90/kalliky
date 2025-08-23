import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { StoreCacheService } from '@/lib/services/storeCacheService';

// Fonction d'authentification
async function authenticateUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; email: string; role: string };
    return { user: { id: decoded.userId, email: decoded.email, role: decoded.role } };
  } catch {
    return null;
  }
}

// GET - Récupérer un store
export async function GET(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      },
      include: {
        business: true
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: store.id,
      name: store.name,
      address: store.address,
      city: store.city,
      country: store.country,
      businessCategory: store.businessCategory,
      isActive: store.isActive,
      settings: store.settings || {},
      businessId: store.businessId,
      // Service configuration
      hasProducts: store.hasProducts,
      hasReservations: store.hasReservations,
      hasConsultations: store.hasConsultations,
      productsConfig: store.productsConfig,
      reservationsConfig: store.reservationsConfig,
      consultationsConfig: store.consultationsConfig,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      business: store.business
    });

  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mettre à jour un store
export async function PUT(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;
    const body = await request.json();

    // Vérifier que le store appartient à l'utilisateur
    const existingStore = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      }
    });

    if (!existingStore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Fusionner les settings existants avec les nouveaux
    const currentSettings = existingStore.settings as any || {};
    const newSettings = {
      ...currentSettings,
      ...body.settings
    };

    // Si on met à jour l'agent IA, ajouter un timestamp
    if (body.settings?.aiAgent) {
      newSettings.aiAgent = {
        ...body.settings.aiAgent,
        updatedAt: new Date().toISOString()
      };
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        name: body.name || existingStore.name,
        address: body.address || existingStore.address,
        city: body.city || existingStore.city,
        country: body.country || existingStore.country,
        businessCategory: body.businessCategory || existingStore.businessCategory,
        isActive: body.isActive !== undefined ? body.isActive : existingStore.isActive,
        settings: newSettings,
        // Service configuration
        hasProducts: body.hasProducts !== undefined ? body.hasProducts : existingStore.hasProducts,
        hasReservations: body.hasReservations !== undefined ? body.hasReservations : existingStore.hasReservations,
        hasConsultations: body.hasConsultations !== undefined ? body.hasConsultations : existingStore.hasConsultations,
        productsConfig: body.productsConfig !== undefined ? body.productsConfig : existingStore.productsConfig,
        reservationsConfig: body.reservationsConfig !== undefined ? body.reservationsConfig : existingStore.reservationsConfig,
        consultationsConfig: body.consultationsConfig !== undefined ? body.consultationsConfig : existingStore.consultationsConfig,
      },
      include: {
        business: true
      }
    });

    // Invalidar automatiquement le cache Redis après mise à jour
    try {
      // Déterminer le type de mise à jour pour optimiser
      let updateType: 'products' | 'services' | 'consultations' | 'settings' | 'all' = 'all';
      
      if (body.productsConfig !== undefined) updateType = 'products';
      else if (body.reservationsConfig !== undefined) updateType = 'services';
      else if (body.consultationsConfig !== undefined) updateType = 'consultations';
      else if (body.settings !== undefined) updateType = 'settings';

      await StoreCacheService.onStoreUpdated(storeId, updateType);
      console.log(`🔄 Cache mis à jour automatiquement pour la boutique: ${storeId} (${updateType})`);
    } catch (cacheError) {
      console.error('⚠️ Erreur mise à jour cache (non bloquante):', cacheError);
      // Ne pas bloquer la réponse si le cache échoue
    }

    return NextResponse.json({
      id: updatedStore.id,
      name: updatedStore.name,
      address: updatedStore.address,
      city: updatedStore.city,
      country: updatedStore.country,
      businessCategory: updatedStore.businessCategory,
      isActive: updatedStore.isActive,
      settings: updatedStore.settings,
      businessId: updatedStore.businessId,
      // Service configuration
      hasProducts: updatedStore.hasProducts,
      hasReservations: updatedStore.hasReservations,
      hasConsultations: updatedStore.hasConsultations,
      productsConfig: updatedStore.productsConfig,
      reservationsConfig: updatedStore.reservationsConfig,
      consultationsConfig: updatedStore.consultationsConfig,
      business: updatedStore.business,
      updatedAt: updatedStore.updatedAt
    });

  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Supprimer un store
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;

    // Vérifier que le store appartient à l'utilisateur
    const existingStore = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      }
    });

    if (!existingStore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    await prisma.store.delete({
      where: { id: storeId }
    });

    // Nettoyer le cache Redis après suppression
    try {
      await StoreCacheService.invalidateStoreCache(storeId);
      console.log(`🗑️ Cache nettoyé pour la boutique supprimée: ${storeId}`);
    } catch (cacheError) {
      console.error('⚠️ Erreur nettoyage cache (non bloquante):', cacheError);
    }

    return NextResponse.json({ message: 'Store deleted successfully' });

  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}