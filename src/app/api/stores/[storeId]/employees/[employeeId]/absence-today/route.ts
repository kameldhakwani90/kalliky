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

// PUT: Marquer un employé absent/présent aujourd'hui
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

    // Vérifier que l'employé existe et appartient au store de l'utilisateur
    const employee = await prisma.serviceResource.findFirst({
      where: {
        id: employeeId,
        storeId,
        type: 'EMPLOYEE',
        store: {
          business: {
            ownerId: session.user.id
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ 
        error: 'Employé non trouvé ou accès non autorisé' 
      }, { status: 404 });
    }

    // Basculer le statut isActive (présent/absent)
    const newIsActive = !employee.isActive;
    
    await prisma.serviceResource.update({
      where: { id: employeeId },
      data: { isActive: newIsActive }
    });

    return NextResponse.json({
      success: true,
      message: `Employé marqué ${newIsActive ? 'présent' : 'absent'} pour aujourd'hui`,
      isActive: newIsActive,
      absenceDate: new Date().toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Error marking employee absent:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour de l\'absence' 
    }, { status: 500 });
  }
}