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

export async function GET(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const includeComposition = searchParams.get('includeComposition') === 'true';

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

    // Construire la requête
    const whereClause: any = { storeId };
    if (status) {
      whereClause.status = status;
    }

    // Récupérer les produits
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        variations: true,
        ...(includeComposition && {
          compositionSteps: {
            include: {
              options: {
                include: {
                  linkedComponent: {
                    include: {
                      category: true
                    }
                  }
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          }
        }),
        tags: true,
        menuUploadSession: {
          select: {
            id: true,
            originalFileName: true,
            aiProcessingStatus: true
          }
        }
      },
      orderBy: [
        { popularity: 'desc' },
        { name: 'asc' }
      ]
    });

    // Transformer les données pour correspondre au format attendu par l'interface
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      image: product.image || 'https://placehold.co/600x400.png',
      imageHint: product.name.toLowerCase(),
      tags: product.tags.map(t => t.tag),
      status: product.status,
      sourceType: product.sourceType,
      sourceConfidence: product.sourceConfidence,
      hasComposition: product.hasComposition,
      originalComposition: product.originalComposition,
      aiDescription: product.aiDescription,
      aiKeywords: product.aiKeywords,
      
      // Récupérer l'availabilitySchedule depuis aiKeywords (temporaire)
      availabilitySchedule: (() => {
        try {
          if (product.aiKeywords && product.aiKeywords.length > 0) {
            const scheduleStr = product.aiKeywords[0];
            if (scheduleStr.startsWith('{')) {
              return JSON.parse(scheduleStr);
            }
          }
        } catch (e) {
          // Si erreur de parsing, retourner null
        }
        return null;
      })(),
      
      // Champs de gestion
      stock: product.stock,
      popularity: product.popularity,
      profitMargin: product.profitMargin,
      
      // Variations (prix)
      variations: product.variations.map(v => ({
        id: v.id,
        name: v.name,
        prices: v.prices as any // JSON déjà parsé par Prisma
      })),

      // Composition si demandée
      ...(includeComposition && product.compositionSteps && {
        composition: product.compositionSteps.map(step => ({
          id: step.id,
          title: step.title,
          isRequired: step.isRequired,
          selectionType: step.selectionType,
          options: step.options.map(option => ({
            id: option.id,
            name: option.name,
            prices: option.prices as any,
            linkedComponentId: option.linkedComponentId,
            linkedComponent: option.linkedComponent ? {
              id: option.linkedComponent.id,
              name: option.linkedComponent.name,
              category: option.linkedComponent.category
            } : null
          }))
        }))
      }),

      // Métadonnées d'upload
      uploadInfo: product.menuUploadSession ? {
        sessionId: product.menuUploadSession.id,
        fileName: product.menuUploadSession.originalFileName,
        status: product.menuUploadSession.aiProcessingStatus
      } : null,

      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    return NextResponse.json({
      products: transformedProducts,
      total: products.length
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des produits' 
    }, { status: 500 });
  }
}

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
      category,
      image,
      variations,
      composition,
      status = 'DRAFT',
      availabilitySchedule
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

    // Créer le produit avec transaction pour gérer la composition
    const result = await prisma.$transaction(async (tx) => {
      // Créer le produit de base
      const product = await tx.product.create({
        data: {
          storeId,
          name,
          description: description || '',
          category: category || 'Général',
          image: image || null,
          status,
          hasComposition: composition && composition.length > 0,
          sourceType: 'MANUAL',
          popularity: 0,
          // Utiliser aiKeywords comme champ JSON temporaire pour l'availabilitySchedule
          aiKeywords: availabilitySchedule ? [JSON.stringify(availabilitySchedule)] : []
        }
      });

      // Créer les variations si fournies
      if (variations && variations.length > 0) {
        await tx.productVariation.createMany({
          data: variations.map((v: any, index: number) => ({
            productId: product.id,
            name: v.name || `Variation ${index + 1}`,
            type: v.type || 'CUSTOM',
            value: v.value || '',
            prices: v.prices || {},
            isVisible: v.isVisible !== false,
            isDefault: index === 0,
            order: index
          }))
        });
      }

      // Créer la composition si fournie
      if (composition && composition.length > 0) {
        for (const [stepIndex, step] of composition.entries()) {
          const compositionStep = await tx.compositionStep.create({
            data: {
              productId: product.id,
              title: step.title,
              isRequired: step.isRequired,
              selectionType: step.selectionType || 'SINGLE',
              order: stepIndex,
              aiGenerated: false
            }
          });

          // Créer les options pour cette étape
          if (step.options && step.options.length > 0) {
            await tx.compositionOption.createMany({
              data: step.options.map((option: any, optionIndex: number) => ({
                stepId: compositionStep.id,
                name: option.name,
                prices: option.prices || {},
                isVisible: option.isVisible !== false,
                order: optionIndex,
                linkedComponentId: option.linkedComponentId || null,
                linkedProductId: option.linkedProductId || null,
                aiGenerated: false
              }))
            });
          }
        }
      }

      return product;
    });

    return NextResponse.json({
      success: true,
      product: result
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création du produit' 
    }, { status: 500 });
  }
}

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
      category,
      image,
      status,
      variations,
      composition,
      availabilitySchedule
    } = body;

    if (!id) {
      return NextResponse.json({ 
        error: 'ID du produit requis' 
      }, { status: 400 });
    }

    // Vérifier que le produit existe et appartient à l'utilisateur
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ 
        error: 'Produit non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Mettre à jour le produit avec transaction pour gérer les variations
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Mettre à jour le produit de base
      const product = await tx.product.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(category && { category }),
          ...(image !== undefined && { image }),
          ...(status && { status }),
          ...(composition !== undefined && { hasComposition: composition && composition.length > 0 }),
          ...(availabilitySchedule !== undefined && { 
            aiKeywords: availabilitySchedule ? [JSON.stringify(availabilitySchedule)] : []
          }),
          updatedAt: new Date()
        }
      });
      

      // Mettre à jour les variations si fournies
      if (variations && variations.length > 0) {
        // Supprimer les anciennes variations
        await tx.productVariation.deleteMany({
          where: { productId: id }
        });

        // Créer les nouvelles variations
        await tx.productVariation.createMany({
          data: variations.map((v: any, index: number) => ({
            productId: id,
            name: v.name || `Variation ${index + 1}`,
            type: v.type || 'CUSTOM',
            value: v.value || '',
            prices: v.prices || {},
            isVisible: v.isVisible !== false,
            isDefault: index === 0,
            order: index
          }))
        });
      }

      // Retourner le produit mis à jour avec ses relations
      return await tx.product.findUnique({
        where: { id },
        include: {
          variations: true,
          compositionSteps: {
            include: {
              options: true
            }
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour du produit' 
    }, { status: 500 });
  }
}

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
        error: 'ID du produit requis' 
      }, { status: 400 });
    }

    // Vérifier que le produit existe et appartient à l'utilisateur
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ 
        error: 'Produit non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Supprimer le produit (cascade sur les variations et compositions)
    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du produit' 
    }, { status: 500 });
  }
}