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

// GET: Récupérer une ressource spécifique
export async function GET(request: NextRequest, { params }: { params: Promise<{ storeId: string; resourceId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, resourceId } = await params;

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

    // Récupérer la ressource
    const resource = await prisma.serviceResource.findFirst({
      where: {
        id: resourceId,
        storeId
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

    if (!resource) {
      return NextResponse.json({ 
        error: 'Ressource non trouvée' 
      }, { status: 404 });
    }

    return NextResponse.json(resource);

  } catch (error) {
    console.error('Error fetching resource:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération de la ressource' 
    }, { status: 500 });
  }
}

// PUT: Modifier une ressource
export async function PUT(request: NextRequest, { params }: { params: Promise<{ storeId: string; resourceId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, resourceId } = await params;
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
      metadata,
      isActive
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ 
        error: 'Le nom est requis' 
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

    // Vérifier que la ressource existe
    const existingResource = await prisma.serviceResource.findFirst({
      where: {
        id: resourceId,
        storeId
      }
    });

    if (!existingResource) {
      return NextResponse.json({ 
        error: 'Ressource non trouvée' 
      }, { status: 404 });
    }

    // Vérifier l'unicité du nom si modifié
    if (name.trim() !== existingResource.name) {
      const duplicateName = await prisma.serviceResource.findFirst({
        where: {
          storeId,
          name: name.trim(),
          id: { not: resourceId }
        }
      });

      if (duplicateName) {
        return NextResponse.json({
          error: `Une ressource nommée "${name.trim()}" existe déjà dans ce store`
        }, { status: 400 });
      }
    }

    // Vérifier l'unicité de l'ID unique si modifié et fourni
    if (uniqueId && uniqueId.trim() !== existingResource.uniqueId) {
      const duplicateUniqueId = await prisma.serviceResource.findFirst({
        where: {
          uniqueId: uniqueId.trim(),
          id: { not: resourceId }
        }
      });

      if (duplicateUniqueId) {
        return NextResponse.json({
          error: `L'identifiant unique "${uniqueId.trim()}" est déjà utilisé`
        }, { status: 400 });
      }
    }

    // Mettre à jour la ressource
    const updatedResource = await prisma.serviceResource.update({
      where: { id: resourceId },
      data: {
        type: type || existingResource.type,
        name: name.trim(),
        description: description?.trim() || null,
        uniqueId: uniqueId?.trim() || null,
        specifications: specifications || existingResource.specifications,
        availability: availability || existingResource.availability,
        constraints: constraints || existingResource.constraints,
        costs: costs || existingResource.costs,
        metadata: metadata || existingResource.metadata,
        isActive: isActive !== undefined ? isActive : existingResource.isActive
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
      resource: updatedResource
    });

  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour de la ressource' 
    }, { status: 500 });
  }
}

// DELETE: Supprimer une ressource
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ storeId: string; resourceId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, resourceId } = await params;

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

    // Vérifier que la ressource existe
    const resource = await prisma.serviceResource.findFirst({
      where: {
        id: resourceId,
        storeId
      },
      include: {
        _count: {
          select: {
            assignments: true
          }
        }
      }
    });

    if (!resource) {
      return NextResponse.json({ 
        error: 'Ressource non trouvée' 
      }, { status: 404 });
    }

    // Vérifier si la ressource est assignée à des services
    if (resource._count.assignments > 0) {
      return NextResponse.json({
        error: `Cette ressource est assignée à ${resource._count.assignments} service(s). Veuillez d'abord retirer les assignations.`
      }, { status: 400 });
    }

    // Supprimer la ressource
    await prisma.serviceResource.delete({
      where: { id: resourceId }
    });

    return NextResponse.json({
      success: true,
      message: 'Ressource supprimée avec succès'
    });

  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression de la ressource' 
    }, { status: 500 });
  }
}