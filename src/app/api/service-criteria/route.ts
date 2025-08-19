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
    const serviceType = searchParams.get('serviceType');

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
    if (serviceType) {
      whereClause.serviceType = serviceType;
    }

    // Récupérer les critères de service
    const serviceCriteria = await prisma.serviceCriteria.findMany({
      where: whereClause,
      orderBy: {
        serviceType: 'asc'
      }
    });

    // Organiser par type de service
    const criteriaByService = serviceCriteria.reduce((acc, criteria) => {
      if (!acc[criteria.serviceType]) {
        acc[criteria.serviceType] = {
          serviceType: criteria.serviceType,
          acceptanceCriteria: [],
          rejectionCriteria: [],
          lastUpdated: criteria.updatedAt
        };
      }
      
      acc[criteria.serviceType].acceptanceCriteria = criteria.acceptanceCriteria;
      acc[criteria.serviceType].rejectionCriteria = criteria.rejectionCriteria;
      
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      serviceCriteria: Object.values(criteriaByService),
      storeId,
      totalServices: Object.keys(criteriaByService).length
    });

  } catch (error) {
    console.error('Error fetching service criteria:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des critères' 
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
      serviceType, 
      acceptanceCriteria, 
      rejectionCriteria 
    } = body;

    if (!storeId || !serviceType) {
      return NextResponse.json({ 
        error: 'storeId et serviceType requis' 
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

    // Valider les critères
    if (!acceptanceCriteria && !rejectionCriteria) {
      return NextResponse.json({ 
        error: 'Au moins un critère d\'acceptation ou de refus requis' 
      }, { status: 400 });
    }

    // Créer ou mettre à jour les critères
    const criteria = await prisma.serviceCriteria.upsert({
      where: {
        storeId_serviceType: {
          storeId,
          serviceType
        }
      },
      update: {
        acceptanceCriteria: acceptanceCriteria || [],
        rejectionCriteria: rejectionCriteria || [],
        updatedAt: new Date()
      },
      create: {
        storeId,
        serviceType,
        acceptanceCriteria: acceptanceCriteria || [],
        rejectionCriteria: rejectionCriteria || []
      }
    });

    return NextResponse.json({
      success: true,
      criteria
    });

  } catch (error) {
    console.error('Error creating/updating service criteria:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création/mise à jour des critères' 
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
      storeId, 
      serviceType, 
      acceptanceCriteria, 
      rejectionCriteria 
    } = body;

    if (!storeId || !serviceType) {
      return NextResponse.json({ 
        error: 'storeId et serviceType requis' 
      }, { status: 400 });
    }

    // Vérifier que les critères existent
    const existingCriteria = await prisma.serviceCriteria.findFirst({
      where: {
        storeId,
        serviceType,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!existingCriteria) {
      return NextResponse.json({ 
        error: 'Critères non trouvés' 
      }, { status: 404 });
    }

    // Mettre à jour les critères
    const updatedCriteria = await prisma.serviceCriteria.update({
      where: {
        id: existingCriteria.id
      },
      data: {
        ...(acceptanceCriteria !== undefined && { acceptanceCriteria }),
        ...(rejectionCriteria !== undefined && { rejectionCriteria }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      criteria: updatedCriteria
    });

  } catch (error) {
    console.error('Error updating service criteria:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour des critères' 
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
    const storeId = searchParams.get('storeId');
    const serviceType = searchParams.get('serviceType');

    if (!storeId || !serviceType) {
      return NextResponse.json({ 
        error: 'storeId et serviceType requis' 
      }, { status: 400 });
    }

    // Vérifier que les critères existent et appartiennent à l'utilisateur
    const existingCriteria = await prisma.serviceCriteria.findFirst({
      where: {
        storeId,
        serviceType,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!existingCriteria) {
      return NextResponse.json({ 
        error: 'Critères non trouvés ou accès non autorisé' 
      }, { status: 404 });
    }

    // Supprimer les critères
    await prisma.serviceCriteria.delete({
      where: {
        id: existingCriteria.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Critères supprimés avec succès'
    });

  } catch (error) {
    console.error('Error deleting service criteria:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression des critères' 
    }, { status: 500 });
  }
}