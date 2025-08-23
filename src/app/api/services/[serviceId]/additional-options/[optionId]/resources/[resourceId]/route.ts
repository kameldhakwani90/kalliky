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
 * PUT - Modifier les paramètres d'une ressource affectée à une option
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string; optionId: string; resourceId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { optionId, resourceId } = await params;
    const body = await request.json();

    // Validation des données
    if (body.isRequired !== undefined && typeof body.isRequired !== 'boolean') {
      return NextResponse.json({ 
        error: 'isRequired doit être un booléen' 
      }, { status: 400 });
    }

    // Vérifier ownership
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

    // Mettre à jour l'affectation
    const updatedResource = await prisma.serviceAdditionalOptionResource.update({
      where: { id: optionResource.id },
      data: {
        ...(body.isRequired !== undefined && { isRequired: body.isRequired }),
        ...(body.constraints !== undefined && { constraints: body.constraints })
      }
    });

    // Récupérer avec détails
    const resourceDetail = await prisma.serviceResource.findUnique({
      where: { id: resourceId }
    });

    return NextResponse.json({
      success: true,
      resource: {
        ...updatedResource,
        resourceDetail
      }
    });

  } catch (error) {
    console.error('[PUT option-resource] Erreur:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la modification des paramètres' 
    }, { status: 500 });
  }
}

/**
 * DELETE - Retirer cette ressource spécifique de l'option
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string; optionId: string; resourceId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { optionId, resourceId } = await params;

    // Vérifier ownership
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
    console.error('[DELETE option-resource] Erreur:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression de l\'affectation' 
    }, { status: 500 });
  }
}