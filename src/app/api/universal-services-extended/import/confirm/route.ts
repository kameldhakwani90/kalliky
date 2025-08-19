import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Fonction d'authentification
async function authenticateUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; email: string; role: string };
    return { user: { id: decoded.userId, email: decoded.email, role: decoded.role } };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, importData } = body;

    if (!storeId || !importData) {
      return NextResponse.json({ 
        error: 'storeId et importData requis' 
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

    // Créer le service principal avec toutes ses catégories et produits
    const service = await prisma.universalService.create({
      data: {
        storeId,
        name: importData.serviceName,
        description: `Service créé par import intelligent`,
        pattern: 'FLEXIBLE_BOOKING',
        icon: '🎯',
        color: '#3b82f6',
        settings: {
          importedAt: new Date().toISOString(),
          source: 'intelligent_import'
        },
        serviceCategories: {
          create: importData.categories.map((category: any, categoryIndex: number) => ({
            name: category.name,
            description: category.description,
            order: categoryIndex,
            icon: '📋',
            color: '#6366f1',
            settings: {},
            products: {
              create: category.products.map((product: any, productIndex: number) => ({
                name: product.name,
                description: product.description,
                order: productIndex,
                pricing: product.pricing || {},
                specifications: product.specifications || {},
                metadata: {
                  importedAt: new Date().toISOString()
                }
              }))
            }
          }))
        }
      },
      include: {
        serviceCategories: {
          include: {
            products: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      service,
      message: `Service "${importData.serviceName}" créé avec ${importData.categories.length} catégories et ${importData.categories.reduce((total: number, cat: any) => total + cat.products.length, 0)} produits`
    });

  } catch (error) {
    console.error('Error confirming import:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création du service' 
    }, { status: 500 });
  }
}