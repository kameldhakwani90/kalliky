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

// GET: Récupérer toutes les ressources d'un store
export async function GET(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Filtrer par type

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

    // Construire les filtres
    const where: any = { storeId };
    if (type) {
      where.type = type;
    }

    // Récupérer les ressources
    const resources = await prisma.serviceResource.findMany({
      where,
      include: {
        assignments: {
          include: {
            variant: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            assignments: true
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    // Calculer les statistiques
    const stats = {
      total: resources.length,
      active: resources.filter(r => r.isActive).length,
      byType: resources.reduce((acc: any, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      }, {}),
      assigned: resources.filter(r => r._count.assignments > 0).length
    };

    return NextResponse.json({
      resources,
      stats
    });

  } catch (error) {
    console.error('Error fetching store resources:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des ressources' 
    }, { status: 500 });
  }
}

// POST: Créer une nouvelle ressource
export async function POST(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;
    const body = await request.json();
    const {
      type,
      name,
      description,
      uniqueId,
      specifications,
      availability,
      constraints,
      costs,
      metadata
    } = body;

    if (!type || !name?.trim()) {
      return NextResponse.json({ 
        error: 'Le type et le nom sont requis' 
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

    // Vérifier l'unicité du nom dans ce store
    const existingResource = await prisma.serviceResource.findFirst({
      where: {
        storeId,
        name: name.trim()
      }
    });

    if (existingResource) {
      return NextResponse.json({
        error: `Une ressource nommée "${name.trim()}" existe déjà dans ce store`
      }, { status: 400 });
    }

    // Vérifier l'unicité de l'ID unique s'il est fourni
    if (uniqueId) {
      const existingUniqueId = await prisma.serviceResource.findFirst({
        where: {
          uniqueId: uniqueId.trim()
        }
      });

      if (existingUniqueId) {
        return NextResponse.json({
          error: `L'identifiant unique "${uniqueId.trim()}" est déjà utilisé`
        }, { status: 400 });
      }
    }

    // Créer la ressource
    const resource = await prisma.serviceResource.create({
      data: {
        storeId,
        type,
        name: name.trim(),
        description: description?.trim() || null,
        uniqueId: uniqueId?.trim() || null,
        specifications: specifications || {},
        availability: availability || {},
        constraints: constraints || {},
        costs: costs || {},
        metadata: metadata || {}
      },
      include: {
        assignments: {
          include: {
            variant: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            assignments: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      resource
    });

  } catch (error) {
    console.error('Error creating service resource:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création de la ressource' 
    }, { status: 500 });
  }
}