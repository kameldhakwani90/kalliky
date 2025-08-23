import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

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

// GET - Récupérer les services d'une boutique
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ 
        error: 'storeId requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès au store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      }
    });

    if (!store) {
      return NextResponse.json({ 
        error: 'Store non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Récupérer les services avec linkedProducts
    console.log('🔍 Chargement des services avec linkedProducts...');
    const services = await prisma.universalService.findMany({
      where: { 
        storeId,
        isActive: true 
      },
      include: {
        linkedProducts: {
          where: { isActive: true },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                image: true,
                productType: true,
                isBookable: true,
                bookingSettings: true,
                stock: true,
                variations: {
                  select: {
                    id: true,
                    name: true,
                    prices: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });
    console.log('✅ Services trouvés:', services.length);

    // Calculer les compteurs à partir des linkedProducts
    const servicesWithCounts = services.map(service => ({
      ...service,
      linkedProductsCount: service.linkedProducts?.length || 0
    }));

    return NextResponse.json({
      services: servicesWithCounts,
      total: servicesWithCounts.length
    });

  } catch (error) {
    console.error('Error fetching services:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des services',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Créer un nouveau service
export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      storeId,
      name,
      description,
      icon,
      color,
      settings
    } = body;

    if (!storeId || !name) {
      return NextResponse.json({ 
        error: 'storeId et name requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès au store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        business: {
          ownerId: session.user.id
        }
      }
    });

    if (!store) {
      return NextResponse.json({ 
        error: 'Store non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Créer le service
    const service = await prisma.universalService.create({
      data: {
        storeId,
        name,
        description: description || '',
        icon: icon || null,
        color: color || null,
        settings: settings || {},
        isActive: true,
        order: 0
      }
    });

    return NextResponse.json({
      success: true,
      service
    });

  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création du service' 
    }, { status: 500 });
  }
}

// PUT - Mettre à jour un service
export async function PUT(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      description,
      icon,
      color,
      settings,
      isActive
    } = body;

    if (!id) {
      return NextResponse.json({ 
        error: 'ID du service requis' 
      }, { status: 400 });
    }

    // Vérifier que le service existe et appartient à l'utilisateur
    const existingService = await prisma.universalService.findFirst({
      where: {
        id,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!existingService) {
      return NextResponse.json({ 
        error: 'Service non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Mettre à jour le service
    const updatedService = await prisma.universalService.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(settings !== undefined && { settings }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      include: {
        linkedProducts: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      service: updatedService
    });

  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour du service' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer un service
export async function DELETE(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'ID du service requis' 
      }, { status: 400 });
    }

    // Vérifier que le service existe et appartient à l'utilisateur
    const existingService = await prisma.universalService.findFirst({
      where: {
        id,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!existingService) {
      return NextResponse.json({ 
        error: 'Service non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Supprimer le service (cascade sur les relations)
    await prisma.universalService.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Service supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du service' 
    }, { status: 500 });
  }
}