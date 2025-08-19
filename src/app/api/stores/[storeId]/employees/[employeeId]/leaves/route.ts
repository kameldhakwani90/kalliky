import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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

    // Pour l'instant, retourner un tableau vide car il n'y a pas de modèle Leave dans la base
    // TODO: Implémenter le modèle Leave si nécessaire
    return NextResponse.json({
      leaves: [],
      total: 0
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

    // Pour l'instant, simuler la création d'un congé
    // TODO: Implémenter le modèle Leave si nécessaire
    return NextResponse.json({
      success: true,
      leave: {
        id: `leave-${Date.now()}`,
        employeeId,
        startDate: body.startDate,
        endDate: body.endDate,
        type: body.type || 'vacation',
        reason: body.reason,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating employee leave:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la création du congé' 
    }, { status: 500 });
  }
}