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

// GET - Récupérer les produits liés à un service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId } = await params;

    // Vérifier l'accès au service
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

    // Récupérer les produits liés
    const linkedProducts = await prisma.productService.findMany({
      where: { 
        serviceId,
        isActive: true 
      },
      include: {
        product: {
          include: {
            variations: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Récupérer aussi les produits disponibles non liés
    const allProducts = await prisma.product.findMany({
      where: {
        storeId: service.storeId,
        status: 'ACTIVE',
        productType: { in: ['RENTAL', 'SERVICE_ITEM'] },
        isBookable: true
      },
      include: {
        variations: true
      }
    });

    const linkedProductIds = linkedProducts.map(lp => lp.productId);
    const availableProducts = allProducts.filter(p => !linkedProductIds.includes(p.id));

    return NextResponse.json({
      linkedProducts: linkedProducts.map(lp => ({
        linkId: lp.id,
        order: lp.order,
        ...lp.product
      })),
      availableProducts,
      total: linkedProducts.length
    });

  } catch (error) {
    console.error('Error fetching service products:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des produits du service' 
    }, { status: 500 });
  }
}

// POST - Lier un produit à un service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId } = await params;
    const body = await request.json();
    const { productId, order = 0 } = body;

    if (!productId) {
      return NextResponse.json({ 
        error: 'productId requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès au service
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

    // Vérifier que le produit existe et appartient à la même boutique
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: service.storeId
      }
    });

    if (!product) {
      return NextResponse.json({ 
        error: 'Produit non trouvé ou non compatible' 
      }, { status: 404 });
    }

    // Vérifier si le lien existe déjà
    const existingLink = await prisma.productService.findFirst({
      where: {
        productId,
        serviceId
      }
    });

    if (existingLink) {
      // Réactiver le lien s'il était désactivé
      const updatedLink = await prisma.productService.update({
        where: { id: existingLink.id },
        data: { 
          isActive: true,
          order 
        }
      });

      return NextResponse.json({
        success: true,
        productService: updatedLink
      });
    }

    // Créer le nouveau lien
    const productService = await prisma.productService.create({
      data: {
        productId,
        serviceId,
        order,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      productService
    });

  } catch (error) {
    console.error('Error linking product to service:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la liaison du produit au service' 
    }, { status: 500 });
  }
}

// DELETE - Délier un produit d'un service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId } = await params;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ 
        error: 'productId requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès au service
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

    // Désactiver le lien (soft delete)
    const productService = await prisma.productService.updateMany({
      where: {
        productId,
        serviceId
      },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Produit délié du service avec succès'
    });

  } catch (error) {
    console.error('Error unlinking product from service:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du lien' 
    }, { status: 500 });
  }
}

// PUT - Mettre à jour l'ordre des produits liés
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId } = await params;
    const body = await request.json();
    const { products } = body; // Array of { productId, order }

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ 
        error: 'Liste de produits requise' 
      }, { status: 400 });
    }

    // Vérifier l'accès au service
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

    // Mettre à jour l'ordre de chaque produit
    const updates = await Promise.all(
      products.map(({ productId, order }) =>
        prisma.productService.updateMany({
          where: {
            productId,
            serviceId
          },
          data: { order }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Ordre des produits mis à jour'
    });

  } catch (error) {
    console.error('Error updating product order:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour de l\'ordre' 
    }, { status: 500 });
  }
}