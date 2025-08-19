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

// GET: Récupérer les variantes d'un service
export async function GET(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Récupérer les variantes
    const variants = await prisma.serviceVariant.findMany({
      where: { serviceId },
      include: {
        resourceAssignments: {
          include: {
            resource: true
          }
        },
        _count: {
          select: {
            bookings: true,
            resourceAssignments: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      variants,
      total: variants.length
    });

  } catch (error) {
    console.error('Error fetching service variants:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des variantes' 
    }, { status: 500 });
  }
}

// POST: Créer une nouvelle variante
export async function POST(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId } = await params;
    const body = await request.json();
    const {
      name,
      description,
      uniqueId,
      specifications,
      capacityConfig,
      pricingConfig,
      metadata
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ 
        error: 'Le nom de la variante est requis' 
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
    const existingVariant = await prisma.serviceVariant.findFirst({
      where: {
        serviceId,
        name: name.trim()
      }
    });

    if (existingVariant) {
      return NextResponse.json({
        error: `Une variante nommée "${name.trim()}" existe déjà pour ce service`
      }, { status: 400 });
    }

    // Vérifier l'unicité de l'ID unique s'il est fourni
    if (uniqueId) {
      const existingUniqueId = await prisma.serviceVariant.findFirst({
        where: {
          uniqueId: uniqueId.trim()
        }
      });

      if (existingUniqueId) {
        return NextResponse.json({
          error: `L'identifiant unique "${uniqueId.trim()}" est déjà utilisé`
        }, { status: 400 });
      }
    }

    // Créer la variante
    const variant = await prisma.serviceVariant.create({
      data: {
        serviceId,
        name: name.trim(),
        description: description?.trim() || null,
        uniqueId: uniqueId?.trim() || null,
        specifications: specifications || {},
        capacityConfig: capacityConfig || {},
        pricingConfig: pricingConfig || {},
        metadata: metadata || {}
      },
      include: {
        resourceAssignments: {
          include: {
            resource: true
          }
        },
        _count: {
          select: {
            bookings: true,
            resourceAssignments: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      variant
    });

  } catch (error) {
    console.error('Error creating service variant:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création de la variante' 
    }, { status: 500 });
  }
}