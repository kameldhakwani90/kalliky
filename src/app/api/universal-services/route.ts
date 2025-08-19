import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { createServiceFromPattern, getPatternById } from '@/lib/service-patterns';

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

// GET: Récupérer les services universels d'un store
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

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

    // Récupérer les services avec leurs statistiques
    const services = await prisma.universalService.findMany({
      where: { storeId },
      include: {
        _count: {
          select: {
            subServices: true,
            bookings: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    });

    // Calculer les statistiques globales
    const stats = await prisma.universalService.aggregate({
      where: { storeId },
      _count: {
        id: true
      }
    });

    const activeServicesCount = await prisma.universalService.count({
      where: { storeId, isActive: true }
    });

    const totalBookings = await prisma.serviceBooking.count({
      where: { storeId }
    });

    // TODO: Calculer le chiffre d'affaires réel depuis les bookings
    const totalRevenue = 0;

    return NextResponse.json({
      services,
      stats: {
        totalServices: stats._count.id || 0,
        activeServices: activeServicesCount,
        totalBookings,
        totalRevenue
      }
    });

  } catch (error) {
    console.error('Error fetching universal services:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des services' 
    }, { status: 500 });
  }
}

// POST: Créer un nouveau service universel
export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      storeId,
      patternId,
      name,
      description,
      pattern,
      icon,
      color,
      duplicateFrom
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

    let serviceData;

    if (duplicateFrom) {
      // Duplication d'un service existant
      const originalService = await prisma.universalService.findFirst({
        where: {
          id: duplicateFrom,
          storeId
        },
        include: {
          subServices: {
            include: {
              options: true
            }
          },
          scheduleConfig: true,
          customFields: true
        }
      });

      if (!originalService) {
        return NextResponse.json({ 
          error: 'Service original non trouvé' 
        }, { status: 404 });
      }

      // Créer une copie avec toutes les relations
      serviceData = {
        storeId,
        name,
        description: description || originalService.description,
        pattern: originalService.pattern,
        icon: originalService.icon,
        color: originalService.color,
        settings: originalService.settings,
        scheduleConfig: originalService.scheduleConfig ? {
          create: {
            type: originalService.scheduleConfig.type,
            workingHours: originalService.scheduleConfig.workingHours,
            slotConfig: originalService.scheduleConfig.slotConfig,
            bookingRules: originalService.scheduleConfig.bookingRules,
            exceptions: originalService.scheduleConfig.exceptions,
            serviceZones: originalService.scheduleConfig.serviceZones
          }
        } : undefined,
        subServices: {
          create: originalService.subServices.map((subService, index) => ({
            name: subService.name,
            description: subService.description,
            order: index,
            duration: subService.duration,
            capacity: subService.capacity,
            pricing: subService.pricing,
            settings: subService.settings,
            requirements: subService.requirements,
            options: {
              create: subService.options.map((option, optIndex) => ({
                name: option.name,
                description: option.description,
                type: option.type,
                isRequired: option.isRequired,
                order: optIndex,
                pricing: option.pricing,
                conditions: option.conditions
              }))
            }
          }))
        },
        customFields: {
          create: originalService.customFields.map((field, index) => ({
            name: field.name,
            label: field.label,
            type: field.type,
            isRequired: field.isRequired,
            order: index,
            config: field.config,
            conditions: field.conditions
          }))
        }
      };
    } else if (patternId) {
      // Création depuis un pattern
      const pattern = getPatternById(patternId);
      if (!pattern) {
        return NextResponse.json({ 
          error: 'Pattern non trouvé' 
        }, { status: 404 });
      }

      serviceData = createServiceFromPattern(storeId, patternId, {
        name,
        description
      });
    } else {
      // Création manuelle libre
      serviceData = {
        storeId,
        name,
        description,
        pattern: pattern || 'FLEXIBLE_BOOKING',
        icon: icon || '⚙️',
        color: color || '#64748b',
        settings: body.settings || {},
        isActive: body.isActive !== undefined ? body.isActive : true
      };
    }

    // Vérifier si un service avec ce nom existe déjà
    const existingService = await prisma.universalService.findFirst({
      where: {
        storeId,
        name
      }
    });

    if (existingService) {
      return NextResponse.json(
        { message: `Un service nommé "${name}" existe déjà. Veuillez choisir un autre nom.` },
        { status: 400 }
      );
    }

    // Créer le service avec toutes ses relations
    const service = await prisma.universalService.create({
      data: serviceData,
      include: {
        _count: {
          select: {
            subServices: true,
            bookings: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      service
    });

  } catch (error) {
    console.error('Error creating universal service:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création du service' 
    }, { status: 500 });
  }
}

// PUT: Mettre à jour un service universel
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
      isActive,
      icon,
      color,
      settings
    } = body;

    if (!id) {
      return NextResponse.json({ 
        error: 'ID du service requis' 
      }, { status: 400 });
    }

    // Vérifier que le service existe et appartient à l'utilisateur
    const existingService = await prisma.universalService.findFirst({
      where: {
        id,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!existingService) {
      return NextResponse.json({ 
        error: 'Service non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Mettre à jour le service
    const updatedService = await prisma.universalService.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(settings !== undefined && { settings }),
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            subServices: true,
            bookings: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      service: updatedService
    });

  } catch (error) {
    console.error('Error updating universal service:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour du service' 
    }, { status: 500 });
  }
}

// DELETE: Supprimer un service universel
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
        error: 'ID du service requis' 
      }, { status: 400 });
    }

    // Vérifier que le service existe et appartient à l'utilisateur
    const existingService = await prisma.universalService.findFirst({
      where: {
        id,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!existingService) {
      return NextResponse.json({ 
        error: 'Service non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Vérifier s'il y a des réservations actives
    const activeBookings = await prisma.serviceBooking.count({
      where: {
        serviceId: id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        }
      }
    });

    if (activeBookings > 0) {
      return NextResponse.json({ 
        error: `Impossible de supprimer le service : ${activeBookings} réservation(s) active(s)` 
      }, { status: 400 });
    }

    // Supprimer le service (cascade sur les relations)
    await prisma.universalService.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Service supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting universal service:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du service' 
    }, { status: 500 });
  }
}