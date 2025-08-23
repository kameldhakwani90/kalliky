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
 * GET - Récupérer toutes les options additionnelles d'un service
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { serviceId } = await params;

    // Vérifier que le service appartient à l'utilisateur
    const service = await prisma.universalService.findFirst({
      where: {
        id: serviceId,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ 
        error: 'Service non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Récupérer les options avec leurs ressources
    const options = await prisma.serviceAdditionalOption.findMany({
      where: { serviceId },
      include: {
        optionResources: {
          include: {
            // Note: les ressources détaillées seront récupérées côté client
            // car resourceId pointe vers ServiceResource
          }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json({
      success: true,
      options
    });

  } catch (error) {
    console.error('[GET additional-options] Erreur:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des options' 
    }, { status: 500 });
  }
}

/**
 * POST - Créer une nouvelle option additionnelle
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { serviceId } = await params;
    const body = await request.json();

    // Validation des données
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ 
        error: 'Le nom de l\'option est requis' 
      }, { status: 400 });
    }

    if (typeof body.price !== 'number' || body.price < 0) {
      return NextResponse.json({ 
        error: 'Le prix doit être un nombre positif' 
      }, { status: 400 });
    }

    const validPriceTypes = ['FIXED', 'PER_PERSON', 'PER_DAY', 'PER_HOUR'];
    if (!validPriceTypes.includes(body.priceType)) {
      return NextResponse.json({ 
        error: 'Type de prix invalide' 
      }, { status: 400 });
    }

    // Vérifier que le service appartient à l'utilisateur
    const service = await prisma.universalService.findFirst({
      where: {
        id: serviceId,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ 
        error: 'Service non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Vérifier l'unicité du nom dans ce service
    const existingOption = await prisma.serviceAdditionalOption.findFirst({
      where: {
        serviceId,
        name: body.name.trim()
      }
    });

    if (existingOption) {
      return NextResponse.json({
        error: `Une option nommée "${body.name.trim()}" existe déjà pour ce service`
      }, { status: 400 });
    }

    // Calculer l'ordre suivant
    const maxOrder = await prisma.serviceAdditionalOption.findFirst({
      where: { serviceId },
      select: { orderIndex: true },
      orderBy: { orderIndex: 'desc' }
    });

    const nextOrder = (maxOrder?.orderIndex ?? -1) + 1;

    // Créer l'option
    const option = await prisma.serviceAdditionalOption.create({
      data: {
        serviceId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        price: body.price,
        priceType: body.priceType,
        isActive: body.isActive ?? true,
        orderIndex: body.orderIndex ?? nextOrder,
        metadata: body.metadata || null
      },
      include: {
        optionResources: true
      }
    });

    return NextResponse.json({
      success: true,
      option
    }, { status: 201 });

  } catch (error) {
    console.error('[POST additional-options] Erreur:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création de l\'option' 
    }, { status: 500 });
  }
}

/**
 * PUT - Réordonner les options (batch update)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { serviceId } = await params;
    const body = await request.json();

    if (!Array.isArray(body.options)) {
      return NextResponse.json({ 
        error: 'Format invalide: options array requis' 
      }, { status: 400 });
    }

    // Vérifier ownership
    const service = await prisma.universalService.findFirst({
      where: {
        id: serviceId,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ 
        error: 'Service non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Mettre à jour l'ordre des options
    const updatePromises = body.options.map((option: any, index: number) => 
      prisma.serviceAdditionalOption.update({
        where: { 
          id: option.id,
          serviceId // Sécurité supplémentaire
        },
        data: { orderIndex: index }
      })
    );

    await Promise.all(updatePromises);

    // Récupérer les options mises à jour
    const updatedOptions = await prisma.serviceAdditionalOption.findMany({
      where: { serviceId },
      include: {
        optionResources: true
      },
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json({
      success: true,
      options: updatedOptions
    });

  } catch (error) {
    console.error('[PUT additional-options] Erreur:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour des options' 
    }, { status: 500 });
  }
}