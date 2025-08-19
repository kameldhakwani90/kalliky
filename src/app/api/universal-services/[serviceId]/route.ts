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

// GET: Récupérer un service universel spécifique
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

    if (!serviceId) {
      return NextResponse.json({ 
        error: 'serviceId requis' 
      }, { status: 400 });
    }

    // Récupérer le service avec vérification de propriété
    const service = await prisma.universalService.findFirst({
      where: {
        id: serviceId,
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      },
      include: {
        subServices: {
          include: {
            options: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        scheduleConfig: true,
        customFields: {
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            subServices: true,
            bookings: true
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ 
        error: 'Service non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    return NextResponse.json({
      service
    });

  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération du service' 
    }, { status: 500 });
  }
}

// PUT: Mettre à jour un service universel
export async function PUT(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId } = params;
    const body = await request.json();
    const {
      name,
      description,
      isActive,
      icon,
      color,
      settings
    } = body;

    if (!serviceId) {
      return NextResponse.json({ 
        error: 'serviceId requis' 
      }, { status: 400 });
    }

    // Vérifier que le service existe et appartient à l'utilisateur
    const existingService = await prisma.universalService.findFirst({
      where: {
        id: serviceId,
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
      where: { id: serviceId },
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
    console.error('Error updating service:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour du service' 
    }, { status: 500 });
  }
}

// DELETE: Supprimer un service universel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId } = params;

    if (!serviceId) {
      return NextResponse.json({ 
        error: 'serviceId requis' 
      }, { status: 400 });
    }

    // Vérifier que le service existe et appartient à l'utilisateur
    const existingService = await prisma.universalService.findFirst({
      where: {
        id: serviceId,
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
        serviceId,
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
      where: { id: serviceId }
    });

    return NextResponse.json({
      success: true,
      message: 'Service supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du service' 
    }, { status: 500 });
  }
}