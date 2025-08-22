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

// PUT: Mettre à jour le statut d'un congé
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ storeId: string; employeeId: string; leaveId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, employeeId, leaveId } = await params;
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

    // Récupérer l'employé
    const employee = await prisma.serviceResource.findFirst({
      where: {
        id: employeeId,
        storeId,
        type: 'EMPLOYEE'
      }
    });

    if (!employee) {
      return NextResponse.json({
        error: 'Employé non trouvé'
      }, { status: 404 });
    }

    // Mettre à jour le congé dans metadata
    const metadata = employee.metadata as any || {};
    const existingLeaves = metadata.leaves || [];
    
    const updatedLeaves = existingLeaves.map((leave: any) => 
      leave.id === leaveId 
        ? { ...leave, status: body.status, updatedAt: new Date().toISOString() }
        : leave
    );

    // Vérifier que le congé existe
    const updatedLeave = updatedLeaves.find((leave: any) => leave.id === leaveId);
    if (!updatedLeave) {
      return NextResponse.json({
        error: 'Congé non trouvé'
      }, { status: 404 });
    }

    // Mettre à jour l'employé
    await prisma.serviceResource.update({
      where: { id: employeeId },
      data: {
        metadata: {
          ...metadata,
          leaves: updatedLeaves
        }
      }
    });

    return NextResponse.json({
      success: true,
      leave: updatedLeave
    });

  } catch (error) {
    console.error('Error updating employee leave:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour du congé' 
    }, { status: 500 });
  }
}

// DELETE: Supprimer un congé
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ storeId: string; employeeId: string; leaveId: string }> }
) {
  try {
    const session = await authenticateUser(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, employeeId, leaveId } = await params;

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

    // Récupérer l'employé
    const employee = await prisma.serviceResource.findFirst({
      where: {
        id: employeeId,
        storeId,
        type: 'EMPLOYEE'
      }
    });

    if (!employee) {
      return NextResponse.json({
        error: 'Employé non trouvé'
      }, { status: 404 });
    }

    // Supprimer le congé des metadata
    const metadata = employee.metadata as any || {};
    const existingLeaves = metadata.leaves || [];
    
    const updatedLeaves = existingLeaves.filter((leave: any) => leave.id !== leaveId);

    // Vérifier que le congé existait
    if (existingLeaves.length === updatedLeaves.length) {
      return NextResponse.json({
        error: 'Congé non trouvé'
      }, { status: 404 });
    }

    // Mettre à jour l'employé
    await prisma.serviceResource.update({
      where: { id: employeeId },
      data: {
        metadata: {
          ...metadata,
          leaves: updatedLeaves
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Congé supprimé avec succès'
    });

  } catch (error) {
    console.error('Error deleting employee leave:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du congé' 
    }, { status: 500 });
  }
}