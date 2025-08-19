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
    const categoryId = searchParams.get('categoryId');
    const storeId = searchParams.get('storeId');
    const includeUsage = searchParams.get('includeUsage') === 'true';
    const search = searchParams.get('search') || '';

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
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    // Ajouter la recherche si spécifiée
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { aliases: { hasSome: [search] } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const components = await prisma.component.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        ...(includeUsage && {
          usageStats: {
            select: {
              totalUsage: true,
              weeklyUsage: true,
              monthlyUsage: true,
              customerAcceptanceRate: true,
              averageRating: true,
              popularTimeSlots: true,
              lastUpdated: true
            }
          }
        }),
        compositionOptions: {
          select: {
            id: true,
            step: {
              select: {
                product: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      components,
      totalComponents: components.length
    });

  } catch (error) {
    console.error('Error fetching components:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des composants' 
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
      name, 
      categoryId, 
      storeId, 
      description, 
      variations, 
      aliases, 
      nutritionInfo, 
      allergens, 
      defaultPrices 
    } = body;

    if (!name || !categoryId || !storeId) {
      return NextResponse.json({ 
        error: 'Nom, categoryId et storeId requis' 
      }, { status: 400 });
    }

    // Vérifier l'accès au store et à la catégorie
    const category = await prisma.componentCategory.findFirst({
      where: {
        id: categoryId,
        storeId,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ 
        error: 'Catégorie non trouvée ou accès non autorisé' 
      }, { status: 404 });
    }

    // Vérifier que le composant n'existe pas déjà dans cette catégorie
    const existingComponent = await prisma.component.findFirst({
      where: {
        storeId,
        categoryId,
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingComponent) {
      return NextResponse.json({ 
        error: 'Un composant avec ce nom existe déjà dans cette catégorie' 
      }, { status: 409 });
    }

    // Créer le nouveau composant
    const component = await prisma.component.create({
      data: {
        name,
        categoryId,
        storeId,
        description,
        variations: variations || [],
        aliases: aliases || [],
        nutritionInfo: nutritionInfo || null,
        allergens: allergens || [],
        defaultPrices: defaultPrices || null,
        aiExtracted: false,
        aiConfidence: null,
        usageCount: 0
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    // Mettre à jour la fréquence de la catégorie
    await prisma.componentCategory.update({
      where: { id: categoryId },
      data: {
        frequency: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      component
    });

  } catch (error) {
    console.error('Error creating component:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création du composant' 
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
      variations, 
      aliases, 
      nutritionInfo, 
      allergens, 
      defaultPrices 
    } = body;

    if (!id) {
      return NextResponse.json({ 
        error: 'ID du composant requis' 
      }, { status: 400 });
    }

    // Vérifier que le composant existe et appartient à l'utilisateur
    const component = await prisma.component.findFirst({
      where: {
        id,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!component) {
      return NextResponse.json({ 
        error: 'Composant non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Mettre à jour le composant
    const updatedComponent = await prisma.component.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(variations && { variations }),
        ...(aliases && { aliases }),
        ...(nutritionInfo !== undefined && { nutritionInfo }),
        ...(allergens && { allergens }),
        ...(defaultPrices !== undefined && { defaultPrices })
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      component: updatedComponent
    });

  } catch (error) {
    console.error('Error updating component:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour du composant' 
    }, { status: 500 });
  }
}