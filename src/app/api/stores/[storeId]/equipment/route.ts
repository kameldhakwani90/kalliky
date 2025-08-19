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

// GET: Récupérer tous les équipements d'un store
export async function GET(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;

    // Vérifier que le store appartient à l'utilisateur
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

    // Récupérer tous les équipements
    const equipment = await prisma.serviceResource.findMany({
      where: {
        storeId,
        type: 'EQUIPMENT'
      },
      include: {
        assignments: {
          include: {
            variant: {
              include: {
                service: {
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
        { isActive: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      equipment,
      total: equipment.length
    });

  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des équipements' 
    }, { status: 500 });
  }
}

// POST: Créer un nouvel équipement
export async function POST(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;
    const body = await request.json();
    
    const {
      name,
      description,
      uniqueId,
      specifications,
      erpId,
      isActive = true,
      schedules = []
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ 
        error: 'Le nom de l\'équipement est requis' 
      }, { status: 400 });
    }

    // Vérifier que le store appartient à l'utilisateur
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

    // Vérifier l'unicité du nom dans ce store
    const existingEquipment = await prisma.serviceResource.findFirst({
      where: {
        storeId,
        name: name.trim(),
        type: 'EQUIPMENT'
      }
    });

    if (existingEquipment) {
      return NextResponse.json({
        error: `Un équipement nommé "${name.trim()}" existe déjà dans ce store`
      }, { status: 400 });
    }

    // Vérifier l'unicité de l'ID unique s'il est fourni
    if (uniqueId) {
      const existingUniqueId = await prisma.serviceResource.findFirst({
        where: {
          storeId,
          uniqueId: uniqueId.trim(),
          type: 'EQUIPMENT'
        }
      });

      if (existingUniqueId) {
        return NextResponse.json({
          error: `L'identifiant unique "${uniqueId.trim()}" est déjà utilisé`
        }, { status: 400 });
      }
    }

    // Créer l'équipement
    const equipment = await prisma.serviceResource.create({
      data: {
        storeId,
        type: 'EQUIPMENT',
        name: name.trim(),
        description: description?.trim() || null,
        uniqueId: uniqueId?.trim() || null,
        specifications: specifications || {},
        erpId: erpId?.trim() || null,
        isActive,
        schedules: {
          create: schedules.map((schedule: any) => ({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isAvailable: schedule.isAvailable !== false,
            scheduleType: schedule.scheduleType || 'REGULAR',
            notes: schedule.notes
          }))
        }
      },
      include: {
        schedules: true
      }
    });

    return NextResponse.json({
      success: true,
      equipment
    });

  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création de l\'équipement' 
    }, { status: 500 });
  }
}