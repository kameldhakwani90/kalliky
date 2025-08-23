import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Authentification utilisateur
async function authenticateUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      userId: string; 
      email: string; 
      role: string 
    };
    return { user: { id: decoded.userId, email: decoded.email, role: decoded.role } };
  } catch {
    return null;
  }
}

/**
 * GET - Récupérer toutes les ressources d'une option avec détails
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string; optionId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { serviceId, optionId } = await params;

    // Vérifier ownership
    const option = await prisma.serviceAdditionalOption.findFirst({
      where: {
        id: optionId,
        serviceId,
        service: {
          store: {
            business: {
              ownerId: session.user.id
            }
          }
        }
      }
    });

    if (!option) {
      return NextResponse.json({ 
        error: 'Option non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    // Récupérer les ressources avec leurs détails
    const optionResources = await prisma.serviceAdditionalOptionResource.findMany({
      where: { optionId }
    });

    // Récupérer les détails des ressources depuis ServiceResource
    const detailedResources = await Promise.all(
      optionResources.map(async (optionResource) => {
        const resourceDetail = await prisma.serviceResource.findUnique({
          where: { id: optionResource.resourceId }
        });

        return {
          ...optionResource,
          resourceDetail: resourceDetail || {
            id: optionResource.resourceId,
            name: 'Ressource supprimée',
            type: optionResource.resourceType,
            isActive: false
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      resources: detailedResources
    });

  } catch (error) {
    console.error('[GET option-resources] Erreur:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des ressources' 
    }, { status: 500 });
  }
}

/**
 * POST - Affecter une ressource à une option
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string; optionId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { serviceId, optionId } = await params;
    const body = await request.json();

    // Validation des données
    if (!body.resourceId) {
      return NextResponse.json({ 
        error: 'resourceId requis' 
      }, { status: 400 });
    }

    const validResourceTypes = ['EMPLOYEE', 'EQUIPMENT'];
    if (!validResourceTypes.includes(body.resourceType)) {
      return NextResponse.json({ 
        error: 'Type de ressource invalide' 
      }, { status: 400 });
    }

    // Vérifier ownership de l'option
    const option = await prisma.serviceAdditionalOption.findFirst({
      where: {
        id: optionId,
        serviceId,
        service: {
          store: {
            business: {
              ownerId: session.user.id
            }
          }
        }
      }
    });

    if (!option) {
      return NextResponse.json({ 
        error: 'Option non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    // Vérifier que la ressource existe et appartient au même store
    const resource = await prisma.serviceResource.findFirst({
      where: {
        id: body.resourceId,
        type: body.resourceType,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!resource) {
      return NextResponse.json({ 
        error: 'Ressource non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    // Vérifier si la ressource n'est pas déjà affectée à cette option
    const existingAssignment = await prisma.serviceAdditionalOptionResource.findUnique({
      where: {
        optionId_resourceType_resourceId: {
          optionId,
          resourceType: body.resourceType,
          resourceId: body.resourceId
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json({
        error: 'Cette ressource est déjà affectée à cette option'
      }, { status: 400 });
    }

    // Créer l'affectation
    const optionResource = await prisma.serviceAdditionalOptionResource.create({
      data: {
        optionId,
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        isRequired: body.isRequired ?? true,
        constraints: body.constraints || null
      }
    });

    // Récupérer avec détails
    const resourceDetail = await prisma.serviceResource.findUnique({
      where: { id: body.resourceId }
    });

    return NextResponse.json({
      success: true,
      resource: {
        ...optionResource,
        resourceDetail
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[POST option-resources] Erreur:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'affectation de la ressource' 
    }, { status: 500 });
  }
}

/**
 * DELETE - Retirer une ressource d'une option
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string; optionId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { optionId } = await params;
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json({ 
        error: 'resourceId requis en query parameter' 
      }, { status: 400 });
    }

    // Vérifier ownership via l'option
    const optionResource = await prisma.serviceAdditionalOptionResource.findFirst({
      where: {
        optionId,
        resourceId,
        option: {
          service: {
            store: {
              business: {
                ownerId: session.user.id
              }
            }
          }
        }
      }
    });

    if (!optionResource) {
      return NextResponse.json({ 
        error: 'Affectation non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    // Supprimer l'affectation
    await prisma.serviceAdditionalOptionResource.delete({
      where: { id: optionResource.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Ressource retirée de l\'option avec succès'
    });

  } catch (error) {
    console.error('[DELETE option-resources] Erreur:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression de l\'affectation' 
    }, { status: 500 });
  }
}