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

// GET: Récupérer les ressources assignées à un service
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

    // Récupérer les ressources assignées via les variantes
    const assignments = await prisma.variantResourceAssignment.findMany({
      where: {
        variant: {
          serviceId
        }
      },
      include: {
        resource: true,
        variant: true
      }
    });

    // Extraire les ressources uniques
    const resourcesMap = new Map();
    assignments.forEach(assignment => {
      if (!resourcesMap.has(assignment.resource.id)) {
        resourcesMap.set(assignment.resource.id, {
          ...assignment.resource,
          assignments: []
        });
      }
      resourcesMap.get(assignment.resource.id).assignments.push({
        id: assignment.id,
        variantId: assignment.variantId,
        variantName: assignment.variant.name,
        assignmentType: assignment.assignmentType,
        priority: assignment.priority,
        isActive: assignment.isActive
      });
    });

    const resources = Array.from(resourcesMap.values());

    return NextResponse.json({
      resources,
      total: resources.length
    });

  } catch (error) {
    console.error('Error fetching service resources:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des ressources' 
    }, { status: 500 });
  }
}

// POST: Assigner une ressource à une variante du service
export async function POST(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId } = await params;
    const body = await request.json();
    const {
      variantId,
      resourceId,
      assignmentType = 'REQUIRED',
      priority = 0,
      conflictRules = {},
      availabilityRules = {}
    } = body;

    if (!variantId || !resourceId) {
      return NextResponse.json({ 
        error: 'variantId et resourceId sont requis' 
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

    // Vérifier que la variante appartient au service
    const variant = await prisma.serviceVariant.findFirst({
      where: {
        id: variantId,
        serviceId
      }
    });

    if (!variant) {
      return NextResponse.json({ 
        error: 'Variante non trouvée pour ce service' 
      }, { status: 404 });
    }

    // Vérifier que la ressource appartient au même store
    const resource = await prisma.serviceResource.findFirst({
      where: {
        id: resourceId,
        storeId: service.storeId
      }
    });

    if (!resource) {
      return NextResponse.json({ 
        error: 'Ressource non trouvée pour ce store' 
      }, { status: 404 });
    }

    // Vérifier si l'assignation existe déjà
    const existingAssignment = await prisma.variantResourceAssignment.findFirst({
      where: {
        variantId,
        resourceId
      }
    });

    if (existingAssignment) {
      return NextResponse.json({
        error: 'Cette ressource est déjà assignée à cette variante'
      }, { status: 400 });
    }

    // Créer l'assignation
    const assignment = await prisma.variantResourceAssignment.create({
      data: {
        variantId,
        resourceId,
        assignmentType,
        priority,
        conflictRules,
        availabilityRules
      },
      include: {
        resource: true,
        variant: true
      }
    });

    return NextResponse.json({
      success: true,
      assignment
    });

  } catch (error) {
    console.error('Error creating resource assignment:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'assignation de la ressource' 
    }, { status: 500 });
  }
}