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

// GET: Récupérer les congés d'un employé
export async function GET(
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

    // Récupérer l'employé et ses congés depuis metadata
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

    // Extraire les congés depuis metadata
    const metadata = employee.metadata as any;
    const leaves = metadata?.leaves || [];

    return NextResponse.json({
      leaves: leaves,
      total: leaves.length
    });

  } catch (error) {
    console.error('Error fetching employee leaves:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des congés' 
    }, { status: 500 });
  }
}

// POST: Créer un nouveau congé
export async function POST(
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

    // Créer le nouveau congé
    const newLeave = {
      id: `leave-${Date.now()}`,
      startDate: body.startDate,
      endDate: body.endDate,
      type: body.type || 'VACATION',
      notes: body.notes || '',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // Ajouter le congé dans metadata
    const metadata = employee.metadata as any || {};
    const existingLeaves = metadata.leaves || [];
    const updatedLeaves = [...existingLeaves, newLeave];

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
      leave: newLeave
    });

  } catch (error) {
    console.error('Error creating employee leave:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création du congé' 
    }, { status: 500 });
  }
}