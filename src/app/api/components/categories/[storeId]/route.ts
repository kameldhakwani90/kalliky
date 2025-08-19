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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

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

    // Récupérer les catégories de composants
    const categories = await prisma.componentCategory.findMany({
      where: {
        storeId
      },
      include: {
        components: {
          select: {
            id: true,
            name: true,
            usageCount: true,
            aiExtracted: true,
            aiConfidence: true,
            variations: true,
            aliases: true
          },
          orderBy: {
            usageCount: 'desc'
          }
        },
        ...(includeStats && {
          _count: {
            select: {
              components: true
            }
          }
        })
      },
      orderBy: [
        { order: 'asc' },
        { frequency: 'desc' },
        { name: 'asc' }
      ]
    });

    // Ajouter des statistiques d'usage si demandé
    let enrichedCategories = categories;
    if (includeStats) {
      enrichedCategories = await Promise.all(
        categories.map(async (category) => {
          // Calculer les statistiques d'usage
          const usageStats = await prisma.componentUsageStats.aggregate({
            where: {
              storeId,
              component: {
                categoryId: category.id
              }
            },
            _sum: {
              totalUsage: true,
              weeklyUsage: true,
              monthlyUsage: true
            },
            _avg: {
              customerAcceptanceRate: true,
              averageRating: true
            }
          });

          return {
            ...category,
            usageStats: {
              totalUsage: usageStats._sum.totalUsage || 0,
              weeklyUsage: usageStats._sum.weeklyUsage || 0,
              monthlyUsage: usageStats._sum.monthlyUsage || 0,
              averageAcceptanceRate: usageStats._avg.customerAcceptanceRate || 0,
              averageRating: usageStats._avg.averageRating || 0
            }
          };
        })
      );
    }

    return NextResponse.json({
      categories: enrichedCategories,
      totalCategories: categories.length,
      totalComponents: categories.reduce((sum, cat) => sum + cat.components.length, 0)
    });

  } catch (error) {
    console.error('Error fetching component categories:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des catégories' 
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;
    const body = await request.json();
    const { name, description, color, order } = body;

    if (!name) {
      return NextResponse.json({ 
        error: 'Nom de catégorie requis' 
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

    // Vérifier que la catégorie n'existe pas déjà
    const existingCategory = await prisma.componentCategory.findFirst({
      where: {
        storeId,
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingCategory) {
      return NextResponse.json({ 
        error: 'Une catégorie avec ce nom existe déjà' 
      }, { status: 409 });
    }

    // Créer la nouvelle catégorie
    const category = await prisma.componentCategory.create({
      data: {
        storeId,
        name,
        description,
        color,
        order: order || 0,
        aiGenerated: false,
        frequency: 0
      },
      include: {
        components: true
      }
    });

    return NextResponse.json({
      success: true,
      category
    });

  } catch (error) {
    console.error('Error creating component category:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création de la catégorie' 
    }, { status: 500 });
  }
}