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
 * GET - Récupérer une option spécifique avec ses ressources
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

    // Vérifier ownership via le service
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
      },
      include: {
        optionResources: true
      }
    });

    if (!option) {
      return NextResponse.json({ 
        error: 'Option non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      option
    });

  } catch (error) {
    console.error('[GET additional-option] Erreur:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération de l\'option' 
    }, { status: 500 });
  }
}

/**
 * PUT - Modifier une option existante
 */
export async function PUT(
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
    if (body.name && !body.name.trim()) {
      return NextResponse.json({ 
        error: 'Le nom de l\'option ne peut pas être vide' 
      }, { status: 400 });
    }

    if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
      return NextResponse.json({ 
        error: 'Le prix doit être un nombre positif' 
      }, { status: 400 });
    }

    if (body.priceType) {
      const validPriceTypes = ['FIXED', 'PER_PERSON', 'PER_DAY', 'PER_HOUR'];
      if (!validPriceTypes.includes(body.priceType)) {
        return NextResponse.json({ 
          error: 'Type de prix invalide' 
        }, { status: 400 });
      }
    }

    // Vérifier ownership
    const existingOption = await prisma.serviceAdditionalOption.findFirst({
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

    if (!existingOption) {
      return NextResponse.json({ 
        error: 'Option non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    // Vérifier l'unicité du nom si modifié
    if (body.name && body.name.trim() !== existingOption.name) {
      const nameConflict = await prisma.serviceAdditionalOption.findFirst({
        where: {
          serviceId,
          name: body.name.trim(),
          id: { not: optionId }
        }
      });

      if (nameConflict) {
        return NextResponse.json({
          error: `Une option nommée "${body.name.trim()}" existe déjà pour ce service`
        }, { status: 400 });
      }
    }

    // Mettre à jour l'option
    const updatedOption = await prisma.serviceAdditionalOption.update({
      where: { id: optionId },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.priceType && { priceType: body.priceType }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.orderIndex !== undefined && { orderIndex: body.orderIndex }),
        ...(body.metadata !== undefined && { metadata: body.metadata })
      },
      include: {
        optionResources: true
      }
    });

    return NextResponse.json({
      success: true,
      option: updatedOption
    });

  } catch (error) {
    console.error('[PUT additional-option] Erreur:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la modification de l\'option' 
    }, { status: 500 });
  }
}

/**
 * DELETE - Supprimer une option
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

    // Supprimer l'option (cascade supprime les ressources liées)
    await prisma.serviceAdditionalOption.delete({
      where: { id: optionId }
    });

    return NextResponse.json({
      success: true,
      message: `Option "${option.name}" supprimée avec succès`
    });

  } catch (error) {
    console.error('[DELETE additional-option] Erreur:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression de l\'option' 
    }, { status: 500 });
  }
}