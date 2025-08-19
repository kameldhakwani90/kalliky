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

// GET: Récupérer les horaires d'un employé
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

    // Récupérer les horaires depuis le champ availability
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

    // Extraire les horaires du champ availability
    const availability = employee.availability as any;
    const schedules = availability?.schedules || [];

    return NextResponse.json({
      schedules,
      total: schedules.length
    });

  } catch (error) {
    console.error('Error fetching employee schedules:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des horaires' 
    }, { status: 500 });
  }
}

// POST: Créer/Mettre à jour les horaires d'un employé
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

    // Pour l'instant, stocker les horaires dans le champ availability du ServiceResource
    // TODO: Créer un modèle Schedule dédié si nécessaire
    const scheduleData = {
      schedules: body.schedules || [],
      updatedAt: new Date().toISOString()
    };

    await prisma.serviceResource.update({
      where: { id: employeeId },
      data: {
        availability: scheduleData
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Horaires mis à jour avec succès',
      schedules: body.schedules
    });

  } catch (error) {
    console.error('Error updating employee schedules:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour des horaires' 
    }, { status: 500 });
  }
}

// PUT: Mettre à jour les horaires (alias pour POST)
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ storeId: string; employeeId: string }> }
) {
  return POST(request, { params });
}