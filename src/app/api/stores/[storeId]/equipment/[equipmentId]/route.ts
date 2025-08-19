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

// PUT: Mettre à jour un équipement
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ storeId: string; equipmentId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, equipmentId } = await params;
    const body = await request.json();

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

    // Vérifier que l'équipement existe
    const existingEquipment = await prisma.serviceResource.findFirst({
      where: {
        id: equipmentId,
        storeId,
        type: 'EQUIPMENT'
      }
    });

    if (!existingEquipment) {
      return NextResponse.json({
        error: 'Équipement non trouvé'
      }, { status: 404 });
    }

    // Mettre à jour l'équipement
    const updatedEquipment = await prisma.serviceResource.update({
      where: { id: equipmentId },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.uniqueId !== undefined && { uniqueId: body.uniqueId?.trim() || null }),
        ...(body.specifications !== undefined && { specifications: body.specifications }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.erpId !== undefined && { erpId: body.erpId?.trim() || null })
      },
      include: {
        schedules: true,
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
      }
    });

    return NextResponse.json({
      success: true,
      equipment: updatedEquipment
    });

  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour de l\'équipement' 
    }, { status: 500 });
  }
}

// DELETE: Supprimer un équipement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; equipmentId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, equipmentId } = await params;

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

    // Vérifier que l'équipement existe
    const existingEquipment = await prisma.serviceResource.findFirst({
      where: {
        id: equipmentId,
        storeId,
        type: 'EQUIPMENT'
      }
    });

    if (!existingEquipment) {
      return NextResponse.json({
        error: 'Équipement non trouvé'
      }, { status: 404 });
    }

    // Supprimer l'équipement (cela supprimera aussi les schedules et assignments en cascade)
    await prisma.serviceResource.delete({
      where: { id: equipmentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Équipement supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression de l\'équipement' 
    }, { status: 500 });
  }
}