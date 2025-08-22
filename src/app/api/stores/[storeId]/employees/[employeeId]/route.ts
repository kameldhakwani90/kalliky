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

// PUT: Mettre à jour un employé
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ storeId: string; employeeId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, employeeId } = await params;
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

    // Vérifier que l'employé existe
    const existingEmployee = await prisma.serviceResource.findFirst({
      where: {
        id: employeeId,
        storeId,
        type: 'EMPLOYEE'
      }
    });

    if (!existingEmployee) {
      return NextResponse.json({
        error: 'Employé non trouvé'
      }, { status: 404 });
    }

    // Mettre à jour l'employé
    const updatedEmployee = await prisma.serviceResource.update({
      where: { id: employeeId },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.uniqueId !== undefined && { uniqueId: body.uniqueId?.trim() || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        metadata: {
          ...(existingEmployee.metadata || {}),
          ...(body.contactInfo !== undefined && { contactInfo: body.contactInfo }),
          ...(body.skills !== undefined && { skills: body.skills }),
          ...(body.erpId !== undefined && { erpId: body.erpId?.trim() || null }),
          ...(body.schedules !== undefined && { 
            availability: {
              schedules: body.schedules,
              updatedAt: new Date().toISOString()
            }
          }),
          ...(body.selectedServices !== undefined && { 
            assignedServices: {
              services: body.selectedServices,
              updatedAt: new Date().toISOString()
            }
          })
        }
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
      }
    });

    return NextResponse.json({
      success: true,
      employee: updatedEmployee
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour de l\'employé' 
    }, { status: 500 });
  }
}

// DELETE: Supprimer un employé
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; employeeId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, employeeId } = await params;

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

    // Vérifier que l'employé existe
    const existingEmployee = await prisma.serviceResource.findFirst({
      where: {
        id: employeeId,
        storeId,
        type: 'EMPLOYEE'
      }
    });

    if (!existingEmployee) {
      return NextResponse.json({
        error: 'Employé non trouvé'
      }, { status: 404 });
    }

    // Supprimer l'employé (cela supprimera aussi les schedules et assignments en cascade)
    await prisma.serviceResource.delete({
      where: { id: employeeId }
    });

    return NextResponse.json({
      success: true,
      message: 'Employé supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression de l\'employé' 
    }, { status: 500 });
  }
}